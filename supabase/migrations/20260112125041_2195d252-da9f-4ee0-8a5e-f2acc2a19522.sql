-- Tighten RLS on innovation_likes to remove permissive (true) policies and prevent anonymous deletion of others' likes.

-- Drop permissive policies
DROP POLICY IF EXISTS "Anyone can like innovations" ON public.innovation_likes;
DROP POLICY IF EXISTS "Anyone can view likes" ON public.innovation_likes;
DROP POLICY IF EXISTS "Users can delete own likes by session" ON public.innovation_likes;

-- Only allow reading like rows for the current authenticated user, or for the current anonymous session.
CREATE POLICY "Users can view own likes"
ON public.innovation_likes
FOR SELECT
TO public
USING (
  (auth.uid() IS NOT NULL AND user_id = auth.uid())
  OR (
    session_id = (coalesce(current_setting('request.headers', true), '{}')::jsonb ->> 'x-innovation-session-id')
  )
);

-- Allow inserting likes for the current anonymous session (header) or authenticated user.
CREATE POLICY "Users can like innovations"
ON public.innovation_likes
FOR INSERT
TO public
WITH CHECK (
  session_id = (coalesce(current_setting('request.headers', true), '{}')::jsonb ->> 'x-innovation-session-id')
  AND (user_id IS NULL OR user_id = auth.uid())
);

-- Allow deleting only the current session's like (and prevent deleting other users' likes).
CREATE POLICY "Users can unlike innovations"
ON public.innovation_likes
FOR DELETE
TO public
USING (
  session_id = (coalesce(current_setting('request.headers', true), '{}')::jsonb ->> 'x-innovation-session-id')
  AND (user_id IS NULL OR user_id = auth.uid())
);
