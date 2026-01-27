import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";

const getSessionId = (): string => {
  const key = 'problem_session_id';
  let sessionId = localStorage.getItem(key);
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem(key, sessionId);
  }
  return sessionId;
};

export const useProblemInterest = (problemId: string, initialInterestCount: number = 0) => {
  const { user } = useAuth();
  const [isInterested, setIsInterested] = useState(false);
  const [interestCount, setInterestCount] = useState(initialInterestCount);
  const [isLoading, setIsLoading] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const sessionId = getSessionId();

  useEffect(() => {
    const checkIfInterested = async () => {
      const { data } = await supabase
        .from('problem_interests')
        .select('id')
        .eq('problem_id', problemId)
        .eq('session_id', sessionId)
        .maybeSingle();

      setIsInterested(!!data);
    };

    checkIfInterested();
  }, [problemId, sessionId]);

  useEffect(() => {
    setInterestCount(initialInterestCount);
  }, [initialInterestCount]);

  const toggleInterest = useCallback(
    async (e?: React.MouseEvent) => {
      if (e) e.stopPropagation();
      if (isLoading) return;

      setIsLoading(true);
      const previousIsInterested = isInterested;
      const previousCount = interestCount;

      // Optimistic update
      setIsInterested(!isInterested);
      setInterestCount(isInterested ? interestCount - 1 : interestCount + 1);

      // Trigger animation
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 300);

      try {
        if (previousIsInterested) {
          const { error } = await supabase
            .from('problem_interests')
            .delete()
            .eq('problem_id', problemId)
            .eq('session_id', sessionId);

          if (error) throw error;
          toast.success("Removed from your interests");
        } else {
          // Insert with session_id; user_id will be stamped by trigger if logged in
          const { error } = await supabase
            .from('problem_interests')
            .insert({ problem_id: problemId, session_id: sessionId });

          if (error) throw error;
          toast.success("Added to your interests");
        }
      } catch (error) {
        // Revert on error
        setIsInterested(previousIsInterested);
        setInterestCount(previousCount);
        console.error('Error toggling problem interest:', error);
        toast.error("Failed to update interest");
      } finally {
        setIsLoading(false);
      }
    },
    [problemId, sessionId, isInterested, interestCount, isLoading]
  );

  return { isInterested, interestCount, toggleInterest, isLoading, isAnimating };
};
