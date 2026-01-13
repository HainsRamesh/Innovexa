-- Create connections table (LinkedIn-style connect/follow)
CREATE TABLE public.connections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  requester_id UUID NOT NULL,
  recipient_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(requester_id, recipient_id)
);

-- Create conversations table
CREATE TABLE public.conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  participant_one UUID NOT NULL,
  participant_two UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(participant_one, participant_two)
);

-- Create messages table
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  text TEXT NOT NULL,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_restrictions table (restrict without blocking)
CREATE TABLE public.user_restrictions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  restrictor_id UUID NOT NULL,
  restricted_user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(restrictor_id, restricted_user_id)
);

-- Create user_blocks table
CREATE TABLE public.user_blocks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  blocker_id UUID NOT NULL,
  blocked_user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(blocker_id, blocked_user_id)
);

-- Create user_reports table
CREATE TABLE public.user_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reporter_id UUID NOT NULL,
  reported_user_id UUID NOT NULL,
  reason TEXT NOT NULL CHECK (reason IN ('spam', 'harassment', 'inappropriate_content', 'fake_profile', 'other')),
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_restrictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_reports ENABLE ROW LEVEL SECURITY;

-- Connections policies
CREATE POLICY "Users can view their own connections"
  ON public.connections FOR SELECT
  USING (auth.uid() = requester_id OR auth.uid() = recipient_id);

CREATE POLICY "Users can create connection requests"
  ON public.connections FOR INSERT
  WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Users can update connections they're part of"
  ON public.connections FOR UPDATE
  USING (auth.uid() = requester_id OR auth.uid() = recipient_id);

CREATE POLICY "Users can delete their own connection requests"
  ON public.connections FOR DELETE
  USING (auth.uid() = requester_id OR auth.uid() = recipient_id);

-- Conversations policies
CREATE POLICY "Users can view their conversations"
  ON public.conversations FOR SELECT
  USING (auth.uid() = participant_one OR auth.uid() = participant_two);

CREATE POLICY "Users can create conversations"
  ON public.conversations FOR INSERT
  WITH CHECK (auth.uid() = participant_one OR auth.uid() = participant_two);

-- Messages policies
CREATE POLICY "Users can view messages in their conversations"
  ON public.messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id
      AND (c.participant_one = auth.uid() OR c.participant_two = auth.uid())
    )
  );

CREATE POLICY "Users can send messages in their conversations"
  ON public.messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id
      AND (c.participant_one = auth.uid() OR c.participant_two = auth.uid())
    )
  );

CREATE POLICY "Users can update their own messages"
  ON public.messages FOR UPDATE
  USING (auth.uid() = sender_id);

-- User restrictions policies
CREATE POLICY "Users can view their restrictions"
  ON public.user_restrictions FOR SELECT
  USING (auth.uid() = restrictor_id);

CREATE POLICY "Users can create restrictions"
  ON public.user_restrictions FOR INSERT
  WITH CHECK (auth.uid() = restrictor_id);

CREATE POLICY "Users can delete their restrictions"
  ON public.user_restrictions FOR DELETE
  USING (auth.uid() = restrictor_id);

-- User blocks policies
CREATE POLICY "Users can view their blocks"
  ON public.user_blocks FOR SELECT
  USING (auth.uid() = blocker_id);

CREATE POLICY "Users can create blocks"
  ON public.user_blocks FOR INSERT
  WITH CHECK (auth.uid() = blocker_id);

CREATE POLICY "Users can delete their blocks"
  ON public.user_blocks FOR DELETE
  USING (auth.uid() = blocker_id);

-- User reports policies
CREATE POLICY "Users can view their own reports"
  ON public.user_reports FOR SELECT
  USING (auth.uid() = reporter_id);

CREATE POLICY "Users can create reports"
  ON public.user_reports FOR INSERT
  WITH CHECK (auth.uid() = reporter_id);

-- Create indexes for performance
CREATE INDEX idx_connections_requester ON public.connections(requester_id);
CREATE INDEX idx_connections_recipient ON public.connections(recipient_id);
CREATE INDEX idx_conversations_participants ON public.conversations(participant_one, participant_two);
CREATE INDEX idx_messages_conversation ON public.messages(conversation_id);
CREATE INDEX idx_messages_created ON public.messages(created_at DESC);
CREATE INDEX idx_blocks_blocker ON public.user_blocks(blocker_id);
CREATE INDEX idx_blocks_blocked ON public.user_blocks(blocked_user_id);

-- Update timestamps trigger for connections
CREATE TRIGGER update_connections_updated_at
  BEFORE UPDATE ON public.connections
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Update timestamps trigger for conversations
CREATE TRIGGER update_conversations_updated_at
  BEFORE UPDATE ON public.conversations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to check if user is blocked
CREATE OR REPLACE FUNCTION public.is_user_blocked(_user_id UUID, _other_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_blocks
    WHERE (blocker_id = _user_id AND blocked_user_id = _other_user_id)
       OR (blocker_id = _other_user_id AND blocked_user_id = _user_id)
  );
$$;

-- Function to get or create conversation
CREATE OR REPLACE FUNCTION public.get_or_create_conversation(_user_one UUID, _user_two UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_conversation_id UUID;
  v_p1 UUID;
  v_p2 UUID;
BEGIN
  -- Order participants consistently
  IF _user_one < _user_two THEN
    v_p1 := _user_one;
    v_p2 := _user_two;
  ELSE
    v_p1 := _user_two;
    v_p2 := _user_one;
  END IF;

  -- Try to find existing conversation
  SELECT id INTO v_conversation_id
  FROM public.conversations
  WHERE (participant_one = v_p1 AND participant_two = v_p2);

  -- Create if not exists
  IF v_conversation_id IS NULL THEN
    INSERT INTO public.conversations (participant_one, participant_two)
    VALUES (v_p1, v_p2)
    RETURNING id INTO v_conversation_id;
  END IF;

  RETURN v_conversation_id;
END;
$$;