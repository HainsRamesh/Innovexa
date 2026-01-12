-- Create table for tracking enterprise innovation video views
CREATE TABLE public.enterprise_innovation_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  enterprise_user_id uuid NOT NULL,
  innovation_id uuid NOT NULL,
  view_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(enterprise_user_id, innovation_id, view_date)
);

-- Enable RLS
ALTER TABLE public.enterprise_innovation_views ENABLE ROW LEVEL SECURITY;

-- Users can view their own views
CREATE POLICY "Users can view own innovation views"
ON public.enterprise_innovation_views
FOR SELECT
USING (auth.uid() = enterprise_user_id);

-- Users can insert own views
CREATE POLICY "Users can insert own innovation views"
ON public.enterprise_innovation_views
FOR INSERT
WITH CHECK (auth.uid() = enterprise_user_id);

-- Create function to track enterprise video views
CREATE OR REPLACE FUNCTION public.track_enterprise_video_view(_innovation_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.enterprise_innovation_views (enterprise_user_id, innovation_id, view_date)
  VALUES (auth.uid(), _innovation_id, CURRENT_DATE)
  ON CONFLICT (enterprise_user_id, innovation_id, view_date) DO NOTHING;
END;
$$;

-- Create index for fast lookups
CREATE INDEX idx_enterprise_innovation_views_user ON public.enterprise_innovation_views(enterprise_user_id);
CREATE INDEX idx_enterprise_innovation_views_date ON public.enterprise_innovation_views(created_at);

-- Add problem likes table for the like/heart functionality on problems
CREATE TABLE public.problem_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  problem_id uuid NOT NULL REFERENCES public.problems(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(problem_id, session_id)
);

-- Enable RLS
ALTER TABLE public.problem_likes ENABLE ROW LEVEL SECURITY;

-- Anyone can view like counts
CREATE POLICY "Anyone can view problem likes"
ON public.problem_likes
FOR SELECT
USING (true);

-- Users can like problems
CREATE POLICY "Users can like problems"
ON public.problem_likes
FOR INSERT
WITH CHECK (
  (session_id = (COALESCE(current_setting('request.headers', true), '{}')::jsonb ->> 'x-problem-session-id'))
  AND ((user_id IS NULL) OR (user_id = auth.uid()))
);

-- Users can unlike problems
CREATE POLICY "Users can unlike problems"
ON public.problem_likes
FOR DELETE
USING (
  (session_id = (COALESCE(current_setting('request.headers', true), '{}')::jsonb ->> 'x-problem-session-id'))
  AND ((user_id IS NULL) OR (user_id = auth.uid()))
);

-- Add like_count column to problems table
ALTER TABLE public.problems ADD COLUMN IF NOT EXISTS like_count integer DEFAULT 0;

-- Add solutions_count column to problems table (for counting solutions/comments)
ALTER TABLE public.problems ADD COLUMN IF NOT EXISTS solutions_count integer DEFAULT 0;

-- Create trigger function to update problem like count
CREATE OR REPLACE FUNCTION public.update_problem_like_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.problems SET like_count = like_count + 1 WHERE id = NEW.problem_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.problems SET like_count = like_count - 1 WHERE id = OLD.problem_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- Create trigger
CREATE TRIGGER problem_like_count_trigger
AFTER INSERT OR DELETE ON public.problem_likes
FOR EACH ROW EXECUTE FUNCTION public.update_problem_like_count();

-- Create trigger function to update problem solutions count
CREATE OR REPLACE FUNCTION public.update_problem_solutions_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.problems SET solutions_count = COALESCE(solutions_count, 0) + 1 WHERE id = NEW.problem_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.problems SET solutions_count = GREATEST(COALESCE(solutions_count, 0) - 1, 0) WHERE id = OLD.problem_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- Create trigger
CREATE TRIGGER problem_solutions_count_trigger
AFTER INSERT OR DELETE ON public.solutions
FOR EACH ROW EXECUTE FUNCTION public.update_problem_solutions_count();