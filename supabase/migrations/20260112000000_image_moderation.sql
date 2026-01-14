-- Create a private bucket for pending uploads
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'temp-uploads',
  'temp-uploads',
  false,
  10485760, -- 10MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Optional quarantine bucket to retain rejected assets for investigation
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'quarantine-uploads',
  'quarantine-uploads',
  false,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Temp bucket policies: innovators can manage their own uploads (folder = user id)
CREATE POLICY "Users can list own temp uploads"
ON storage.objects
FOR SELECT
USING (bucket_id = 'temp-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload temp assets"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'temp-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update temp assets"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'temp-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete temp assets"
ON storage.objects
FOR DELETE
USING (bucket_id = 'temp-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Media assets moderation table
CREATE TABLE public.media_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users (id),
  innovation_id UUID REFERENCES public.innovations (id) ON DELETE SET NULL,
  kind TEXT NOT NULL CHECK (kind IN ('cover', 'gallery')),
  bucket TEXT NOT NULL,
  path TEXT NOT NULL,
  public_url TEXT,
  status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected', 'error')),
  moderation_result JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  moderated_at TIMESTAMPTZ
);

ALTER TABLE public.media_assets ENABLE ROW LEVEL SECURITY;

-- RLS: owners can manage their own assets
CREATE POLICY "Users can insert own media assets"
ON public.media_assets
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own media assets"
ON public.media_assets
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own media assets"
ON public.media_assets
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own media assets"
ON public.media_assets
FOR DELETE
USING (auth.uid() = user_id);

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_media_assets_user ON public.media_assets (user_id);
CREATE INDEX IF NOT EXISTS idx_media_assets_innovation ON public.media_assets (innovation_id);
CREATE INDEX IF NOT EXISTS idx_media_assets_status ON public.media_assets (status);
