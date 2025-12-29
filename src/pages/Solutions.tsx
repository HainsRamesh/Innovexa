import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useGlobalLoading } from '@/contexts/LoadingContext';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Lightbulb, Search, Calendar, DollarSign, Clock, ArrowRight, CheckCircle, Eye } from 'lucide-react';
import { Tables } from '@/integrations/supabase/types';
import { SolutionDetailDialog } from '@/components/solutions/SolutionDetailDialog';

type Solution = Tables<'solutions'> & {
  problems?: { title: string; category: string } | null;
};

const Solutions = () => {
  const { user, role } = useAuth();
  const { startLoading, stopLoading } = useGlobalLoading();
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

  useEffect(() => {
    fetchSolutions();
  }, [user, role]);

  const fetchSolutions = async () => {
    setIsLoading(true);
    startLoading("Loading solutions…");
    try {
      // Fetch all approved solutions
      const { data: approved, error: approvedError } = await supabase
        .from('solutions')
        .select(`
          *,
          problems:problem_id (title, category)
        `)
        .eq('status', 'accepted')
        .order('created_at', { ascending: false });

      if (approvedError) throw approvedError;
      setApprovedSolutions(approved || []);

      // Fetch user's own solutions if they are an innovator
      if (user && isInnovator) {
        const { data: mine, error: mineError } = await supabase
          .from('solutions')
          .select(`
            *,
            problems:problem_id (title, category)
          `)
          .eq('innovator_id', user.id)
          .order('created_at', { ascending: false });

        if (mineError) throw mineError;
        setMySolutions(mine || []);
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
            .select(`
              *,
              problems:problem_id (title, category)
            `)
            .in('problem_id', problemIds)
            .in('status', ['submitted', 'under_review', 'shortlisted', 'accepted'])
            .order('created_at', { ascending: false });

          if (mineForProblemsError) throw mineForProblemsError;
          setMyProblemSolutions(mineForProblems || []);
        } else {
          setMyProblemSolutions([]);
        }
      }
    } catch (error) {
      console.error('Error fetching solutions:', error);
    } finally {
      setIsLoading(false);
      stopLoading();
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
        return <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20">Shortlisted</Badge>;
      case 'draft':
        return <Badge variant="outline" className="text-muted-foreground">Draft</Badge>;
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

  const SolutionCard = ({ solution, showViewButton = false }: { solution: Solution; showViewButton?: boolean }) => (
    <Card className="group hover:shadow-lg transition-all duration-300 border-border/50 hover:border-primary/30">
      <CardHeader>
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
        <CardDescription className="line-clamp-2">
          {solution.description}
        </CardDescription>
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
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>{new Date(solution.created_at).toLocaleDateString()}</span>
            </div>
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
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => handleViewDetails(solution)}
            >
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

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className="pt-24 pb-12 px-4">
        <div className="container mx-auto text-center">
          <Badge variant="secondary" className="mb-4">
            {isEnterprise ? "My Problems' Solutions" : 'Accepted Solutions'}
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            {isEnterprise ? (
              <>
                Solutions for <span className="text-gradient">My Problems</span>
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
                  <div className="flex justify-center py-12">
                    <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
                  </div>
                ) : filteredApproved.length === 0 ? (
                  <EmptyState 
                    message={searchQuery || categoryFilter !== 'all' 
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
                  <div className="flex justify-center py-12">
                    <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
                  </div>
                ) : filteredMine.length === 0 ? (
                  <EmptyState 
                    message={searchQuery || categoryFilter !== 'all' 
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
              {isLoading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
                </div>
              ) : filteredMyProblems.length === 0 ? (
                <EmptyState
                  message={
                    searchQuery || categoryFilter !== 'all'
                      ? 'Try adjusting your search or filters'
                      : "No solutions submitted for your problems yet."
                  }
                  showExplore={false}
                />
              ) : (
                renderSolutionsGrid(filteredMyProblems, true)
              )}
            </>
          ) : (
            // Non-innovators and non-enterprise only see approved solutions
            <>
              {isLoading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
                </div>
              ) : filteredApproved.length === 0 ? (
                <EmptyState 
                  message={searchQuery || categoryFilter !== 'all'
                    ? 'Try adjusting your search or filters'
                    : 'Be the first to submit an innovative solution!'}
                />
              ) : (
                renderSolutionsGrid(filteredApproved, true)
              )}
            </>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 border-t border-border/50">
        <div className="container mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            Have an Innovative Solution?
          </h2>
          <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
            Join our community of innovators and submit your solutions to real-world challenges
          </p>
          <Button size="lg" asChild>
            <Link to="/auth?mode=signup">
              Get Started <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      <Footer />

      {/* Solution Detail Dialog */}
      <SolutionDetailDialog
        solution={selectedSolution}
        open={showDetailDialog}
        onOpenChange={setShowDetailDialog}
      />
    </div>
  );
};

export default Solutions;