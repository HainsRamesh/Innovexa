-- Drop the existing restrictive UPDATE policy
DROP POLICY "Users can update their own messages" ON public.messages;

-- Create separate policies: sender can update text/edit fields, any participant can update deleted_for_user_ids
CREATE POLICY "Sender can update own messages"
ON public.messages
FOR UPDATE
USING (auth.uid() = sender_id)
WITH CHECK (auth.uid() = sender_id);

-- Allow any conversation participant to update deleted_for_user_ids (for "delete for me")
CREATE POLICY "Participants can soft-delete messages for themselves"
ON public.messages
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM conversations c
    WHERE c.id = messages.conversation_id
    AND (c.participant_one = auth.uid() OR c.participant_two = auth.uid())
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM conversations c
    WHERE c.id = messages.conversation_id
    AND (c.participant_one = auth.uid() OR c.participant_two = auth.uid())
  )
);