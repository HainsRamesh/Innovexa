-- Drop the existing overly permissive policy
DROP POLICY IF EXISTS "Anyone can view innovation comments" ON public.innovation_comments;

-- Create new policy that restricts viewing to authenticated users only
CREATE POLICY "Authenticated users can view innovation comments"
ON public.innovation_comments
FOR SELECT
USING (auth.uid() IS NOT NULL);