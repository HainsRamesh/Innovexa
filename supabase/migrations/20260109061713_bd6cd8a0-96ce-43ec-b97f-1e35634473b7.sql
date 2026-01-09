-- Add visibility column to solutions table
ALTER TABLE public.solutions 
ADD COLUMN visibility text NOT NULL DEFAULT 'public';

-- Create policy for investors to view accepted public solutions
CREATE POLICY "Investors can view accepted public solutions"
ON public.solutions
FOR SELECT
USING (
  has_role(auth.uid(), 'investor'::app_role) 
  AND status = 'accepted'::solution_status 
  AND visibility = 'public'
);