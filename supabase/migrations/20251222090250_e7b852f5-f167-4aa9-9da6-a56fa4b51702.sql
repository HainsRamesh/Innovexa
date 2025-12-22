-- Drop existing SELECT policies
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON public.profiles;

-- Create a restrictive policy: users can only view their OWN full profile (including email)
CREATE POLICY "Users can view own full profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);