import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Eye, Edit, Trash2, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { Problem, ProblemStatus } from '@/types';

interface EnterpriseProblemsTableProps {
  problems: Problem[];
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onViewAll?: () => void;
  showViewAll?: boolean;
  limit?: number;
}

const getStatusBadge = (status: ProblemStatus) => {
  const styles: Record<ProblemStatus, string> = {
    open: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    in_review: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    matched: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    closed: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
    draft: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
  };
  return styles[status] || styles.draft;
};

const formatBudget = (min: number | null, max: number | null): string => {
  if (!min && !max) return 'N/A';
  if (min && max) return `$${min.toLocaleString()} - $${max.toLocaleString()}`;
  if (max) return `Up to $${max.toLocaleString()}`;
  return `From $${min?.toLocaleString()}`;
};

export const EnterpriseProblemsTable = ({
  problems,
  onView,
  onEdit,
  onDelete,
  onViewAll,
  showViewAll = false,
  limit,
}: EnterpriseProblemsTableProps) => {
  // Apply limit if specified
  const displayedProblems = limit ? problems.slice(0, limit) : problems;

  return (
    <Card className="bg-card/50 border-border/50">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            My Problems
          </CardTitle>
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="text-xs">
              {problems.length} Problems
            </Badge>
            {showViewAll && onViewAll && problems.length > (limit || 0) && (
              <Button
                variant="outline"
                size="sm"
                onClick={onViewAll}
                className="text-xs h-7"
              >
                View All
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border border-border/50 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-muted/30">
                <TableHead className="text-muted-foreground font-semibold w-12">S.No</TableHead>
                <TableHead className="text-muted-foreground font-semibold">Problem Title</TableHead>
                <TableHead className="text-muted-foreground font-semibold">Category</TableHead>
                <TableHead className="text-muted-foreground font-semibold text-center">Budget</TableHead>
                <TableHead className="text-muted-foreground font-semibold text-center">Status</TableHead>
                <TableHead className="text-muted-foreground font-semibold">Date Posted</TableHead>
                <TableHead className="text-muted-foreground font-semibold text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayedProblems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No problems posted yet
                  </TableCell>
                </TableRow>
              ) : (
                displayedProblems.map((problem, index) => (
                  <TableRow
                    key={problem.id}
                    className="hover:bg-muted/20 transition-colors border-border/30"
                  >
                    <TableCell className="text-muted-foreground font-mono text-sm">
                      {String(index + 1).padStart(2, '0')}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                          <FileText className="h-4 w-4 text-primary" />
                        </div>
                        <span className="font-medium truncate max-w-[200px]">{problem.title}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="capitalize">
                        {problem.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center text-sm">
                      {formatBudget(problem.budget_min, problem.budget_max)}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className={getStatusBadge(problem.status)}>
                        {problem.status.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {format(new Date(problem.created_at), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          <DropdownMenuItem onClick={() => onView(problem.id)}>
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onEdit(problem.id)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => onDelete(problem.id)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
