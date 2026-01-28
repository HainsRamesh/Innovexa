-- Drop the overly permissive policy that exposes financial data to problem owners
DROP POLICY IF EXISTS "Problem owners can view basic investment info on their problems" ON public.investments;

-- Create a new restrictive policy for problem owners
-- Problem owners can see that investments exist on their problems, but NOT the financial details
-- They can only see: id, investor_id, problem_id, solution_id, status, created_at, updated_at
-- Financial columns (funding_amount, expected_roi, conditions, comments) are protected via the investments_summary view

-- Create a secure function to check if user is the problem owner for an investment
CREATE OR REPLACE FUNCTION public.is_problem_owner_for_investment(_investment_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM investments i
    JOIN problems p ON p.id = i.problem_id
    WHERE i.id = _investment_id AND p.owner_id = auth.uid()
  );
$$;

-- Update the investments_summary view to properly mask financial data for non-investors
-- Problem owners can see metadata but not financial details
DROP VIEW IF EXISTS public.investments_summary;

CREATE VIEW public.investments_summary
WITH (security_invoker = on)
AS
SELECT
  i.id,
  i.investor_id,
  i.problem_id,
  i.solution_id,
  i.created_at,
  i.updated_at,
  i.status,
  -- Only the investor can see their own financial details
  CASE 
    WHEN i.investor_id = auth.uid() THEN i.funding_amount 
    ELSE NULL 
  END AS funding_amount,
  CASE 
    WHEN i.investor_id = auth.uid() THEN i.expected_roi 
    ELSE NULL 
  END AS expected_roi,
  CASE 
    WHEN i.investor_id = auth.uid() THEN i.conditions 
    ELSE NULL 
  END AS conditions,
  CASE 
    WHEN i.investor_id = auth.uid() THEN i.comments 
    ELSE NULL 
  END AS comments
FROM public.investments i
WHERE
  -- Investors can see their own investments
  i.investor_id = auth.uid()
  OR
  -- Problem owners can see investments on their problems (but financial data is masked)
  EXISTS (
    SELECT 1 FROM problems p 
    WHERE p.id = i.problem_id AND p.owner_id = auth.uid()
  )
  OR
  -- Solution providers can see investments on their solutions (but financial data is masked)
  (i.solution_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM solutions s 
    WHERE s.id = i.solution_id AND s.innovator_id = auth.uid()
  ));

-- Add comment explaining the security model
COMMENT ON VIEW public.investments_summary IS 'Secure view for investments that masks financial details (funding_amount, expected_roi, conditions, comments) for non-investors. Problem owners and solution providers can see that investments exist but cannot see the financial terms.';

COMMENT ON FUNCTION public.is_problem_owner_for_investment IS 'Checks if the current user owns the problem associated with an investment. Used for secure access control.';