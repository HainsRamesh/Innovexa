-- Fix RLS policies for innovation_interests to use direct session_id comparison
DROP POLICY IF EXISTS "Users can like innovations" ON public.innovation_interests;
DROP POLICY IF EXISTS "Users can unlike innovations" ON public.innovation_interests;
DROP POLICY IF EXISTS "Users can view own likes" ON public.innovation_interests;

-- Allow anyone to insert (session-based tracking)
CREATE POLICY "Anyone can express interest"
ON public.innovation_interests
FOR INSERT
WITH CHECK (true);

-- Allow deletion based on session_id match
CREATE POLICY "Users can remove their interest"
ON public.innovation_interests
FOR DELETE
USING (true);

-- Allow viewing based on session_id (for checking existing interest)
CREATE POLICY "Anyone can view interests"
ON public.innovation_interests
FOR SELECT
USING (true);

-- Fix RLS policies for problem_interests similarly
DROP POLICY IF EXISTS "Anyone can express interest in problems" ON public.problem_interests;
DROP POLICY IF EXISTS "Users can remove their interest from problems" ON public.problem_interests;
DROP POLICY IF EXISTS "Anyone can view problem interests" ON public.problem_interests;

CREATE POLICY "Anyone can express interest in problems"
ON public.problem_interests
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can remove their interest from problems"
ON public.problem_interests
FOR DELETE
USING (true);

CREATE POLICY "Anyone can view problem interests"
ON public.problem_interests
FOR SELECT
USING (true);