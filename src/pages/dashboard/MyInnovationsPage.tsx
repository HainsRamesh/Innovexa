import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
import { Button } from '@/components/ui/button';
import { Search, Lightbulb, MoreVertical, Eye, Edit, Trash2, Play, Sparkles, Calendar, Bookmark, BookmarkCheck } from 'lucide-react';
import { Innovation } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { ConfirmationModal } from '@/components/dashboard/ConfirmationModal';
import { getCategoryColor, getCategoryLabel } from '@/lib/categoryColors';
import { format } from 'date-fns';
import { useBookmarks } from '@/hooks/useBookmarks';

const MyInnovationsPage = () => {
  const { user, role } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { isBookmarked, toggleBookmark } = useBookmarks();

  const [innovations, setInnovations] = useState<Innovation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (user) {
      fetchInnovations();
    }
  }, [user]);

  const fetchInnovations = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('innovations')
        .select('*')
        .eq('innovator_id', user!.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInnovations((data as Innovation[]) || []);
    } catch (error) {
      console.error('Error fetching innovations:', error);
      toast({
        title: 'Error',
        description: 'Failed to load innovations',
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
      const { error } = await supabase.from('innovations').delete().eq('id', deleteTarget);
      if (error) throw error;
      setInnovations((prev) => prev.filter((i) => i.id !== deleteTarget));
      toast({
        title: 'Innovation deleted',
        description: 'The innovation has been removed.',
      });
    } catch (error) {
      console.error('Error deleting innovation:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete innovation',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
  };

  const handleToggleBookmark = (innovationId: string) => {
    toggleBookmark(undefined, undefined, innovationId);
  };

  const filteredInnovations = innovations.filter((innovation) => {
    const matchesSearch =
      innovation.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      innovation.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || innovation.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || innovation.category === categoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const InnovationCard = ({ innovation }: { innovation: Innovation }) => {
    const bookmarked = isBookmarked(undefined, undefined, innovation.id);
    
    return (
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
            <div className="flex items-center gap-1 shrink-0">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => handleToggleBookmark(innovation.id)}
              >
                {bookmarked ? (
                  <BookmarkCheck className="h-4 w-4 text-primary" />
                ) : (
                  <Bookmark className="h-4 w-4" />
                )}
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() =>
                      navigate(`/dashboard/innovations/${innovation.id}`, {
                        state: { from: 'my-innovations' },
                      })
                    }
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() =>
                      navigate(`/dashboard/innovations/${innovation.id}/edit`, {
                        state: { from: 'my-innovations' },
                      })
                    }
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleDeleteClick(innovation.id)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{innovation.tagline}</p>

          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
            <div className="flex items-center gap-1">
              <Play className="h-4 w-4" />
              <span>{innovation.view_count || 0}</span>
            </div>
            <div className="flex items-center gap-1">
              <Sparkles className="h-4 w-4" />
              <span>{innovation.interest_count || 0}</span>
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
                  : 'outline'
              }
            >
              {innovation.status === 'published' ? 'Published' : 'Draft'}
            </Badge>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">My Innovations</h1>
        <p className="text-muted-foreground">Manage your innovations portfolio</p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search innovations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="ai">AI & ML</SelectItem>
                <SelectItem value="healthtech">HealthTech</SelectItem>
                <SelectItem value="fintech">FinTech</SelectItem>
                <SelectItem value="climatetech">ClimateTech</SelectItem>
                <SelectItem value="edtech">EdTech</SelectItem>
                <SelectItem value="saas">SaaS</SelectItem>
                <SelectItem value="hardware">Hardware</SelectItem>
                <SelectItem value="web3">Web3</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-36">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {filteredInnovations.length} innovation{filteredInnovations.length !== 1 ? 's' : ''} found
        </p>
      </div>

      {/* Innovations Grid */}
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
            <p className="text-muted-foreground">
              {searchQuery || statusFilter !== 'all' || categoryFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'Start by creating your first innovation from the Innovations page'}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete Innovation"
        description="Are you sure you want to delete this innovation? This action cannot be undone."
        confirmLabel="Yes, Delete"
        onConfirm={handleConfirmDelete}
        isLoading={isDeleting}
        variant="destructive"
      />
    </div>
  );
};

export default MyInnovationsPage;
