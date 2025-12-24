-- Create innovation_likes table for tracking likes
CREATE TABLE public.innovation_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  innovation_id UUID NOT NULL REFERENCES public.innovations(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  user_id UUID DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(innovation_id, session_id)
);

-- Add like_count column to innovations
ALTER TABLE public.innovations ADD COLUMN like_count INTEGER DEFAULT 0;

-- Enable RLS
ALTER TABLE public.innovation_likes ENABLE ROW LEVEL SECURITY;

-- Anyone can view likes
CREATE POLICY "Anyone can view likes" ON public.innovation_likes
  FOR SELECT USING (true);

-- Anyone can insert likes
CREATE POLICY "Anyone can like innovations" ON public.innovation_likes
  FOR INSERT WITH CHECK (true);

-- Anyone can delete their own likes by session_id
CREATE POLICY "Anyone can unlike by session" ON public.innovation_likes
  FOR DELETE USING (true);

-- Create function to update like_count on innovations
CREATE OR REPLACE FUNCTION public.update_innovation_like_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.innovations SET like_count = like_count + 1 WHERE id = NEW.innovation_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.innovations SET like_count = like_count - 1 WHERE id = OLD.innovation_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- Create trigger for like count updates
CREATE TRIGGER innovation_likes_count_trigger
AFTER INSERT OR DELETE ON public.innovation_likes
FOR EACH ROW
EXECUTE FUNCTION public.update_innovation_like_count();