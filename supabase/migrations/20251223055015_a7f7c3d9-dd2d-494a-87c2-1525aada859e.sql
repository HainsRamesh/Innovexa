-- Add explicit deny policy for anonymous users on profiles table
-- This prevents any accidental public access to user PII (emails)
CREATE POLICY "Deny anonymous access to profiles"
ON public.profiles
FOR SELECT
TO anon
USING (false);