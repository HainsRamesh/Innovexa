-- Atomic demo-play increment for an innovation (used by frontend on video play)
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
