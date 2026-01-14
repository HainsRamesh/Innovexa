-- Fix: Restrict problem_likes SELECT access to authenticated users only
-- Remove the public "Anyone can view" policy and replace with authenticated-only

DROP POLICY IF EXISTS "Anyone can view problem likes" ON public.problem_likes;

CREATE POLICY "Authenticated users can view problem likes"
ON public.problem_likes
FOR SELECT
TO authenticated
USING (true);