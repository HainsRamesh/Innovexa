import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Search,
  Eye,
  Edit,
  Trash2,
  MoreHorizontal,
  Sparkles,
  Target,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Solution, SolutionStatus } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

const SolutionsPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [solutions, setSolutions] = useState<Solution[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

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

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from('solutions').delete().eq('id', id);

      if (error) throw error;

      setSolutions((prev) => prev.filter((s) => s.id !== id));
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
    }
  };

  const filteredSolutions = solutions.filter((solution) => {
    const matchesSearch =
      solution.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      solution.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || solution.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

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

      {/* Solutions Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto" />
              <p className="text-muted-foreground mt-4">Loading solutions...</p>
            </div>
          ) : filteredSolutions.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Solution</TableHead>
                    <TableHead>Problem</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>AI Score</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSolutions.map((solution) => (
                    <TableRow key={solution.id}>
                      <TableCell>
                        <div className="max-w-xs">
                          <p className="font-medium truncate">{solution.title}</p>
                          <p className="text-sm text-muted-foreground truncate">
                            {solution.description.substring(0, 80)}...
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs">
                          <p className="text-sm truncate">
                            {(solution as any).problems?.title || 'Unknown'}
                          </p>
                          <Badge variant={(solution as any).problems?.category || 'outline'} className="mt-1">
                            {(solution as any).problems?.category || 'N/A'}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadge(solution.status)}>
                          {solution.status.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {solution.ai_match_score ? (
                          <div className="flex items-center gap-1">
                            <Sparkles className="h-4 w-4 text-primary" />
                            <span className="font-medium">{solution.ai_match_score}%</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">--</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {format(new Date(solution.created_at), 'MMM d, yyyy')}
                        </span>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link to={`/dashboard/solutions/${solution.id}`}>
                                <Eye className="h-4 w-4 mr-2" />
                                View
                              </Link>
                            </DropdownMenuItem>
                            {(solution.status === 'draft' || solution.status === 'submitted') && (
                              <DropdownMenuItem asChild>
                                <Link to={`/dashboard/solutions/${solution.id}/edit`}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit
                                </Link>
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => handleDelete(solution.id)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="p-12 text-center">
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
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SolutionsPage;
