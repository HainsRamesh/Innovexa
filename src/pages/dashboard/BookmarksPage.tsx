import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Bookmark,
  BookmarkX,
  Eye,
  MoreVertical,
  FileText,
  Sparkles,
  Calendar,
  DollarSign,
  Lightbulb,
  Play,
  Heart,
} from 'lucide-react';
import { Problem, Solution, Innovation, Bookmark as BookmarkType, SolutionStatus, ProblemStatus } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { getCategoryColor, getCategoryLabel } from '@/lib/categoryColors';

const BookmarksPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [bookmarks, setBookmarks] = useState<BookmarkType[]>([]);
  const [problems, setProblems] = useState<Problem[]>([]);
  const [solutions, setSolutions] = useState<Solution[]>([]);
  const [innovations, setInnovations] = useState<Innovation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchBookmarks();
    }
  }, [user]);

  const fetchBookmarks = async () => {
    setIsLoading(true);
    try {
      const { data: bookmarkData, error: bookmarkError } = await supabase
        .from('bookmarks')
        .select('*')
        .eq('user_id', user!.id);

      if (bookmarkError) throw bookmarkError;
      setBookmarks((bookmarkData as BookmarkType[]) || []);

      const problemIds = bookmarkData?.filter((b) => b.problem_id).map((b) => b.problem_id) || [];
      const solutionIds = bookmarkData?.filter((b) => b.solution_id).map((b) => b.solution_id) || [];
      const innovationIds = bookmarkData?.filter((b) => b.innovation_id).map((b) => b.innovation_id) || [];

      // Fetch problems
      if (problemIds.length > 0) {
        const { data: problemData } = await supabase
          .from('problems')
          .select('*')
          .in('id', problemIds);
        setProblems((problemData as Problem[]) || []);
      } else {
        setProblems([]);
      }

      // Fetch solutions
      if (solutionIds.length > 0) {
        const { data: solutionData } = await supabase
          .from('solutions')
          .select('*, problems(title, category)')
          .in('id', solutionIds);
        setSolutions((solutionData as Solution[]) || []);
      } else {
        setSolutions([]);
      }

      // Fetch innovations
      if (innovationIds.length > 0) {
        const { data: innovationData } = await supabase
          .from('innovations')
          .select('*')
          .in('id', innovationIds);
        setInnovations((innovationData as Innovation[]) || []);
      } else {
        setInnovations([]);
      }
    } catch (error) {
      console.error('Error fetching bookmarks:', error);
      toast({
        title: 'Error',
        description: 'Failed to load bookmarks',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const removeBookmark = async (bookmarkId: string, itemType: 'problem' | 'solution' | 'innovation', itemId: string) => {
    // Optimistic update
    setBookmarks((prev) => prev.filter((b) => b.id !== bookmarkId));
    if (itemType === 'problem') {
      setProblems((prev) => prev.filter((p) => p.id !== itemId));
    } else if (itemType === 'solution') {
      setSolutions((prev) => prev.filter((s) => s.id !== itemId));
    } else {
      setInnovations((prev) => prev.filter((i) => i.id !== itemId));
    }

    try {
      const { error } = await supabase.from('bookmarks').delete().eq('id', bookmarkId);

      if (error) throw error;

      toast({
        title: 'Bookmark removed',
        description: 'Item removed from your bookmarks',
      });
    } catch (error) {
      // Revert on error
      console.error('Error removing bookmark:', error);
      fetchBookmarks();
      toast({
        title: 'Error',
        description: 'Failed to remove bookmark',
        variant: 'destructive',
      });
    }
  };

  const formatBudget = (min: number | null, max: number | null) => {
    if (!min && !max) return null;
    if (min && max) return `$${min.toLocaleString()} - $${max.toLocaleString()}`;
    if (max) return `Up to $${max.toLocaleString()}`;
    return `From $${min?.toLocaleString()}`;
  };

  const getStatusBadge = (status: SolutionStatus) => {
    const variants: Record<SolutionStatus, string> = {
      draft: 'outline',
      submitted: 'secondary',
      under_review: 'status_in_review',
      shortlisted: 'status_open',
      accepted: 'status_matched',
      rejected: 'destructive',
    };
    return variants[status] as any;
  };

  const getStatusLabel = (status: SolutionStatus) => {
    const labels: Record<SolutionStatus, string> = {
      draft: 'Draft',
      submitted: 'Submitted',
      under_review: 'Under Review',
      shortlisted: 'Shortlisted',
      accepted: 'Accepted',
      rejected: 'Rejected',
    };
    return labels[status];
  };

  const getProblemStatusBadge = (status: ProblemStatus) => {
    const variants: Record<ProblemStatus, 'status_open' | 'status_in_review' | 'status_matched' | 'status_closed' | 'outline'> = {
      draft: 'outline',
      open: 'status_open',
      in_review: 'status_in_review',
      matched: 'status_matched',
      closed: 'status_closed',
    };
    return variants[status];
  };

  const getProblemStatusLabel = (status: ProblemStatus) => {
    const labels: Record<ProblemStatus, string> = {
      draft: 'Draft',
      open: 'Open',
      in_review: 'In Review',
      matched: 'Matched',
      closed: 'Closed',
    };
    return labels[status];
  };

  const bookmarkedProblems = problems.filter((p) =>
    bookmarks.some((b) => b.problem_id === p.id)
  );

  const bookmarkedSolutions = solutions.filter((s) =>
    bookmarks.some((b) => b.solution_id === s.id)
  );

  const bookmarkedInnovations = innovations.filter((i) =>
    bookmarks.some((b) => b.innovation_id === i.id)
  );

  const getBookmarkId = (problemId?: string, solutionId?: string, innovationId?: string) => {
    const bookmark = bookmarks.find(
      (b) =>
        (problemId && b.problem_id === problemId) ||
        (solutionId && b.solution_id === solutionId) ||
        (innovationId && b.innovation_id === innovationId)
    );
    return bookmark?.id;
  };

  const SkeletonCard = () => (
    <Card>
      <CardContent className="p-5">
        <div className="space-y-4 animate-pulse">
          <div className="flex gap-2">
            <div className="h-5 bg-secondary rounded w-1/4" />
            <div className="h-5 bg-secondary rounded w-1/4" />
          </div>
          <div className="h-5 bg-secondary rounded w-3/4" />
          <div className="space-y-2">
            <div className="h-3 bg-secondary rounded" />
            <div className="h-3 bg-secondary rounded w-5/6" />
          </div>
          <div className="h-8 bg-secondary rounded w-full" />
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Bookmarks</h1>
        <p className="text-muted-foreground">Your saved innovations, solutions, and problems</p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="innovations" className="w-full">
        <TabsList className="grid w-full max-w-2xl grid-cols-3 mb-6">
          <TabsTrigger value="innovations" className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4" />
            <span className="hidden sm:inline">Innovations</span> ({bookmarkedInnovations.length})
          </TabsTrigger>
          <TabsTrigger value="solutions" className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            <span className="hidden sm:inline">Solutions</span> ({bookmarkedSolutions.length})
          </TabsTrigger>
          <TabsTrigger value="problems" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Problems</span> ({bookmarkedProblems.length})
          </TabsTrigger>
        </TabsList>

        {/* Bookmarked Innovations */}
        <TabsContent value="innovations" className="mt-0">
          {isLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
            </div>
          ) : bookmarkedInnovations.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {bookmarkedInnovations.map((innovation) => (
                <Card key={innovation.id} className="group hover:border-primary/50 transition-all duration-200 overflow-hidden">
                  <div className="aspect-video relative overflow-hidden bg-muted">
                    <img
                      src={innovation.cover_image_url}
                      alt={innovation.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
                    <Badge
                      variant="outline"
                      className={`absolute top-3 left-3 ${getCategoryColor(innovation.category, 'innovation')}`}
                    >
                      {getCategoryLabel(innovation.category, 'innovation')}
                    </Badge>
                  </div>
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <h3 className="font-semibold text-lg line-clamp-1 group-hover:text-primary transition-colors">
                        {innovation.title}
                      </h3>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 -mt-1 -mr-2 shrink-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link to={`/dashboard/innovations/${innovation.id}`} state={{ from: 'bookmarks' }}>
                              <Eye className="h-4 w-4 mr-2" />
                              View
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              const id = getBookmarkId(undefined, undefined, innovation.id);
                              if (id) removeBookmark(id, 'innovation', innovation.id);
                            }}
                          >
                            <BookmarkX className="h-4 w-4 mr-2" />
                            Remove Bookmark
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{innovation.tagline}</p>

                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                      <div className="flex items-center gap-1">
                        <Play className="h-4 w-4" />
                        <span>{innovation.view_count || 0}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Heart className="h-4 w-4" />
                        <span>{innovation.like_count || 0}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-border/50">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="h-3.5 w-3.5" />
                        {format(new Date(innovation.created_at), 'MMM d, yyyy')}
                      </div>
                      <Badge
                        variant={
                          innovation.status === 'published'
                            ? 'status_open'
                            : innovation.status === 'draft'
                            ? 'outline'
                            : 'secondary'
                        }
                      >
                        {innovation.status.charAt(0).toUpperCase() + innovation.status.slice(1)}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <Bookmark className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No bookmarked innovations</h3>
                <p className="text-muted-foreground mb-6">
                  Bookmark innovations you find interesting to save them here
                </p>
                <Button variant="hero" asChild>
                  <Link to="/dashboard/innovations">Browse Innovations</Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Bookmarked Solutions */}
        <TabsContent value="solutions" className="mt-0">
          {isLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
            </div>
          ) : bookmarkedSolutions.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {bookmarkedSolutions.map((solution) => (
                <Card key={solution.id} className="group hover:border-primary/50 transition-all duration-200">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <Badge variant={getStatusBadge(solution.status)}>
                        {getStatusLabel(solution.status)}
                      </Badge>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 -mt-1 -mr-2">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link to={`/dashboard/solutions/${solution.id}`} state={{ from: 'bookmarks' }}>
                              <Eye className="h-4 w-4 mr-2" />
                              View
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              const id = getBookmarkId(undefined, solution.id);
                              if (id) removeBookmark(id, 'solution', solution.id);
                            }}
                          >
                            <BookmarkX className="h-4 w-4 mr-2" />
                            Remove Bookmark
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <h3 className="font-semibold text-lg mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                      {solution.title}
                    </h3>

                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {solution.description}
                    </p>

                    {(solution as any).problems && (
                      <div className="flex items-center gap-2 mb-4 p-2 rounded-lg bg-secondary/50">
                        <span className="text-xs text-muted-foreground">For:</span>
                        <span className="text-sm font-medium truncate">
                          {(solution as any).problems.title}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-3 border-t border-border/50">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="h-3.5 w-3.5" />
                        {format(new Date(solution.created_at), 'MMM d, yyyy')}
                      </div>
                      {solution.ai_match_score && (
                        <div className="flex items-center gap-1 text-xs">
                          <Sparkles className="h-3.5 w-3.5 text-primary" />
                          <span className="font-medium">{solution.ai_match_score}%</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <Bookmark className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No bookmarked solutions</h3>
                <p className="text-muted-foreground">
                  Bookmark solutions you find interesting to save them here
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Bookmarked Problems */}
        <TabsContent value="problems" className="mt-0">
          {isLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
            </div>
          ) : bookmarkedProblems.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {bookmarkedProblems.map((problem) => {
                const budget = formatBudget(problem.budget_min, problem.budget_max);
                return (
                  <Card key={problem.id} className="group hover:border-primary/50 transition-all duration-200">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant={problem.category as any}>{problem.category}</Badge>
                          <Badge variant={getProblemStatusBadge(problem.status)}>
                            {getProblemStatusLabel(problem.status)}
                          </Badge>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 -mt-1 -mr-2">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link to={`/dashboard/browse/${problem.id}`} state={{ from: 'bookmarks' }}>
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                const id = getBookmarkId(problem.id);
                                if (id) removeBookmark(id, 'problem', problem.id);
                              }}
                            >
                              <BookmarkX className="h-4 w-4 mr-2" />
                              Remove Bookmark
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      <h3 className="font-semibold text-lg mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                        {problem.title}
                      </h3>

                      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                        {problem.description}
                      </p>

                      {budget && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                          <DollarSign className="h-4 w-4" />
                          <span>{budget}</span>
                        </div>
                      )}

                      {problem.tags && problem.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
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

                      <div className="flex items-center justify-between pt-3 border-t border-border/50">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Calendar className="h-3.5 w-3.5" />
                          {format(new Date(problem.created_at), 'MMM d, yyyy')}
                        </div>
                        <Button variant="ghost" size="sm" asChild>
                          <Link to={`/dashboard/browse/${problem.id}`} state={{ from: 'bookmarks' }}>View Details</Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <Bookmark className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No bookmarked problems</h3>
                <p className="text-muted-foreground mb-6">
                  Browse problems and bookmark the ones you're interested in
                </p>
                <Button variant="hero" asChild>
                  <Link to="/dashboard/browse">Browse Problems</Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BookmarksPage;
