import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Sparkles, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface RecommendedItem {
  id: string;
  title: string;
  type: 'problem' | 'innovation';
  category: string;
  matchReason: string;
}

interface RecommendedSectionProps {
  limit?: number;
  className?: string;
}

export const RecommendedSection = ({ 
  limit = 5,
  className 
}: RecommendedSectionProps) => {
  const { user, role } = useAuth();
  const [items, setItems] = useState<RecommendedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRecommended = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const results: RecommendedItem[] = [];

        // For investors, recommend innovations with high engagement
        if (role === 'investor') {
          // Get investor's interests to understand preferences
          const { data: interests } = await supabase
            .from("investor_interests")
            .select("innovation_id, problem_id")
            .eq("investor_id", user.id)
            .limit(10);

          const interestedInnovationIds = interests?.map(i => i.innovation_id).filter(Boolean) || [];
          const interestedProblemIds = interests?.map(i => i.problem_id).filter(Boolean) || [];

          // Get innovations similar to their interests (by category)
          const { data: innovations } = await supabase
            .from("innovations")
            .select("id, title, category, view_count, interest_count")
            .in("status", ["published", "featured"])
            .not("id", "in", `(${interestedInnovationIds.length > 0 ? interestedInnovationIds.join(',') : 'null'})`)
            .order("interest_count", { ascending: false })
            .limit(limit);

          if (innovations) {
            results.push(...innovations.map(i => ({
              id: i.id,
              title: i.title,
              type: 'innovation' as const,
              category: i.category,
              matchReason: "High engagement",
            })));
          }
        }

        // For innovators, recommend problems matching their skills
        if (role === 'innovator') {
          // Get categories from their innovations
          const { data: myInnovations } = await supabase
            .from("innovations")
            .select("category")
            .eq("innovator_id", user.id);

          const myCategories = [...new Set(myInnovations?.map(i => i.category) || [])];

          // Find problems in similar categories
          type ProblemCategory = "agriculture" | "education" | "finance" | "healthcare" | "infrastructure" | "manufacturing" | "other" | "sustainability" | "technology";
          
          const categoryMap: { [key: string]: ProblemCategory } = {
            'ai': 'technology',
            'healthtech': 'healthcare',
            'fintech': 'finance',
            'edtech': 'education',
            'climatetech': 'sustainability',
            'saas': 'technology',
            'hardware': 'manufacturing',
          };

          const mappedCategories = myCategories.map(c => categoryMap[c] || 'other');

          let query = supabase
            .from("problems")
            .select("id, title, category, view_count")
            .neq("status", "draft")
            .order("view_count", { ascending: false })
            .limit(limit);

          if (mappedCategories.length > 0) {
            query = query.in("category", mappedCategories);
          }

          const { data: problems } = await query;

          if (problems) {
            results.push(...problems.map((p: any) => ({
              id: p.id,
              title: p.title,
              type: 'problem' as const,
              category: p.category,
              matchReason: mappedCategories.includes(p.category as ProblemCategory) ? "Matches your expertise" : "Popular problem",
            })));
          }
        }

        // For enterprise, recommend solutions and innovations
        if (role === 'enterprise') {
          const { data: innovations } = await supabase
            .from("innovations")
            .select("id, title, category, view_count, interest_count")
            .in("status", ["published", "featured"])
            .order("view_count", { ascending: false })
            .limit(limit);

          if (innovations) {
            results.push(...innovations.map(i => ({
              id: i.id,
              title: i.title,
              type: 'innovation' as const,
              category: i.category,
              matchReason: "Popular innovation",
            })));
          }
        }

        setItems(results.slice(0, limit));
      } catch (error) {
        console.error("Error fetching recommendations:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecommended();
  }, [user, role, limit]);

  if (!user || isLoading) {
    if (isLoading) {
      return (
        <Card className={className}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Sparkles className="h-5 w-5 text-primary" />
              Recommended for You
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      );
    }
    return null;
  }

  if (items.length === 0) {
    return null;
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Sparkles className="h-5 w-5 text-primary" />
          Recommended for You
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.map((item) => (
          <Link
            key={`${item.type}-${item.id}`}
            to={item.type === 'problem' ? `/explore/${item.id}` : `/innovations`}
            className="flex items-start gap-3 p-2 rounded-lg hover:bg-accent transition-colors group"
          >
            <div className="flex items-center justify-center h-10 w-10 rounded bg-primary/10 shrink-0">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate group-hover:text-primary transition-colors">
                {item.title}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="text-xs capitalize">
                  {item.type}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {item.matchReason}
                </span>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
          </Link>
        ))}
      </CardContent>
    </Card>
  );
};
