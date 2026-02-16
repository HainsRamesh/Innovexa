import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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

const Solutions = () => {
  const { user, role } = useAuth();

  const [approvedSolutions, setApprovedSolutions] = useState<Solution[]>([]);
  const [mySolutions, setMySolutions] = useState<Solution[]>([]);
  const [myProblemSolutions, setMyProblemSolutions] = useState<Solution[]>([]);

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

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, role]);

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
      } else {
        setMyProblemSolutions([]);
      }
    } catch (error) {
      console.error('Error fetching solutions:', error);
    } finally {
      setIsLoading(false);
    }
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
            <Button size="sm" className="mt-2 bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm" onClick={() => handleViewDetails(solution)}>
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

  const renderEnterpriseSolutionsTable = () => {
    if (isLoading) {
      return (
        <Card>
          <CardHeader>
            <CardTitle>Solutions submitted to your problems</CardTitle>
            <CardDescription>Track submissions across the problems your organization owns.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div
                key={idx}
                className="h-12 rounded-md bg-muted/50 animate-pulse"
              />
            ))}
          </CardContent>
        </Card>
      );
    }

    if (filteredMyProblems.length === 0) {
      return (
        <EmptyState
          message={
            searchQuery || categoryFilter !== 'all'
              ? 'Try adjusting your search or filters'
              : 'No solutions have been submitted to your problems yet.'
          }
          showExplore={false}
        />
      );
    }

    return (
      <Card>
        <CardHeader className="px-3 py-4 sm:px-6 sm:py-6">
          <CardTitle className="text-base sm:text-lg">Solutions submitted to your problems</CardTitle>
          <CardDescription className="text-xs sm:text-sm">Review and track submissions for challenges your organization owns.</CardDescription>
        </CardHeader>
        <CardContent className="px-0 sm:px-6 pb-4 sm:pb-6">
          {/* Mobile card layout */}
          <div className="sm:hidden space-y-3 px-3">
            {filteredMyProblems.map((solution) => (
              <div key={solution.id} className="rounded-lg border border-border/60 p-3 space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm leading-snug line-clamp-2">{solution.title}</p>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{solution.description}</p>
                  </div>
                  {getStatusBadge(solution.status)}
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="flex gap-1.5">
                    <span className="text-muted-foreground shrink-0">Problem:</span>
                    <span className="font-medium line-clamp-1">{solution.problems?.title || 'Untitled problem'}</span>
                  </div>
                  <div className="flex gap-1.5">
                    <span className="text-muted-foreground shrink-0">Category:</span>
                    <Badge variant="outline" className="capitalize text-[10px] h-5 px-1.5">
                      {solution.problems?.category || 'general'}
                    </Badge>
                  </div>
                  <div className="flex gap-1.5">
                    <span className="text-muted-foreground shrink-0">By:</span>
                    <span className="font-medium">{solution.author?.full_name || 'Innovator'}</span>
                  </div>
                  <div className="flex gap-1.5">
                    <span className="text-muted-foreground shrink-0">Date:</span>
                    <span>{new Date(solution.created_at).toLocaleDateString()}</span>
                  </div>
                </div>

                <Button size="sm" variant="outline" className="w-full text-xs mt-1" onClick={() => handleViewDetails(solution)}>
                  View Details
                </Button>
              </div>
            ))}
          </div>

          {/* Desktop table layout */}
          <div className="hidden sm:block overflow-x-auto">
            <Table className="text-xs sm:text-sm">
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[160px]">Solution</TableHead>
                  <TableHead className="hidden md:table-cell">Problem</TableHead>
                  <TableHead className="hidden lg:table-cell">Submitted by</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMyProblems.map((solution) => (
                  <TableRow key={solution.id}>
                    <TableCell className="px-4 py-3">
                      <div className="font-semibold text-sm line-clamp-1">{solution.title}</div>
                      <p className="text-xs text-muted-foreground line-clamp-2">{solution.description}</p>
                      <div className="md:hidden mt-1 text-xs text-muted-foreground line-clamp-1">
                        {solution.problems?.title || 'Untitled problem'}
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell px-4">
                      <div className="font-medium text-sm line-clamp-1">{solution.problems?.title || 'Untitled problem'}</div>
                      <Badge variant="outline" className="mt-1 inline-flex capitalize text-xs">
                        {solution.problems?.category || 'general'}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell px-4">
                      <div className="text-sm font-medium">
                        {solution.author?.full_name || 'Innovator'}
                      </div>
                    </TableCell>
                    <TableCell className="px-4">
                      <div className="text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(solution.created_at).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap px-4">{getStatusBadge(solution.status)}</TableCell>
                    <TableCell className="text-right px-4">
                      <Button size="sm" variant="outline" className="text-xs" onClick={() => handleViewDetails(solution)}>
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className="pt-20 sm:pt-24 pb-8 sm:pb-12 px-4">
        <div className="container mx-auto text-center max-w-3xl">
          <Badge variant="secondary" className="mb-3 sm:mb-4 text-[11px] sm:text-xs">
            {isEnterprise ? "My Problems' Solutions" : isInvestor ? 'Investment Opportunities' : 'Accepted Solutions'}
          </Badge>

          <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold mb-3 sm:mb-4 leading-tight tracking-tight text-foreground">
            {isEnterprise
              ? 'Solutions for My Problems'
              : isInvestor
                ? 'Discover Investment Opportunities'
                : 'Innovative Solutions'}
          </h1>

          <p className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
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
              <TabsList className="mb-6 w-full sm:w-2/3 lg:w-2/3 flex h-12 sm:h-11 gap-1 p-1.5 rounded-xl bg-secondary/60 backdrop-blur-sm border border-border/40">
                <TabsTrigger value="approved" className="flex-1 lg:flex-initial text-xs sm:text-sm px-3 sm:px-5 py-2 rounded-lg font-medium transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md">
                  <span className="sm:hidden">Approved ({activeTab === 'approved' ? filteredApproved.length : approvedSolutions.length})</span>
                  <span className="hidden sm:inline">Approved Solutions ({activeTab === 'approved' ? filteredApproved.length : approvedSolutions.length})</span>
                </TabsTrigger>
                <TabsTrigger value="my-solutions" className="flex-1 lg:flex-initial text-xs sm:text-sm px-3 sm:px-5 py-2 rounded-lg font-medium transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md">My Solutions ({activeTab === 'my-solutions' ? filteredMine.length : mySolutions.length})</TabsTrigger>
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
            <div className="space-y-6">
              {renderEnterpriseSolutionsTable()}
            </div>
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
