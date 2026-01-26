import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";

const getSessionId = (): string => {
  const key = 'innovation_session_id';
  let sessionId = localStorage.getItem(key);
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem(key, sessionId);
  }
  return sessionId;
};

export const useInnovationInterest = (innovationId: string, initialInterestCount: number = 0) => {
  const [isInterested, setIsInterested] = useState(false);
  const [interestCount, setInterestCount] = useState(initialInterestCount);
  const [isLoading, setIsLoading] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const sessionId = getSessionId();

  useEffect(() => {
    const checkIfInterested = async () => {
      const { data } = await supabase
        .from('innovation_interests')
        .select('id')
        .eq('innovation_id', innovationId)
        .eq('session_id', sessionId)
        .maybeSingle();

      setIsInterested(!!data);
    };

    checkIfInterested();
  }, [innovationId, sessionId]);

  useEffect(() => {
    setInterestCount(initialInterestCount);
  }, [initialInterestCount]);

  const toggleInterest = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();
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
            .from('innovation_interests')
            .delete()
            .eq('innovation_id', innovationId)
            .eq('session_id', sessionId);

          if (error) throw error;
          toast.success("Removed from your interests");
        } else {
          const { error } = await supabase
            .from('innovation_interests')
            .insert({ innovation_id: innovationId, session_id: sessionId });

          if (error) throw error;
          toast.success("Added to your interests");
        }
      } catch (error) {
        // Revert on error
        setIsInterested(previousIsInterested);
        setInterestCount(previousCount);
        console.error('Error toggling interest:', error);
        toast.error("Failed to update interest");
      } finally {
        setIsLoading(false);
      }
    },
    [innovationId, sessionId, isInterested, interestCount, isLoading]
  );

  return { isInterested, interestCount, toggleInterest, isLoading, isAnimating };
};
