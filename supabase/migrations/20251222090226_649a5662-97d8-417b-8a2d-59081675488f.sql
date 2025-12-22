-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Public can view non-sensitive profile data" ON public.profiles;

-- Create a policy that allows users to see all profiles but only their own email
-- We'll use a different approach: restrict email at the application level
-- Since RLS can't filter columns, we use the view for public access

-- Policy: Only authenticated users can view profiles, and they see all columns
-- For public/unauthenticated access, they must use the view
CREATE POLICY "Authenticated users can view profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);