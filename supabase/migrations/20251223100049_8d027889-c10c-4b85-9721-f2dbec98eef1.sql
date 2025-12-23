-- Replace SECURITY DEFINER view with a dedicated safe table for public profile data

DROP VIEW IF EXISTS public.public_profiles;

CREATE TABLE IF NOT EXISTS public.public_profiles (
  id uuid PRIMARY KEY,
  full_name text,
  avatar_url text,
  bio text,
  organization_name text,
  organization_type text,
  website text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.public_profiles ENABLE ROW LEVEL SECURITY;

-- Public read of non-PII fields only
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.public_profiles;
CREATE POLICY "Public profiles are viewable by everyone"
ON public.public_profiles
FOR SELECT
USING (true);

-- Keep public_profiles in sync with profiles
CREATE OR REPLACE FUNCTION public.sync_public_profile_from_profiles()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.public_profiles (
    id, full_name, avatar_url, bio, organization_name, organization_type, website, created_at, updated_at
  ) VALUES (
    NEW.id,
    NEW.full_name,
    NEW.avatar_url,
    NEW.bio,
    NEW.organization_name,
    NEW.organization_type,
    NEW.website,
    COALESCE(NEW.created_at, now()),
    COALESCE(NEW.updated_at, now())
  )
  ON CONFLICT (id)
  DO UPDATE SET
    full_name = EXCLUDED.full_name,
    avatar_url = EXCLUDED.avatar_url,
    bio = EXCLUDED.bio,
    organization_name = EXCLUDED.organization_name,
    organization_type = EXCLUDED.organization_type,
    website = EXCLUDED.website,
    updated_at = EXCLUDED.updated_at;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_public_profile_from_profiles()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.public_profiles WHERE id = OLD.id;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS sync_public_profile_after_upsert ON public.profiles;
CREATE TRIGGER sync_public_profile_after_upsert
AFTER INSERT OR UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.sync_public_profile_from_profiles();

DROP TRIGGER IF EXISTS delete_public_profile_after_delete ON public.profiles;
CREATE TRIGGER delete_public_profile_after_delete
AFTER DELETE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.delete_public_profile_from_profiles();

-- Backfill existing rows
INSERT INTO public.public_profiles (id, full_name, avatar_url, bio, organization_name, organization_type, website, created_at, updated_at)
SELECT id, full_name, avatar_url, bio, organization_name, organization_type, website, created_at, updated_at
FROM public.profiles
ON CONFLICT (id) DO NOTHING;
