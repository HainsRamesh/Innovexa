-- Create notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  is_read BOOLEAN NOT NULL DEFAULT false,
  priority INTEGER NOT NULL DEFAULT 0,
  group_key TEXT,
  related_id UUID,
  related_type TEXT,
  actor_id UUID,
  actor_name TEXT,
  actor_avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  read_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for performance
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_user_unread ON public.notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX idx_notifications_group_key ON public.notifications(group_key) WHERE group_key IS NOT NULL;

-- Enable Row Level Security
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can only view their own notifications
CREATE POLICY "Users can view their own notifications" 
ON public.notifications 
FOR SELECT 
USING (auth.uid() = user_id);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update their own notifications" 
ON public.notifications 
FOR UPDATE 
USING (auth.uid() = user_id);

-- System can insert notifications (via service role or triggers)
CREATE POLICY "Service role can insert notifications" 
ON public.notifications 
FOR INSERT 
WITH CHECK (true);

-- Users can delete their own notifications
CREATE POLICY "Users can delete their own notifications" 
ON public.notifications 
FOR DELETE 
USING (auth.uid() = user_id);

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Function to create a notification
CREATE OR REPLACE FUNCTION public.create_notification(
  p_user_id UUID,
  p_type TEXT,
  p_title TEXT,
  p_message TEXT,
  p_data JSONB DEFAULT '{}',
  p_priority INTEGER DEFAULT 0,
  p_group_key TEXT DEFAULT NULL,
  p_related_id UUID DEFAULT NULL,
  p_related_type TEXT DEFAULT NULL,
  p_actor_id UUID DEFAULT NULL,
  p_actor_name TEXT DEFAULT NULL,
  p_actor_avatar_url TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_notification_id UUID;
BEGIN
  INSERT INTO public.notifications (
    user_id, type, title, message, data, priority, 
    group_key, related_id, related_type, actor_id, actor_name, actor_avatar_url
  )
  VALUES (
    p_user_id, p_type, p_title, p_message, p_data, p_priority,
    p_group_key, p_related_id, p_related_type, p_actor_id, p_actor_name, p_actor_avatar_url
  )
  RETURNING id INTO v_notification_id;
  
  RETURN v_notification_id;
END;
$$;

-- Function to mark all notifications as read for a user
CREATE OR REPLACE FUNCTION public.mark_all_notifications_read(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE public.notifications
  SET is_read = true, read_at = now()
  WHERE user_id = p_user_id AND is_read = false;
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

-- Trigger to create notification when a solution is submitted
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
  
  -- Get innovator info
  SELECT full_name, avatar_url INTO v_innovator_name, v_innovator_avatar
  FROM public.profiles
  WHERE id = NEW.innovator_id;
  
  -- Don't notify if the problem owner is submitting solution to their own problem
  IF v_problem_owner_id != NEW.innovator_id THEN
    PERFORM public.create_notification(
      v_problem_owner_id,
      'solution_submitted',
      'New Solution Submitted',
      COALESCE(v_innovator_name, 'Someone') || ' submitted a solution to "' || v_problem_title || '"',
      jsonb_build_object('solution_id', NEW.id, 'problem_id', NEW.problem_id),
      1,
      'solution_' || NEW.problem_id::text,
      NEW.id,
      'solution',
      NEW.innovator_id,
      v_innovator_name,
      v_innovator_avatar
    );
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_notify_solution_submitted
AFTER INSERT ON public.solutions
FOR EACH ROW
EXECUTE FUNCTION public.notify_on_solution_submitted();

-- Trigger to notify when solution status changes
CREATE OR REPLACE FUNCTION public.notify_on_solution_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_problem_title TEXT;
BEGIN
  -- Only proceed if status changed
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    -- Get problem title
    SELECT title INTO v_problem_title
    FROM public.problems
    WHERE id = NEW.problem_id;
    
    IF NEW.status = 'accepted' THEN
      PERFORM public.create_notification(
        NEW.innovator_id,
        'solution_approved',
        'Solution Approved! 🎉',
        'Your solution for "' || v_problem_title || '" has been approved!',
        jsonb_build_object('solution_id', NEW.id, 'problem_id', NEW.problem_id),
        2,
        NULL,
        NEW.id,
        'solution',
        NULL,
        NULL,
        NULL
      );
    ELSIF NEW.status = 'rejected' THEN
      PERFORM public.create_notification(
        NEW.innovator_id,
        'solution_rejected',
        'Solution Not Selected',
        'Your solution for "' || v_problem_title || '" was not selected.',
        jsonb_build_object('solution_id', NEW.id, 'problem_id', NEW.problem_id),
        1,
        NULL,
        NEW.id,
        'solution',
        NULL,
        NULL,
        NULL
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_notify_solution_status
AFTER UPDATE ON public.solutions
FOR EACH ROW
EXECUTE FUNCTION public.notify_on_solution_status_change();

-- Trigger to notify on problem bookmark
CREATE OR REPLACE FUNCTION public.notify_on_bookmark()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_problem_owner_id UUID;
  v_problem_title TEXT;
  v_bookmarker_name TEXT;
  v_bookmarker_avatar TEXT;
BEGIN
  IF NEW.problem_id IS NOT NULL THEN
    -- Get problem owner and title
    SELECT owner_id, title INTO v_problem_owner_id, v_problem_title
    FROM public.problems
    WHERE id = NEW.problem_id;
    
    -- Get bookmarker info
    SELECT full_name, avatar_url INTO v_bookmarker_name, v_bookmarker_avatar
    FROM public.profiles
    WHERE id = NEW.user_id;
    
    -- Don't notify if bookmarking own problem
    IF v_problem_owner_id != NEW.user_id THEN
      PERFORM public.create_notification(
        v_problem_owner_id,
        'bookmark',
        'Problem Bookmarked',
        COALESCE(v_bookmarker_name, 'Someone') || ' bookmarked your problem "' || v_problem_title || '"',
        jsonb_build_object('problem_id', NEW.problem_id),
        0,
        'bookmark_' || NEW.problem_id::text,
        NEW.problem_id,
        'problem',
        NEW.user_id,
        v_bookmarker_name,
        v_bookmarker_avatar
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_notify_bookmark
AFTER INSERT ON public.bookmarks
FOR EACH ROW
EXECUTE FUNCTION public.notify_on_bookmark();

-- Trigger to notify on investor interest
CREATE OR REPLACE FUNCTION public.notify_on_investor_interest()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_problem_owner_id UUID;
  v_problem_title TEXT;
  v_innovation_owner_id UUID;
  v_innovation_title TEXT;
  v_investor_avatar TEXT;
BEGIN
  -- Get investor avatar
  SELECT avatar_url INTO v_investor_avatar
  FROM public.profiles
  WHERE id = NEW.investor_id;
  
  IF NEW.problem_id IS NOT NULL THEN
    -- Get problem owner and title
    SELECT owner_id, title INTO v_problem_owner_id, v_problem_title
    FROM public.problems
    WHERE id = NEW.problem_id;
    
    IF v_problem_owner_id IS NOT NULL THEN
      PERFORM public.create_notification(
        v_problem_owner_id,
        'investor_interest',
        'Investor Interest! 💰',
        NEW.investor_name || ' expressed ' || NEW.interest_type || ' interest in your problem "' || v_problem_title || '"',
        jsonb_build_object('problem_id', NEW.problem_id, 'interest_type', NEW.interest_type, 'investment_range', NEW.investment_range),
        2,
        NULL,
        NEW.problem_id,
        'problem',
        NEW.investor_id,
        NEW.investor_name,
        v_investor_avatar
      );
    END IF;
  END IF;
  
  IF NEW.innovation_id IS NOT NULL THEN
    -- Get innovation owner and title
    SELECT innovator_id, title INTO v_innovation_owner_id, v_innovation_title
    FROM public.innovations
    WHERE id = NEW.innovation_id;
    
    IF v_innovation_owner_id IS NOT NULL THEN
      PERFORM public.create_notification(
        v_innovation_owner_id,
        'investor_interest',
        'Investor Interest! 💰',
        NEW.investor_name || ' expressed ' || NEW.interest_type || ' interest in your innovation "' || v_innovation_title || '"',
        jsonb_build_object('innovation_id', NEW.innovation_id, 'interest_type', NEW.interest_type, 'investment_range', NEW.investment_range),
        2,
        NULL,
        NEW.innovation_id,
        'innovation',
        NEW.investor_id,
        NEW.investor_name,
        v_investor_avatar
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_notify_investor_interest
AFTER INSERT ON public.investor_interests
FOR EACH ROW
EXECUTE FUNCTION public.notify_on_investor_interest();

-- Trigger to notify on problem like
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
  -- Get problem owner and title
  SELECT owner_id, title INTO v_problem_owner_id, v_problem_title
  FROM public.problems
  WHERE id = NEW.problem_id;
  
  -- Get liker info (if authenticated)
  IF NEW.user_id IS NOT NULL THEN
    SELECT full_name, avatar_url INTO v_liker_name, v_liker_avatar
    FROM public.profiles
    WHERE id = NEW.user_id;
  END IF;
  
  -- Don't notify if liking own problem or anonymous like
  IF NEW.user_id IS NOT NULL AND v_problem_owner_id != NEW.user_id THEN
    PERFORM public.create_notification(
      v_problem_owner_id,
      'like',
      'New Like',
      COALESCE(v_liker_name, 'Someone') || ' liked your problem "' || v_problem_title || '"',
      jsonb_build_object('problem_id', NEW.problem_id),
      0,
      'like_problem_' || NEW.problem_id::text,
      NEW.problem_id,
      'problem',
      NEW.user_id,
      v_liker_name,
      v_liker_avatar
    );
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_notify_problem_like
AFTER INSERT ON public.problem_likes
FOR EACH ROW
EXECUTE FUNCTION public.notify_on_problem_like();