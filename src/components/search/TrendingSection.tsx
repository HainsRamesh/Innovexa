import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { TrendingUp, Eye, Heart, MessageCircle, Flame } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";

interface TrendingItem {
  id: string;
  title: string;
  type: 'problem' | 'innovation';
  category: string;
  view_count: number;
  like_count: number;
  comment_count?: number;
}

interface TrendingSectionProps {
  type?: 'problems' | 'innovations' | 'all';
  limit?: number;
  className?: string;
}

export const TrendingSection = ({ 
  type = 'all', 
  limit = 5,
  className 
}: TrendingSectionProps) => {
  const [items, setItems] = useState<TrendingItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTrending = async () => {
      setIsLoading(true);
      try {
        const results: TrendingItem[] = [];

        if (type === 'all' || type === 'problems') {
          const { data: problems } = await supabase
            .from("problems")
            .select("id, title, category, view_count, like_count")
            .neq("status", "draft")
            .order("view_count", { ascending: false })
            .order("like_count", { ascending: false })
            .limit(type === 'all' ? Math.ceil(limit / 2) : limit);

          if (problems) {
            results.push(...problems.map(p => ({
              ...p,
              type: 'problem' as const,
              view_count: p.view_count || 0,
              like_count: p.like_count || 0,
            })));
          }
        }

        if (type === 'all' || type === 'innovations') {
          const { data: innovations } = await supabase
            .from("innovations")
            .select("id, title, category, view_count, like_count, comment_count")
            .in("status", ["published", "featured"])
            .order("view_count", { ascending: false })
            .order("like_count", { ascending: false })
            .limit(type === 'all' ? Math.ceil(limit / 2) : limit);

          if (innovations) {
            results.push(...innovations.map(i => ({
              ...i,
              type: 'innovation' as const,
              view_count: i.view_count || 0,
              like_count: i.like_count || 0,
              comment_count: i.comment_count || 0,
            })));
          }
        }

        // Sort by engagement score (views + likes*2 + comments*3)
        results.sort((a, b) => {
          const scoreA = (a.view_count || 0) + (a.like_count || 0) * 2 + (a.comment_count || 0) * 3;
          const scoreB = (b.view_count || 0) + (b.like_count || 0) * 2 + (b.comment_count || 0) * 3;
          return scoreB - scoreA;
        });

        setItems(results.slice(0, limit));
      } catch (error) {
        console.error("Error fetching trending:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTrending();
  }, [type, limit]);

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Flame className="h-5 w-5 text-orange-500" />
            Trending
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-8 w-8 rounded" />
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

  if (items.length === 0) {
    return null;
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Flame className="h-5 w-5 text-orange-500" />
          Trending Now
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.map((item, index) => (
          <Link
            key={`${item.type}-${item.id}`}
            to={item.type === 'problem' ? `/explore/${item.id}` : `/innovations`}
            className="flex items-start gap-3 p-2 rounded-lg hover:bg-accent transition-colors group"
          >
            <div className="flex items-center justify-center h-8 w-8 rounded bg-primary/10 text-primary font-bold text-sm shrink-0">
              {index + 1}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate group-hover:text-primary transition-colors">
                {item.title}
              </p>
              <div className="flex items-center gap-3 mt-1">
                <Badge variant="outline" className="text-xs capitalize">
                  {item.type}
                </Badge>
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Eye className="h-3 w-3" />
                  {item.view_count}
                </span>
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Heart className="h-3 w-3" />
                  {item.like_count}
                </span>
                {item.comment_count !== undefined && (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MessageCircle className="h-3 w-3" />
                    {item.comment_count}
                  </span>
                )}
              </div>
            </div>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
};
