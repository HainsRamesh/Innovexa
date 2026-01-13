-- Messaging fixes: reply metadata + secure read/unread helpers

-- 1) WhatsApp-style reply metadata
ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS reply_to_message_id uuid NULL REFERENCES public.messages(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS reply_to_sender_id uuid NULL,
  ADD COLUMN IF NOT EXISTS reply_to_snippet text NULL;

CREATE INDEX IF NOT EXISTS idx_messages_reply_to_message_id
  ON public.messages(reply_to_message_id);

-- 2) Securely mark a conversation as read for the current user
CREATE OR REPLACE FUNCTION public.mark_conversation_read(p_conversation_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid;
  v_count integer;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.conversations c
    WHERE c.id = p_conversation_id
      AND (c.participant_one = v_uid OR c.participant_two = v_uid)
  ) THEN
    RAISE EXCEPTION 'not_authorized';
  END IF;

  UPDATE public.messages m
  SET read_at = now()
  WHERE m.conversation_id = p_conversation_id
    AND m.sender_id <> v_uid
    AND m.read_at IS NULL;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

REVOKE ALL ON FUNCTION public.mark_conversation_read(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.mark_conversation_read(uuid) TO authenticated;

-- 3) Efficient global unread count (only incoming messages)
CREATE OR REPLACE FUNCTION public.get_unread_message_count()
RETURNS integer
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT count(*)::int
  FROM public.messages m
  JOIN public.conversations c ON c.id = m.conversation_id
  WHERE (c.participant_one = auth.uid() OR c.participant_two = auth.uid())
    AND m.sender_id <> auth.uid()
    AND m.read_at IS NULL
    AND NOT (auth.uid() = ANY(COALESCE(m.deleted_for_user_ids, '{}'::uuid[])));
$$;

REVOKE ALL ON FUNCTION public.get_unread_message_count() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_unread_message_count() TO authenticated;
