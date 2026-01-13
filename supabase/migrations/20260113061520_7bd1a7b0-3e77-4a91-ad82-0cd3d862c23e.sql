-- Enable realtime for notifications table
ALTER TABLE public.notifications REPLICA IDENTITY FULL;

-- Ensure notifications is in the realtime publication
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  END IF;
END $$;

-- Fix the notify_on_problem_like function to properly handle cases where user might not have profile
CREATE OR REPLACE FUNCTION public.notify_on_problem_like()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_problem_owner_id UUID;
  v_problem_title TEXT;
  v_liker_name TEXT;
  v_liker_avatar TEXT;
BEGIN
  -- Only proceed for authenticated users
  IF NEW.user_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Get problem owner and title
  SELECT owner_id, title INTO v_problem_owner_id, v_problem_title
  FROM public.problems
  WHERE id = NEW.problem_id;
  
  -- Don't notify if problem owner is null or liking own problem
  IF v_problem_owner_id IS NULL OR v_problem_owner_id = NEW.user_id THEN
    RETURN NEW;
  END IF;
  
  -- Get liker info
  SELECT full_name, avatar_url INTO v_liker_name, v_liker_avatar
  FROM public.profiles
  WHERE id = NEW.user_id;
  
  -- Create notification
  INSERT INTO public.notifications (
    user_id, type, title, message, data, priority, 
    group_key, related_id, related_type, actor_id, actor_name, actor_avatar_url
  ) VALUES (
    v_problem_owner_id,
    'like',
    'New Like',
    COALESCE(v_liker_name, 'Someone') || ' liked your problem "' || COALESCE(v_problem_title, 'Untitled') || '"',
    jsonb_build_object('problem_id', NEW.problem_id),
    0,
    'like_problem_' || NEW.problem_id::text,
    NEW.problem_id,
    'problem',
    NEW.user_id,
    COALESCE(v_liker_name, 'Someone'),
    v_liker_avatar
  );
  
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log error but don't fail the like operation
  RAISE WARNING 'notify_on_problem_like error: %', SQLERRM;
  RETURN NEW;
END;
$$;

-- Fix the notify_on_innovation_like function similarly
CREATE OR REPLACE FUNCTION public.notify_on_innovation_like()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_innovation_owner_id UUID;
  v_innovation_title TEXT;
  v_liker_name TEXT;
  v_liker_avatar TEXT;
BEGIN
  -- Only proceed for authenticated users
  IF NEW.user_id IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Get innovation owner and title
  SELECT innovator_id, title INTO v_innovation_owner_id, v_innovation_title
  FROM public.innovations
  WHERE id = NEW.innovation_id;
  
  -- Don't notify if owner is null or liking own innovation
  IF v_innovation_owner_id IS NULL OR v_innovation_owner_id = NEW.user_id THEN
    RETURN NEW;
  END IF;
  
  -- Get liker info
  SELECT full_name, avatar_url INTO v_liker_name, v_liker_avatar
  FROM public.profiles
  WHERE id = NEW.user_id;
  
  -- Create notification using direct INSERT instead of function call
  INSERT INTO public.notifications (
    user_id, type, title, message, data, priority, 
    group_key, related_id, related_type, actor_id, actor_name, actor_avatar_url
  ) VALUES (
    v_innovation_owner_id,
    'like',
    'New Like',
    COALESCE(v_liker_name, 'Someone') || ' liked your innovation "' || COALESCE(v_innovation_title, 'Untitled') || '"',
    jsonb_build_object('innovation_id', NEW.innovation_id),
    0,
    'like_innovation_' || NEW.innovation_id::text,
    NEW.innovation_id,
    'innovation',
    NEW.user_id,
    COALESCE(v_liker_name, 'Someone'),
    v_liker_avatar
  );
  
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'notify_on_innovation_like error: %', SQLERRM;
  RETURN NEW;
END;
$$;

-- Fix bookmark notification trigger
CREATE OR REPLACE FUNCTION public.notify_on_bookmark()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner_id UUID;
  v_title TEXT;
  v_entity_type TEXT;
  v_bookmarker_name TEXT;
  v_bookmarker_avatar TEXT;
