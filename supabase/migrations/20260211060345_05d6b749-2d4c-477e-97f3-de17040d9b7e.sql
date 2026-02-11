
-- Create a SECURITY DEFINER function for soft-deleting a message for the current user
CREATE OR REPLACE FUNCTION public.soft_delete_message_for_me(p_message_id uuid)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_conversation_id uuid;
  v_user_id uuid := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Verify the user is a participant in the conversation this message belongs to
  SELECT c.id INTO v_conversation_id
  FROM messages m
  JOIN conversations c ON c.id = m.conversation_id
  WHERE m.id = p_message_id
    AND (c.participant_one = v_user_id OR c.participant_two = v_user_id);

  IF v_conversation_id IS NULL THEN
    RAISE EXCEPTION 'Message not found or access denied';
  END IF;

  -- Append user ID to deleted_for_user_ids array
  UPDATE messages
  SET deleted_for_user_ids = array_append(COALESCE(deleted_for_user_ids, '{}'), v_user_id::text)
  WHERE id = p_message_id
    AND NOT (v_user_id::text = ANY(COALESCE(deleted_for_user_ids, '{}')));
END;
$$;
