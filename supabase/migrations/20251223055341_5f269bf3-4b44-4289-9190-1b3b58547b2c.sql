-- Drop the existing policy that exposes investment details to problem owners
DROP POLICY IF EXISTS "Problem owners can view investments on their problems" ON public.investments;

-- Create a more restrictive policy - problem owners only see that investments exist, not details
-- They can see investment count but not financial specifics until deal is finalized (accepted status)
CREATE POLICY "Problem owners can view accepted investments only"
ON public.investments
FOR SELECT
USING (
  (auth.uid() = investor_id) OR
  (
    status = 'accepted' AND
    EXISTS (
      SELECT 1 FROM public.problems
      WHERE problems.id = investments.problem_id
      AND problems.owner_id = auth.uid()
    )
  )
);

-- Add explicit deny for anonymous users
CREATE POLICY "Deny anonymous access to investments"
ON public.investments
FOR SELECT
TO anon
USING (false);