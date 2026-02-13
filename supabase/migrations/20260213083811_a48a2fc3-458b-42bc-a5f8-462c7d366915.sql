
-- Drop the existing INSERT policy on messages
DROP POLICY IF EXISTS "Users can send messages in their conversations" ON public.messages;

-- Create new INSERT policy that also checks bidirectional block
CREATE POLICY "Users can send messages in their conversations"
ON public.messages
FOR INSERT
WITH CHECK (
  (auth.uid() = sender_id)
  AND (EXISTS (
    SELECT 1 FROM conversations c
    WHERE c.id = messages.conversation_id
      AND (c.participant_one = auth.uid() OR c.participant_two = auth.uid())
  ))
  AND NOT is_user_blocked(
    auth.uid(),
    CASE
      WHEN (SELECT participant_one FROM conversations WHERE id = messages.conversation_id) = auth.uid()
      THEN (SELECT participant_two FROM conversations WHERE id = messages.conversation_id)
      ELSE (SELECT participant_one FROM conversations WHERE id = messages.conversation_id)
    END
  )
);
