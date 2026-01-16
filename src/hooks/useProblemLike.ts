import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabaseClient";

const getSessionId = (): string => {
  const key = 'problem_session_id';
  let sessionId = localStorage.getItem(key);
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem(key, sessionId);
  }
  return sessionId;
};

export const useProblemLike = (problemId: string, initialLikeCount: number = 0) => {
  const { user } = useAuth();
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [isLoading, setIsLoading] = useState(false);
  const sessionId = getSessionId();

  useEffect(() => {
    const checkIfLiked = async () => {
      const { data } = await supabase
        .from('problem_likes')
        .select('id')
        .eq('problem_id', problemId)
        .eq('session_id', sessionId)
        .maybeSingle();

      setIsLiked(!!data);
    };

    checkIfLiked();
  }, [problemId, sessionId]);

  useEffect(() => {
    setLikeCount(initialLikeCount);
  }, [initialLikeCount]);

  const toggleLike = useCallback(
    async (e?: React.MouseEvent) => {
      if (e) e.stopPropagation();
      if (isLoading) return;

      setIsLoading(true);
      const previousIsLiked = isLiked;
      const previousCount = likeCount;

      // Optimistic update
      setIsLiked(!isLiked);
      setLikeCount(isLiked ? likeCount - 1 : likeCount + 1);

      try {
        if (previousIsLiked) {
          const { error } = await supabase
            .from('problem_likes')
            .delete()
            .eq('problem_id', problemId)
            .eq('session_id', sessionId);

          if (error) throw error;
        } else {
          // Insert with session_id; user_id will be stamped by trigger if logged in
          const { error } = await supabase
            .from('problem_likes')
            .insert({ problem_id: problemId, session_id: sessionId });

          if (error) throw error;
        }
      } catch (error) {
        // Revert on error
        setIsLiked(previousIsLiked);
        setLikeCount(previousCount);
        console.error('Error toggling problem like:', error);
      } finally {
        setIsLoading(false);
      }
    },
    [problemId, sessionId, isLiked, likeCount, isLoading, supabaseWithSession]
  );

  return { isLiked, likeCount, toggleLike, isLoading };
};
