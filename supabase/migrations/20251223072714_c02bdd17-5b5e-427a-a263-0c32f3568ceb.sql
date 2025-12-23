-- Create solution_replies table for reply functionality
CREATE TABLE public.solution_replies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  solution_id UUID NOT NULL REFERENCES public.solutions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.solution_replies ENABLE ROW LEVEL SECURITY;

-- Anyone can view replies on submitted solutions
CREATE POLICY "Anyone can view replies on submitted solutions"
ON public.solution_replies
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.solutions s
    WHERE s.id = solution_replies.solution_id
    AND s.status IN ('submitted', 'under_review', 'shortlisted', 'accepted')
  )
);

-- Authenticated users can insert replies (problem owner, solution owner, or investors)
CREATE POLICY "Authorized users can insert replies"
ON public.solution_replies
FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM public.solutions s
    JOIN public.problems p ON p.id = s.problem_id
    WHERE s.id = solution_replies.solution_id
    AND (
      s.innovator_id = auth.uid() -- solution owner
      OR p.owner_id = auth.uid() -- problem owner
      OR public.has_role(auth.uid(), 'investor') -- investors
    )
  )
);

-- Users can update their own replies
CREATE POLICY "Users can update own replies"
ON public.solution_replies
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own replies
CREATE POLICY "Users can delete own replies"
ON public.solution_replies
FOR DELETE
USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_solution_replies_updated_at
BEFORE UPDATE ON public.solution_replies
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();