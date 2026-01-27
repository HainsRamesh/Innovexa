-- Fix 1: Update can_view_profile function to properly handle unauthenticated users
CREATE OR REPLACE FUNCTION public.can_view_profile(_target_user_id uuid, _viewer_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_setting text;
  v_is_connected boolean;
BEGIN
  -- Owner can always view their own profile
  IF _target_user_id = _viewer_id AND _viewer_id IS NOT NULL THEN
    RETURN true;
  END IF;

  -- Get privacy setting
  SELECT who_can_view_profile INTO v_setting
  FROM public.privacy_settings
  WHERE user_id = _target_user_id;

  -- Default to 'everyone' if no setting exists
  IF v_setting IS NULL THEN
    v_setting := 'everyone';
  END IF;

  CASE v_setting
    WHEN 'everyone' THEN
      RETURN true;
    WHEN 'authenticated' THEN
      -- Only authenticated users can view
      RETURN _viewer_id IS NOT NULL;
    WHEN 'connections' THEN
      -- Must be authenticated and connected
      IF _viewer_id IS NULL THEN
        RETURN false;
      END IF;
      SELECT EXISTS (
        SELECT 1 FROM public.connections c
        WHERE c.status = 'accepted'
        AND ((c.requester_id = _target_user_id AND c.recipient_id = _viewer_id)
             OR (c.recipient_id = _target_user_id AND c.requester_id = _viewer_id))
      ) INTO v_is_connected;
      RETURN v_is_connected;
    WHEN 'none' THEN
      RETURN false;
    ELSE
      -- Default to false for unknown settings (secure by default)
      RETURN false;
  END CASE;
END;
$function$;

-- Fix 2: Update problems RLS policy to properly enforce visibility
DROP POLICY IF EXISTS "Problems viewable based on visibility" ON public.problems;

CREATE POLICY "Problems viewable based on visibility"
ON public.problems
FOR SELECT
USING (
  (owner_id = auth.uid()) 
  OR (
    (status <> 'draft'::problem_status) 
    AND (
      CASE visibility
        WHEN 'public' THEN true
        WHEN 'authenticated' THEN (auth.uid() IS NOT NULL)
        WHEN 'private' THEN false
        ELSE false  -- Secure default: unknown visibility = not accessible
      END
    )
  )
);

-- Fix 3: Update innovations RLS policy to properly enforce visibility
DROP POLICY IF EXISTS "Innovations viewable based on visibility" ON public.innovations;

CREATE POLICY "Innovations viewable based on visibility"
ON public.innovations
FOR SELECT
USING (
  (innovator_id = auth.uid())
  OR (
    (status = ANY (ARRAY['published'::innovation_status, 'featured'::innovation_status]))
    AND (
      CASE visibility
        WHEN 'public' THEN true
        WHEN 'authenticated' THEN (auth.uid() IS NOT NULL)
        WHEN 'private' THEN false
        ELSE false  -- Secure default: unknown visibility = not accessible
      END
    )
  )
);