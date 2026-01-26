-- First drop all old triggers that depend on the old functions
DROP TRIGGER IF EXISTS innovation_likes_count_trigger ON public.innovation_likes;
DROP TRIGGER IF EXISTS problem_likes_count_trigger ON public.problem_likes;
DROP TRIGGER IF EXISTS on_innovation_like_notify ON public.innovation_likes;
DROP TRIGGER IF EXISTS on_innovation_unlike_notify ON public.innovation_likes;
DROP TRIGGER IF EXISTS on_problem_like_notify ON public.problem_likes;
DROP TRIGGER IF EXISTS on_problem_unlike_notify ON public.problem_likes;
DROP TRIGGER IF EXISTS stamp_innovation_like_user_id ON public.innovation_likes;
DROP TRIGGER IF EXISTS stamp_problem_like_user_id ON public.problem_likes;
DROP TRIGGER IF EXISTS update_innovation_like_count_trigger ON public.innovation_likes;
DROP TRIGGER IF EXISTS update_problem_like_count_trigger ON public.problem_likes;

-- Now safely drop old functions
DROP FUNCTION IF EXISTS public.update_innovation_like_count() CASCADE;
DROP FUNCTION IF EXISTS public.update_problem_like_count() CASCADE;
DROP FUNCTION IF EXISTS public.notify_on_innovation_like() CASCADE;
DROP FUNCTION IF EXISTS public.notify_on_problem_like() CASCADE;
DROP FUNCTION IF EXISTS public.delete_innovation_like_notification_on_unlike() CASCADE;
DROP FUNCTION IF EXISTS public.delete_problem_like_notification_on_unlike() CASCADE;

-- Rename innovation_likes table to innovation_interests
ALTER TABLE public.innovation_likes RENAME TO innovation_interests;

-- Rename like_count to interest_count in innovations table
ALTER TABLE public.innovations RENAME COLUMN like_count TO interest_count;

-- Rename problem_likes table to problem_interests
ALTER TABLE public.problem_likes RENAME TO problem_interests;

-- Rename like_count to interest_count in problems table
ALTER TABLE public.problems RENAME COLUMN like_count TO interest_count;

-- Create the new innovation interest count trigger function
CREATE OR REPLACE FUNCTION public.update_innovation_interest_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.innovations SET interest_count = interest_count + 1 WHERE id = NEW.innovation_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.innovations SET interest_count = interest_count - 1 WHERE id = OLD.innovation_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$function$;

-- Create the new problem interest count trigger function
CREATE OR REPLACE FUNCTION public.update_problem_interest_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.problems SET interest_count = interest_count + 1 WHERE id = NEW.problem_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.problems SET interest_count = interest_count - 1 WHERE id = OLD.problem_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$function$;

-- Create new triggers for innovation_interests
CREATE TRIGGER update_innovation_interest_count_trigger
  AFTER INSERT OR DELETE ON public.innovation_interests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_innovation_interest_count();

CREATE TRIGGER stamp_innovation_interest_user_id
  BEFORE INSERT ON public.innovation_interests
  FOR EACH ROW
  EXECUTE FUNCTION public.set_like_user_id_from_auth();

-- Create new triggers for problem_interests
CREATE TRIGGER update_problem_interest_count_trigger
  AFTER INSERT OR DELETE ON public.problem_interests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_problem_interest_count();

CREATE TRIGGER stamp_problem_interest_user_id
  BEFORE INSERT ON public.problem_interests
  FOR EACH ROW
  EXECUTE FUNCTION public.set_like_user_id_from_auth();

-- Create notification function for innovation interests
CREATE OR REPLACE FUNCTION public.notify_on_innovation_interest()
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
    'interest',
    'New Interest',
    COALESCE(v_actor_name, 'Someone') || ' is interested in your innovation "' || COALESCE(v_innovation_title, 'Untitled') || '"',
    jsonb_build_object('innovation_id', NEW.innovation_id),
    0,
    'interest_innovation_' || NEW.innovation_id::text,
    NEW.innovation_id,
    'innovation',
    v_actor_id,
    COALESCE(v_actor_name, 'Someone'),
    v_actor_avatar
  );

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'notify_on_innovation_interest error: %', SQLERRM;
  RETURN NEW;
END;
$function$;

-- Create notification function for problem interests
CREATE OR REPLACE FUNCTION public.notify_on_problem_interest()
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
    'interest',
    'New Interest',
    COALESCE(v_actor_name, 'Someone') || ' is interested in your problem "' || COALESCE(v_problem_title, 'Untitled') || '"',
    jsonb_build_object('problem_id', NEW.problem_id),
    0,
    'interest_problem_' || NEW.problem_id::text,
    NEW.problem_id,
    'problem',
    v_actor_id,
    COALESCE(v_actor_name, 'Someone'),
    v_actor_avatar
  );

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'notify_on_problem_interest error: %', SQLERRM;
  RETURN NEW;
END;
$function$;

-- Create notification triggers
CREATE TRIGGER on_innovation_interest_notify
  AFTER INSERT ON public.innovation_interests
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_innovation_interest();

CREATE TRIGGER on_problem_interest_notify
  AFTER INSERT ON public.problem_interests
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_problem_interest();

-- Create delete notification functions
CREATE OR REPLACE FUNCTION public.delete_innovation_interest_notification()
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
    AND type = 'interest'
    AND related_type = 'innovation'
    AND related_id = OLD.innovation_id
    AND actor_id = v_actor_id;

  RETURN OLD;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'delete_innovation_interest_notification error: %', SQLERRM;
  RETURN OLD;
END;
$function$;

CREATE OR REPLACE FUNCTION public.delete_problem_interest_notification()
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
    AND type = 'interest'
    AND related_type = 'problem'
    AND related_id = OLD.problem_id
    AND actor_id = v_actor_id;

  RETURN OLD;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'delete_problem_interest_notification error: %', SQLERRM;
  RETURN OLD;
END;
$function$;

-- Create delete notification triggers
CREATE TRIGGER on_innovation_uninterest_notify
  AFTER DELETE ON public.innovation_interests
  FOR EACH ROW
  EXECUTE FUNCTION public.delete_innovation_interest_notification();

CREATE TRIGGER on_problem_uninterest_notify
  AFTER DELETE ON public.problem_interests
  FOR EACH ROW
  EXECUTE FUNCTION public.delete_problem_interest_notification();