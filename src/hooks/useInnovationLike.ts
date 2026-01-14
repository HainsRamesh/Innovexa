import { useState, useEffect, useCallback, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const getSessionId = (): string => {
  const key = 'innovation_session_id';
  let sessionId = localStorage.getItem(key);
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem(key, sessionId);
  }
  return sessionId;
};

export const useInnovationLike = (innovationId: string, initialLikeCount: number = 0) => {
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [isLoading, setIsLoading] = useState(false);
  const sessionId = getSessionId();

  // Create a Supabase client that sends the session header so RLS can see it
  // This client also inherits the auth session from localStorage
  const supabaseWithSession = useMemo(
    () =>
      createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        global: {
          headers: {
            'x-innovation-session-id': sessionId,
          },
        },
        auth: {
          storage: localStorage,
          persistSession: true,
          autoRefreshToken: true,
        },
      }),
    [sessionId]
  );

  useEffect(() => {
    const checkIfLiked = async () => {
      const { data } = await supabaseWithSession
        .from('innovation_likes')
        .select('id')
        .eq('innovation_id', innovationId)
        .eq('session_id', sessionId)
        .maybeSingle();

      setIsLiked(!!data);
    };

    checkIfLiked();
  }, [innovationId, sessionId, supabaseWithSession]);

  useEffect(() => {
    setLikeCount(initialLikeCount);
  }, [initialLikeCount]);

  const toggleLike = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();
      if (isLoading) return;

      setIsLoading(true);
      const previousIsLiked = isLiked;
      const previousCount = likeCount;

      // Optimistic update
      setIsLiked(!isLiked);
      setLikeCount(isLiked ? likeCount - 1 : likeCount + 1);

      try {
        if (previousIsLiked) {
          const { error } = await supabaseWithSession
            .from('innovation_likes')
            .delete()
            .eq('innovation_id', innovationId)
            .eq('session_id', sessionId);

          if (error) throw error;
        } else {
          const { error } = await supabaseWithSession
            .from('innovation_likes')
            .insert({ innovation_id: innovationId, session_id: sessionId });

          if (error) throw error;
        }
      } catch (error) {
        // Revert on error
        setIsLiked(previousIsLiked);
        setLikeCount(previousCount);
        console.error('Error toggling like:', error);
      } finally {
        setIsLoading(false);
      }
    },
    [innovationId, sessionId, isLiked, likeCount, isLoading, supabaseWithSession]
  );

  return { isLiked, likeCount, toggleLike, isLoading };
};
