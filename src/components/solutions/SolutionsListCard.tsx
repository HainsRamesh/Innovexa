import { useEffect, useState } from "react";
import { format } from "date-fns";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import type { Solution } from "@/types";
import { Eye, Filter, DollarSign, Clock, X, MessageCircle } from "lucide-react";

interface SolutionsListCardProps {
  problemId: string;
  budgetMin?: number | null;
  budgetMax?: number | null;
  onSelectSolution?: (solution: Solution) => void;
}

export function SolutionsListCard({
  problemId,
  budgetMin,
  budgetMax,
  onSelectSolution,
}: SolutionsListCardProps) {
  const [solutions, setSolutions] = useState<Solution[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [minCostFilter, setMinCostFilter] = useState<string>("");
  const [maxCostFilter, setMaxCostFilter] = useState<string>("");

  useEffect(() => {
    const fetchSolutions = async () => {
      setIsLoading(true);

      const { data, error } = await supabase
        .from("solutions")
        .select("*")
        .eq("problem_id", problemId)
        .in("status", ["submitted", "under_review", "shortlisted", "accepted"]);

      if (error) {
        console.error("Error fetching solutions:", error);
        setSolutions([]);
      } else {
        setSolutions((data as Solution[]) || []);
      }

      setIsLoading(false);
    };

    fetchSolutions();
  }, [problemId]);

  const filteredSolutions = solutions.filter((solution) => {
    const cost = solution.estimated_cost;
    const min = minCostFilter ? parseFloat(minCostFilter) : null;
    const max = maxCostFilter ? parseFloat(maxCostFilter) : null;

    if (min !== null && cost !== null && cost < min) return false;
    if (max !== null && cost !== null && cost > max) return false;

    return true;
  });

  const clearFilters = () => {
    setMinCostFilter("");
    setMaxCostFilter("");
  };

  const formatCurrency = (amount: number | null) => {
    if (amount === null) return "Not specified";
    return `$${amount.toLocaleString()}`;
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "accepted":
        return "default";
      case "shortlisted":
        return "secondary";
      case "under_review":
        return "outline";
      default:
        return "outline";
    }
  };

  return (
    <Card className="mt-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Submitted Solutions
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
        </div>

        {showFilters && (
          <div className="mt-4 p-4 bg-secondary/30 rounded-lg space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Filter by estimated cost</Label>
              {(minCostFilter || maxCostFilter) && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <X className="h-4 w-4 mr-1" />
                  Clear
                </Button>
              )}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="min-cost" className="text-xs text-muted-foreground">
                  Min Cost ($)
                </Label>
                <Input
                  id="min-cost"
                  type="number"
                  min="0"
                  placeholder={budgetMin ? `${budgetMin}` : "0"}
                  value={minCostFilter}
                  onChange={(e) => setMinCostFilter(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="max-cost" className="text-xs text-muted-foreground">
                  Max Cost ($)
                </Label>
                <Input
                  id="max-cost"
                  type="number"
                  min="0"
                  placeholder={budgetMax ? `${budgetMax}` : "No limit"}
                  value={maxCostFilter}
                  onChange={(e) => setMaxCostFilter(e.target.value)}
                />
              </div>
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-4 border rounded-lg">
                <Skeleton className="h-5 w-2/3 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        ) : filteredSolutions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {solutions.length === 0
              ? "No solutions have been submitted yet."
              : "No solutions match your filter criteria."}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {filteredSolutions.map((solution) => (
              <Card
                key={solution.id}
                className="overflow-hidden hover:shadow-md transition-shadow"
              >
                <CardContent className="p-5">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-semibold text-lg leading-tight line-clamp-2">
                        {solution.title}
                      </h4>
                      <Badge variant={getStatusVariant(solution.status)} className="shrink-0">
                        {solution.status.replace("_", " ")}
                      </Badge>
                    </div>

                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {solution.description}
                    </p>

                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <div className="flex items-center gap-2 text-sm">
                        <DollarSign className="h-4 w-4 text-primary" />
                        <span className="font-medium">
                          {formatCurrency(solution.estimated_cost)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4 text-primary" />
                        <span className="font-medium">
                          {solution.timeline_weeks
                            ? `${solution.timeline_weeks} weeks`
                            : "TBD"}
                        </span>
                      </div>
                    </div>

                    {solution.approach && (
                      <div className="pt-2 border-t">
                        <p className="text-xs text-muted-foreground mb-1">Personal Opinion</p>
                        <p className="text-sm line-clamp-2">{solution.approach}</p>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-3 border-t">
                      <Button variant="ghost" size="sm" className="text-muted-foreground">
                        <MessageCircle className="h-4 w-4 mr-1" />
                        Comments
                      </Button>
                      {onSelectSolution && (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => onSelectSolution(solution)}
                        >
                          Invest
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {!isLoading && solutions.length > 0 && (
          <>
            <Separator className="my-4" />
            <p className="text-sm text-muted-foreground text-center">
              Showing {filteredSolutions.length} of {solutions.length} solution
              {solutions.length !== 1 ? "s" : ""}
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
