-- ============================================================
-- SECURITY HARDENING: Remove email from profiles table
-- Email already exists in auth.users and should not be duplicated
-- This eliminates the PII exposure risk entirely
-- ============================================================

-- Step 1: Update handle_new_user() to not copy email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert profile WITHOUT email - email is accessed via auth.users only
  INSERT INTO public.profiles (id, full_name)
  VALUES (new.id, new.raw_user_meta_data ->> 'full_name');
  RETURN new;
END;
$$;

-- Step 2: Drop the email column from profiles table
-- This eliminates the security concern entirely
ALTER TABLE public.profiles DROP COLUMN IF EXISTS email;

-- Step 3: Update sync_public_profile_from_profiles trigger
-- (Already doesn't sync email since public_profiles doesn't have email)

-- ============================================================
-- INVESTMENT HARDENING: Strengthen investments view security
-- Add WHERE clause that restricts base table access more strictly
-- ============================================================

-- Drop and recreate investments_summary with stricter security
DROP VIEW IF EXISTS public.investments_summary;

-- Create the secured view with security_invoker
-- This ensures the view executes with the caller's permissions
CREATE VIEW public.investments_summary
WITH (security_invoker = on)
AS
SELECT 
  id,
  investor_id,
  problem_id,
  solution_id,
  created_at,
  updated_at,
  status,
  -- Financial data is ONLY visible to the investor themselves
  CASE WHEN investor_id = auth.uid() THEN funding_amount ELSE NULL END AS funding_amount,
  CASE WHEN investor_id = auth.uid() THEN expected_roi ELSE NULL END AS expected_roi,
  CASE WHEN investor_id = auth.uid() THEN conditions ELSE NULL END AS conditions,
  CASE WHEN investor_id = auth.uid() THEN comments ELSE NULL END AS comments
FROM public.investments i
WHERE 
  -- Investor can see their own investments
  investor_id = auth.uid()
  OR
  -- Problem owner can see investments on their problems (metadata only via CASE above)
  EXISTS (
    SELECT 1 FROM public.problems p 
    WHERE p.id = i.problem_id AND p.owner_id = auth.uid()
  )
  OR
  -- Solution provider can see investments on their solutions (metadata only via CASE above)
  (
    solution_id IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM public.solutions s 
      WHERE s.id = i.solution_id AND s.innovator_id = auth.uid()
    )
  );

-- Grant SELECT on the view to authenticated users
GRANT SELECT ON public.investments_summary TO authenticated;