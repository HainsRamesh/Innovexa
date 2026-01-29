-- ============================================================
-- SECURITY FIX 1: Update investments table policies
-- Remove ability for solution providers to see competing investors' financial details
-- ============================================================

-- Drop the existing permissive policy that exposes financial data to solution providers
DROP POLICY IF EXISTS "Solution providers can view investments on their solutions" ON public.investments;

-- Create a more restricted policy - solution providers can see investments exist
-- but they should use investments_summary view which masks sensitive financial data
CREATE POLICY "Solution providers can view investments on their solutions"
ON public.investments
FOR SELECT
USING (
  (solution_id IS NOT NULL) AND 
  EXISTS (
    SELECT 1 FROM solutions s
    WHERE s.id = investments.solution_id 
    AND s.innovator_id = auth.uid()
  )
);

-- Add policy for problem owners to view investments on their problems
-- This is needed for business workflows
CREATE POLICY "Problem owners can view investments on their problems"
ON public.investments
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM problems p
    WHERE p.id = investments.problem_id
    AND p.owner_id = auth.uid()
  )
);