BEGIN
  -- Get bookmarker info
  SELECT full_name, avatar_url INTO v_bookmarker_name, v_bookmarker_avatar
  FROM public.profiles
  WHERE id = NEW.user_id;

  -- Handle problem bookmarks
  IF NEW.problem_id IS NOT NULL THEN
    SELECT owner_id, title INTO v_owner_id, v_title
    FROM public.problems
    WHERE id = NEW.problem_id;
    v_entity_type := 'problem';
    
    IF v_owner_id IS NOT NULL AND v_owner_id != NEW.user_id THEN
      INSERT INTO public.notifications (
        user_id, type, title, message, data, priority, 
        group_key, related_id, related_type, actor_id, actor_name, actor_avatar_url
      ) VALUES (
        v_owner_id,
        'bookmark',
        'Problem Bookmarked',
        COALESCE(v_bookmarker_name, 'Someone') || ' bookmarked your problem "' || COALESCE(v_title, 'Untitled') || '"',
        jsonb_build_object('problem_id', NEW.problem_id),
        0,
        'bookmark_problem_' || NEW.problem_id::text,
        NEW.problem_id,
        'problem',
        NEW.user_id,
        COALESCE(v_bookmarker_name, 'Someone'),
        v_bookmarker_avatar
      );
    END IF;
  END IF;

  -- Handle innovation bookmarks
  IF NEW.innovation_id IS NOT NULL THEN
    SELECT innovator_id, title INTO v_owner_id, v_title
    FROM public.innovations
    WHERE id = NEW.innovation_id;
    v_entity_type := 'innovation';
    
    IF v_owner_id IS NOT NULL AND v_owner_id != NEW.user_id THEN
      INSERT INTO public.notifications (
        user_id, type, title, message, data, priority, 
        group_key, related_id, related_type, actor_id, actor_name, actor_avatar_url
      ) VALUES (
        v_owner_id,
        'bookmark',
        'Innovation Bookmarked',
        COALESCE(v_bookmarker_name, 'Someone') || ' bookmarked your innovation "' || COALESCE(v_title, 'Untitled') || '"',
        jsonb_build_object('innovation_id', NEW.innovation_id),
        0,
        'bookmark_innovation_' || NEW.innovation_id::text,
        NEW.innovation_id,
        'innovation',
        NEW.user_id,
        COALESCE(v_bookmarker_name, 'Someone'),
        v_bookmarker_avatar
      );
    END IF;
  END IF;

  -- Handle solution bookmarks
  IF NEW.solution_id IS NOT NULL THEN
    SELECT innovator_id, title INTO v_owner_id, v_title
    FROM public.solutions
    WHERE id = NEW.solution_id;
    v_entity_type := 'solution';
    
    IF v_owner_id IS NOT NULL AND v_owner_id != NEW.user_id THEN
      INSERT INTO public.notifications (
        user_id, type, title, message, data, priority, 
        group_key, related_id, related_type, actor_id, actor_name, actor_avatar_url
      ) VALUES (
        v_owner_id,
        'bookmark',
        'Solution Bookmarked',
        COALESCE(v_bookmarker_name, 'Someone') || ' bookmarked your solution "' || COALESCE(v_title, 'Untitled') || '"',
        jsonb_build_object('solution_id', NEW.solution_id),
        0,
        'bookmark_solution_' || NEW.solution_id::text,
        NEW.solution_id,
        'solution',
        NEW.user_id,
        COALESCE(v_bookmarker_name, 'Someone'),
        v_bookmarker_avatar
      );
    END IF;
  END IF;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'notify_on_bookmark error: %', SQLERRM;
  RETURN NEW;
END;
$$;

-- Fix solution submission notification
CREATE OR REPLACE FUNCTION public.notify_on_solution_submitted()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_problem_owner_id UUID;
  v_problem_title TEXT;
  v_innovator_name TEXT;
  v_innovator_avatar TEXT;
BEGIN
  -- Get problem owner and title
  SELECT owner_id, title INTO v_problem_owner_id, v_problem_title
  FROM public.problems
  WHERE id = NEW.problem_id;
  
  -- Don't notify if problem owner is null or submitting to own problem
  IF v_problem_owner_id IS NULL OR v_problem_owner_id = NEW.innovator_id THEN
    RETURN NEW;
  END IF;
  
  -- Get innovator info
  SELECT full_name, avatar_url INTO v_innovator_name, v_innovator_avatar
  FROM public.profiles
  WHERE id = NEW.innovator_id;
  
  INSERT INTO public.notifications (
    user_id, type, title, message, data, priority, 
    group_key, related_id, related_type, actor_id, actor_name, actor_avatar_url
  ) VALUES (
    v_problem_owner_id,
    'solution_submitted',
    'New Solution Submitted',
    COALESCE(v_innovator_name, 'Someone') || ' submitted a solution to "' || COALESCE(v_problem_title, 'your problem') || '"',
    jsonb_build_object('solution_id', NEW.id, 'problem_id', NEW.problem_id),
    1,
    'solution_' || NEW.problem_id::text,
    NEW.id,
    'solution',
    NEW.innovator_id,
    COALESCE(v_innovator_name, 'Someone'),
    v_innovator_avatar
  );
  
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'notify_on_solution_submitted error: %', SQLERRM;
  RETURN NEW;
