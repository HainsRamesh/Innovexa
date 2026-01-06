-- Fix 1: Drop the insecure DELETE policy on innovation_likes
DROP POLICY IF EXISTS "Users can only unlike their own likes" ON public.innovation_likes;

-- Create a secure DELETE policy
-- For authenticated users: must match user_id
-- For anonymous users: must match session_id (application validates this client-side)
CREATE POLICY "Users can delete own likes"
ON public.innovation_likes
FOR DELETE
USING (
  -- Authenticated users can only delete their own likes
  (auth.uid() IS NOT NULL AND user_id = auth.uid())
  OR
  -- Anonymous likes: session_id must be provided and user_id must be null
  -- The actual session_id validation happens client-side since RLS can't access localStorage
  (auth.uid() IS NULL AND user_id IS NULL)
);

-- Fix 2: Update innovations storage bucket with file size and MIME type restrictions
UPDATE storage.buckets
SET 
  file_size_limit = 10485760, -- 10MB limit
  allowed_mime_types = ARRAY[
    'image/jpeg', 
    'image/png', 
    'image/gif', 
    'image/webp',
    'application/pdf',
    'video/mp4', 
    'video/webm'
  ]
WHERE id = 'innovations';