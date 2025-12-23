-- Allow problem owners to approve solutions without granting broad UPDATE permissions

CREATE OR REPLACE FUNCTION public.approve_solution(_solution_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.solutions s
  SET status = 'accepted'::public.solution_status,
      updated_at = now()
  WHERE s.id = _solution_id
    AND EXISTS (
      SELECT 1
      FROM public.problems p
      WHERE p.id = s.problem_id
        AND p.owner_id = auth.uid()
    );

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Not authorized or solution not found';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.approve_solution(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.approve_solution(uuid) TO authenticated;
