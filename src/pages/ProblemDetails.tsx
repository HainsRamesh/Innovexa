import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { format } from "date-fns";

import { Navbar } from "@/components/layout/Navbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { SolutionSubmissionForm } from "@/components/solutions/SolutionSubmissionForm";
import { SolutionsListCard } from "@/components/solutions/SolutionsListCard";
import { InvestmentProposalForm } from "@/components/investments/InvestmentProposalForm";
import type { Problem, Solution } from "@/types";
import { Eye, TrendingUp } from "lucide-react";

const upsertMetaTag = (name: string, content: string) => {
  let tag = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null;
  if (!tag) {
    tag = document.createElement("meta");
    tag.setAttribute("name", name);
    document.head.appendChild(tag);
  }
  tag.setAttribute("content", content);
};

const upsertLinkTag = (rel: string, href: string) => {
  let tag = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;
  if (!tag) {
    tag = document.createElement("link");
    tag.setAttribute("rel", rel);
    document.head.appendChild(tag);
  }
  tag.setAttribute("href", href);
};

export default function ProblemDetails() {
  const { problemId } = useParams();
  const { toast } = useToast();
  const { user, role } = useAuth();

  const [problem, setProblem] = useState<Problem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showSubmissionForm, setShowSubmissionForm] = useState(false);
  const [showSolutionsList, setShowSolutionsList] = useState(false);
  const [showInvestmentForm, setShowInvestmentForm] = useState(false);
  const [selectedSolution, setSelectedSolution] = useState<Solution | null>(null);

  const isInnovator = role === "innovator";
  const isInvestor = role === "investor";

  const handleSelectSolutionForInvestment = (solution: Solution) => {
    setSelectedSolution(solution);
    setShowInvestmentForm(true);
  };

  useEffect(() => {
    let isMounted = true;

    const fetchProblem = async () => {
      if (!problemId) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      const { data, error } = await supabase
        .from("problems")
        .select("*")
        .eq("id", problemId)
        .maybeSingle();

      if (!isMounted) return;

      if (error) {
        console.error("Error fetching problem:", error);
        toast({
          title: "Could not load problem",
          description: "Please try again in a moment.",
          variant: "destructive",
        });
        setProblem(null);
      } else {
        setProblem((data as Problem) ?? null);
      }

      setIsLoading(false);
    };

    fetchProblem();

    return () => {
      isMounted = false;
    };
  }, [problemId, toast]);

  useEffect(() => {
    const title = problem?.title ? `${problem.title} | Problem Details` : "Problem Details";
    document.title = title;

    const description = problem?.description
      ? `${problem.description.slice(0, 150)}${problem.description.length > 150 ? "…" : ""}`
      : "View problem details, requirements, and timeline.";

    upsertMetaTag("description", description);

    if (problemId) {
      upsertLinkTag("canonical", `${window.location.origin}/explore/${problemId}`);
    }
  }, [problem, problemId]);

  const jsonLd = useMemo(() => {
    if (!problem) return null;
    return {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: problem.title,
      description: problem.description,
      datePublished: problem.created_at,
      dateModified: problem.updated_at,
      mainEntityOfPage: {
        "@type": "WebPage",
        "@id": problemId ? `${window.location.origin}/explore/${problemId}` : undefined,
      },
    };
  }, [problem, problemId]);

  const formatBudget = (min: number | null, max: number | null) => {
    if (!min && !max) return "Open budget";
    if (min && max) return `$${min.toLocaleString()} - $${max.toLocaleString()}`;
    if (max) return `Up to $${max.toLocaleString()}`;
    return `From $${min?.toLocaleString()}`;
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-24 pb-16">
        <section className="container mx-auto px-4">
          {jsonLd && (
            <script
              type="application/ld+json"
              dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
          )}

          <div className="mb-6">
            <Button variant="ghost" asChild>
              <Link to="/explore">← Back to Explore</Link>
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
                    <Link to="/explore">Browse problems</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <article className="max-w-3xl mx-auto">
              <header className="mb-6">
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <Badge variant={problem.category as any}>{problem.category}</Badge>
                  {problem.industry && <Badge variant="outline">{problem.industry}</Badge>}
                </div>

                <h1 className="text-3xl font-bold leading-tight">{problem.title}</h1>

                <p className="text-muted-foreground mt-3">
                  Posted {format(new Date(problem.created_at), "MMM d, yyyy")}
                  {problem.deadline
                    ? ` • Due ${format(new Date(problem.deadline), "MMM d, yyyy")}`
                    : ""}
                </p>
              </header>

              <Card>
                <CardContent className="p-6">
                  <section aria-label="Key details" className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <p className="text-sm text-muted-foreground">Budget</p>
                      <p className="font-medium">{formatBudget(problem.budget_min, problem.budget_max)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Category</p>
                      <p className="font-medium">{problem.category}</p>
                    </div>
                  </section>

                  <Separator className="my-6" />

                  <section aria-label="Problem overview">
                    <h2 className="text-lg font-semibold mb-2">Overview</h2>
                    <p className="text-muted-foreground leading-relaxed">{problem.description}</p>
                  </section>

                  {problem.ai_summary && (
                    <>
                      <Separator className="my-6" />
                      <section aria-label="AI summary">
                        <h2 className="text-lg font-semibold mb-2">Summary</h2>
                        <p className="text-muted-foreground leading-relaxed">{problem.ai_summary}</p>
                      </section>
                    </>
                  )}

                  {problem.requirements && problem.requirements.length > 0 && (
                    <>
                      <Separator className="my-6" />
                      <section aria-label="Requirements">
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
                      <Separator className="my-6" />
                      <section aria-label="Tags">
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

                  <Separator className="my-6" />

                  <section aria-label="Next steps" className="space-y-4">
                    {user && isInnovator ? (
                      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                        <p className="text-sm text-muted-foreground">
                          Ready to submit your solution for this problem?
                        </p>
                        <Button onClick={() => setShowSubmissionForm(true)}>
                          Submit Your Solution
                        </Button>
                      </div>
                    ) : user && isInvestor ? (
                      <div className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                          Interested in this opportunity? View solutions or propose an investment.
                        </p>
                        <div className="flex flex-wrap gap-3">
                          <Button
                            variant="outline"
                            onClick={() => setShowSolutionsList(!showSolutionsList)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            {showSolutionsList ? "Hide Solutions" : "View Solutions"}
                          </Button>
                          <Button onClick={() => setShowInvestmentForm(true)}>
                            <TrendingUp className="h-4 w-4 mr-2" />
                            Propose Investment
                          </Button>
                        </div>
                      </div>
                    ) : user ? (
                      <p className="text-sm text-muted-foreground">
                        Only innovators can submit solutions and investors can propose investments.
                      </p>
                    ) : (
                      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                        <p className="text-sm text-muted-foreground">
                          Want to propose a solution? Create an account to submit your approach.
                        </p>
                        <Button asChild>
                          <Link to="/auth?mode=signup">Sign up to submit</Link>
                        </Button>
                      </div>
                    )}
                  </section>
                </CardContent>
              </Card>

              {showSubmissionForm && problemId && (
                <SolutionSubmissionForm
                  problemId={problemId}
                  onSuccess={() => setShowSubmissionForm(false)}
                  onCancel={() => setShowSubmissionForm(false)}
                />
              )}

              {showSolutionsList && problemId && (
                <SolutionsListCard
                  problemId={problemId}
                  budgetMin={problem.budget_min}
                  budgetMax={problem.budget_max}
                  onSelectSolution={handleSelectSolutionForInvestment}
                />
              )}

              {showInvestmentForm && problemId && (
                <InvestmentProposalForm
                  problemId={problemId}
                  budgetMin={problem.budget_min}
                  budgetMax={problem.budget_max}
                  selectedSolution={selectedSolution}
                  onSuccess={() => {
                    setShowInvestmentForm(false);
                    setSelectedSolution(null);
                  }}
                  onCancel={() => {
                    setShowInvestmentForm(false);
                    setSelectedSolution(null);
                  }}
                />
              )}
            </article>
          )}
        </section>
      </main>
    </div>
  );
}
