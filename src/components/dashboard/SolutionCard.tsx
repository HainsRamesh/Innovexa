import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Eye, Edit, Trash2, MoreVertical, Sparkles, Calendar } from 'lucide-react';
import { Solution, SolutionStatus } from '@/types';
import { format } from 'date-fns';

interface SolutionCardProps {
  solution: Solution & { problems?: { title: string; category: string } };
  onDelete: (id: string) => void;
}

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

export const SolutionCard = ({ solution, onDelete }: SolutionCardProps) => {
  const canEdit = solution.status === 'draft' || solution.status === 'submitted';

  return (
    <Card className="group hover:border-primary/50 transition-all duration-200">
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
                <Link to={`/dashboard/solutions/${solution.id}`}>
                  <Eye className="h-4 w-4 mr-2" />
                  View
                </Link>
              </DropdownMenuItem>
              {canEdit && (
                <DropdownMenuItem asChild>
                  <Link to={`/dashboard/solutions/${solution.id}/edit`}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => onDelete(solution.id)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
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

        {solution.problems && (
          <div className="flex items-center gap-2 mb-4 p-2 rounded-lg bg-secondary/50">
            <span className="text-xs text-muted-foreground">For:</span>
            <span className="text-sm font-medium truncate">{solution.problems.title}</span>
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
  );
};
