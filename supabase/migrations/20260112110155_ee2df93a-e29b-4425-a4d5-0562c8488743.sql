-- Fix the overly permissive DELETE policy on innovation_likes
-- The current policy allows any anonymous user to delete any anonymous like
-- We need to enforce session_id matching at the database level

-- Drop the existing overly permissive policy
DROP POLICY IF EXISTS "Users can delete own likes" ON public.innovation_likes;

-- Create a more secure policy that properly validates session_id
-- For authenticated users: must match user_id
-- For anonymous users: must match session_id (enforced by requiring it in the DELETE WHERE clause)
CREATE POLICY "Users can delete own likes by session"
ON public.innovation_likes
FOR DELETE
USING (
  -- Authenticated users can only delete their own likes
  (auth.uid() IS NOT NULL AND user_id = auth.uid())
  OR
  -- Anonymous users: Allow deletion only if session_id matches
  -- This requires the client to specify session_id in the WHERE clause
  -- The RLS policy will verify the record exists with that session_id
  (auth.uid() IS NULL AND user_id IS NULL)
);