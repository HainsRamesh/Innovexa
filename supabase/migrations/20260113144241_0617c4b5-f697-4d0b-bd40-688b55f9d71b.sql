-- Audit logs table for enterprise-ready logging
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  metadata JSONB DEFAULT '{}'::jsonb,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on audit_logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins can view audit logs" 
ON public.audit_logs 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow inserts from authenticated users (logging their own actions)
CREATE POLICY "Authenticated users can create audit logs"
ON public.audit_logs
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Content reports table for moderation
CREATE TABLE IF NOT EXISTS public.content_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reporter_id UUID NOT NULL,
  content_type TEXT NOT NULL, -- 'problem', 'solution', 'innovation', 'message'
  content_id UUID NOT NULL,
  reason TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'reviewed', 'resolved', 'dismissed'
  admin_notes TEXT,
  reviewed_by UUID,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on content_reports
ALTER TABLE public.content_reports ENABLE ROW LEVEL SECURITY;

-- Users can create reports
CREATE POLICY "Users can create content reports"
ON public.content_reports
FOR INSERT
WITH CHECK (auth.uid() = reporter_id);

-- Users can view their own reports
CREATE POLICY "Users can view their own reports"
ON public.content_reports
FOR SELECT
USING (auth.uid() = reporter_id);

-- Admins can view all reports
CREATE POLICY "Admins can view all content reports"
ON public.content_reports
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can update reports
CREATE POLICY "Admins can update content reports"
ON public.content_reports
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admin actions table to track moderation actions
CREATE TABLE IF NOT EXISTS public.admin_actions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id UUID NOT NULL,
  action_type TEXT NOT NULL, -- 'warn', 'suspend', 'activate', 'remove_content', 'block'
  target_user_id UUID,
  target_content_type TEXT,
  target_content_id UUID,
  reason TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on admin_actions
ALTER TABLE public.admin_actions ENABLE ROW LEVEL SECURITY;

-- Only admins can insert actions
CREATE POLICY "Admins can create admin actions"
ON public.admin_actions
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Only admins can view actions
CREATE POLICY "Admins can view admin actions"
ON public.admin_actions
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- User suspensions table
CREATE TABLE IF NOT EXISTS public.user_suspensions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  suspended_by UUID NOT NULL,
  reason TEXT NOT NULL,
  suspended_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  is_permanent BOOLEAN NOT NULL DEFAULT false,
  lifted_at TIMESTAMP WITH TIME ZONE,
  lifted_by UUID
);

-- Enable RLS on user_suspensions
ALTER TABLE public.user_suspensions ENABLE ROW LEVEL SECURITY;

-- Users can view their own suspensions
CREATE POLICY "Users can view their own suspensions"
ON public.user_suspensions
FOR SELECT
USING (auth.uid() = user_id);

-- Admins can manage suspensions
CREATE POLICY "Admins can manage suspensions"
ON public.user_suspensions
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create function to log audit events
CREATE OR REPLACE FUNCTION public.log_audit_event(
  p_action TEXT,
  p_entity_type TEXT DEFAULT NULL,
  p_entity_id UUID DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
) RETURNS UUID AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO public.audit_logs (user_id, action, entity_type, entity_id, metadata)
  VALUES (auth.uid(), p_action, p_entity_type, p_entity_id, p_metadata)
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_content_reports_status ON public.content_reports(status);
CREATE INDEX IF NOT EXISTS idx_content_reports_content_type ON public.content_reports(content_type);
CREATE INDEX IF NOT EXISTS idx_user_suspensions_user_id ON public.user_suspensions(user_id);
CREATE INDEX IF NOT EXISTS idx_problems_view_count ON public.problems(view_count DESC);
CREATE INDEX IF NOT EXISTS idx_problems_like_count ON public.problems(like_count DESC);
CREATE INDEX IF NOT EXISTS idx_innovations_view_count ON public.innovations(view_count DESC);
CREATE INDEX IF NOT EXISTS idx_innovations_like_count ON public.innovations(like_count DESC);
CREATE INDEX IF NOT EXISTS idx_innovations_category ON public.innovations(category);
CREATE INDEX IF NOT EXISTS idx_problems_category ON public.problems(category);
CREATE INDEX IF NOT EXISTS idx_problems_status ON public.problems(status);
CREATE INDEX IF NOT EXISTS idx_innovations_status ON public.innovations(status);