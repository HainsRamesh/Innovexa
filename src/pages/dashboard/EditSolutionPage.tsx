import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useGlobalLoading } from '@/contexts/LoadingContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { SolutionSubmissionForm } from '@/components/solutions/SolutionSubmissionForm';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, AlertCircle, Lock } from 'lucide-react';
import { Solution, SolutionStatus } from '@/types';

// Statuses that are editable (before enterprise contact)
const EDITABLE_STATUSES: SolutionStatus[] = ['draft', 'submitted'];

const EditSolutionPage = () => {
  const { solutionId } = useParams<{ solutionId: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const { startLoading, stopLoading } = useGlobalLoading();
  const navigate = useNavigate();

  const [solution, setSolution] = useState<Solution | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLocked, setIsLocked] = useState(false);

  useEffect(() => {
    if (solutionId && user) {
      fetchSolution();
    }
  }, [solutionId, user]);

  const fetchSolution = async () => {
    setIsLoading(true);
    startLoading("Loading solution…");
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('solutions')
        .select('*')
        .eq('id', solutionId)
        .single();

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          setError('Solution not found');
        } else {
          throw fetchError;
        }
        return;
      }

      // Verify ownership
      if (data.innovator_id !== user!.id) {
        setError('You do not have permission to edit this solution');
        return;
      }

      // Check if editable
      if (!EDITABLE_STATUSES.includes(data.status as SolutionStatus)) {
        setIsLocked(true);
      }

      setSolution(data as Solution);
    } catch (err) {
      console.error('Error fetching solution:', err);
      setError('Failed to load solution');
      toast({
        title: 'Error',
        description: 'Failed to load solution',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
      stopLoading();
    }
  };

  const handleSuccess = () => {
    toast({
      title: 'Solution updated',
      description: 'Your solution has been saved successfully.',
    });
    navigate('/dashboard/solutions');
  };

  const handleCancel = () => {
    navigate('/dashboard/solutions');
  };

  if (isLoading) {
    return null; // Global loading overlay is shown
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

  if (isLocked) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <Lock className="h-16 w-16 text-muted-foreground/30 mb-4" />
        <h2 className="text-xl font-semibold mb-2">Editing Disabled</h2>
        <p className="text-muted-foreground mb-6 max-w-md">
          Editing is disabled once an enterprise has contacted you about this solution.
          Your solution is currently in "{solution?.status.replace('_', ' ')}" status.
        </p>
        <Button variant="outline" onClick={() => navigate(`/dashboard/solutions/${solutionId}`)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          View Solution
        </Button>
      </div>
    );
  }

  if (!solution) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Button
          variant="ghost"
          size="sm"
          className="mb-4"
          onClick={() => navigate('/dashboard/solutions')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to My Solutions
        </Button>

        <h1 className="text-2xl font-bold">Edit Solution</h1>
        <p className="text-muted-foreground">
          Update your solution details below. Changes will be saved when you click Update.
        </p>
      </div>

      {/* Form with existing attachments passed */}
      <SolutionSubmissionForm
        problemId={solution.problem_id}
        existingSolution={{
          id: solution.id,
          title: solution.title,
          description: solution.description,
          approach: solution.approach,
          estimated_cost: solution.estimated_cost,
          timeline_weeks: solution.timeline_weeks,
          technology_stack: solution.technology_stack,
          attachments: solution.attachments,
          innovator_id: solution.innovator_id,
        }}
        onSuccess={handleSuccess}
        onCancel={handleCancel}
      />
    </div>
  );
};

export default EditSolutionPage;
