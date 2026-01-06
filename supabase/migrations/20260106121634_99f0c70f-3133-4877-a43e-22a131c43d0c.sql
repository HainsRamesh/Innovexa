-- Fix infinite recursion in solutions RLS policy
-- The issue: solutions policy references investments, investments policy references solutions

-- Drop the problematic policy
DROP POLICY IF EXISTS "Authorized users can view solutions" ON public.solutions;

-- Create a simpler policy that avoids circular references by not checking investments
-- Access granted to:
-- 1. Solution owner (innovator_id = auth.uid())
-- 2. Problem owner (EXISTS check on problems table only)
-- Note: Investors access via investments will be handled by application layer or separate queries
CREATE POLICY "Authorized users can view solutions"
ON public.solutions
FOR SELECT
USING (
  -- Solution owner
  innovator_id = auth.uid()
  OR
  -- Problem owner
  EXISTS (
    SELECT 1 FROM public.problems
    WHERE problems.id = solutions.problem_id
    AND problems.owner_id = auth.uid()
  )
);

-- Create a separate function to check investor access (avoiding circular RLS)
CREATE OR REPLACE FUNCTION public.can_investor_view_solution(_solution_id UUID, _user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM investments i
    JOIN solutions s ON (i.problem_id = s.problem_id OR i.solution_id = s.id)
    WHERE s.id = _solution_id
    AND i.investor_id = _user_id
  );
$$;

-- Add investor access via RPC-based check (using SECURITY DEFINER function)
DROP POLICY IF EXISTS "Investors can view related solutions" ON public.solutions;
CREATE POLICY "Investors can view related solutions"
ON public.solutions
FOR SELECT
USING (
  public.can_investor_view_solution(id, auth.uid())
);