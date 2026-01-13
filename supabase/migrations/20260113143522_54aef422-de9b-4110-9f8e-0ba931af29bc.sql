
-- Fix overly permissive policies for message clicks - require session_id to be present
DROP POLICY IF EXISTS "Anyone can insert message clicks" ON public.innovation_message_clicks;
CREATE POLICY "Users can insert message clicks with session"
  ON public.innovation_message_clicks FOR INSERT
  WITH CHECK (session_id IS NOT NULL AND session_id != '');

-- Fix overly permissive policies for form analytics - require session_id to be present
DROP POLICY IF EXISTS "Anyone can insert form analytics" ON public.form_analytics;
CREATE POLICY "Users can insert form analytics with session"
  ON public.form_analytics FOR INSERT
  WITH CHECK (session_id IS NOT NULL AND session_id != '');