END;
$$;

-- Fix solution status change notification
CREATE OR REPLACE FUNCTION public.notify_on_solution_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_problem_title TEXT;
  v_message TEXT;
  v_title TEXT;
  v_priority INTEGER;
BEGIN
  -- Only proceed if status changed
  IF OLD.status IS NOT DISTINCT FROM NEW.status THEN
    RETURN NEW;
  END IF;
  
  -- Get problem title
  SELECT title INTO v_problem_title
  FROM public.problems
  WHERE id = NEW.problem_id;
  
  IF NEW.status = 'accepted' THEN
    v_title := 'Solution Approved! 🎉';
    v_message := 'Your solution for "' || COALESCE(v_problem_title, 'a problem') || '" has been approved!';
    v_priority := 2;
  ELSIF NEW.status = 'rejected' THEN
    v_title := 'Solution Not Selected';
    v_message := 'Your solution for "' || COALESCE(v_problem_title, 'a problem') || '" was not selected.';
    v_priority := 1;
  ELSIF NEW.status = 'shortlisted' THEN
    v_title := 'Solution Shortlisted! ⭐';
    v_message := 'Your solution for "' || COALESCE(v_problem_title, 'a problem') || '" has been shortlisted!';
    v_priority := 2;
  ELSIF NEW.status = 'under_review' THEN
    v_title := 'Solution Under Review';
    v_message := 'Your solution for "' || COALESCE(v_problem_title, 'a problem') || '" is now under review.';
    v_priority := 1;
  ELSE
    RETURN NEW;
  END IF;
  
  INSERT INTO public.notifications (
    user_id, type, title, message, data, priority, 
    related_id, related_type
  ) VALUES (
    NEW.innovator_id,
    CASE WHEN NEW.status = 'accepted' THEN 'solution_approved' 
         WHEN NEW.status = 'rejected' THEN 'solution_rejected'
         ELSE 'status_update' END,
    v_title,
    v_message,
    jsonb_build_object('solution_id', NEW.id, 'problem_id', NEW.problem_id, 'new_status', NEW.status),
    v_priority,
    NEW.id,
    'solution'
  );
  
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'notify_on_solution_status_change error: %', SQLERRM;
  RETURN NEW;
END;
$$;

-- Fix solution reply notification
CREATE OR REPLACE FUNCTION public.notify_on_solution_reply()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_solution_owner_id UUID;
  v_solution_title TEXT;
  v_problem_title TEXT;
  v_problem_id UUID;
  v_replier_name TEXT;
  v_replier_avatar TEXT;
BEGIN
  -- Get solution info
  SELECT s.innovator_id, s.title, s.problem_id, p.title 
  INTO v_solution_owner_id, v_solution_title, v_problem_id, v_problem_title
  FROM public.solutions s
  JOIN public.problems p ON p.id = s.problem_id
  WHERE s.id = NEW.solution_id;
  
  -- Don't notify if commenting on own solution
  IF v_solution_owner_id IS NULL OR v_solution_owner_id = NEW.user_id THEN
    RETURN NEW;
  END IF;
  
  -- Get replier info
  SELECT full_name, avatar_url INTO v_replier_name, v_replier_avatar
  FROM public.profiles
  WHERE id = NEW.user_id;
  
  INSERT INTO public.notifications (
    user_id, type, title, message, data, priority, 
    group_key, related_id, related_type, actor_id, actor_name, actor_avatar_url
  ) VALUES (
    v_solution_owner_id,
    'comment',
    'New Comment',
    COALESCE(v_replier_name, 'Someone') || ' commented on your solution for "' || COALESCE(v_problem_title, 'a problem') || '"',
    jsonb_build_object('solution_id', NEW.solution_id, 'problem_id', v_problem_id, 'reply_id', NEW.id),
    1,
    'comment_' || NEW.solution_id::text,
    NEW.solution_id,
    'solution',
    NEW.user_id,
    COALESCE(v_replier_name, 'Someone'),
    v_replier_avatar
  );
  
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'notify_on_solution_reply error: %', SQLERRM;
  RETURN NEW;
END;
$$;

