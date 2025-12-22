import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { format } from "date-fns";

import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { Problem } from "@/types";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Edit, Trash2 } from "lucide-react";

export default function ProblemDetailPage() {
  const { problemId } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [problem, setProblem] = useState<Problem | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!problemId) {
      setIsLoading(false);
      return;
    }

    const fetchProblem = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("problems")
        .select("*")
        .eq("id", problemId)
        .maybeSingle();

      if (error) {
        console.error("Error fetching problem:", error);
        toast({
          title: "Could not load problem",
          description: "Please try again later.",
          variant: "destructive",
        });
        setProblem(null);
      } else {
        setProblem((data as Problem) ?? null);
      }
      setIsLoading(false);
    };

    fetchProblem();
  }, [problemId, toast]);

  const handleDelete = async () => {
    if (!problem) return;

    const { error } = await supabase.from("problems").delete().eq("id", problem.id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete problem",
        variant: "destructive",
      });
    } else {
      toast({ title: "Problem deleted" });
      navigate("/dashboard/problems");
    }
  };

  const formatBudget = (min: number | null, max: number | null) => {
    if (!min && !max) return "Open budget";
    if (min && max) return `$${min.toLocaleString()} - $${max.toLocaleString()}`;
    if (max) return `Up to $${max.toLocaleString()}`;
    return `From $${min?.toLocaleString()}`;
  };

  const isOwner = user && problem && user.id === problem.owner_id;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/dashboard/problems">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Link>
        </Button>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4 animate-pulse">
              <div className="h-5 bg-secondary rounded w-2/3" />
              <div className="h-4 bg-secondary rounded w-1/3" />
              <div className="h-24 bg-secondary rounded" />
            </div>
          </CardContent>
        </Card>
      ) : !problem ? (
        <Card>
          <CardContent className="p-10 text-center">
            <h1 className="text-2xl font-bold">Problem not found</h1>
            <p className="text-muted-foreground mt-2">
              This problem may have been removed or is no longer available.
            </p>
            <div className="mt-6">
              <Button asChild>
                <Link to="/dashboard/problems">Back to My Problems</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <Badge variant={problem.category as any}>{problem.category}</Badge>
                <Badge variant="outline">{problem.status}</Badge>
              </div>
              <h1 className="text-2xl font-bold">{problem.title}</h1>
              <p className="text-muted-foreground mt-1">
                Created {format(new Date(problem.created_at), "MMM d, yyyy")}
                {problem.deadline && ` • Due ${format(new Date(problem.deadline), "MMM d, yyyy")}`}
              </p>
            </div>

            {isOwner && (
              <div className="flex gap-2">
                <Button variant="outline" asChild>
                  <Link to={`/dashboard/problems/${problem.id}/edit`}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Link>
                </Button>
                <Button variant="destructive" onClick={handleDelete}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>
            )}
          </div>

          <Card>
            <CardContent className="p-6 space-y-6">
              <section className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">Budget</p>
                  <p className="font-medium">{formatBudget(problem.budget_min, problem.budget_max)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Industry</p>
                  <p className="font-medium">{problem.industry || "Not specified"}</p>
                </div>
              </section>

              <Separator />

              <section>
                <h2 className="text-lg font-semibold mb-2">Description</h2>
                <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {problem.description}
                </p>
              </section>

              {problem.ai_summary && (
                <>
                  <Separator />
                  <section>
                    <h2 className="text-lg font-semibold mb-2">AI Summary</h2>
                    <p className="text-muted-foreground leading-relaxed">{problem.ai_summary}</p>
                  </section>
                </>
              )}

              {problem.requirements && problem.requirements.length > 0 && (
                <>
                  <Separator />
                  <section>
                    <h2 className="text-lg font-semibold mb-3">Requirements</h2>
                    <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
                      {problem.requirements.map((req) => (
                        <li key={req}>{req}</li>
                      ))}
                    </ul>
                  </section>
                </>
              )}

              {problem.tags && problem.tags.length > 0 && (
                <>
                  <Separator />
                  <section>
                    <h2 className="text-lg font-semibold mb-3">Tags</h2>
                    <div className="flex flex-wrap gap-2">
                      {problem.tags.map((tag) => (
                        <Badge key={tag} variant="outline">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </section>
                </>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
