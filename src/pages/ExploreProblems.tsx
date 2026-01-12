import { useEffect, useState, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ProblemFeedItem } from '@/components/explore/ProblemFeedItem';
import { Search, Plus, Loader2, Target } from 'lucide-react';
import { Problem } from '@/types';

const PROBLEMS_PER_PAGE = 10;

interface ProblemWithCounts extends Problem {
  like_count?: number;
  solutions_count?: number;
}

const ExploreProblems = () => {
  const { user, role } = useAuth();
  const navigate = useNavigate();
  
  const [problems, setProblems] = useState<ProblemWithCounts[]>([]);
  const [profiles, setProfiles] = useState<Record<string, { full_name: string | null; avatar_url: string | null }>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  
  const isEnterprise = role === 'enterprise';
  const isInnovator = role === 'innovator';
  const canPostProblems = isEnterprise || isInnovator;

  const fetchProblems = useCallback(async (reset = false) => {
    if (reset) {
      setIsLoading(true);
      setProblems([]);
    } else {
      setIsLoadingMore(true);
    }

    try {
      let query = supabase
        .from('problems')
        .select('*, like_count, solutions_count')
        .eq('status', 'open')
        .order('created_at', { ascending: false });

      if (categoryFilter !== 'all') {
        query = query.eq('category', categoryFilter as any);
      }

      if (searchQuery) {
        query = query.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
      }

      const offset = reset ? 0 : problems.length;
      query = query.range(offset, offset + PROBLEMS_PER_PAGE - 1);

      const { data, error } = await query;

      if (error) throw error;

      const newProblems = (data as ProblemWithCounts[]) || [];
      setHasMore(newProblems.length === PROBLEMS_PER_PAGE);

      if (reset) {
        setProblems(newProblems);
      } else {
        setProblems(prev => [...prev, ...newProblems]);
      }

      // Fetch profiles for new problems
      const ownerIds = [...new Set(newProblems.map(p => p.owner_id))];
      if (ownerIds.length > 0) {
        const { data: profilesData } = await supabase
          .from('public_profiles')
          .select('id, full_name, avatar_url')
          .in('id', ownerIds);

        if (profilesData) {
          const profileMap = profilesData.reduce((acc, profile) => {
            acc[profile.id] = { full_name: profile.full_name, avatar_url: profile.avatar_url };
            return acc;
          }, {} as Record<string, { full_name: string | null; avatar_url: string | null }>);
          
          setProfiles(prev => ({ ...prev, ...profileMap }));
        }
      }
    } catch (error) {
      console.error('Error fetching problems:', error);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [categoryFilter, searchQuery, problems.length]);

  // Initial fetch and filter changes
  useEffect(() => {
    fetchProblems(true);
  }, [categoryFilter, searchQuery]);

  // Infinite scroll observer
  useEffect(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading && !isLoadingMore) {
          fetchProblems(false);
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [hasMore, isLoading, isLoadingMore, fetchProblems]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Filters - Sticky directly below navbar */}
      <div className="sticky top-16 z-30 bg-background border-b border-border">
        <div className="container mx-auto px-4 max-w-3xl py-4">
          <div className="flex flex-col sm:flex-row gap-4">
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
              <SelectTrigger className="w-full sm:w-48">
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
            {canPostProblems && (
              <Button asChild>
                <Link to="/problems/new">
                  <Plus className="h-4 w-4 mr-2" />
                  Post
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>

      <main className="pt-8 pb-16">
        <div className="container mx-auto px-4 max-w-3xl">
          {/* Header */}
          <div className="text-center mb-8">
            <Badge variant="outline" className="mb-4">
              <Target className="h-3 w-3 mr-1.5" />
              Problem Feed
            </Badge>
            <h1 className="text-3xl font-bold mb-2">
              Explore Problems
            </h1>
            <p className="text-muted-foreground">
              Discover challenges and submit your innovative solutions
            </p>
          </div>
          {/* Problems Feed */}
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : problems.length > 0 ? (
            <div className="space-y-4">
              {problems.map((problem) => (
                <ProblemFeedItem
                  key={problem.id}
                  problem={problem}
                  ownerProfile={profiles[problem.owner_id]}
                />
              ))}
              
              {/* Load More Trigger */}
              <div ref={loadMoreRef} className="py-4 flex justify-center">
                {isLoadingMore && (
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                )}
                {!hasMore && problems.length > 0 && (
                  <p className="text-muted-foreground text-sm">No more problems to load</p>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-16">
              <Target className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No problems found</h3>
              <p className="text-muted-foreground mb-6">
                {searchQuery || categoryFilter !== 'all'
                  ? 'Try adjusting your search or filters'
                  : 'Check back later for new challenges'}
              </p>
              {(searchQuery || categoryFilter !== 'all') && (
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
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ExploreProblems;
