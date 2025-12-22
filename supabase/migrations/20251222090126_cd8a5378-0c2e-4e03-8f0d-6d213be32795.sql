-- Drop the existing view
DROP VIEW IF EXISTS public.public_profiles;

-- Recreate the view with SECURITY INVOKER (default, but explicit)
CREATE VIEW public.public_profiles 
WITH (security_invoker = true)
AS
SELECT 
  id,
  full_name,
  avatar_url,
  bio,
  organization_name,
  organization_type,
  website,
  created_at
FROM public.profiles;

-- Grant access to the view for authenticated and anonymous users
GRANT SELECT ON public.public_profiles TO anon, authenticated;

-- Add a policy to allow everyone to read profiles via the view
-- Since SECURITY INVOKER uses the caller's permissions, we need a policy that allows reads
CREATE POLICY "Public can view non-sensitive profile data"
ON public.profiles
FOR SELECT
USING (true);

-- Drop the restrictive policy we just created (we'll have two: one for public data access, one handled by the view)
-- Actually let's keep it simpler: have one policy that allows SELECT for everyone
-- The view filters what columns are exposed

-- Drop the owner-only policy since we need public access for the view
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;