
-- Innovation Comments table
CREATE TABLE IF NOT EXISTS public.innovation_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  innovation_id UUID NOT NULL REFERENCES public.innovations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.innovation_comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for innovation_comments
CREATE POLICY "Anyone can view innovation comments"
  ON public.innovation_comments FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create comments"
  ON public.innovation_comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments"
  ON public.innovation_comments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments"
  ON public.innovation_comments FOR DELETE
  USING (auth.uid() = user_id);

-- Innovation message clicks tracking
CREATE TABLE IF NOT EXISTS public.innovation_message_clicks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  innovation_id UUID NOT NULL REFERENCES public.innovations(id) ON DELETE CASCADE,
  user_id UUID,
  session_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.innovation_message_clicks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert message clicks"
  ON public.innovation_message_clicks FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Innovators can view their innovation clicks"
  ON public.innovation_message_clicks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.innovations i
      WHERE i.id = innovation_id AND i.innovator_id = auth.uid()
    )
  );

-- Add comment_count to innovations
ALTER TABLE public.innovations ADD COLUMN IF NOT EXISTS comment_count INTEGER DEFAULT 0;
ALTER TABLE public.innovations ADD COLUMN IF NOT EXISTS message_click_count INTEGER DEFAULT 0;

-- Investment requests table (extends investor_interests with status tracking)
ALTER TABLE public.investor_interests ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'requested';

-- NDA/Document exchange table
CREATE TABLE IF NOT EXISTS public.innovation_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  innovation_id UUID NOT NULL REFERENCES public.innovations(id) ON DELETE CASCADE,
  uploaded_by UUID NOT NULL,
  document_type TEXT NOT NULL DEFAULT 'nda',
  document_url TEXT NOT NULL,
  title TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.innovation_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Innovators can manage their documents"
  ON public.innovation_documents FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.innovations i
      WHERE i.id = innovation_id AND i.innovator_id = auth.uid()
    )
  );

CREATE POLICY "Interested investors can view documents"
  ON public.innovation_documents FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.investor_interests ii
      WHERE ii.innovation_id = innovation_documents.innovation_id
        AND ii.investor_id = auth.uid()
    )
  );

-- NDA acceptance tracking
CREATE TABLE IF NOT EXISTS public.nda_acceptances (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID NOT NULL REFERENCES public.innovation_documents(id) ON DELETE CASCADE,
  investor_id UUID NOT NULL,
  accepted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(document_id, investor_id)
);

ALTER TABLE public.nda_acceptances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Investors can accept NDAs"
  ON public.nda_acceptances FOR INSERT
  WITH CHECK (auth.uid() = investor_id);

CREATE POLICY "Participants can view NDA acceptances"
  ON public.nda_acceptances FOR SELECT
  USING (
    auth.uid() = investor_id OR
    EXISTS (
      SELECT 1 FROM public.innovation_documents d
      JOIN public.innovations i ON i.id = d.innovation_id
      WHERE d.id = document_id AND i.innovator_id = auth.uid()
    )
  );

-- Form drafts autosave table
CREATE TABLE IF NOT EXISTS public.form_drafts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  form_type TEXT NOT NULL,
  form_data JSONB NOT NULL DEFAULT '{}',
  entity_id UUID,
  last_saved_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, form_type, entity_id)
);

ALTER TABLE public.form_drafts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own drafts"
  ON public.form_drafts FOR ALL
  USING (auth.uid() = user_id);

-- Form analytics table
CREATE TABLE IF NOT EXISTS public.form_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  session_id TEXT NOT NULL,
  form_type TEXT NOT NULL,
  field_name TEXT NOT NULL,
  action TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.form_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert form analytics"
  ON public.form_analytics FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can view form analytics"
  ON public.form_analytics FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Trigger to update comment count
CREATE OR REPLACE FUNCTION public.update_innovation_comment_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.innovations SET comment_count = COALESCE(comment_count, 0) + 1 WHERE id = NEW.innovation_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.innovations SET comment_count = GREATEST(COALESCE(comment_count, 0) - 1, 0) WHERE id = OLD.innovation_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER update_innovation_comment_count_trigger
AFTER INSERT OR DELETE ON public.innovation_comments
FOR EACH ROW EXECUTE FUNCTION public.update_innovation_comment_count();

-- Trigger to update message click count
CREATE OR REPLACE FUNCTION public.update_innovation_message_click_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.innovations SET message_click_count = COALESCE(message_click_count, 0) + 1 WHERE id = NEW.innovation_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_innovation_message_click_count_trigger
AFTER INSERT ON public.innovation_message_clicks
FOR EACH ROW EXECUTE FUNCTION public.update_innovation_message_click_count();

