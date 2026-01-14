import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface InvestorInterest {
  id: string;
  investor_id: string;
  investor_name: string;
  interest_type: string;
  investment_range: string | null;
  message: string | null;
  created_at: string;
}

export function useInvestorInterests(targetType: "problem" | "innovation", targetId: string) {
  const { user } = useAuth();
  const [interests, setInterests] = useState<InvestorInterest[]>([]);
  const [hasUserInterest, setHasUserInterest] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchInterests = useCallback(async () => {
    setIsLoading(true);
    try {
      const column = targetType === "problem" ? "problem_id" : "innovation_id";
      const { data, error } = await supabase
        .from("investor_interests")
        .select("*")
        .eq(column, targetId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      setInterests(data || []);
      setHasUserInterest(data?.some(i => i.investor_id === user?.id) || false);
    } catch (error) {
      console.error("Error fetching investor interests:", error);
    } finally {
      setIsLoading(false);
    }
  }, [targetType, targetId, user?.id]);

  useEffect(() => {
    fetchInterests();
  }, [fetchInterests]);

  return {
    interests,
    hasUserInterest,
    isLoading,
    refetch: fetchInterests,
    count: interests.length,
  };
}

export function useHasApprovedSolutions(problemId: string) {
  const [hasApproved, setHasApproved] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkApprovedSolutions = async () => {
      setIsLoading(true);
      try {
        const { count, error } = await supabase
          .from("solutions")
          .select("id", { count: "exact", head: true })
          .eq("problem_id", problemId)
          .eq("status", "accepted");

        if (error) throw error;
        setHasApproved((count || 0) > 0);
      } catch (error) {
        console.error("Error checking approved solutions:", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkApprovedSolutions();
  }, [problemId]);

  return { hasApproved, isLoading };
}