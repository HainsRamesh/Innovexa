-- Create storage bucket for solution attachments
INSERT INTO storage.buckets (id, name, public) 
VALUES ('solution-attachments', 'solution-attachments', false)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload to their own folder
CREATE POLICY "Users can upload solution attachments"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'solution-attachments' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to view their own attachments
CREATE POLICY "Users can view own solution attachments"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'solution-attachments' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to delete their own attachments
CREATE POLICY "Users can delete own solution attachments"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'solution-attachments' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow problem owners to view attachments of solutions to their problems
CREATE POLICY "Problem owners can view solution attachments"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'solution-attachments' AND
  EXISTS (
    SELECT 1 
    FROM public.solutions s
    JOIN public.problems p ON p.id = s.problem_id
    WHERE 
      p.owner_id = auth.uid() AND
      s.innovator_id::text = (storage.foldername(name))[1]
  )
);