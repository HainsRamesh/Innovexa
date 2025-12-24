-- Update the profiles SELECT policy to explicitly require authentication
DROP POLICY IF EXISTS "Users can view own full profile" ON public.profiles;

CREATE POLICY "Users can view own full profile" ON public.profiles
FOR SELECT USING (
  auth.uid() IS NOT NULL AND auth.uid() = id
);