-- Fix notifications INSERT policy to prevent unauthorized notification injection
-- All notifications are created via SECURITY DEFINER trigger functions, so we deny direct INSERT

DROP POLICY IF EXISTS "Service role can insert notifications" ON public.notifications;

-- Only allow service role to insert (SECURITY DEFINER functions bypass RLS, so they can still insert)
-- This prevents authenticated users from directly inserting fake notifications
CREATE POLICY "Only system can create notifications"
  ON public.notifications FOR INSERT
  TO authenticated
  WITH CHECK (false);

-- Note: SECURITY DEFINER functions (like create_notification and the trigger functions)
-- bypass RLS entirely, so they can still insert notifications.
-- This policy blocks direct client-side INSERT attempts.