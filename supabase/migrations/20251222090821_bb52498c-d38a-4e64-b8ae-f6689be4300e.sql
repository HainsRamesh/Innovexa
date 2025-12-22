-- Drop the existing overly permissive SELECT policy
DROP POLICY IF EXISTS "Solutions viewable by problem owner and solution creator" ON public.solutions;

-- Create a more restrictive policy:
-- - Solution creator can always view their own solutions
-- - Problem owner can view solutions submitted to their problems
-- - Only 'accepted' solutions are publicly viewable (not 'shortlisted')
CREATE POLICY "Solutions viewable by authorized users"
ON public.solutions
FOR SELECT
USING (
  -- Solution creator can always view their own
  (innovator_id = auth.uid())
  OR
  -- Problem owner can view solutions to their problems
  (EXISTS (
    SELECT 1 FROM problems
    WHERE problems.id = solutions.problem_id
    AND problems.owner_id = auth.uid()
  ))
  OR
  -- Only accepted solutions are publicly viewable
  (status = 'accepted'::solution_status)
);