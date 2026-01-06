import { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Search, Sparkles, Target, Lightbulb, MoreVertical, Eye, Edit, Trash2, Play, Heart, Calendar, Plus } from 'lucide-react';
import { Solution, Innovation } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { SolutionCard } from '@/components/dashboard/SolutionCard';
import { ConfirmationModal } from '@/components/dashboard/ConfirmationModal';
import { useBookmarks } from '@/hooks/useBookmarks';
import { getCategoryColor, getCategoryLabel } from '@/lib/categoryColors';
import { format } from 'date-fns';

const InnovatorSolutionsPage = () => {
  const { user, role } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [solutions, setSolutions] = useState<Solution[]>([]);
  const [innovations, setInnovations] = useState<Innovation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; type: 'solution' | 'innovation' } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { isBookmarked, toggleBookmark } = useBookmarks();

  const activeTab = searchParams.get('tab') || 'solutions';

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch solutions
      const { data: solutionsData, error: solutionsError } = await supabase
        .from('solutions')
        .select('*, problems(title, category)')
        .eq('innovator_id', user!.id)
        .order('created_at', { ascending: false });

      if (solutionsError) throw solutionsError;
      setSolutions((solutionsData as Solution[]) || []);

      // Fetch innovations if innovator
      if (role === 'innovator' || role === 'admin') {
        const { data: innovationsData, error: innovationsError } = await supabase
          .from('innovations')
          .select('*')
          .eq('innovator_id', user!.id)
          .order('created_at', { ascending: false });

        if (innovationsError) throw innovationsError;
        setInnovations((innovationsData as Innovation[]) || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load data',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteClick = (id: string, type: 'solution' | 'innovation') => {
    setDeleteTarget({ id, type });
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;

    setIsDeleting(true);
    try {
      if (deleteTarget.type === 'solution') {
        const { error } = await supabase.from('solutions').delete().eq('id', deleteTarget.id);
        if (error) throw error;
        setSolutions((prev) => prev.filter((s) => s.id !== deleteTarget.id));
        toast({
          title: 'Solution deleted',
          description: 'The solution has been removed.',
        });
      } else {
        const { error } = await supabase.from('innovations').delete().eq('id', deleteTarget.id);
        if (error) throw error;
        setInnovations((prev) => prev.filter((i) => i.id !== deleteTarget.id));
        toast({
          title: 'Innovation deleted',
          description: 'The innovation has been removed.',
        });
      }
    } catch (error) {
      console.error('Error deleting:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete',
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

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value });
  };

  const filteredSolutions = solutions.filter((solution) => {
    const matchesSearch =
      solution.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      solution.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || solution.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredInnovations = innovations.filter((innovation) => {
    const matchesSearch =
      innovation.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      innovation.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || innovation.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const InnovationCard = ({ innovation }: { innovation: Innovation }) => (
    <Card className="group hover:border-primary/50 transition-all duration-200 overflow-hidden">
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
              <DropdownMenuItem onClick={() => navigate(`/dashboard/innovations/${innovation.id}`, { state: { from: 'innovations-tab' } })}>
                <Eye className="h-4 w-4 mr-2" />
                View
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate(`/dashboard/innovations/${innovation.id}/edit`, { state: { from: 'innovations-tab' } })}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => handleDeleteClick(innovation.id, 'innovation')}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
          {innovation.tagline}
        </p>

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
            variant={innovation.status === 'published' ? 'status_open' : innovation.status === 'draft' ? 'outline' : 'secondary'}
          >
            {innovation.status.charAt(0).toUpperCase() + innovation.status.slice(1)}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">My Work</h1>
          <p className="text-muted-foreground">Manage your innovations and solutions</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link to="/dashboard/browse">
              <Target className="h-4 w-4 mr-2" />
              Browse Problems
            </Link>
          </Button>
          <Button variant="hero" asChild>
            <Link to="/innovations/new">
              <Plus className="h-4 w-4 mr-2" />
              New Innovation
            </Link>
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full max-w-lg grid-cols-2 mb-6">
          <TabsTrigger value="innovations" className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4" />
            Innovations ({innovations.length})
          </TabsTrigger>
          <TabsTrigger value="solutions" className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            My Solutions ({solutions.length})
          </TabsTrigger>
        </TabsList>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={activeTab === 'innovations' ? 'Search innovations...' : 'Search solutions...'}
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
                  {activeTab === 'innovations' ? (
                    <>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                      <SelectItem value="featured">Featured</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </>
                  ) : (
                    <>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="submitted">Submitted</SelectItem>
                      <SelectItem value="under_review">Under Review</SelectItem>
                      <SelectItem value="shortlisted">Shortlisted</SelectItem>
                      <SelectItem value="accepted">Accepted</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Innovations Tab */}
        <TabsContent value="innovations" className="mt-0">
          {isLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i}>
                  <div className="aspect-video bg-secondary animate-pulse" />
                  <CardContent className="p-5">
                    <div className="space-y-4 animate-pulse">
                      <div className="h-5 bg-secondary rounded w-3/4" />
                      <div className="h-3 bg-secondary rounded w-full" />
                      <div className="h-3 bg-secondary rounded w-5/6" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredInnovations.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredInnovations.map((innovation) => (
                <InnovationCard key={innovation.id} innovation={innovation} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <Lightbulb className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No innovations found</h3>
                <p className="text-muted-foreground mb-6">
                  {searchQuery || statusFilter !== 'all'
                    ? 'Try adjusting your filters'
                    : "Start by creating your first innovation"}
                </p>
                {!searchQuery && statusFilter === 'all' && (
                  <Button variant="hero" asChild>
                    <Link to="/innovations/new">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Innovation
                    </Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Solutions Tab */}
        <TabsContent value="solutions" className="mt-0">
          {/* Results Count */}
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-muted-foreground">
              {filteredSolutions.length} solution{filteredSolutions.length !== 1 ? 's' : ''} found
            </p>
          </div>

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
                  onDelete={(id) => handleDeleteClick(id, 'solution')}
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
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title={`Delete ${deleteTarget?.type === 'innovation' ? 'Innovation' : 'Solution'}`}
        description={`Are you sure you want to delete this ${deleteTarget?.type}? This action cannot be undone.`}
        confirmLabel="Yes, Delete"
        onConfirm={handleConfirmDelete}
        isLoading={isDeleting}
        variant="destructive"
      />
    </div>
  );
};

export default InnovatorSolutionsPage;
