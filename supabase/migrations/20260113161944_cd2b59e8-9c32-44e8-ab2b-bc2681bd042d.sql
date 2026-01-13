-- Add type column to messages table
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT 'text';

-- Create message_attachments table
CREATE TABLE IF NOT EXISTS public.message_attachments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size INTEGER NOT NULL,
  thumbnail_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on message_attachments
ALTER TABLE public.message_attachments ENABLE ROW LEVEL SECURITY;

-- Create storage bucket for chat attachments
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'chat-attachments', 
  'chat-attachments', 
  false,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation', 'text/plain', 'application/zip']
) ON CONFLICT (id) DO NOTHING;

-- RLS policy: Participants can view attachments for their conversations
CREATE POLICY "Participants can view message attachments"
ON public.message_attachments
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.messages m
    JOIN public.conversations c ON m.conversation_id = c.id
    WHERE m.id = message_attachments.message_id
    AND (c.participant_one = auth.uid() OR c.participant_two = auth.uid())
  )
);

-- RLS policy: Participants can insert attachments for their messages
CREATE POLICY "Users can insert attachments for their messages"
ON public.message_attachments
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.messages m
    WHERE m.id = message_attachments.message_id
    AND m.sender_id = auth.uid()
  )
);

-- Storage policies for chat-attachments bucket
-- Allow authenticated users to upload to their own folder
CREATE POLICY "Users can upload chat attachments"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'chat-attachments' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow conversation participants to view attachments
CREATE POLICY "Participants can view chat attachments"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'chat-attachments'
  AND EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE (c.participant_one = auth.uid() OR c.participant_two = auth.uid())
    AND (
      (storage.foldername(name))[1] = c.participant_one::text 
      OR (storage.foldername(name))[1] = c.participant_two::text
    )
  )
);

-- Allow users to delete their own uploads
CREATE POLICY "Users can delete own chat attachments"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'chat-attachments' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Create index for faster attachment lookups
CREATE INDEX IF NOT EXISTS idx_message_attachments_message_id ON public.message_attachments(message_id);

-- Enable realtime for message_attachments
ALTER PUBLICATION supabase_realtime ADD TABLE public.message_attachments;