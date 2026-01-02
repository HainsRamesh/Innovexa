import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, Sparkles, Target } from 'lucide-react';
import { Solution } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { SolutionCard } from '@/components/dashboard/SolutionCard';
import { ConfirmationModal } from '@/components/dashboard/ConfirmationModal';
import { useBookmarks } from '@/hooks/useBookmarks';

const SolutionsPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [solutions, setSolutions] = useState<Solution[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { isBookmarked, toggleBookmark } = useBookmarks();

  useEffect(() => {
    if (user) {
      fetchSolutions();
    }
  }, [user]);

  const fetchSolutions = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('solutions')
        .select('*, problems(title, category)')
        .eq('innovator_id', user!.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSolutions((data as Solution[]) || []);
    } catch (error) {
      console.error('Error fetching solutions:', error);
      toast({
        title: 'Error',
        description: 'Failed to load solutions',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteClick = (id: string) => {
    setDeleteTarget(id);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;

    setIsDeleting(true);
    try {
      const { error } = await supabase.from('solutions').delete().eq('id', deleteTarget);

      if (error) throw error;

      setSolutions((prev) => prev.filter((s) => s.id !== deleteTarget));
      toast({
        title: 'Solution deleted',
        description: 'The solution has been removed.',
      });
    } catch (error) {
      console.error('Error deleting solution:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete solution',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
  };

  const handleToggleBookmark = (solutionId: string) => {
    toggleBookmark(undefined, solutionId);
  };

  const filteredSolutions = solutions.filter((solution) => {
    const matchesSearch =
      solution.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      solution.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || solution.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">My Solutions</h1>
          <p className="text-muted-foreground">Track your submitted solutions and their status</p>
        </div>
        <Button variant="hero" asChild>
          <Link to="/dashboard/browse">
            <Target className="h-4 w-4 mr-2" />
            Find Problems to Solve
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search solutions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="submitted">Submitted</SelectItem>
                <SelectItem value="under_review">Under Review</SelectItem>
                <SelectItem value="shortlisted">Shortlisted</SelectItem>
                <SelectItem value="accepted">Accepted</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {filteredSolutions.length} solution{filteredSolutions.length !== 1 ? 's' : ''} found
        </p>
      </div>

      {/* Solutions Grid */}
      {isLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i}>
              <CardContent className="p-5">
                <div className="space-y-4 animate-pulse">
                  <div className="h-5 bg-secondary rounded w-1/4" />
                  <div className="h-5 bg-secondary rounded w-3/4" />
                  <div className="space-y-2">
                    <div className="h-3 bg-secondary rounded" />
                    <div className="h-3 bg-secondary rounded w-5/6" />
                  </div>
                  <div className="h-10 bg-secondary rounded" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredSolutions.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSolutions.map((solution) => (
            <SolutionCard
              key={solution.id}
              solution={solution as any}
              onDelete={handleDeleteClick}
              isBookmarked={isBookmarked(undefined, solution.id)}
              onToggleBookmark={handleToggleBookmark}
            />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <Sparkles className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No solutions found</h3>
            <p className="text-muted-foreground mb-6">
              {searchQuery || statusFilter !== 'all'
                ? 'Try adjusting your filters'
                : "Start by finding a problem to solve"}
            </p>
            {!searchQuery && statusFilter === 'all' && (
              <Button variant="hero" asChild>
                <Link to="/dashboard/browse">
                  <Target className="h-4 w-4 mr-2" />
                  Browse Problems
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete Solution"
        description="Are you sure you want to delete this solution? This action cannot be undone."
        confirmLabel="Yes, Delete"
        onConfirm={handleConfirmDelete}
        isLoading={isDeleting}
        variant="destructive"
      />
    </div>
  );
};

export default SolutionsPage;
