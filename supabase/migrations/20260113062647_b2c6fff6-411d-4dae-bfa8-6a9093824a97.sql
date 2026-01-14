-- Fix missing like notifications: persist actor user_id on likes + create notifications using auth.uid()

-- 1) Stamp authenticated user_id onto like rows (so notification triggers can work)
CREATE OR REPLACE FUNCTION public.set_like_user_id_from_auth()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.user_id IS NULL AND auth.uid() IS NOT NULL THEN
    NEW.user_id := auth.uid();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS innovation_likes_set_user_id ON public.innovation_likes;
CREATE TRIGGER innovation_likes_set_user_id
BEFORE INSERT ON public.innovation_likes
FOR EACH ROW
EXECUTE FUNCTION public.set_like_user_id_from_auth();

DROP TRIGGER IF EXISTS problem_likes_set_user_id ON public.problem_likes;
CREATE TRIGGER problem_likes_set_user_id
BEFORE INSERT ON public.problem_likes
FOR EACH ROW
EXECUTE FUNCTION public.set_like_user_id_from_auth();

-- 2) Make like notification creation work even if client doesn't send user_id (use auth.uid())
CREATE OR REPLACE FUNCTION public.notify_on_innovation_like()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_innovation_owner_id UUID;
  v_innovation_title TEXT;
  v_actor_id UUID;
  v_actor_name TEXT;
  v_actor_avatar TEXT;
BEGIN
  v_actor_id := COALESCE(NEW.user_id, auth.uid());

  -- Anonymous likes (session-only) should not generate a notification
  IF v_actor_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT innovator_id, title
    INTO v_innovation_owner_id, v_innovation_title
  FROM public.innovations
  WHERE id = NEW.innovation_id;

  IF v_innovation_owner_id IS NULL OR v_innovation_owner_id = v_actor_id THEN
    RETURN NEW;
  END IF;

  SELECT full_name, avatar_url
    INTO v_actor_name, v_actor_avatar
  FROM public.profiles
  WHERE id = v_actor_id;

  PERFORM public.create_notification(
    v_innovation_owner_id,
    'like',
    'New Like',
    COALESCE(v_actor_name, 'Someone') || ' liked your innovation "' || COALESCE(v_innovation_title, 'Untitled') || '"',
    jsonb_build_object('innovation_id', NEW.innovation_id),
    0,
    'like_innovation_' || NEW.innovation_id::text,
    NEW.innovation_id,
    'innovation',
    v_actor_id,
    COALESCE(v_actor_name, 'Someone'),
    v_actor_avatar
  );

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'notify_on_innovation_like error: %', SQLERRM;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.notify_on_problem_like()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_problem_owner_id UUID;
  v_problem_title TEXT;
  v_actor_id UUID;
  v_actor_name TEXT;
  v_actor_avatar TEXT;
BEGIN
  v_actor_id := COALESCE(NEW.user_id, auth.uid());

  -- Anonymous likes (session-only) should not generate a notification
  IF v_actor_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT owner_id, title
    INTO v_problem_owner_id, v_problem_title
  FROM public.problems
  WHERE id = NEW.problem_id;

  IF v_problem_owner_id IS NULL OR v_problem_owner_id = v_actor_id THEN
    RETURN NEW;
  END IF;

  SELECT full_name, avatar_url
    INTO v_actor_name, v_actor_avatar
  FROM public.profiles
  WHERE id = v_actor_id;

  INSERT INTO public.notifications (
    user_id, type, title, message, data, priority,
    group_key, related_id, related_type,
    actor_id, actor_name, actor_avatar_url
  ) VALUES (
    v_problem_owner_id,
    'like',
    'New Like',
    COALESCE(v_actor_name, 'Someone') || ' liked your problem "' || COALESCE(v_problem_title, 'Untitled') || '"',
    jsonb_build_object('problem_id', NEW.problem_id),
    0,
    'like_problem_' || NEW.problem_id::text,
    NEW.problem_id,
    'problem',
    v_actor_id,
    COALESCE(v_actor_name, 'Someone'),
    v_actor_avatar
  );

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'notify_on_problem_like error: %', SQLERRM;
  RETURN NEW;
END;
$function$;

-- 3) Remove like notifications if the actor unlikes (best-effort de-dupe)
CREATE OR REPLACE FUNCTION public.delete_innovation_like_notification_on_unlike()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_innovation_owner_id UUID;
  v_actor_id UUID;
