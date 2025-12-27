-- Fix 1: Verify profiles table RLS is correct (it already only allows own profile viewing)
-- The current policy is correct, but let's ensure no other policies leak data
-- No changes needed for profiles as the policy (auth.uid() = id) correctly restricts access

-- Fix 2: Update investments table RLS to prevent exposing competing investors' financial details
-- Drop the existing visibility policy
DROP POLICY IF EXISTS "Investment visibility rules" ON public.investments;

-- Create a stricter policy: investors can only see their OWN investments
-- Problem owners should NOT be able to see other investors' financial details
CREATE POLICY "Investors can view own investments only"
ON public.investments
FOR SELECT
USING (auth.uid() = investor_id);