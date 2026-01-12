-- Ensure demo-play tracking RPC exists and is callable from client
-- This function increments innovations.view_count while bypassing RLS safely.

CREATE OR REPLACE FUNCTION public.increment_innovation_view_count(_innovation_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.innovations
  SET view_count = COALESCE(view_count, 0) + 1
  WHERE id = _innovation_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.increment_innovation_view_count(uuid) TO anon, authenticated;