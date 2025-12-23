-- Drop existing restrictive SELECT policy
DROP POLICY IF EXISTS "Solutions viewable by authorized users" ON public.solutions;

-- Create new policy allowing anyone to view submitted solutions
CREATE POLICY "Anyone can view submitted solutions"
ON public.solutions
FOR SELECT
USING (
  status IN ('submitted', 'under_review', 'shortlisted', 'accepted')
  OR innovator_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM problems 
    WHERE problems.id = solutions.problem_id 
    AND problems.owner_id = auth.uid()
  )
);