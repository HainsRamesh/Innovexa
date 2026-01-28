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
import { Eye, Edit, Trash2, MoreVertical, Calendar, DollarSign, Bookmark, BookmarkCheck } from 'lucide-react';
import { Problem, ProblemStatus } from '@/types';
import { format } from 'date-fns';

interface ProblemCardProps {
  problem: Problem;
  onDelete?: (id: string) => void;
  onBookmark?: (id: string) => void;
  isBookmarked?: boolean;
  showOwnerActions?: boolean;
  basePath?: string;
}

const getStatusBadge = (status: ProblemStatus) => {
  const variants: Record<ProblemStatus, 'status_open' | 'status_in_review' | 'status_matched' | 'status_closed' | 'outline'> = {
    draft: 'outline',
    open: 'status_open',
    in_review: 'status_in_review',
    matched: 'status_matched',
    closed: 'status_closed',
  };
  return variants[status];
};

const getStatusLabel = (status: ProblemStatus) => {
  const labels: Record<ProblemStatus, string> = {
    draft: 'Draft',
    open: 'Open',
    in_review: 'In Review',
    matched: 'Matched',
    closed: 'Closed',
  };
  return labels[status];
};

const formatBudget = (min: number | null, max: number | null) => {
  if (!min && !max) return null;
  if (min && max) return `$${min.toLocaleString()} - $${max.toLocaleString()}`;
  if (max) return `Up to $${max.toLocaleString()}`;
  return `From $${min?.toLocaleString()}`;
};

export const ProblemCard = ({
  problem,
  onDelete,
  onBookmark,
  isBookmarked = false,
  showOwnerActions = false,
  basePath = '/dashboard/problems',
}: ProblemCardProps) => {
  const budget = formatBudget(problem.budget_min, problem.budget_max);

  return (
    <Card className="group hover:border-primary/50 transition-all duration-200">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <Badge variant={problem.category as any}>{problem.category}</Badge>
            <Badge variant={getStatusBadge(problem.status)}>
              {getStatusLabel(problem.status)}
            </Badge>
          </div>
          <div className="flex items-center gap-1">
            {onBookmark && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => onBookmark(problem.id)}
              >
                {isBookmarked ? (
                  <BookmarkCheck className="h-4 w-4 text-primary" />
                ) : (
                  <Bookmark className="h-4 w-4" />
                )}
              </Button>
            )}
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 -mt-1 -mr-2">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="z-50" sideOffset={5}>
                <DropdownMenuItem asChild>
                  <Link to={`${basePath}/${problem.id}`}>
                    <Eye className="h-4 w-4 mr-2" />
                    View
                  </Link>
                </DropdownMenuItem>
                {showOwnerActions && (
                  <>
                    <DropdownMenuItem asChild>
                      <Link to={`${basePath}/${problem.id}/edit`}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Link>
                    </DropdownMenuItem>
                    {onDelete && (
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => onDelete(problem.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    )}
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
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

        <div className="flex items-center pt-3 border-t border-border/50">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Calendar className="h-3.5 w-3.5" />
            {format(new Date(problem.created_at), 'MMM d, yyyy, h:mm a')}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
