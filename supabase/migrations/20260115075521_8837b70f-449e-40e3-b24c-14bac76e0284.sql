-- Create notification_preferences table
CREATE TABLE IF NOT EXISTS public.notification_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  likes_enabled BOOLEAN NOT NULL DEFAULT true,
  comments_enabled BOOLEAN NOT NULL DEFAULT true,
  mentions_enabled BOOLEAN NOT NULL DEFAULT true,
  messages_enabled BOOLEAN NOT NULL DEFAULT true,
  solutions_enabled BOOLEAN NOT NULL DEFAULT true,
  system_enabled BOOLEAN NOT NULL DEFAULT true,
  investor_interest_enabled BOOLEAN NOT NULL DEFAULT true,
  mute_all BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create messaging_preferences table
CREATE TABLE IF NOT EXISTS public.messaging_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  message_requests_enabled BOOLEAN NOT NULL DEFAULT true,
  allow_attachments BOOLEAN NOT NULL DEFAULT true,
  read_receipts_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on notification_preferences
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

-- Enable RLS on messaging_preferences
ALTER TABLE public.messaging_preferences ENABLE ROW LEVEL SECURITY;

-- RLS policies for notification_preferences
CREATE POLICY "Users can view own notification preferences"
  ON public.notification_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notification preferences"
  ON public.notification_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notification preferences"
  ON public.notification_preferences FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS policies for messaging_preferences
CREATE POLICY "Users can view own messaging preferences"
  ON public.messaging_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own messaging preferences"
  ON public.messaging_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own messaging preferences"
  ON public.messaging_preferences FOR UPDATE
  USING (auth.uid() = user_id);

-- Add show_activity_status to privacy_settings if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' 
                 AND table_name = 'privacy_settings' 
                 AND column_name = 'show_activity_status') THEN
    ALTER TABLE public.privacy_settings ADD COLUMN show_activity_status BOOLEAN NOT NULL DEFAULT true;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' 
                 AND table_name = 'privacy_settings' 
                 AND column_name = 'profile_visibility') THEN
    ALTER TABLE public.privacy_settings ADD COLUMN profile_visibility TEXT NOT NULL DEFAULT 'public';
  END IF;
END $$;