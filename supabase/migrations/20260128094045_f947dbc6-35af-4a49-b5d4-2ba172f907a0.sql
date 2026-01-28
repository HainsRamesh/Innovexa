-- ============================================================
-- FINAL RLS HARDENING: Remove remaining permissive policies
-- ============================================================

-- Drop ALL old overly-permissive policies on problem_interests
DROP POLICY IF EXISTS "Users can like problems" ON public.problem_interests;
DROP POLICY IF EXISTS "Users can unlike problems" ON public.problem_interests;
DROP POLICY IF EXISTS "Authenticated users can view problem likes" ON public.problem_interests;
DROP POLICY IF EXISTS "Anyone can express interest in problems" ON public.problem_interests;
DROP POLICY IF EXISTS "Anyone can view problem interests" ON public.problem_interests;
DROP POLICY IF EXISTS "Users can remove their interest from problems" ON public.problem_interests;

-- Drop ALL old overly-permissive policies on innovation_interests
DROP POLICY IF EXISTS "Anyone can express interest" ON public.innovation_interests;
DROP POLICY IF EXISTS "Anyone can view interests" ON public.innovation_interests;
DROP POLICY IF EXISTS "Users can remove their interest" ON public.innovation_interests;

-- Now verify the new restricted policies are in place
-- If they don't exist (from failed migration), create them

-- For problem_interests
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'problem_interests' 
        AND policyname = 'Authenticated users can express interest in problems'
    ) THEN
        CREATE POLICY "Authenticated users can express interest in problems"
        ON public.problem_interests FOR INSERT
        TO authenticated
        WITH CHECK (
            session_id IS NOT NULL AND
            session_id <> '' AND
            (user_id IS NULL OR user_id = auth.uid())
        );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'problem_interests' 
        AND policyname = 'Owners and interested users can view problem interests'
    ) THEN
        CREATE POLICY "Owners and interested users can view problem interests"
        ON public.problem_interests FOR SELECT
        TO authenticated
        USING (
            user_id = auth.uid() OR
            EXISTS (
                SELECT 1 FROM public.problems p
                WHERE p.id = problem_interests.problem_id AND p.owner_id = auth.uid()
            )
        );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'problem_interests' 
        AND policyname = 'Users can remove their own problem interests'
    ) THEN
        CREATE POLICY "Users can remove their own problem interests"
        ON public.problem_interests FOR DELETE
        TO authenticated
        USING (user_id = auth.uid());
    END IF;
END $$;

-- For innovation_interests
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'innovation_interests' 
        AND policyname = 'Authenticated users can express interest in innovations'
    ) THEN
        CREATE POLICY "Authenticated users can express interest in innovations"
        ON public.innovation_interests FOR INSERT
        TO authenticated
        WITH CHECK (
            session_id IS NOT NULL AND
            session_id <> '' AND
            (user_id IS NULL OR user_id = auth.uid())
        );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'innovation_interests' 
        AND policyname = 'Owners and interested users can view innovation interests'
    ) THEN
        CREATE POLICY "Owners and interested users can view innovation interests"
        ON public.innovation_interests FOR SELECT
        TO authenticated
        USING (
            user_id = auth.uid() OR
            EXISTS (
                SELECT 1 FROM public.innovations i
                WHERE i.id = innovation_interests.innovation_id AND i.innovator_id = auth.uid()
            )
        );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'innovation_interests' 
        AND policyname = 'Users can remove their own innovation interests'
    ) THEN
        CREATE POLICY "Users can remove their own innovation interests"
        ON public.innovation_interests FOR DELETE
        TO authenticated
        USING (user_id = auth.uid());
    END IF;
END $$;

-- Harden public_profiles - require authentication for viewing
DROP POLICY IF EXISTS "Profiles viewable based on privacy settings" ON public.public_profiles;

CREATE POLICY "Authenticated users can view public profiles"
ON public.public_profiles FOR SELECT
TO authenticated
USING (can_view_profile(id, auth.uid()));