-- Drop the old check constraint that doesn't include innovation_id
ALTER TABLE public.bookmarks DROP CONSTRAINT bookmarks_check;

-- Add the new check constraint that includes innovation_id
ALTER TABLE public.bookmarks ADD CONSTRAINT bookmarks_check 
  CHECK (
    (problem_id IS NOT NULL) OR 
    (solution_id IS NOT NULL) OR 
    (innovation_id IS NOT NULL)
  );

-- Add unique constraint to prevent duplicate bookmarks for the same entity
-- First, let's check if there's already a unique constraint
-- If not, add one based on the three entity types
CREATE UNIQUE INDEX IF NOT EXISTS bookmarks_user_problem_unique 
  ON public.bookmarks (user_id, problem_id) 
  WHERE problem_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS bookmarks_user_solution_unique 
  ON public.bookmarks (user_id, solution_id) 
  WHERE solution_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS bookmarks_user_innovation_unique 
  ON public.bookmarks (user_id, innovation_id) 
  WHERE innovation_id IS NOT NULL;