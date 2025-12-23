import { useEffect, useState } from "react";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { SolutionItem } from "./SolutionItem";
import { MessageSquare } from "lucide-react";

interface Solution {
  id: string;
  title: string;
  description: string;
  approach: string | null;
  technology_stack: string[] | null;
  estimated_cost: number | null;
  timeline_weeks: number | null;
  attachments: string[] | null;
  innovator_id: string;
  created_at: string;
  status: string;
}

interface SolutionsListProps {
  problemId: string;
  problemOwnerId: string;
}

export function SolutionsList({ problemId, problemOwnerId }: SolutionsListProps) {
  const [solutions, setSolutions] = useState<Solution[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSolutions = async () => {
    setIsLoading(true);

    const { data, error } = await supabase
      .from("solutions")
      .select("id, title, description, approach, technology_stack, estimated_cost, timeline_weeks, attachments, innovator_id, created_at, status")
      .eq("problem_id", problemId)
      .in("status", ["submitted", "under_review", "shortlisted", "accepted"])
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching solutions:", error);
      setSolutions([]);
    } else {
      setSolutions(data || []);
    }

    setIsLoading(false);
  };

  useEffect(() => {
    fetchSolutions();
  }, [problemId]);

  if (isLoading) {
    return (
      <div className="mt-8">
        <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Solutions
        </h3>
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-start gap-4">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-5 w-2/3" />
                <Skeleton className="h-16 w-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (solutions.length === 0) {
    return (
      <div className="mt-8">
        <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Solutions
        </h3>
        <p className="text-muted-foreground text-center py-8">
          No solutions have been submitted yet. Be the first to propose a solution!
        </p>
      </div>
    );
  }

  return (
    <div className="mt-8">
      <h3 className="text-xl font-semibold mb-2 flex items-center gap-2">
        <MessageSquare className="h-5 w-5" />
        Solutions ({solutions.length})
      </h3>
      
      <div className="divide-y divide-border">
        {solutions.map((solution) => (
          <SolutionItem
            key={solution.id}
            solution={solution}
            problemOwnerId={problemOwnerId}
            onStatusChange={fetchSolutions}
          />
        ))}
      </div>
    </div>
  );
}