-- Issue 1: Add explicit denial of public access to profiles
-- The existing policy requires auth.uid() = id, but let's add belt-and-suspenders protection
-- by ensuring RLS defaults to deny for unauthenticated users explicitly

-- First, ensure the current policy is correct
DROP POLICY IF EXISTS "Users can view own full profile" ON public.profiles;
CREATE POLICY "Authenticated users can view own profile only" ON public.profiles
FOR SELECT TO authenticated
USING (auth.uid() = id);

-- Issue 2: Fix investments visibility - consolidate SELECT policies to be explicit
-- Drop existing SELECT policies
DROP POLICY IF EXISTS "Investors can view own investments" ON public.investments;
DROP POLICY IF EXISTS "Problem owners can view accepted investments only" ON public.investments;

-- Create a single, clear SELECT policy that covers all valid cases
CREATE POLICY "Investment visibility rules" ON public.investments
FOR SELECT TO authenticated
USING (
  -- Investors can always see their own investments
  auth.uid() = investor_id
  OR
  -- Problem owners can ONLY see ACCEPTED investments for their specific problems
  (
    status = 'accepted'
    AND EXISTS (
      SELECT 1 FROM problems
      WHERE problems.id = investments.problem_id
      AND problems.owner_id = auth.uid()
    )
  )
);