BEGIN
  v_actor_id := COALESCE(OLD.user_id, auth.uid());
  IF v_actor_id IS NULL THEN
    RETURN OLD;
  END IF;

  SELECT innovator_id INTO v_innovation_owner_id
  FROM public.innovations
  WHERE id = OLD.innovation_id;

  IF v_innovation_owner_id IS NULL OR v_innovation_owner_id = v_actor_id THEN
    RETURN OLD;
  END IF;

  DELETE FROM public.notifications
  WHERE user_id = v_innovation_owner_id
    AND type = 'like'
    AND related_type = 'innovation'
    AND related_id = OLD.innovation_id
    AND actor_id = v_actor_id;

  RETURN OLD;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'delete_innovation_like_notification_on_unlike error: %', SQLERRM;
  RETURN OLD;
END;
$function$;

DROP TRIGGER IF EXISTS trigger_delete_innovation_like_notification ON public.innovation_likes;
CREATE TRIGGER trigger_delete_innovation_like_notification
AFTER DELETE ON public.innovation_likes
FOR EACH ROW
EXECUTE FUNCTION public.delete_innovation_like_notification_on_unlike();

CREATE OR REPLACE FUNCTION public.delete_problem_like_notification_on_unlike()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_problem_owner_id UUID;
  v_actor_id UUID;
BEGIN
  v_actor_id := COALESCE(OLD.user_id, auth.uid());
  IF v_actor_id IS NULL THEN
    RETURN OLD;
  END IF;

  SELECT owner_id INTO v_problem_owner_id
  FROM public.problems
  WHERE id = OLD.problem_id;

  IF v_problem_owner_id IS NULL OR v_problem_owner_id = v_actor_id THEN
    RETURN OLD;
  END IF;

  DELETE FROM public.notifications
  WHERE user_id = v_problem_owner_id
    AND type = 'like'
    AND related_type = 'problem'
    AND related_id = OLD.problem_id
    AND actor_id = v_actor_id;

  RETURN OLD;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'delete_problem_like_notification_on_unlike error: %', SQLERRM;
  RETURN OLD;
END;
$function$;

DROP TRIGGER IF EXISTS trigger_delete_problem_like_notification ON public.problem_likes;
CREATE TRIGGER trigger_delete_problem_like_notification
AFTER DELETE ON public.problem_likes
FOR EACH ROW
EXECUTE FUNCTION public.delete_problem_like_notification_on_unlike();

-- 4) Mentions in solution replies: create mention notifications for @Name matches
--    (Matches @word => profiles.full_name equals that word, case-insensitive)
CREATE OR REPLACE FUNCTION public.notify_on_solution_reply()
RETURNS trigger
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
  v_mention TEXT;
  v_mentioned_user_id UUID;
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

  -- Comment notification (to solution owner)
  IF v_solution_owner_id IS NOT NULL AND v_solution_owner_id != NEW.user_id THEN
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
      COALESCE(v_replier_name, 'Someone'),
      v_replier_avatar
    );
  END IF;

  -- Mention notifications (best-effort)
  FOR v_mention IN
    SELECT DISTINCT lower((m)[1])
    FROM regexp_matches(COALESCE(NEW.content, ''), '@([A-Za-z0-9_]+)', 'g') AS m
  LOOP
    SELECT id INTO v_mentioned_user_id
    FROM public.profiles
    WHERE lower(COALESCE(full_name, '')) = v_mention
    LIMIT 1;

    IF v_mentioned_user_id IS NOT NULL AND v_mentioned_user_id != NEW.user_id THEN
      PERFORM public.create_notification(
        v_mentioned_user_id,
        'mention',
        'You were mentioned',
        COALESCE(v_replier_name, 'Someone') || ' mentioned you in a comment',
        jsonb_build_object('solution_id', NEW.solution_id, 'problem_id', v_problem_id, 'reply_id', NEW.id, 'mention', v_mention),
        1,
        'mention_' || NEW.id::text,
        NEW.solution_id,
        'solution',
        NEW.user_id,
        COALESCE(v_replier_name, 'Someone'),
        v_replier_avatar
      );
    END IF;
  END LOOP;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'notify_on_solution_reply error: %', SQLERRM;
  RETURN NEW;
END;
$$;

-- Ensure triggers still point to latest functions
DROP TRIGGER IF EXISTS trigger_notify_innovation_like ON public.innovation_likes;
CREATE TRIGGER trigger_notify_innovation_like
AFTER INSERT ON public.innovation_likes
FOR EACH ROW
EXECUTE FUNCTION public.notify_on_innovation_like();

DROP TRIGGER IF EXISTS trigger_notify_problem_like ON public.problem_likes;
CREATE TRIGGER trigger_notify_problem_like
AFTER INSERT ON public.problem_likes
FOR EACH ROW
EXECUTE FUNCTION public.notify_on_problem_like();

DROP TRIGGER IF EXISTS trigger_notify_solution_reply ON public.solution_replies;
CREATE TRIGGER trigger_notify_solution_reply
AFTER INSERT ON public.solution_replies
FOR EACH ROW
EXECUTE FUNCTION public.notify_on_solution_reply();
