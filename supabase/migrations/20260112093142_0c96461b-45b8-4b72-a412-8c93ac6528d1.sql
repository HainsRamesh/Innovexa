-- Add innovation_id column to bookmarks table
ALTER TABLE public.bookmarks 
ADD COLUMN innovation_id UUID REFERENCES public.innovations(id) ON DELETE CASCADE;

-- Create index for faster queries
CREATE INDEX idx_bookmarks_innovation_id ON public.bookmarks(innovation_id);

-- Update RLS policies to include innovation bookmarks
DROP POLICY IF EXISTS "Users can view their own bookmarks" ON public.bookmarks;
DROP POLICY IF EXISTS "Users can create their own bookmarks" ON public.bookmarks;
DROP POLICY IF EXISTS "Users can delete their own bookmarks" ON public.bookmarks;

CREATE POLICY "Users can view their own bookmarks" 
ON public.bookmarks 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own bookmarks" 
ON public.bookmarks 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own bookmarks" 
ON public.bookmarks 
FOR DELETE 
USING (auth.uid() = user_id);