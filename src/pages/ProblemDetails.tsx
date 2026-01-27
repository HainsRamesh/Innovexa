import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { format } from "date-fns";

import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { SolutionSubmissionForm } from "@/components/solutions/SolutionSubmissionForm";
import { SolutionsList } from "@/components/solutions/SolutionsList";
import { InvestmentProposalForm } from "@/components/investments/InvestmentProposalForm";
import { InnovationDetailModal } from "@/components/innovations/InnovationDetailModal";
import type { Innovation, Problem } from "@/types";
import { TrendingUp, PlusCircle, Edit, Loader2 } from "lucide-react";

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

interface ExistingSolution {
  id: string;
  title: string;
  description: string;
  approach: string | null;
  estimated_cost: number | null;
  timeline_weeks: number | null;
  technology_stack: string[] | null;
}

export default function ProblemDetails() {
  const { problemId } = useParams();
  const { toast } = useToast();
  const { user, role } = useAuth();

  const [problem, setProblem] = useState<Problem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showSubmissionForm, setShowSubmissionForm] = useState(false);
  const [showInvestmentForm, setShowInvestmentForm] = useState(false);
  const [existingSolution, setExistingSolution] = useState<ExistingSolution | null>(null);
  const [isCheckingExistingSolution, setIsCheckingExistingSolution] = useState(false);
  const [relatedInnovations, setRelatedInnovations] = useState<Innovation[]>([]);
  const [relatedLoading, setRelatedLoading] = useState(false);
  const [relatedError, setRelatedError] = useState<string | null>(null);
  const [relatedLoaded, setRelatedLoaded] = useState(false);
  const [selectedInnovation, setSelectedInnovation] = useState<Innovation | null>(null);
  const [showInnovationModal, setShowInnovationModal] = useState(false);

  const isInnovator = role === "innovator";
  const isInvestor = role === "investor";

  // Check if innovator already has a solution for this problem
  useEffect(() => {
    const checkExistingSolution = async () => {
      if (!user || !problemId || !isInnovator) {
        setExistingSolution(null);
        return;
      }

      setIsCheckingExistingSolution(true);
      const { data, error } = await supabase
        .from("solutions")
        .select("id, title, description, approach, estimated_cost, timeline_weeks, technology_stack")
        .eq("problem_id", problemId)
        .eq("innovator_id", user.id)
        .maybeSingle();

      if (!error && data) {
        setExistingSolution(data);
      } else {
        setExistingSolution(null);
      }
      setIsCheckingExistingSolution(false);
    };

    checkExistingSolution();
  }, [user, problemId, isInnovator]);

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

  const extractKeywords = (currentProblem: Problem | null) => {
    if (!currentProblem) return [];

    const stopwords = new Set([
      "the","a","an","and","or","to","for","of","in","on","with","is","are","be","this","that","from","by","at","as","it","its","into","their","they","them","we","our","you","your","about","over","under","out","up","down","across","within","without","but",
    ]);

    const text = [
      currentProblem.title,
      currentProblem.category,
      currentProblem.industry || "",
      (currentProblem.tags || []).join(" "),
      currentProblem.description || "",
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .replace(/[^\w\s]/g, " ");

    const tokens = text
      .split(/\s+/)
      .map((t) => t.trim())
      .filter((t) => t.length >= 3 && !stopwords.has(t));

    const unique = Array.from(new Set(tokens));
    return unique.slice(0, 12);
  };

  const fetchRelatedInnovations = async () => {
    if (!problem) return;

    setRelatedError(null);
    setRelatedLoading(true);

    try {
      // Quick visibility check (helps detect RLS issues in logs)
      supabase
        .from("innovations")
        .select("id,title,tagline,created_at")
        .order("created_at", { ascending: false })
        .limit(5)
        .then(({ data, error }) => {
          if (error) {
            console.error("Innovation visibility check failed:", error);
          } else {
            console.log("Innovation visibility check:", data);
          }
        });

      const keywords = extractKeywords(problem);

      const baseQuery = supabase
        .from("innovations")
        .select("*")
        .eq("status", "published" as any)
        .order("updated_at", { ascending: false })
        .limit(12);

      let query = baseQuery;

      if (keywords.length > 0) {
        const orParts = keywords.flatMap((kw) => [
          `title.ilike.%${kw}%`,
          `tagline.ilike.%${kw}%`,
          `description.ilike.%${kw}%`,
        ]);

        query = query.or(orParts.join(","));
      }

      const { data, error } = await query;

      if (error) throw error;

      setRelatedInnovations((data as Innovation[]) || []);
      setRelatedLoaded(true);
    } catch (error: any) {
      console.error("Error fetching related innovations:", error);
      setRelatedError(error?.message ?? "Could not load related innovations.");
      setRelatedInnovations([]);
      setRelatedLoaded(true);
    } finally {
      setRelatedLoading(false);
    }
  };

  const handleOpenInnovation = (innovation: Innovation) => {
    setSelectedInnovation(innovation);
    setShowInnovationModal(true);
  };

  const handleInnovationModalChange = (open: boolean) => {
    setShowInnovationModal(open);
    if (!open) {
      setSelectedInnovation(null);
    }
  };

  const handleFormSuccess = () => {
    setShowSubmissionForm(false);
    // Refresh the existing solution check
    if (user && problemId && isInnovator) {
      supabase
        .from("solutions")
        .select("id, title, description, approach, estimated_cost, timeline_weeks, technology_stack")
        .eq("problem_id", problemId)
        .eq("innovator_id", user.id)
        .maybeSingle()
        .then(({ data }) => {
          setExistingSolution(data || null);
        });
    }
    // Force page reload to refresh solutions list
    window.location.reload();
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
                          {existingSolution
                            ? "You have already submitted a solution. Click to edit it."
                            : "Ready to submit your solution for this problem?"}
                        </p>
                        <Button 
                          onClick={() => setShowSubmissionForm(true)}
                          disabled={isCheckingExistingSolution}
                        >
                          {existingSolution ? (
                            <>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit Your Solution
                            </>
                          ) : (
                            "Submit Your Solution"
                          )}
                        </Button>
                      </div>
                    ) : user && isInvestor ? (
                      <div className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                          Interested in this opportunity? Propose an investment below.
                        </p>
                        <Button onClick={() => setShowInvestmentForm(true)}>
                          <TrendingUp className="h-4 w-4 mr-2" />
                          Propose Investment
                        </Button>
                      </div>
                    ) : user ? (
                      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                        <p className="text-sm text-muted-foreground">
                          Have a challenge that needs solving? Post your own problem.
                        </p>
                        <Button asChild>
                          <Link to="/dashboard/problems/new">
                            <PlusCircle className="h-4 w-4 mr-2" />
                            Post a Problem
                          </Link>
                        </Button>
                      </div>
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

              <section className="mt-8 space-y-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-xl font-semibold">Discover related innovations</h2>
                    <p className="text-sm text-muted-foreground">
                      Search for innovations that align with this problem&apos;s needs.
                    </p>
                  </div>
                  <Button
                    onClick={fetchRelatedInnovations}
                    disabled={relatedLoading || !problem}
                    className="whitespace-nowrap"
                  >
                    {relatedLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Searching...
                      </>
                    ) : (
                      "Discover related innovations"
                    )}
                  </Button>
                </div>

                {relatedError && <p className="text-sm text-destructive">{relatedError}</p>}

                {relatedLoading && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Array.from({ length: 4 }).map((_, idx) => (
                      <Card key={idx}>
                        <CardContent className="space-y-3 p-6">
                          <div className="h-4 w-24 bg-muted/60 rounded animate-pulse" />
                          <div className="h-5 w-3/4 bg-muted/60 rounded animate-pulse" />
                          <div className="h-16 w-full bg-muted/60 rounded animate-pulse" />
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}

                {relatedLoaded && !relatedLoading && (
                  relatedInnovations.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {relatedInnovations.map((innovation) => (
                        <Card key={innovation.id} className="border-border/60">
                          <CardHeader className="space-y-2">
                            <div className="flex items-center justify-between gap-2">
                              <Badge variant="outline" className="capitalize">
                                {innovation.category}
                              </Badge>
                            </div>
                            <CardTitle className="text-lg">{innovation.title}</CardTitle>
                            <CardDescription className="line-clamp-2">{innovation.tagline}</CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <p className="text-sm text-muted-foreground line-clamp-3">
                              {innovation.description}
                            </p>
                            <div className="flex justify-end">
                              <Button size="sm" variant="outline" onClick={() => handleOpenInnovation(innovation)}>
                                View details
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <Card>
                      <CardContent className="p-6 text-center">
                        <p className="text-sm text-muted-foreground">
                          No related innovations found yet. Add clearer tags or context to improve matches.
                        </p>
                      </CardContent>
                    </Card>
                  )
                )}
              </section>

              {/* Solution Submission Form - Above Solutions List */}
              {showSubmissionForm && problemId && (
                <SolutionSubmissionForm
                  problemId={problemId}
                  existingSolution={existingSolution}
                  onSuccess={handleFormSuccess}
                  onCancel={() => setShowSubmissionForm(false)}
                />
              )}

              {/* Solutions List - Comment Style */}
              {problemId && problem && (
                <SolutionsList
                  problemId={problemId}
                  problemOwnerId={problem.owner_id}
                />
              )}

              {showInvestmentForm && problemId && (
                <InvestmentProposalForm
                  problemId={problemId}
                  budgetMin={problem.budget_min}
                  budgetMax={problem.budget_max}
                  onSuccess={() => {
                    setShowInvestmentForm(false);
                  }}
                  onCancel={() => {
                    setShowInvestmentForm(false);
                  }}
                />
              )}
            </article>
          )}
        </section>
      </main>

      <InnovationDetailModal
        innovation={selectedInnovation}
        open={showInnovationModal}
        onOpenChange={handleInnovationModalChange}
      />

      <Footer />
    </div>
  );
}
