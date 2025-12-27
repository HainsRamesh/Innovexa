-- Add RLS policy for problem owners to view investments on their problems
CREATE POLICY "Problem owners can view investments on their problems"
ON public.investments
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.problems
    WHERE problems.id = investments.problem_id
    AND problems.owner_id = auth.uid()
  )
);

-- Add RLS policy for solution providers to view investments linked to their solutions
CREATE POLICY "Solution providers can view investments on their solutions"
ON public.investments
FOR SELECT
USING (
  investments.solution_id IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.solutions
    WHERE solutions.id = investments.solution_id
    AND solutions.innovator_id = auth.uid()
  )
);