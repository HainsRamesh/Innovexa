import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Lightbulb, Search, Calendar, DollarSign, Clock, ArrowRight } from 'lucide-react';
import { Tables } from '@/integrations/supabase/types';

type Solution = Tables<'solutions'> & {
  problems?: { title: string; category: string } | null;
};

const Solutions = () => {
  const [solutions, setSolutions] = useState<Solution[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  useEffect(() => {
    fetchSolutions();
  }, []);

  const fetchSolutions = async () => {
    try {
      const { data, error } = await supabase
        .from('solutions')
        .select(`
          *,
          problems:problem_id (title, category)
        `)
        .eq('status', 'accepted')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSolutions(data || []);
    } catch (error) {
      console.error('Error fetching solutions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredSolutions = solutions.filter((solution) => {
    const matchesSearch =
      solution.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      solution.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      categoryFilter === 'all' || solution.problems?.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

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

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className="pt-24 pb-12 px-4">
        <div className="container mx-auto text-center">
          <Badge variant="secondary" className="mb-4">
            Accepted Solutions
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Innovative <span className="text-gradient">Solutions</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Discover accepted solutions from innovators tackling real-world challenges
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

      {/* Solutions Grid */}
      <section className="pb-20 px-4">
        <div className="container mx-auto">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
            </div>
          ) : filteredSolutions.length === 0 ? (
            <div className="text-center py-12">
              <Lightbulb className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Solutions Found</h3>
              <p className="text-muted-foreground mb-6">
                {searchQuery || categoryFilter !== 'all'
                  ? 'Try adjusting your search or filters'
                  : 'Be the first to submit an innovative solution!'}
              </p>
              <Button asChild>
                <Link to="/explore">Explore Problems</Link>
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredSolutions.map((solution) => (
                <Card key={solution.id} className="group hover:shadow-lg transition-all duration-300 border-border/50 hover:border-primary/30">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <Badge variant="outline" className="mb-2 capitalize">
                          {solution.problems?.category || 'General'}
                        </Badge>
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
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
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

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-border/50 bg-muted/30">
        <div className="container mx-auto text-center text-sm text-muted-foreground">
          <p>© 2024 INNOVEXA. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Solutions;