-- Notification trigger for innovation comments
CREATE OR REPLACE FUNCTION public.notify_on_innovation_comment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_innovation_owner_id UUID;
  v_innovation_title TEXT;
  v_commenter_name TEXT;
  v_commenter_avatar TEXT;
BEGIN
  SELECT innovator_id, title INTO v_innovation_owner_id, v_innovation_title
  FROM public.innovations WHERE id = NEW.innovation_id;

  IF v_innovation_owner_id IS NULL OR v_innovation_owner_id = NEW.user_id THEN
    RETURN NEW;
  END IF;

  SELECT full_name, avatar_url INTO v_commenter_name, v_commenter_avatar
  FROM public.profiles WHERE id = NEW.user_id;

  PERFORM public.create_notification(
    v_innovation_owner_id,
    'comment',
    'New Comment',
    COALESCE(v_commenter_name, 'Someone') || ' commented on your innovation "' || COALESCE(v_innovation_title, 'Untitled') || '"',
    jsonb_build_object('innovation_id', NEW.innovation_id, 'comment_id', NEW.id),
    1,
    'comment_innovation_' || NEW.innovation_id::text,
    NEW.innovation_id,
    'innovation',
    NEW.user_id,
    COALESCE(v_commenter_name, 'Someone'),
    v_commenter_avatar
  );

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'notify_on_innovation_comment error: %', SQLERRM;
  RETURN NEW;
END;
$$;

CREATE TRIGGER notify_on_innovation_comment_trigger
AFTER INSERT ON public.innovation_comments
FOR EACH ROW EXECUTE FUNCTION public.notify_on_innovation_comment();

-- Notification trigger for investor interest status changes
CREATE OR REPLACE FUNCTION public.notify_on_investor_interest_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_innovation_owner_id UUID;
  v_innovation_title TEXT;
  v_investor_avatar TEXT;
  v_message TEXT;
  v_title TEXT;
BEGIN
  IF OLD.status IS NOT DISTINCT FROM NEW.status THEN
    RETURN NEW;
  END IF;

  IF NEW.innovation_id IS NOT NULL THEN
    SELECT innovator_id, title INTO v_innovation_owner_id, v_innovation_title
    FROM public.innovations WHERE id = NEW.innovation_id;
  END IF;

  SELECT avatar_url INTO v_investor_avatar
  FROM public.profiles WHERE id = NEW.investor_id;

  IF NEW.status = 'accepted' THEN
    v_title := 'Interest Accepted! 🎉';
    v_message := 'Your investment interest in "' || COALESCE(v_innovation_title, 'an innovation') || '" has been accepted!';
    
    INSERT INTO public.notifications (
      user_id, type, title, message, data, priority,
      related_id, related_type, actor_id, actor_name
    ) VALUES (
      NEW.investor_id,
      'investment_accepted',
      v_title,
      v_message,
      jsonb_build_object('innovation_id', NEW.innovation_id, 'interest_id', NEW.id),
      2,
      NEW.innovation_id,
      'innovation',
      v_innovation_owner_id,
      'Innovator'
    );
  ELSIF NEW.status = 'rejected' THEN
    v_title := 'Interest Update';
    v_message := 'Your investment interest in "' || COALESCE(v_innovation_title, 'an innovation') || '" was not accepted.';
    
    INSERT INTO public.notifications (
      user_id, type, title, message, data, priority,
      related_id, related_type
    ) VALUES (
      NEW.investor_id,
      'investment_rejected',
      v_title,
      v_message,
      jsonb_build_object('innovation_id', NEW.innovation_id, 'interest_id', NEW.id),
      1,
      NEW.innovation_id,
      'innovation'
    );
  ELSIF NEW.status = 'in_discussion' THEN
    v_title := 'Discussion Started';
    v_message := 'Discussion started for your interest in "' || COALESCE(v_innovation_title, 'an innovation') || '"';
    
    INSERT INTO public.notifications (
      user_id, type, title, message, data, priority,
      related_id, related_type
    ) VALUES (
      NEW.investor_id,
      'investment_discussion',
      v_title,
      v_message,
      jsonb_build_object('innovation_id', NEW.innovation_id, 'interest_id', NEW.id),
      1,
      NEW.innovation_id,
      'innovation'
    );
  END IF;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'notify_on_investor_interest_status_change error: %', SQLERRM;
  RETURN NEW;
END;
$$;

CREATE TRIGGER notify_on_investor_interest_status_change_trigger
AFTER UPDATE ON public.investor_interests
FOR EACH ROW EXECUTE FUNCTION public.notify_on_investor_interest_status_change();

-- Enable realtime for innovation_comments
ALTER PUBLICATION supabase_realtime ADD TABLE public.innovation_comments;

-- Trigger for updated_at on innovation_comments
CREATE TRIGGER update_innovation_comments_updated_at
BEFORE UPDATE ON public.innovation_comments
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
