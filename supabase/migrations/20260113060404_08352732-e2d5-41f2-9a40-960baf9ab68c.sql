-- Add trigger for solution replies (comments)
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
  
  -- Get replier info
  SELECT full_name, avatar_url INTO v_replier_name, v_replier_avatar
  FROM public.profiles
  WHERE id = NEW.user_id;
  
  -- Don't notify if commenting on own solution
  IF v_solution_owner_id != NEW.user_id THEN
    PERFORM public.create_notification(
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
      v_replier_name,
      v_replier_avatar
    );
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_notify_solution_reply ON public.solution_replies;
CREATE TRIGGER trigger_notify_solution_reply
AFTER INSERT ON public.solution_replies
FOR EACH ROW
EXECUTE FUNCTION public.notify_on_solution_reply();

-- Add trigger for innovation likes
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
  -- Get innovation owner and title
  SELECT innovator_id, title INTO v_innovation_owner_id, v_innovation_title
  FROM public.innovations
  WHERE id = NEW.innovation_id;
  
  -- Get liker info (if authenticated)
  IF NEW.user_id IS NOT NULL THEN
    SELECT full_name, avatar_url INTO v_liker_name, v_liker_avatar
    FROM public.profiles
    WHERE id = NEW.user_id;
  END IF;
  
  -- Don't notify if liking own innovation or anonymous like
  IF NEW.user_id IS NOT NULL AND v_innovation_owner_id != NEW.user_id THEN
    PERFORM public.create_notification(
      v_innovation_owner_id,
      'like',
      'New Like',
      COALESCE(v_liker_name, 'Someone') || ' liked your innovation "' || v_innovation_title || '"',
      jsonb_build_object('innovation_id', NEW.innovation_id),
      0,
      'like_innovation_' || NEW.innovation_id::text,
      NEW.innovation_id,
      'innovation',
      NEW.user_id,
      v_liker_name,
      v_liker_avatar
    );
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_notify_innovation_like ON public.innovation_likes;
CREATE TRIGGER trigger_notify_innovation_like
AFTER INSERT ON public.innovation_likes
FOR EACH ROW
EXECUTE FUNCTION public.notify_on_innovation_like();