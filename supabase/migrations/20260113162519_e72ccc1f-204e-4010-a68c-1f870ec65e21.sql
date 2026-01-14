-- Add edited_at column for tracking message edits
ALTER TABLE public.messages
ADD COLUMN IF NOT EXISTS edited_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Add is_deleted column for "delete for everyone" functionality (soft delete)
ALTER TABLE public.messages
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;

-- Add deleted_for_user_ids array for "delete for me" functionality
ALTER TABLE public.messages
ADD COLUMN IF NOT EXISTS deleted_for_user_ids UUID[] DEFAULT '{}';

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_messages_deleted_for_user_ids 
ON public.messages USING GIN(deleted_for_user_ids);

-- Update RLS policy to filter out deleted messages for user
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON public.messages;

CREATE POLICY "Users can view messages in their conversations"
ON public.messages
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM conversations c
    WHERE c.id = messages.conversation_id
    AND (c.participant_one = auth.uid() OR c.participant_two = auth.uid())
  )
  AND NOT (auth.uid() = ANY(deleted_for_user_ids))
);

-- Enable realtime for message updates (for edit/delete sync)
ALTER TABLE public.messages REPLICA IDENTITY FULL;