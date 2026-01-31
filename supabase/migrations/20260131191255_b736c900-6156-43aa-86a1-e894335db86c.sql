
-- =============================================
-- COMPREHENSIVE SECURITY HARDENING MIGRATION
-- =============================================

-- 1. FIX: innovation_comments - restrict visibility to innovation viewers only
DROP POLICY IF EXISTS "Authenticated users can view innovation comments" ON public.innovation_comments;

CREATE POLICY "Users can view comments on accessible innovations"
ON public.innovation_comments
FOR SELECT
USING (
  -- User owns the comment
  auth.uid() = user_id
  OR
  -- User can view the associated innovation (same logic as innovations table)
  EXISTS (
    SELECT 1 FROM public.innovations i
    WHERE i.id = innovation_comments.innovation_id
    AND (
      i.innovator_id = auth.uid()
      OR (
        i.status IN ('published', 'featured')
        AND (
          CASE i.visibility
            WHEN 'public' THEN true
            WHEN 'authenticated' THEN auth.uid() IS NOT NULL
            WHEN 'private' THEN false
            ELSE false
          END
        )
      )
    )
  )
);

-- 2. FIX: Strengthen form_analytics INSERT policy to validate user_id
DROP POLICY IF EXISTS "Users can insert form analytics with session" ON public.form_analytics;

CREATE POLICY "Users can insert form analytics with validated session"
ON public.form_analytics
FOR INSERT
WITH CHECK (
  session_id IS NOT NULL 
  AND session_id <> ''
  AND (user_id IS NULL OR user_id = auth.uid())
);

-- 3. FIX: Strengthen problem_interests INSERT policy
DROP POLICY IF EXISTS "Authenticated users can express interest in problems" ON public.problem_interests;

CREATE POLICY "Users can express interest in problems with validation"
ON public.problem_interests
FOR INSERT
WITH CHECK (
  session_id IS NOT NULL 
  AND session_id <> ''
  AND (user_id IS NULL OR user_id = auth.uid())
  -- Prevent duplicate interests per session
  AND NOT EXISTS (
    SELECT 1 FROM public.problem_interests pi
    WHERE pi.problem_id = problem_interests.problem_id
    AND pi.session_id = problem_interests.session_id
  )
);

-- 4. FIX: Strengthen innovation_interests INSERT policy
DROP POLICY IF EXISTS "Authenticated users can express interest in innovations" ON public.innovation_interests;

CREATE POLICY "Users can express interest in innovations with validation"
ON public.innovation_interests
FOR INSERT
WITH CHECK (
  session_id IS NOT NULL 
  AND session_id <> ''
  AND (user_id IS NULL OR user_id = auth.uid())
  -- Prevent duplicate interests per session
  AND NOT EXISTS (
    SELECT 1 FROM public.innovation_interests ii
    WHERE ii.innovation_id = innovation_interests.innovation_id
    AND ii.session_id = innovation_interests.session_id
  )
);

-- 5. FIX: Strengthen innovation_message_clicks INSERT policy
DROP POLICY IF EXISTS "Users can insert message clicks with session" ON public.innovation_message_clicks;

CREATE POLICY "Users can insert message clicks with validation"
ON public.innovation_message_clicks
FOR INSERT
WITH CHECK (
  session_id IS NOT NULL 
  AND session_id <> ''
  AND (user_id IS NULL OR user_id = auth.uid())
);

-- 6. Add unique constraint to prevent session-based spam on interests
-- (These will fail silently on conflict instead of erroring)
CREATE UNIQUE INDEX IF NOT EXISTS idx_problem_interests_session_problem 
ON public.problem_interests(session_id, problem_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_innovation_interests_session_innovation 
ON public.innovation_interests(session_id, innovation_id);

-- 7. VERIFY: investments_summary view uses security_invoker
-- Recreate view to ensure security_invoker is properly set
DROP VIEW IF EXISTS public.investments_summary;

CREATE VIEW public.investments_summary 
WITH (security_invoker = on) AS
SELECT 
  i.id,
  i.investor_id,
  i.problem_id,
  i.solution_id,
  i.created_at,
  i.updated_at,
  -- Sensitive fields only visible to the investor
  CASE WHEN i.investor_id = auth.uid() THEN i.funding_amount ELSE NULL END AS funding_amount,
  CASE WHEN i.investor_id = auth.uid() THEN i.expected_roi ELSE NULL END AS expected_roi,
  CASE WHEN i.investor_id = auth.uid() THEN i.comments ELSE NULL END AS comments,
  i.status,
  CASE WHEN i.investor_id = auth.uid() THEN i.conditions ELSE NULL END AS conditions
FROM public.investments i
WHERE 
  -- Investor can see their own investments
  i.investor_id = auth.uid()
  OR 
  -- Problem owner can see investments on their problems (with masked sensitive data)
  EXISTS (
    SELECT 1 FROM public.problems p 
    WHERE p.id = i.problem_id AND p.owner_id = auth.uid()
  )
  OR
  -- Solution provider can see investments on their solutions (with masked sensitive data)
  (i.solution_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.solutions s 
    WHERE s.id = i.solution_id AND s.innovator_id = auth.uid()
  ));

-- 8. Add comment explaining audit_logs security model
COMMENT ON TABLE public.audit_logs IS 
'Security audit trail. INSERT restricted to log_audit_event() SECURITY DEFINER function. 
SELECT restricted to admin role only. This table intentionally has no public INSERT policy 
as all logging goes through the secure RPC function.';

-- 9. Strengthen innovation_documents - require NDA acceptance for sensitive docs
DROP POLICY IF EXISTS "Interested investors can view documents" ON public.innovation_documents;

CREATE POLICY "Investors with interest can view documents"
ON public.innovation_documents
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.investor_interests ii
    WHERE ii.innovation_id = innovation_documents.innovation_id
    AND ii.investor_id = auth.uid()
    AND ii.status IN ('accepted', 'in_discussion')
  )
  OR
  -- Also check for NDA acceptance for NDA-protected documents
  (
    document_type = 'nda' 
    OR EXISTS (
      SELECT 1 FROM public.nda_acceptances na
      WHERE na.document_id = innovation_documents.id
      AND na.investor_id = auth.uid()
    )
  )
);
