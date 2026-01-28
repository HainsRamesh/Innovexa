-- Create a view that hides sensitive financial details for non-owners
-- Problem owners can see that investments exist but not specific amounts/terms of other investors

CREATE OR REPLACE VIEW public.investments_summary
WITH (security_invoker = on) AS
SELECT 
  i.id,
  i.investor_id,
  i.problem_id,
  i.solution_id,
  i.status,
  i.created_at,
  i.updated_at,
  -- Only show financial details if the viewer is the investor
  CASE WHEN i.investor_id = auth.uid() THEN i.funding_amount ELSE NULL END as funding_amount,
  CASE WHEN i.investor_id = auth.uid() THEN i.expected_roi ELSE NULL END as expected_roi,
  CASE WHEN i.investor_id = auth.uid() THEN i.conditions ELSE NULL END as conditions,
  CASE WHEN i.investor_id = auth.uid() THEN i.comments ELSE NULL END as comments
FROM public.investments i;

-- Grant SELECT on the view
GRANT SELECT ON public.investments_summary TO authenticated;