-- Fix investor interest notification
CREATE OR REPLACE FUNCTION public.notify_on_investor_interest()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner_id UUID;
  v_title TEXT;
  v_entity_type TEXT;
  v_investor_avatar TEXT;
BEGIN
  -- Get investor avatar
  SELECT avatar_url INTO v_investor_avatar
  FROM public.profiles
  WHERE id = NEW.investor_id;

  IF NEW.problem_id IS NOT NULL THEN
    SELECT owner_id, title INTO v_owner_id, v_title
    FROM public.problems
    WHERE id = NEW.problem_id;
    v_entity_type := 'problem';
    
    IF v_owner_id IS NOT NULL AND v_owner_id != NEW.investor_id THEN
      INSERT INTO public.notifications (
        user_id, type, title, message, data, priority, 
        related_id, related_type, actor_id, actor_name, actor_avatar_url
      ) VALUES (
        v_owner_id,
        'investor_interest',
        'Investor Interest! 💰',
        NEW.investor_name || ' expressed ' || NEW.interest_type || ' interest in your problem "' || COALESCE(v_title, 'Untitled') || '"',
        jsonb_build_object('problem_id', NEW.problem_id, 'interest_type', NEW.interest_type, 'investment_range', NEW.investment_range),
        2,
        NEW.problem_id,
        'problem',
        NEW.investor_id,
        NEW.investor_name,
        v_investor_avatar
      );
    END IF;
  END IF;

  IF NEW.innovation_id IS NOT NULL THEN
    SELECT innovator_id, title INTO v_owner_id, v_title
    FROM public.innovations
    WHERE id = NEW.innovation_id;
    v_entity_type := 'innovation';
    
    IF v_owner_id IS NOT NULL AND v_owner_id != NEW.investor_id THEN
      INSERT INTO public.notifications (
        user_id, type, title, message, data, priority, 
        related_id, related_type, actor_id, actor_name, actor_avatar_url
      ) VALUES (
        v_owner_id,
        'investor_interest',
        'Investor Interest! 💰',
        NEW.investor_name || ' expressed ' || NEW.interest_type || ' interest in your innovation "' || COALESCE(v_title, 'Untitled') || '"',
        jsonb_build_object('innovation_id', NEW.innovation_id, 'interest_type', NEW.interest_type, 'investment_range', NEW.investment_range),
        2,
        NEW.innovation_id,
        'innovation',
        NEW.investor_id,
        NEW.investor_name,
        v_investor_avatar
      );
    END IF;
  END IF;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'notify_on_investor_interest error: %', SQLERRM;
  RETURN NEW;
END;
$$;

-- Ensure all triggers are properly attached
DROP TRIGGER IF EXISTS trigger_notify_problem_like ON public.problem_likes;
CREATE TRIGGER trigger_notify_problem_like
AFTER INSERT ON public.problem_likes
FOR EACH ROW
EXECUTE FUNCTION public.notify_on_problem_like();

DROP TRIGGER IF EXISTS trigger_notify_innovation_like ON public.innovation_likes;
CREATE TRIGGER trigger_notify_innovation_like
AFTER INSERT ON public.innovation_likes
FOR EACH ROW
EXECUTE FUNCTION public.notify_on_innovation_like();

DROP TRIGGER IF EXISTS trigger_notify_bookmark ON public.bookmarks;
CREATE TRIGGER trigger_notify_bookmark
AFTER INSERT ON public.bookmarks
FOR EACH ROW
EXECUTE FUNCTION public.notify_on_bookmark();

DROP TRIGGER IF EXISTS trigger_notify_solution_submitted ON public.solutions;
CREATE TRIGGER trigger_notify_solution_submitted
AFTER INSERT ON public.solutions
FOR EACH ROW
EXECUTE FUNCTION public.notify_on_solution_submitted();

DROP TRIGGER IF EXISTS trigger_notify_solution_status ON public.solutions;
CREATE TRIGGER trigger_notify_solution_status
AFTER UPDATE ON public.solutions
FOR EACH ROW
EXECUTE FUNCTION public.notify_on_solution_status_change();

DROP TRIGGER IF EXISTS trigger_notify_solution_reply ON public.solution_replies;
CREATE TRIGGER trigger_notify_solution_reply
AFTER INSERT ON public.solution_replies
FOR EACH ROW
EXECUTE FUNCTION public.notify_on_solution_reply();

DROP TRIGGER IF EXISTS trigger_notify_investor_interest ON public.investor_interests;
CREATE TRIGGER trigger_notify_investor_interest
AFTER INSERT ON public.investor_interests
FOR EACH ROW
EXECUTE FUNCTION public.notify_on_investor_interest();