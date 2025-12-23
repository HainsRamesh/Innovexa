-- Drop existing view and recreate with security_invoker = false
DROP VIEW IF EXISTS public_profiles;

CREATE VIEW public_profiles 
WITH (security_invoker = false)
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
FROM profiles;