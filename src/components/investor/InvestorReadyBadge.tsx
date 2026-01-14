import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { supabase } from "@/integrations/supabase/client";
import { TrendingUp, MessageCircle, Rocket, DollarSign } from "lucide-react";

interface InvestorInterest {
  id: string;
  investor_name: string;
  interest_type: string;
  investment_range: string | null;
  created_at: string;
}

interface InvestorReadyBadgeProps {
  targetType: "problem" | "innovation";
  targetId: string;
  className?: string;
}

const interestTypeLabels: Record<string, { label: string; Icon: typeof MessageCircle }> = {
  discussion: { label: "Discussion", Icon: MessageCircle },
  pilot: { label: "Pilot / POC", Icon: Rocket },
  funding: { label: "Funding", Icon: DollarSign },
};

const investmentRangeLabels: Record<string, string> = {
  under_10k: "Under $10K",
  "10k_50k": "$10K - $50K",
  "50k_100k": "$50K - $100K",
  "100k_500k": "$100K - $500K",
  "500k_1m": "$500K - $1M",
  over_1m: "Over $1M",
};

export function InvestorReadyBadge({ targetType, targetId, className }: InvestorReadyBadgeProps) {
  const [interests, setInterests] = useState<InvestorInterest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchInterests = async () => {
      setIsLoading(true);
      try {
        const column = targetType === "problem" ? "problem_id" : "innovation_id";
        const { data, error } = await supabase
          .from("investor_interests")
          .select("id, investor_name, interest_type, investment_range, created_at")
          .eq(column, targetId)
          .order("created_at", { ascending: false });

        if (error) throw error;
        setInterests(data || []);
      } catch (error) {
        console.error("Error fetching investor interests:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInterests();
  }, [targetType, targetId]);

  if (isLoading || interests.length === 0) {
    return null;
  }

  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <Badge 
          className={`bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/20 cursor-pointer gap-1.5 ${className}`}
        >
          <TrendingUp className="h-3 w-3" />
          Investor Ready
          {interests.length > 1 && (
            <span className="ml-1 bg-emerald-500/20 px-1.5 py-0.5 rounded-full text-xs">
              {interests.length}
            </span>
          )}
        </Badge>
      </HoverCardTrigger>
      <HoverCardContent 
        className="w-80 p-0" 
        side="top"
        align="start"
      >
        <div className="p-3 border-b border-border">
          <h4 className="font-semibold text-sm flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-emerald-500" />
            Investor Interest ({interests.length})
          </h4>
        </div>
        <div className="max-h-60 overflow-y-auto">
          {interests.map((interest) => {
            const typeInfo = interestTypeLabels[interest.interest_type] || { label: interest.interest_type, Icon: MessageCircle };
            const Icon = typeInfo.Icon;
            
            return (
              <div key={interest.id} className="p-3 border-b border-border/50 last:border-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{interest.investor_name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs gap-1">
                        <Icon className="h-3 w-3" />
                        {typeInfo.label}
                      </Badge>
                      {interest.investment_range && (
                        <span className="text-xs text-muted-foreground">
                          {investmentRangeLabels[interest.investment_range] || interest.investment_range}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {format(new Date(interest.created_at), "MMM d")}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}