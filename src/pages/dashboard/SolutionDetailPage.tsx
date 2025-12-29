import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { LoadingOverlay } from '@/components/ui/LoadingOverlay';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import {
  ArrowLeft,
  Edit,
  FileText,
  Layers,
  DollarSign,
  Clock,
  Paperclip,
  Calendar,
  Target,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { Solution, SolutionStatus, Problem } from '@/types';

// Statuses that are editable (before enterprise contact)
const EDITABLE_STATUSES: SolutionStatus[] = ['draft', 'submitted'];

const SolutionDetailPage = () => {
  const { solutionId } = useParams<{ solutionId: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [solution, setSolution] = useState<Solution | null>(null);
  const [problem, setProblem] = useState<Problem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (solutionId && user) {
      fetchSolutionDetails();
    }
  }, [solutionId, user]);

  const fetchSolutionDetails = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch solution with problem details
      const { data: solutionData, error: solutionError } = await supabase
        .from('solutions')
        .select('*, problems(id, title, category, status, owner_id, description)')
        .eq('id', solutionId)
        .single();

      if (solutionError) {
        if (solutionError.code === 'PGRST116') {
          setError('Solution not found');
        } else {
          throw solutionError;
        }
        return;
      }

      // Verify ownership
      if (solutionData.innovator_id !== user!.id) {
        setError('You do not have permission to view this solution');
        return;
      }

      setSolution(solutionData as Solution);
      setProblem((solutionData as any).problems as Problem);
    } catch (err) {
      console.error('Error fetching solution:', err);
      setError('Failed to load solution details');
      toast({
        title: 'Error',
        description: 'Failed to load solution details',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number | null) => {
    if (amount === null) return 'Not specified';
    return `$${amount.toLocaleString()}`;
  };

  const getStatusBadge = (status: SolutionStatus) => {
    const config: Record<SolutionStatus, { variant: string; label: string }> = {
      draft: { variant: 'outline', label: 'Draft' },
      submitted: { variant: 'secondary', label: 'Submitted' },
      under_review: { variant: 'status_in_review', label: 'Under Review' },
      shortlisted: { variant: 'status_open', label: 'Shortlisted' },
      accepted: { variant: 'status_matched', label: 'Accepted' },
      rejected: { variant: 'destructive', label: 'Rejected' },
    };
    return config[status];
  };

  const isEditable = solution && EDITABLE_STATUSES.includes(solution.status);

  if (isLoading) {
    return <LoadingOverlay isVisible={true} message="Loading solution details…" />;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <AlertCircle className="h-16 w-16 text-muted-foreground/30 mb-4" />
        <h2 className="text-xl font-semibold mb-2">{error}</h2>
        <p className="text-muted-foreground mb-6">
          {error === 'Solution not found'
            ? 'The solution you are looking for does not exist.'
            : 'Please try again later.'}
        </p>
        <Button variant="outline" onClick={() => navigate('/dashboard/solutions')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to My Solutions
        </Button>
      </div>
    );
  }

  if (!solution) return null;

  const statusConfig = getStatusBadge(solution.status);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <Button
          variant="ghost"
          size="sm"
          className="w-fit"
          onClick={() => navigate('/dashboard/solutions')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to My Solutions
        </Button>

        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold">{solution.title}</h1>
              <Badge variant={statusConfig.variant as any}>{statusConfig.label}</Badge>
            </div>
            <p className="text-muted-foreground">
              Submitted on {format(new Date(solution.created_at), 'MMMM d, yyyy')}
              {solution.updated_at !== solution.created_at && (
                <> · Updated {format(new Date(solution.updated_at), 'MMMM d, yyyy')}</>
              )}
            </p>
          </div>

          {isEditable ? (
            <Button asChild>
              <Link to={`/dashboard/solutions/${solution.id}/edit`}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Solution
              </Link>
            </Button>
          ) : (
            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 px-4 py-2 rounded-lg">
              <AlertCircle className="h-4 w-4" />
              <span>Editing is disabled once an enterprise has contacted you.</span>
            </div>
          )}
        </div>
      </div>

      {/* Linked Problem */}
      {problem && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              Linked Problem
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{problem.title}</p>
                <Badge variant="outline" className="mt-1">
                  {problem.category}
                </Badge>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link to={`/explore/${problem.id}`}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View Problem
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Solution Details */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                Description
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground whitespace-pre-wrap">
                {solution.description}
              </p>
            </CardContent>
          </Card>

          {/* Technical Approach */}
          {solution.approach && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Layers className="h-4 w-4 text-primary" />
                  Technical Approach
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground whitespace-pre-wrap">
                  {solution.approach}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Technology Stack */}
          {solution.technology_stack && solution.technology_stack.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Technology Stack</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {solution.technology_stack.map((tech) => (
                    <Badge key={tech} variant="secondary">
                      {tech}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Attachments */}
          {solution.attachments && solution.attachments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Paperclip className="h-4 w-4 text-primary" />
                  Attachments ({solution.attachments.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {solution.attachments.map((attachment, index) => {
                    const fileName =
                      attachment.split('/').pop() || `Attachment ${index + 1}`;
                    return (
                      <a
                        key={index}
                        href={attachment}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-primary hover:underline p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                      >
                        <FileText className="h-4 w-4 shrink-0" />
                        <span className="truncate">{fileName}</span>
                        <ExternalLink className="h-3 w-3 ml-auto shrink-0" />
                      </a>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Cost & Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Estimates</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Estimated Cost</p>
                  <p className="font-semibold">
                    {formatCurrency(solution.estimated_cost)}
                  </p>
                </div>
              </div>

              <Separator />

              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Timeline</p>
                  <p className="font-semibold">
                    {solution.timeline_weeks
                      ? `${solution.timeline_weeks} weeks`
                      : 'Not specified'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Dates */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Timeline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Created</p>
                  <p className="text-sm font-medium">
                    {format(new Date(solution.created_at), 'PPP')}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Last Updated</p>
                  <p className="text-sm font-medium">
                    {format(new Date(solution.updated_at), 'PPP')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* AI Evaluation */}
          {(solution.ai_match_score || solution.ai_evaluation) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">AI Analysis</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {solution.ai_match_score && (
                  <div>
                    <p className="text-sm text-muted-foreground">Match Score</p>
                    <p className="text-2xl font-bold text-primary">
                      {solution.ai_match_score}%
                    </p>
                  </div>
                )}
                {solution.ai_evaluation && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Evaluation</p>
                    <p className="text-sm">{solution.ai_evaluation}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default SolutionDetailPage;
