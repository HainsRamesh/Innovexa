import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, Calendar, DollarSign, ArrowRight, Target, Sparkles } from 'lucide-react';
import { Problem } from '@/types';
import { format } from 'date-fns';

const Explore = () => {
  const { user, role } = useAuth();
  const [allProblems, setAllProblems] = useState<Problem[]>([]);
  const [myProblems, setMyProblems] = useState<Problem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('all');

  const isEnterprise = role === 'enterprise';

  useEffect(() => {
    fetchProblems();
  }, [user, role]);

  const fetchProblems = async () => {
    setIsLoading(true);
    try {
      // Fetch all open problems
      const { data, error } = await supabase
        .from('problems')
        .select('*')
        .eq('status', 'open')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAllProblems((data as Problem[]) || []);

      // Fetch enterprise's own problems
      if (user && isEnterprise) {
        const { data: myData, error: myError } = await supabase
          .from('problems')
          .select('*')
          .eq('owner_id', user.id)
          .order('created_at', { ascending: false });

        if (myError) throw myError;
        setMyProblems((myData as Problem[]) || []);
      }
    } catch (error) {
      console.error('Error fetching problems:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterProblems = (problems: Problem[]) => {
    return problems.filter((problem) => {
      const matchesSearch =
        problem.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        problem.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || problem.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  };

  const filteredAllProblems = filterProblems(allProblems);
  const filteredMyProblems = filterProblems(myProblems);

  const formatBudget = (min: number | null, max: number | null) => {
    if (!min && !max) return 'Open budget';
    if (min && max) return `$${min.toLocaleString()} - $${max.toLocaleString()}`;
    if (max) return `Up to $${max.toLocaleString()}`;
    return `From $${min?.toLocaleString()}`;
  };

  const ProblemCard = ({ problem }: { problem: Problem }) => (
    <Card key={problem.id} variant="interactive" className="group">
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <Badge variant={problem.category as any}>{problem.category}</Badge>
          {problem.ai_complexity_score && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Sparkles className="h-3 w-3 text-primary" />
              AI Score: {problem.ai_complexity_score}
            </div>
          )}
        </div>

        <h3 className="font-semibold text-lg mb-2 line-clamp-2 group-hover:text-primary transition-colors">
          {problem.title}
        </h3>

        <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
          {problem.description}
        </p>

        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <span>{formatBudget(problem.budget_min, problem.budget_max)}</span>
          </div>
          {problem.deadline && (
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>Due {format(new Date(problem.deadline), 'MMM d, yyyy')}</span>
            </div>
          )}
        </div>

        {problem.tags && problem.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {problem.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
            {problem.tags.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{problem.tags.length - 3}
              </Badge>
            )}
          </div>
        )}

        <div className="flex items-center justify-between pt-4 border-t border-border/50">
          <span className="text-xs text-muted-foreground">
            {format(new Date(problem.created_at), 'MMM d, yyyy')}
          </span>
          <Button variant="ghost" size="sm" asChild>
            <Link to={`/explore/${problem.id}`}>
              View Details
              <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderProblemsGrid = (problems: Problem[]) => (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {problems.map((problem) => (
        <ProblemCard key={problem.id} problem={problem} />
      ))}
    </div>
  );

  const LoadingState = () => (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <Card key={i}>
          <CardContent className="p-6">
            <div className="space-y-4 animate-pulse">
              <div className="h-4 bg-secondary rounded w-3/4" />
              <div className="h-3 bg-secondary rounded w-1/4" />
              <div className="space-y-2">
                <div className="h-3 bg-secondary rounded" />
                <div className="h-3 bg-secondary rounded w-5/6" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const EmptyState = ({ showClearFilters = false }: { showClearFilters?: boolean }) => (
    <Card>
      <CardContent className="p-12 text-center">
        <Target className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
        <h3 className="text-lg font-medium mb-2">No problems found</h3>
        <p className="text-muted-foreground mb-6">
          {searchQuery || categoryFilter !== 'all'
            ? 'Try adjusting your search or filters'
            : 'Check back later for new challenges'}
        </p>
        {showClearFilters && (searchQuery || categoryFilter !== 'all') && (
          <Button
            variant="outline"
            onClick={() => {
              setSearchQuery('');
              setCategoryFilter('all');
            }}
          >
            Clear Filters
          </Button>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-4">
              <Target className="h-3 w-3 mr-1.5" />
              Open Challenges
            </Badge>
            <h1 className="text-3xl lg:text-4xl font-bold mb-4">
              Explore Real-World Problems
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Discover challenges from organizations worldwide. Find problems that match your expertise
              and submit innovative solutions.
            </p>
          </div>

          {/* Filters */}
          <Card className="mb-8">
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search problems..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="technology">Technology</SelectItem>
                    <SelectItem value="healthcare">Healthcare</SelectItem>
                    <SelectItem value="sustainability">Sustainability</SelectItem>
                    <SelectItem value="finance">Finance</SelectItem>
                    <SelectItem value="education">Education</SelectItem>
                    <SelectItem value="infrastructure">Infrastructure</SelectItem>
                    <SelectItem value="manufacturing">Manufacturing</SelectItem>
                    <SelectItem value="agriculture">Agriculture</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Results Count */}
          <div className="mb-6">
            <p className="text-sm text-muted-foreground">
              {(activeTab === 'all' ? filteredAllProblems : filteredMyProblems).length} problem
              {(activeTab === 'all' ? filteredAllProblems : filteredMyProblems).length !== 1 ? 's' : ''} found
            </p>
          </div>

          {/* Problems Content - Tabs for Enterprise, Grid for others */}
          {isEnterprise ? (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="mb-6">
                <TabsTrigger value="all">All Problems</TabsTrigger>
                <TabsTrigger value="my-problems">My Problems ({myProblems.length})</TabsTrigger>
              </TabsList>
              
              <TabsContent value="all">
                {isLoading ? (
                  <LoadingState />
                ) : filteredAllProblems.length > 0 ? (
                  renderProblemsGrid(filteredAllProblems)
                ) : (
                  <EmptyState showClearFilters />
                )}
              </TabsContent>
              
              <TabsContent value="my-problems">
                {isLoading ? (
                  <LoadingState />
                ) : filteredMyProblems.length > 0 ? (
                  renderProblemsGrid(filteredMyProblems)
                ) : (
                  <Card>
                    <CardContent className="p-12 text-center">
                      <Target className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">No problems posted yet</h3>
                      <p className="text-muted-foreground mb-6">
                        {searchQuery || categoryFilter !== 'all'
                          ? 'Try adjusting your search or filters'
                          : 'Start by posting your first problem to get innovative solutions'}
                      </p>
                      <Button asChild>
                        <Link to="/dashboard/problems/new">Post a Problem</Link>
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          ) : (
            // Non-enterprise users see all problems
            <>
              {isLoading ? (
                <LoadingState />
              ) : filteredAllProblems.length > 0 ? (
                renderProblemsGrid(filteredAllProblems)
              ) : (
                <EmptyState showClearFilters />
              )}
            </>
          )}

          {/* CTA */}
          <div className="mt-16 text-center">
            <Card variant="highlight" className="max-w-2xl mx-auto">
              <CardContent className="p-8">
                <h2 className="text-2xl font-bold mb-2">Have a Problem to Solve?</h2>
                <p className="text-muted-foreground mb-6">
                  Post your challenge and connect with innovative solutions from around the world.
                </p>
                <Button variant="hero" size="lg" asChild>
                  <Link to="/auth?mode=signup">Get Started</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Explore;