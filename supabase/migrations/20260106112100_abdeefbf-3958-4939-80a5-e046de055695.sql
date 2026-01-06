-- Drop the existing overly permissive policy
DROP POLICY IF EXISTS "Anyone can view submitted solutions" ON public.solutions;

-- Create a new restricted policy that only allows authorized users
CREATE POLICY "Authorized users can view solutions"
ON public.solutions
FOR SELECT
USING (
  -- Solution owner can always view their own solutions
  (innovator_id = auth.uid())
  OR
  -- Problem owner can view solutions submitted to their problems
  (EXISTS (
    SELECT 1 FROM public.problems
    WHERE problems.id = solutions.problem_id
    AND problems.owner_id = auth.uid()
  ))
  OR
  -- Investors who have invested in the problem can view solutions
  (EXISTS (
    SELECT 1 FROM public.investments
    WHERE investments.problem_id = solutions.problem_id
    AND investments.investor_id = auth.uid()
  ))
  OR
  -- Investors who have invested in this specific solution can view it
  (EXISTS (
    SELECT 1 FROM public.investments
    WHERE investments.solution_id = solutions.id
    AND investments.investor_id = auth.uid()
  ))
);