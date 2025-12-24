-- Fix Issue 1: profiles table - "Deny anonymous access" with USING (false) blocks everyone
-- Remove the faulty policy; the "Users can view own full profile" policy (auth.uid() = id) is correct
DROP POLICY IF EXISTS "Deny anonymous access to profiles" ON public.profiles;

-- Fix Issue 2: investments table - similar issue with "Deny anonymous access"
-- The "Problem owners can view accepted investments only" policy logic is correct
-- but the "Deny anonymous access" with USING (false) blocks all users
DROP POLICY IF EXISTS "Deny anonymous access to investments" ON public.investments;

-- Fix Issue 3: solution_replies table - restrict visibility to only involved parties
DROP POLICY IF EXISTS "Anyone can view replies on submitted solutions" ON public.solution_replies;

CREATE POLICY "Authorized users can view solution replies" ON public.solution_replies
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM solutions s
    JOIN problems p ON p.id = s.problem_id
    WHERE s.id = solution_replies.solution_id
    AND (
      s.innovator_id = auth.uid() OR
      p.owner_id = auth.uid() OR
      EXISTS (
        SELECT 1 FROM investments i 
        WHERE i.problem_id = p.id 
        AND i.investor_id = auth.uid()
      )
    )
  )
);