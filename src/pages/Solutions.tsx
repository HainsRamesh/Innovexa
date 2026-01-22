import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Lightbulb, Search, DollarSign, Clock, CheckCircle, Eye } from 'lucide-react';
import { Tables } from '@/integrations/supabase/types';
import { SolutionDetailDialog } from '@/components/solutions/SolutionDetailDialog';
import { InnovexaSolutionsGridSkeleton } from '@/components/ui/InnovexaSkeleton';
import { UserProfileLink } from '@/components/user/UserProfileLink';

type AuthorProfile = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
};

type Solution = Tables<'solutions'> & {
  problems?: { title: string; category: string } | null;
  author?: AuthorProfile | null;
};

type RecommendationMatch = {
  id: string;
  innovationId: string;
  title: string;
  tagline: string;
  category: string;
  score: number;
  reasons: string[];
};

type ProblemRecommendation = {
  problemId: string;
  problemTitle: string;
  problemCategory: string;
  lastUpdated: string;
  matches: RecommendationMatch[];
};

const Solutions = () => {
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [approvedSolutions, setApprovedSolutions] = useState<Solution[]>([]);
  const [mySolutions, setMySolutions] = useState<Solution[]>([]);
  const [myProblemSolutions, setMyProblemSolutions] = useState<Solution[]>([]);

  const [recommendedMatches, setRecommendedMatches] = useState<ProblemRecommendation[]>([]);
  const [recommendationsLoading, setRecommendationsLoading] = useState(false);
  const [refreshingRecommendations, setRefreshingRecommendations] = useState(false);
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<string | null>(null);
  const [expandedProblems, setExpandedProblems] = useState<Record<string, boolean>>({});
  const [rateLimitSeconds, setRateLimitSeconds] = useState<number | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('approved');
  const [selectedSolution, setSelectedSolution] = useState<Solution | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);

  const isInnovator = role === 'innovator';
  const isEnterprise = role === 'enterprise';
  const isInvestor = role === 'investor';

  useEffect(() => {
    fetchSolutions();

    if (user && isEnterprise) {
      fetchRecommendations();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, role]);

  useEffect(() => {
    if (rateLimitSeconds === null) return;
    const timer = setInterval(() => {
      setRateLimitSeconds((prev) => {
        if (prev === null) return null;
        return prev > 1 ? prev - 1 : null;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [rateLimitSeconds]);

  const fetchSolutions = async () => {
    setIsLoading(true);

    try {
      // Helper function to attach author profiles to solutions
      const attachAuthorProfiles = async (
        solutions: Tables<'solutions'>[],
      ): Promise<Solution[]> => {
        if (!solutions || solutions.length === 0) return [];

        const innovatorIds = [...new Set(solutions.map((s) => s.innovator_id))];
        const { data: profiles } = await supabase
          .from('public_profiles')
          .select('id, full_name, avatar_url')
          .in('id', innovatorIds);

        const profileMap = new Map<string, AuthorProfile>();
        (profiles || []).forEach((p) => profileMap.set(p.id, p));

        return solutions.map((s) => ({
          ...s,
          author: profileMap.get(s.innovator_id) || null,
        }));
      };

      // Fetch all approved public solutions (for investors and general users)
      const { data: approved, error: approvedError } = await supabase
        .from('solutions')
        .select(
          `
          *,
          problems:problem_id (title, category)
        `,
        )
        .eq('status', 'accepted')
        .eq('visibility', 'public')
        .order('created_at', { ascending: false });

      if (approvedError) throw approvedError;

      const approvedWithAuthors = await attachAuthorProfiles(approved || []);
      setApprovedSolutions(approvedWithAuthors);

      // Fetch user's own solutions if they are an innovator
      if (user && isInnovator) {
        const { data: mine, error: mineError } = await supabase
          .from('solutions')
          .select(
            `
            *,
            problems:problem_id (title, category)
          `,
          )
          .eq('innovator_id', user.id)
          .order('created_at', { ascending: false });

        if (mineError) throw mineError;

        const mineWithAuthors = await attachAuthorProfiles(mine || []);
        setMySolutions(mineWithAuthors);
      }

      // Fetch solutions submitted to enterprise's problems (all relevant statuses)
      if (user && isEnterprise) {
        // First get the user's problems
        const { data: myProblems, error: problemsError } = await supabase
          .from('problems')
          .select('id')
          .eq('owner_id', user.id);

        if (problemsError) throw problemsError;

        const problemIds = (myProblems || []).map((p) => p.id);

        if (problemIds.length > 0) {
          const { data: mineForProblems, error: mineForProblemsError } = await supabase
            .from('solutions')
            .select(
              `
              *,
              problems:problem_id (title, category)
            `,
            )
            .in('problem_id', problemIds)
            .in('status', ['submitted', 'under_review', 'shortlisted', 'accepted'])
            .order('created_at', { ascending: false });

          if (mineForProblemsError) throw mineForProblemsError;

          const mineForProblemsWithAuthors = await attachAuthorProfiles(mineForProblems || []);
          setMyProblemSolutions(mineForProblemsWithAuthors);
        } else {
          setMyProblemSolutions([]);
        }
      }
    } catch (error) {
      console.error('Error fetching solutions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRecommendations = async () => {
    if (!user || !isEnterprise) return;

    setRecommendationsLoading(true);
    setRefreshError(null);

    try {
      const [{ data, error }, { data: refreshState }] = await Promise.all([
        supabase
          .from('problem_innovation_matches')
          .select(
            `
            id,
            problem_id,
            innovation_id,
            score_total,
            reasons,
            updated_at,
            created_at,
            problems:problem_id (title, category),
            innovations:innovation_id (title, tagline, category)
          `,
          )
          .eq('org_id', user.id)
          .order('score_total', { ascending: false }),
        supabase
          .from('problem_match_refresh_state')
          .select('last_refreshed_at')
          .eq('org_id', user.id)
          .maybeSingle(),
      ]);

      if (error) throw error;

      const grouped = new Map<string, ProblemRecommendation>();

      (data || []).forEach((row: any) => {
        const problemId = row.problem_id as string;

        if (!grouped.has(problemId)) {
          grouped.set(problemId, {
            problemId,
            problemTitle: row.problems?.title ?? 'Untitled problem',
            problemCategory: row.problems?.category ?? 'other',
            lastUpdated: row.updated_at ?? row.created_at,
            matches: [],
          });
        }

        const reasons = Array.isArray(row.reasons)
          ? row.reasons.filter((r: any) => typeof r === 'string')
          : [];

        const rec = grouped.get(problemId)!;

        rec.matches.push({
          id: row.id,
          innovationId: row.innovation_id,
          title: row.innovations?.title ?? 'Innovation',
          tagline: row.innovations?.tagline ?? '',
          category: row.innovations?.category ?? 'other',
          score: row.score_total ?? 0,
          reasons: reasons.slice(0, 3) as string[],
        });

        if (row.updated_at && row.updated_at > rec.lastUpdated) {
          rec.lastUpdated = row.updated_at;
        }
      });

      const ordered = Array.from(grouped.values())
        .map((rec) => ({
          ...rec,
          matches: rec.matches.sort((a, b) => b.score - a.score),
        }))
        .sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime());

      setRecommendedMatches(ordered);
      setLastRefreshedAt(refreshState?.last_refreshed_at ?? null);
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      setRecommendedMatches([]);
    } finally {
      setRecommendationsLoading(false);
    }
  };

  const refreshRecommendations = async () => {
    if (!user || !isEnterprise) return;

    setRefreshingRecommendations(true);
    setRefreshError(null);

    try {
      const { data: s } = await supabase.auth.getSession();
      const accessToken = s.session?.access_token;
      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      console.log("Invoking generate-problem-innovation-matches", {
        hasSession: !!s.session,
        hasToken: !!accessToken,
        hasAnonKey: !!anonKey,
      });

      if (!accessToken) {
        setRefreshError('Missing session token. Please sign in again.');
        return;
      }

      const { data, error } = await supabase.functions.invoke(
        'generate-problem-innovation-matches',
        {
          body: { refresh_org: true },
          headers: {
            Authorization: `Bearer ${accessToken}`,
            apikey: anonKey,
          },
        },
      );

      if (error) {
        const response = (error as any)?.context?.response as Response | undefined;
        let retryAfterSeconds: number | null = null;
        if (response) {
          if (response.status === 429) {
            const headerRetry = Number(response.headers.get('retry-after'));
            if (Number.isFinite(headerRetry)) {
              retryAfterSeconds = headerRetry;
            }
            try {
              const body = await response.clone().json();
              if (typeof body?.retry_after_seconds === 'number') {
                retryAfterSeconds = body.retry_after_seconds;
              }
              if (body?.error) {
                setRefreshError(body.error);
              }
            } catch {
              // ignore JSON parse issues
            }
          }
        }

        if (response?.status === 429) {
          setRateLimitSeconds(retryAfterSeconds ?? 120);
          setRefreshError(
            retryAfterSeconds
              ? `Refresh is limited. Try again in ${retryAfterSeconds}s.`
              : 'Refresh is rate limited. Please try again shortly.',
          );
          return;
        }

        throw error;
      }

      setLastRefreshedAt((data as any)?.last_refreshed_at ?? new Date().toISOString());
      setRateLimitSeconds(null);
      await fetchRecommendations();
    } catch (err: any) {
      setRefreshError(err?.message ?? 'Failed to refresh recommendations');
    } finally {
      setRefreshingRecommendations(false);
    }
  };

  const toggleExpanded = (problemId: string) => {
    setExpandedProblems((prev) => ({ ...prev, [problemId]: !prev[problemId] }));
  };

  const formatRefreshTime = (timestamp: string | null) => {
    if (!timestamp) return 'Not refreshed yet';
    return new Date(timestamp).toLocaleString();
  };

  const filterSolutions = (solutions: Solution[]) => {
    return solutions.filter((solution) => {
      const matchesSearch =
        solution.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        solution.description.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory =
        categoryFilter === 'all' || solution.problems?.category === categoryFilter;

      return matchesSearch && matchesCategory;
    });
  };

  const filteredApproved = filterSolutions(approvedSolutions);
  const filteredMine = filterSolutions(mySolutions);
  const filteredMyProblems = filterSolutions(myProblemSolutions);

  const categories = [
    'technology',
    'healthcare',
    'sustainability',
    'finance',
    'education',
    'infrastructure',
    'manufacturing',
    'agriculture',
    'other',
  ];

  const formatCurrency = (amount: number | null) => {
    if (!amount) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'accepted':
        return (
          <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
            <CheckCircle className="h-3 w-3 mr-1" />
            Approved
          </Badge>
        );
      case 'submitted':
        return <Badge variant="secondary">Submitted</Badge>;
      case 'under_review':
        return <Badge variant="outline">Under Review</Badge>;
      case 'shortlisted':
        return (
          <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20">
            Shortlisted
          </Badge>
        );
      case 'draft':
        return (
          <Badge variant="outline" className="text-muted-foreground">
            Draft
          </Badge>
        );
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleViewDetails = (solution: Solution) => {
    setSelectedSolution(solution);
    setShowDetailDialog(true);
  };

  const handleViewInnovation = (innovationId: string) => {
    navigate(`/dashboard/innovations/${innovationId}`, {
      state: { returnTo: location.pathname + location.search },
    });
  };

  const SolutionCard = ({
    solution,
    showViewButton = false,
  }: {
    solution: Solution;
    showViewButton?: boolean;
  }) => (
    <Card className="group hover:shadow-lg transition-all duration-300 border-border/50 hover:border-primary/30">
      <CardHeader className="space-y-3">
        {/* Author Mini Profile - LinkedIn style */}
        <div className="flex items-center gap-3">
          <UserProfileLink
            userId={solution.innovator_id}
            fullName={solution.author?.full_name || null}
            avatarUrl={solution.author?.avatar_url || null}
            showName={true}
            avatarSize="sm"
            nameClassName="text-sm font-semibold line-clamp-1"
          />
          <span className="text-xs text-muted-foreground">
            ·{' '}
            {new Date(solution.created_at).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </span>
        </div>

        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="capitalize">
                {solution.problems?.category || 'General'}
              </Badge>
              {getStatusBadge(solution.status)}
            </div>
            <CardTitle className="text-lg line-clamp-2 group-hover:text-primary transition-colors">
              {solution.title}
            </CardTitle>
          </div>
          {solution.ai_match_score && (
            <Badge variant="secondary" className="shrink-0">
              {solution.ai_match_score}% Match
            </Badge>
          )}
        </div>

        <CardDescription className="line-clamp-2">{solution.description}</CardDescription>
      </CardHeader>

      <CardContent>
        <div className="space-y-3">
          {solution.problems?.title && (
            <div className="text-sm">
              <span className="text-muted-foreground">For: </span>
              <span className="font-medium">{solution.problems.title}</span>
            </div>
          )}

          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            {solution.estimated_cost && (
              <div className="flex items-center gap-1">
                <DollarSign className="h-4 w-4" />
                <span>{formatCurrency(solution.estimated_cost)}</span>
              </div>
            )}
            {solution.timeline_weeks && (
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>{solution.timeline_weeks} weeks</span>
              </div>
            )}
          </div>

          {solution.technology_stack && solution.technology_stack.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {solution.technology_stack.slice(0, 3).map((tech) => (
                <Badge key={tech} variant="outline" className="text-xs">
                  {tech}
                </Badge>
              ))}
              {solution.technology_stack.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{solution.technology_stack.length - 3}
                </Badge>
              )}
            </div>
          )}

          {showViewButton && (
            <Button variant="outline" size="sm" className="mt-2" onClick={() => handleViewDetails(solution)}>
              <Eye className="h-4 w-4 mr-1" />
              View Details
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );

  const EmptyState = ({ message, showExplore = true }: { message: string; showExplore?: boolean }) => (
    <div className="text-center py-12">
      <Lightbulb className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
      <h3 className="text-lg font-semibold mb-2">No Solutions Found</h3>
      <p className="text-muted-foreground mb-6">{message}</p>
      {showExplore && (
        <Button asChild>
          <Link to="/explore">Explore Problems</Link>
        </Button>
      )}
    </div>
  );

  const renderSolutionsGrid = (solutions: Solution[], showViewButton = false) => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {solutions.map((solution) => (
        <SolutionCard key={solution.id} solution={solution} showViewButton={showViewButton} />
      ))}
    </div>
  );

  const renderRecommendations = () => {
    if (recommendationsLoading) {
      return <InnovexaSolutionsGridSkeleton cards={3} />;
    }

    if (recommendedMatches.length === 0) {
      return (
        <EmptyState
          message="No cached recommendations yet. Refresh to generate matches for your problems."
          showExplore={false}
        />
      );
    }

    return (
      <div className="space-y-4">
        {recommendedMatches.map((rec) => {
          const matchesToShow = expandedProblems[rec.problemId] ? rec.matches : rec.matches.slice(0, 5);

          return (
            <Card key={rec.problemId} className="border-border/60 shadow-sm">
              <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className="capitalize">
                      {rec.problemCategory}
                    </Badge>
                    <Badge variant="secondary">Problem</Badge>
                  </div>
                  <CardTitle className="text-lg">{rec.problemTitle}</CardTitle>
                  <CardDescription>Updated {new Date(rec.lastUpdated).toLocaleString()}</CardDescription>
                </div>

                {rec.matches.length > 5 && (
                  <Button variant="ghost" size="sm" onClick={() => toggleExpanded(rec.problemId)}>
                    {expandedProblems[rec.problemId] ? 'Show top 5' : 'View all'}
                  </Button>
                )}
              </CardHeader>

              <CardContent className="space-y-4">
                {matchesToShow.map((match) => (
                  <div key={match.id} className="p-4 rounded-lg border border-border/60 bg-muted/30">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">{Math.round(match.score)} pts</Badge>
                          <Badge variant="outline" className="capitalize">
                            {match.category}
                          </Badge>
                        </div>

                        <div>
                          <h4 className="text-base font-semibold leading-tight">{match.title}</h4>
                          <p className="text-sm text-muted-foreground line-clamp-2">{match.tagline}</p>
                        </div>

                        <ul className="text-xs text-muted-foreground list-disc ml-5 space-y-1">
                          {match.reasons.slice(0, 3).map((reason, idx) => (
                            <li key={idx}>{reason}</li>
                          ))}
                        </ul>
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewInnovation(match.innovationId)}
                      >
                        View
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className="pt-24 pb-12 px-4">
        <div className="container mx-auto text-center">
          <Badge variant="secondary" className="mb-4">
            {isEnterprise ? "My Problems' Solutions" : isInvestor ? 'Investment Opportunities' : 'Accepted Solutions'}
          </Badge>

          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            {isEnterprise ? (
              <>
                Solutions for <span className="text-gradient">My Problems</span>
              </>
            ) : isInvestor ? (
              <>
                Discover <span className="text-gradient">Investment Opportunities</span>
              </>
            ) : (
              <>
                Innovative <span className="text-gradient">Solutions</span>
              </>
            )}
          </h1>

          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {isEnterprise
              ? 'Review solutions submitted to your posted problems'
              : isInvestor
                ? 'Browse approved solutions from innovators solving real-world challenges'
                : 'Discover accepted solutions from innovators tackling real-world challenges'}
          </p>
        </div>
      </section>

      {/* Filters */}
      <section className="pb-8 px-4">
        <div className="container mx-auto">
          <div className="flex flex-col sm:flex-row gap-4 max-w-2xl mx-auto">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search solutions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      {/* Solutions Content */}
      <section className="pb-20 px-4">
        <div className="container mx-auto">
          {isInnovator ? (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="mb-6">
                <TabsTrigger value="approved">Approved Solutions</TabsTrigger>
                <TabsTrigger value="my-solutions">My Solutions ({mySolutions.length})</TabsTrigger>
              </TabsList>

              <TabsContent value="approved">
                {isLoading ? (
                  <InnovexaSolutionsGridSkeleton cards={6} />
                ) : filteredApproved.length === 0 ? (
                  <EmptyState
                    message={
                      searchQuery || categoryFilter !== 'all'
                        ? 'Try adjusting your search or filters'
                        : 'No approved solutions yet. Be the first to get your solution approved!'
                    }
                  />
                ) : (
                  renderSolutionsGrid(filteredApproved, true)
                )}
              </TabsContent>

              <TabsContent value="my-solutions">
                {isLoading ? (
                  <InnovexaSolutionsGridSkeleton cards={6} />
                ) : filteredMine.length === 0 ? (
                  <EmptyState
                    message={
                      searchQuery || categoryFilter !== 'all'
                        ? 'Try adjusting your search or filters'
                        : "You haven't submitted any solutions yet."
                    }
                  />
                ) : (
                  renderSolutionsGrid(filteredMine, true)
                )}
              </TabsContent>
            </Tabs>
          ) : isEnterprise ? (
            <>
              <section className="mb-12 space-y-4">
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h2 className="text-2xl font-semibold">Recommended Innovations matched to your problems</h2>
                    <p className="text-sm text-muted-foreground">
                      Cached matches are refreshed via vector search + heuristics. Last refreshed: {formatRefreshTime(lastRefreshedAt)}
                    </p>
                    {refreshError && <p className="text-sm text-destructive mt-1">{refreshError}</p>}
                  </div>

                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={refreshRecommendations}
                      disabled={
                        refreshingRecommendations || recommendationsLoading || rateLimitSeconds !== null
                      }
                    >
                      {refreshingRecommendations
                        ? 'Refreshing...'
                        : rateLimitSeconds
                          ? `Try again in ${rateLimitSeconds}s`
                          : 'Refresh recommendations'}
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={fetchRecommendations}
                      disabled={recommendationsLoading || refreshingRecommendations}
                    >
                      Reload
                    </Button>
                  </div>
                </div>

                {renderRecommendations()}
              </section>

              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-semibold">Solutions submitted to your problems</h2>
                </div>

                {isLoading ? (
                  <InnovexaSolutionsGridSkeleton cards={6} />
                ) : filteredMyProblems.length === 0 ? (
                  <EmptyState
                    message={
                      searchQuery || categoryFilter !== 'all'
                        ? 'Try adjusting your search or filters'
                        : 'No solutions submitted for your problems yet.'
                    }
                    showExplore={false}
                  />
                ) : (
                  renderSolutionsGrid(filteredMyProblems, true)
                )}
              </section>
            </>
          ) : isInvestor ? (
            <>
              {isLoading ? (
                <InnovexaSolutionsGridSkeleton cards={6} />
              ) : filteredApproved.length === 0 ? (
                <EmptyState
                  message={
                    searchQuery || categoryFilter !== 'all'
                      ? 'Try adjusting your search or filters'
                      : 'No approved solutions available yet.'
                  }
                  showExplore={false}
                />
              ) : (
                renderSolutionsGrid(filteredApproved, true)
              )}
            </>
          ) : (
            <>
              {isLoading ? (
                <InnovexaSolutionsGridSkeleton cards={6} />
              ) : filteredApproved.length === 0 ? (
                <EmptyState
                  message={
                    searchQuery || categoryFilter !== 'all'
                      ? 'Try adjusting your search or filters'
                      : 'Be the first to submit an innovative solution!'
                  }
                />
              ) : (
                renderSolutionsGrid(filteredApproved, true)
              )}
            </>
          )}
        </div>
      </section>

      <Footer />

      <SolutionDetailDialog
        solution={selectedSolution}
        open={showDetailDialog}
        onOpenChange={setShowDetailDialog}
      />
    </div>
  );
};

export default Solutions;
