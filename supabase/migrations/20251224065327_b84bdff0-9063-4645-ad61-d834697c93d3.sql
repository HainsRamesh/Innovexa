-- Create innovation_status enum
CREATE TYPE public.innovation_status AS ENUM ('draft', 'published', 'featured', 'archived');

-- Create innovation_category enum  
CREATE TYPE public.innovation_category AS ENUM (
  'ai', 'healthtech', 'fintech', 'climatetech', 'edtech', 'saas', 'hardware', 'web3', 'other'
);

-- Create innovations table
CREATE TABLE public.innovations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  innovator_id UUID NOT NULL,
  title TEXT NOT NULL,
  tagline TEXT NOT NULL,
  category public.innovation_category NOT NULL DEFAULT 'other',
  description TEXT NOT NULL,
  cover_image_url TEXT NOT NULL,
  video_url TEXT,
  gallery_urls TEXT[] DEFAULT '{}',
  pdf_urls TEXT[] DEFAULT '{}',
  without_product TEXT NOT NULL,
  with_product TEXT NOT NULL,
  status public.innovation_status NOT NULL DEFAULT 'draft',
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.innovations ENABLE ROW LEVEL SECURITY;

-- Policy: Published innovations are viewable by everyone
CREATE POLICY "Published innovations are viewable by everyone"
ON public.innovations
FOR SELECT
USING (status IN ('published', 'featured') OR innovator_id = auth.uid());

-- Policy: Innovators can insert their own innovations
CREATE POLICY "Innovators can insert own innovations"
ON public.innovations
FOR INSERT
WITH CHECK (auth.uid() = innovator_id AND public.has_role(auth.uid(), 'innovator'));

-- Policy: Innovators can update their own innovations
CREATE POLICY "Innovators can update own innovations"
ON public.innovations
FOR UPDATE
USING (auth.uid() = innovator_id);

-- Policy: Innovators can delete their own innovations
CREATE POLICY "Innovators can delete own innovations"
ON public.innovations
FOR DELETE
USING (auth.uid() = innovator_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_innovations_updated_at
BEFORE UPDATE ON public.innovations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for innovations media
INSERT INTO storage.buckets (id, name, public) VALUES ('innovations', 'innovations', true);

-- Storage policies for innovations bucket
CREATE POLICY "Innovations media is publicly accessible"
ON storage.objects
FOR SELECT
USING (bucket_id = 'innovations');

CREATE POLICY "Innovators can upload innovation media"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'innovations' AND auth.uid() IS NOT NULL);

CREATE POLICY "Innovators can update own innovation media"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'innovations' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Innovators can delete own innovation media"
ON storage.objects
FOR DELETE
USING (bucket_id = 'innovations' AND auth.uid()::text = (storage.foldername(name))[1]);