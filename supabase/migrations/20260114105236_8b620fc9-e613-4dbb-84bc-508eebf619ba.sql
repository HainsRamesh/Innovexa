-- ============================================
-- Security Enhancement: User-Controlled Visibility Settings
-- ============================================

-- 1. Create privacy_settings table for user profile visibility control
CREATE TABLE IF NOT EXISTS public.privacy_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  who_can_message text NOT NULL DEFAULT 'everyone' CHECK (who_can_message IN ('everyone', 'connections', 'none')),
  who_can_view_profile text NOT NULL DEFAULT 'everyone' CHECK (who_can_view_profile IN ('everyone', 'connections', 'none')),
  who_can_comment text NOT NULL DEFAULT 'everyone' CHECK (who_can_comment IN ('everyone', 'connections', 'none')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS on privacy_settings
ALTER TABLE public.privacy_settings ENABLE ROW LEVEL SECURITY;

-- Users can only view and manage their own privacy settings
CREATE POLICY "Users can view own privacy settings"
ON public.privacy_settings FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own privacy settings"
ON public.privacy_settings FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own privacy settings"
ON public.privacy_settings FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- 2. Add visibility column to problems table
ALTER TABLE public.problems 
ADD COLUMN IF NOT EXISTS visibility text NOT NULL DEFAULT 'public';

-- Add check constraint separately to avoid issues if column exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'problems_visibility_check'
  ) THEN
    ALTER TABLE public.problems 
    ADD CONSTRAINT problems_visibility_check 
    CHECK (visibility IN ('public', 'authenticated', 'private'));
  END IF;
END $$;

-- 3. Add visibility column to innovations table
ALTER TABLE public.innovations 
ADD COLUMN IF NOT EXISTS visibility text NOT NULL DEFAULT 'public';

-- Add check constraint separately
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'innovations_visibility_check'
  ) THEN
    ALTER TABLE public.innovations 
    ADD CONSTRAINT innovations_visibility_check 
    CHECK (visibility IN ('public', 'authenticated', 'private'));
  END IF;
END $$;

-- 4. Create helper function to check if a user can view a profile
CREATE OR REPLACE FUNCTION public.can_view_profile(_target_user_id uuid, _viewer_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_setting text;
  v_is_connected boolean;
BEGIN
  -- Owner can always view their own profile
  IF _target_user_id = _viewer_id THEN
    RETURN true;
  END IF;

  -- Get privacy setting
  SELECT who_can_view_profile INTO v_setting
  FROM public.privacy_settings
  WHERE user_id = _target_user_id;

  -- Default to 'everyone' if no setting exists
  IF v_setting IS NULL THEN
    RETURN true;
  END IF;

  CASE v_setting
    WHEN 'everyone' THEN
      RETURN true;
    WHEN 'connections' THEN
      -- Check if users are connected
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
      RETURN true;
  END CASE;
END;
$$;

-- 5. Update public_profiles RLS policy to respect privacy settings
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.public_profiles;

CREATE POLICY "Profiles viewable based on privacy settings"
ON public.public_profiles FOR SELECT
USING (
  public.can_view_profile(id, auth.uid())
);

-- 6. Update problems RLS policy to respect visibility settings
DROP POLICY IF EXISTS "Published problems are viewable by everyone" ON public.problems;

CREATE POLICY "Problems viewable based on visibility"
ON public.problems FOR SELECT
USING (
  -- Owner can always view their own problems
  owner_id = auth.uid()
  OR (
    -- Non-draft problems are subject to visibility rules
    status <> 'draft'::problem_status
    AND (
      CASE visibility
        WHEN 'public' THEN true
        WHEN 'authenticated' THEN auth.uid() IS NOT NULL
        WHEN 'private' THEN false
        ELSE true
      END
    )
  )
);

-- 7. Update innovations RLS policy to respect visibility settings
DROP POLICY IF EXISTS "Published innovations are viewable by everyone" ON public.innovations;

CREATE POLICY "Innovations viewable based on visibility"
ON public.innovations FOR SELECT
USING (
  -- Owner can always view their own innovations
  innovator_id = auth.uid()
  OR (
    -- Published/featured innovations are subject to visibility rules
    status IN ('published'::innovation_status, 'featured'::innovation_status)
    AND (
      CASE visibility
        WHEN 'public' THEN true
        WHEN 'authenticated' THEN auth.uid() IS NOT NULL
        WHEN 'private' THEN false
        ELSE true
      END
    )
  )
);

-- 8. Create trigger to auto-create privacy settings for new users
CREATE OR REPLACE FUNCTION public.handle_new_user_privacy_settings()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.privacy_settings (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Create trigger on profiles table (fires when user profile is created)
DROP TRIGGER IF EXISTS on_profile_created_privacy_settings ON public.profiles;
CREATE TRIGGER on_profile_created_privacy_settings
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_privacy_settings();

-- 9. Initialize privacy settings for existing users
INSERT INTO public.privacy_settings (user_id)
SELECT id FROM public.profiles
ON CONFLICT (user_id) DO NOTHING;