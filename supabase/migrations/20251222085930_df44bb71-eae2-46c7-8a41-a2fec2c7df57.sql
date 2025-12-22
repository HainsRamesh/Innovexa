-- Drop the existing overly permissive policy
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

-- Create a new policy: users can only view their own full profile (including email)
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

-- Create a public view that exposes only non-sensitive profile data
CREATE OR REPLACE VIEW public.public_profiles AS
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