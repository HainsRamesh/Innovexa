-- Fix: PUBLIC_DATA_EXPOSURE in investor_interests table
-- Drop the overly permissive policy that allows anyone to view all investor interests
DROP POLICY IF EXISTS "Anyone can view investor interests" ON public.investor_interests;

-- Create a new policy that restricts visibility to only participants
-- 1. The investor can see their own interests
-- 2. The problem owner can see interests on their problems
-- 3. The innovation owner can see interests on their innovations
CREATE POLICY "Participants can view investor interests"
  ON public.investor_interests
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = investor_id
    OR EXISTS (
      SELECT 1 FROM public.problems p
      WHERE p.id = investor_interests.problem_id 
      AND p.owner_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.innovations i
      WHERE i.id = investor_interests.innovation_id 
      AND i.innovator_id = auth.uid()
    )
  );