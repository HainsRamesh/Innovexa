-- Create investments table for investor proposals
CREATE TABLE public.investments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  investor_id UUID NOT NULL,
  problem_id UUID NOT NULL REFERENCES public.problems(id) ON DELETE CASCADE,
  solution_id UUID REFERENCES public.solutions(id) ON DELETE SET NULL,
  funding_amount NUMERIC NOT NULL,
  expected_roi NUMERIC,
  conditions TEXT,
  comments TEXT,
  status TEXT NOT NULL DEFAULT 'proposed' CHECK (status IN ('proposed', 'under_review', 'accepted', 'rejected', 'withdrawn')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.investments ENABLE ROW LEVEL SECURITY;

-- Investors can view their own investments
CREATE POLICY "Investors can view own investments"
ON public.investments
FOR SELECT
USING (auth.uid() = investor_id);

-- Investors can insert their own investments
CREATE POLICY "Investors can insert own investments"
ON public.investments
FOR INSERT
WITH CHECK (auth.uid() = investor_id);

-- Investors can update their own investments
CREATE POLICY "Investors can update own investments"
ON public.investments
FOR UPDATE
USING (auth.uid() = investor_id);

-- Investors can delete their own investments
CREATE POLICY "Investors can delete own investments"
ON public.investments
FOR DELETE
USING (auth.uid() = investor_id);

-- Problem owners can view investments on their problems
CREATE POLICY "Problem owners can view investments on their problems"
ON public.investments
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.problems
    WHERE problems.id = investments.problem_id
    AND problems.owner_id = auth.uid()
  )
);

-- Add trigger for updated_at
CREATE TRIGGER update_investments_updated_at
BEFORE UPDATE ON public.investments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();