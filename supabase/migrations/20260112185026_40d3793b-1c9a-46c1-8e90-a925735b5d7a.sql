-- Create investor_interests table to track investor interest in problems/solutions
CREATE TABLE public.investor_interests (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    investor_id UUID NOT NULL,
    problem_id UUID REFERENCES public.problems(id) ON DELETE CASCADE,
    innovation_id UUID REFERENCES public.innovations(id) ON DELETE CASCADE,
    investor_name TEXT NOT NULL,
    interest_type TEXT NOT NULL CHECK (interest_type IN ('discussion', 'pilot', 'funding')),
    investment_range TEXT,
    message TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    
    -- Ensure at least one of problem_id or innovation_id is set
    CONSTRAINT investor_interests_target_check CHECK (
        (problem_id IS NOT NULL OR innovation_id IS NOT NULL)
    )
);

-- Create unique index to prevent duplicate interests per investor per target
CREATE UNIQUE INDEX idx_investor_interests_problem ON public.investor_interests (investor_id, problem_id) 
    WHERE problem_id IS NOT NULL;
CREATE UNIQUE INDEX idx_investor_interests_innovation ON public.investor_interests (investor_id, innovation_id) 
    WHERE innovation_id IS NOT NULL;

-- Enable Row Level Security
ALTER TABLE public.investor_interests ENABLE ROW LEVEL SECURITY;

-- RLS Policies for investor_interests

-- Investors can view all interests (for badge display)
CREATE POLICY "Anyone can view investor interests"
    ON public.investor_interests
    FOR SELECT
    TO authenticated
    USING (true);

-- Only investors can create interests
CREATE POLICY "Investors can create their own interests"
    ON public.investor_interests
    FOR INSERT
    TO authenticated
    WITH CHECK (
        auth.uid() = investor_id AND
        public.has_role(auth.uid(), 'investor')
    );

-- Investors can update their own interests
CREATE POLICY "Investors can update their own interests"
    ON public.investor_interests
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = investor_id);

-- Investors can delete their own interests
CREATE POLICY "Investors can delete their own interests"
    ON public.investor_interests
    FOR DELETE
    TO authenticated
    USING (auth.uid() = investor_id);

-- Create trigger for updating timestamps
CREATE TRIGGER update_investor_interests_updated_at
    BEFORE UPDATE ON public.investor_interests
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();