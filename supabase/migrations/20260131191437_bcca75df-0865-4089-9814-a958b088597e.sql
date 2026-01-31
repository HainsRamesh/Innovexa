
-- =============================================
-- FIX REMAINING SECURITY FINDINGS
-- =============================================

-- 1. FIX: innovation_documents policy - require NDA acceptance for non-NDA docs
DROP POLICY IF EXISTS "Investors with interest can view documents" ON public.innovation_documents;

CREATE POLICY "Authorized users can view innovation documents"
ON public.innovation_documents
FOR SELECT
USING (
  -- Innovator owns the innovation (already covered by 'Innovators can manage their documents')
  EXISTS (
    SELECT 1 FROM public.innovations i
    WHERE i.id = innovation_documents.innovation_id
    AND i.innovator_id = auth.uid()
  )
  OR
  -- NDA documents are viewable by interested investors (so they can review before accepting)
  (
    document_type = 'nda'
    AND EXISTS (
      SELECT 1 FROM public.investor_interests ii
      WHERE ii.innovation_id = innovation_documents.innovation_id
      AND ii.investor_id = auth.uid()
    )
  )
  OR
  -- Non-NDA documents require NDA acceptance first
  (
    document_type <> 'nda'
    AND EXISTS (
      SELECT 1 FROM public.nda_acceptances na
      JOIN public.innovation_documents nd ON nd.id = na.document_id
      WHERE nd.innovation_id = innovation_documents.innovation_id
      AND na.investor_id = auth.uid()
    )
  )
);

-- 2. Add comment explaining investments_summary security model
COMMENT ON VIEW public.investments_summary IS 
'Secure view for investment data with participant-scoped access. Uses security_invoker=on 
to inherit caller permissions from underlying investments table RLS. Financial data 
(funding_amount, expected_roi, conditions, comments) is masked for non-investors using 
CASE expressions. Access restricted to: investors (own investments), problem owners 
(investments on their problems), and solution providers (investments on their solutions).';

-- 3. Add comment explaining public_profiles security model  
COMMENT ON TABLE public.public_profiles IS
'Public-facing profile data synced from profiles table via trigger. Uses can_view_profile() 
SECURITY DEFINER function to enforce privacy settings. Does NOT contain email (PII). 
Privacy settings controlled by privacy_settings table: everyone (default for professional 
networking), authenticated (logged in users), connections (verified connections only), 
none (private). See can_view_profile() function for implementation.';

-- 4. Verify can_view_profile function handles blocked users
-- Update function to also check user_blocks
CREATE OR REPLACE FUNCTION public.can_view_profile(_target_user_id uuid, _viewer_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_setting text;
  v_is_connected boolean;
  v_is_blocked boolean;
BEGIN
  -- Owner can always view their own profile
  IF _target_user_id = _viewer_id AND _viewer_id IS NOT NULL THEN
    RETURN true;
  END IF;

  -- Check if viewer is blocked by target (or vice versa)
  SELECT EXISTS (
    SELECT 1 FROM public.user_blocks
    WHERE (blocker_id = _target_user_id AND blocked_user_id = _viewer_id)
       OR (blocker_id = _viewer_id AND blocked_user_id = _target_user_id)
  ) INTO v_is_blocked;
  
  IF v_is_blocked THEN
    RETURN false;
  END IF;

  -- Get privacy setting
  SELECT who_can_view_profile INTO v_setting
  FROM public.privacy_settings
  WHERE user_id = _target_user_id;

  -- Default to 'everyone' if no setting exists
  IF v_setting IS NULL THEN
    v_setting := 'everyone';
  END IF;

  CASE v_setting
    WHEN 'everyone' THEN
      RETURN true;
    WHEN 'authenticated' THEN
      -- Only authenticated users can view
      RETURN _viewer_id IS NOT NULL;
    WHEN 'connections' THEN
      -- Must be authenticated and connected
      IF _viewer_id IS NULL THEN
        RETURN false;
      END IF;
      SELECT EXISTS (
        SELECT 1 FROM public.connections c
        WHERE c.status = 'accepted'
        AND ((c.requester_id = _target_user_id AND c.recipient_id = _viewer_id)
             OR (c.recipient_id = _target_user_id AND c.requester_id = _viewer_id))
      ) INTO v_is_connected;
      RETURN v_is_connected;
    WHEN 'none' THEN
      RETURN false;
    ELSE
      -- Default to false for unknown settings (secure by default)
      RETURN false;
  END CASE;
END;
$$;
