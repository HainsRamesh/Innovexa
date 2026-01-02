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
} from 'lucide-react';
import { Problem, Solution, Bookmark as BookmarkType } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

const BookmarksPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [bookmarks, setBookmarks] = useState<BookmarkType[]>([]);
  const [problems, setProblems] = useState<Problem[]>([]);
  const [solutions, setSolutions] = useState<Solution[]>([]);
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

      if (problemIds.length > 0) {
        const { data: problemData } = await supabase
          .from('problems')
          .select('*')
          .in('id', problemIds);
        setProblems((problemData as Problem[]) || []);
      }

      if (solutionIds.length > 0) {
        const { data: solutionData } = await supabase
          .from('solutions')
          .select('*, problems(title, category)')
          .in('id', solutionIds);
        setSolutions((solutionData as Solution[]) || []);
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

  const removeBookmark = async (bookmarkId: string) => {
    try {
      const { error } = await supabase.from('bookmarks').delete().eq('id', bookmarkId);

      if (error) throw error;

      setBookmarks((prev) => prev.filter((b) => b.id !== bookmarkId));
      toast({
        title: 'Bookmark removed',
        description: 'Item removed from your bookmarks',
      });
    } catch (error) {
      console.error('Error removing bookmark:', error);
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

  const bookmarkedProblems = problems.filter((p) =>
    bookmarks.some((b) => b.problem_id === p.id)
  );

  const bookmarkedSolutions = solutions.filter((s) =>
    bookmarks.some((b) => b.solution_id === s.id)
  );

  const getBookmarkId = (problemId?: string, solutionId?: string) => {
    const bookmark = bookmarks.find(
      (b) =>
        (problemId && b.problem_id === problemId) ||
        (solutionId && b.solution_id === solutionId)
    );
    return bookmark?.id;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Bookmarks</h1>
        <p className="text-muted-foreground">Your saved problems and solutions</p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="problems" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="problems" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Problems ({bookmarkedProblems.length})
          </TabsTrigger>
          <TabsTrigger value="solutions" className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Solutions ({bookmarkedSolutions.length})
          </TabsTrigger>
        </TabsList>

        {/* Bookmarked Problems */}
        <TabsContent value="problems" className="mt-6">
          {isLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardContent className="p-5">
                    <div className="space-y-4 animate-pulse">
                      <div className="h-5 bg-secondary rounded w-3/4" />
                      <div className="h-3 bg-secondary rounded" />
                      <div className="h-3 bg-secondary rounded w-5/6" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : bookmarkedProblems.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {bookmarkedProblems.map((problem) => (
                <Card key={problem.id} className="group hover:border-primary/50 transition-all">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <Badge variant={problem.category as any}>{problem.category}</Badge>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link to={`/dashboard/browse/${problem.id}`}>
                              <Eye className="h-4 w-4 mr-2" />
                              View
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              const id = getBookmarkId(problem.id);
                              if (id) removeBookmark(id);
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

                    {formatBudget(problem.budget_min, problem.budget_max) && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                        <DollarSign className="h-4 w-4" />
                        <span>{formatBudget(problem.budget_min, problem.budget_max)}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-3 border-t border-border/50">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="h-3.5 w-3.5" />
                        {format(new Date(problem.created_at), 'MMM d, yyyy')}
                      </div>
                      <Button variant="ghost" size="sm" asChild>
                        <Link to={`/dashboard/browse/${problem.id}`}>View Details</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
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

        {/* Bookmarked Solutions */}
        <TabsContent value="solutions" className="mt-6">
          {isLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardContent className="p-5">
                    <div className="space-y-4 animate-pulse">
                      <div className="h-5 bg-secondary rounded w-3/4" />
                      <div className="h-3 bg-secondary rounded" />
                      <div className="h-3 bg-secondary rounded w-5/6" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : bookmarkedSolutions.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {bookmarkedSolutions.map((solution) => (
                <Card key={solution.id} className="group hover:border-primary/50 transition-all">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <Badge
                        variant={
                          solution.status === 'accepted'
                            ? 'status_matched'
                            : solution.status === 'rejected'
                            ? 'destructive'
                            : 'outline'
                        }
                      >
                        {solution.status}
                      </Badge>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link to={`/dashboard/solutions/${solution.id}`}>
                              <Eye className="h-4 w-4 mr-2" />
                              View
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              const id = getBookmarkId(undefined, solution.id);
                              if (id) removeBookmark(id);
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
                      <Button variant="ghost" size="sm" asChild>
                        <Link to={`/dashboard/solutions/${solution.id}`}>View Details</Link>
                      </Button>
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
      </Tabs>
    </div>
  );
};

export default BookmarksPage;
