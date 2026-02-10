import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { Sparkles, MessageCircle, ChevronDown, ChevronUp, Send, Loader2, CheckCircle, Eye, DollarSign, Calendar, TrendingUp } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SolutionSubmissionForm } from "@/components/solutions/SolutionSubmissionForm";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Problem, Solution } from "@/types";
import { SolutionDetailDialog } from "@/components/solutions/SolutionDetailDialog";
import { InvestorInterestModal } from "@/components/investor/InvestorInterestModal";
import { InvestorReadyBadge } from "@/components/investor/InvestorReadyBadge";
import { useHasApprovedSolutions, useInvestorInterests } from "@/hooks/useInvestorInterests";
import { useProblemInterest } from "@/hooks/useProblemInterest";
import { UserProfileLink } from "@/components/user/UserProfileLink";
import { cn } from "@/lib/utils";

interface ProblemFeedItemProps {
  problem: Problem & { interest_count?: number; solutions_count?: number };
  ownerProfile?: { full_name: string | null; avatar_url: string | null } | null;
}

export function ProblemFeedItem({ problem, ownerProfile }: ProblemFeedItemProps) {
  const { user, role } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [isExpanded, setIsExpanded] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [solutions, setSolutions] = useState<Solution[]>([]);
  const [isLoadingSolutions, setIsLoadingSolutions] = useState(false);
  const solutionsCount = problem.solutions_count ?? 0;
  
  // Use the problem interest hook for persistent interests + notifications
  const { isInterested, interestCount, toggleInterest, isLoading: isToggling, isAnimating } = useProblemInterest(
    problem.id,
    problem.interest_count ?? 0
  );
  
  // Solution submission state
  const [showSolutionForm, setShowSolutionForm] = useState(false);
  
  // Selected solution for detail view
  const [selectedSolution, setSelectedSolution] = useState<Solution | null>(null);
  const [showSolutionDetail, setShowSolutionDetail] = useState(false);

  // Investor interest state
  const [showInvestorModal, setShowInvestorModal] = useState(false);
  const { hasApproved } = useHasApprovedSolutions(problem.id);
  const { count: investorInterestCount, hasUserInterest, refetch: refetchInterests } = useInvestorInterests("problem", problem.id);

  const isInnovator = role === "innovator";
  const isEnterprise = role === "enterprise";
  const isInvestor = role === "investor";
  const isProblemOwner = user?.id === problem.owner_id;
  
  const descriptionLimit = 300;
  const isLongDescription = problem.description.length > descriptionLimit;
  const displayDescription = isExpanded || !isLongDescription 
    ? problem.description 
    : `${problem.description.slice(0, descriptionLimit)}`;

  const getInitials = (name: string | null) => {
    if (!name) return "U";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const formatBudget = (min: number | null, max: number | null) => {
    if (!min && !max) return "Open budget";
    if (min && max) return `$${min.toLocaleString()} - $${max.toLocaleString()}`;
    if (max) return `Up to $${max.toLocaleString()}`;
    return `From $${min?.toLocaleString()}`;
  };

  // Fetch solutions when comments are opened
  useEffect(() => {
    if (showComments && solutions.length === 0) {
      fetchSolutions();
    }
  }, [showComments]);

  const fetchSolutions = async () => {
    setIsLoadingSolutions(true);
    try {
      const { data, error } = await supabase
        .from("solutions")
        .select("*")
        .eq("problem_id", problem.id)
        .in("status", ["submitted", "under_review", "shortlisted", "accepted"])
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch profiles for each solution
      const solutionsWithProfiles = await Promise.all(
        (data || []).map(async (solution) => {
          const { data: profile } = await supabase
            .from("public_profiles")
            .select("full_name, avatar_url")
            .eq("id", solution.innovator_id)
            .maybeSingle();
          return { ...solution, profiles: profile } as Solution;
        })
      );

      setSolutions(solutionsWithProfiles);
    } catch (error) {
      console.error("Error fetching solutions:", error);
    } finally {
      setIsLoadingSolutions(false);
    }
  };

  // Interest handler now uses the hook
  const handleInterest = async () => {
    await toggleInterest();
  };

  const handleSolutionSuccess = () => {
    setShowSolutionForm(false);
    fetchSolutions();
  };

  const handleApproveSolution = async (solutionId: string) => {
    try {
      const { error } = await supabase.rpc("approve_solution", {
        _solution_id: solutionId,
      });

      if (error) throw error;

      toast({ title: "Solution approved successfully" });
      fetchSolutions();
    } catch (error) {
      console.error("Error approving solution:", error);
      toast({
        title: "Failed to approve solution",
        variant: "destructive",
      });
    }
  };

  return (
    <article className="bg-card border border-border rounded-xl p-6 mb-4">
      {/* Post Header */}
      <div className="flex items-start gap-4 mb-4">
        <UserProfileLink
          userId={problem.owner_id}
          fullName={ownerProfile?.full_name || null}
          avatarUrl={ownerProfile?.avatar_url || null}
          showName={false}
          avatarSize="lg"
        />
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <UserProfileLink
              userId={problem.owner_id}
              fullName={ownerProfile?.full_name || null}
              avatarUrl={ownerProfile?.avatar_url || null}
              showName={true}
              avatarSize="lg"
              className="[&>*:first-child]:hidden"
            />
            <span className="text-sm text-muted-foreground">
              · {format(new Date(problem.created_at), "MMM d, yyyy")}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <Badge variant={problem.category as any}>
              {problem.category}
            </Badge>
            {hasApproved && (
              <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
                <CheckCircle className="h-3 w-3 mr-1" />
                Approved Solutions
              </Badge>
            )}
            <InvestorReadyBadge targetType="problem" targetId={problem.id} />
          </div>
        </div>
      </div>

      {/* Post Title */}
      <h3 className="text-xl font-bold mb-3">{problem.title}</h3>

      {/* Post Description with "...more" */}
      <div className="mb-4">
        <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
          {displayDescription}
          {isLongDescription && !isExpanded && (
            <button
              onClick={() => setIsExpanded(true)}
              className="text-primary hover:underline ml-1 font-medium"
            >
              ...more
            </button>
          )}
        </p>
        {isExpanded && isLongDescription && (
          <button
            onClick={() => setIsExpanded(false)}
            className="text-primary hover:underline mt-2 text-sm flex items-center gap-1"
          >
            <ChevronUp className="h-4 w-4" />
            Show less
          </button>
        )}
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="mb-4 p-4 bg-muted/30 rounded-lg space-y-3">
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-primary" />
              <span>{formatBudget(problem.budget_min, problem.budget_max)}</span>
            </div>
            {problem.deadline && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                <span>Due {format(new Date(problem.deadline), "MMM d, yyyy")}</span>
              </div>
            )}
          </div>
          
          {problem.tags && problem.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {problem.tags.map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          {problem.requirements && problem.requirements.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2">Requirements:</p>
              <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                {problem.requirements.map((req, i) => (
                  <li key={i}>{req}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Engagement Stats Bar */}
      <div className="flex items-center gap-4 py-3 border-t border-b border-border/50 text-sm text-muted-foreground">
        <span>{interestCount} interests</span>
        <span>{solutions.length > 0 ? solutions.length : solutionsCount} solutions</span>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2 pt-3 flex-wrap">
        <Button
          size="sm"
          onClick={() => navigate(`/explore/${problem.id}`)}
        >
          <Eye className="h-4 w-4 mr-2" />
          View full details
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleInterest}
          disabled={isToggling}
          className={isInterested ? "text-amber-500" : ""}
        >
          <Sparkles className={cn(
            "h-5 w-5 mr-2 transition-all duration-200",
            isInterested && "fill-current",
            isAnimating && "scale-125"
          )} />
          Interested
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowComments(!showComments)}
        >
          <MessageCircle className="h-5 w-5 mr-2" />
          Solutions ({solutions.length > 0 ? solutions.length : solutionsCount})
        </Button>

        {/* Investor Ready to Invest CTA */}
        {isInvestor && hasApproved && !hasUserInterest && (
          <Button
            size="sm"
            onClick={() => setShowInvestorModal(true)}
            className="ml-auto bg-emerald-600 hover:bg-emerald-700"
          >
            <TrendingUp className="h-4 w-4 mr-2" />
            Ready to Invest
          </Button>
        )}
        {isInvestor && hasUserInterest && (
          <Badge variant="outline" className="ml-auto text-emerald-500 border-emerald-500/30">
            <CheckCircle className="h-3 w-3 mr-1" />
            Interest Submitted
          </Badge>
        )}
      </div>

      {/* Comments/Solutions Section */}
      {showComments && (
        <div className="mt-4 pt-4 border-t border-border/50">
          {/* Solution Submission Form - Only for Innovators */}
          {isInnovator && !isProblemOwner && (
            <div className="mb-6">
              {showSolutionForm ? (
                <SolutionSubmissionForm
                  problemId={problem.id}
                  onSuccess={handleSolutionSuccess}
                  onCancel={() => setShowSolutionForm(false)}
                />
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSolutionForm(true)}
                  className="w-full"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Submit Your Solution
                </Button>
              )}
            </div>
          )}

          {/* Solutions List */}
          {isLoadingSolutions ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : solutions.length > 0 ? (
            <div className="space-y-4">
              {solutions.map((solution) => (
                <SolutionComment
                  key={solution.id}
                  solution={solution}
                  isProblemOwner={isProblemOwner}
                  onApprove={() => handleApproveSolution(solution.id)}
                  onViewDetails={() => {
                    setSelectedSolution(solution);
                    setShowSolutionDetail(true);
                  }}
                />
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-6">
              No solutions yet. {isInnovator && "Be the first to submit one!"}
            </p>
          )}
        </div>
      )}

      {/* Solution Detail Dialog */}
      {selectedSolution && (
        <SolutionDetailDialog
          solution={selectedSolution}
          open={showSolutionDetail}
          onOpenChange={setShowSolutionDetail}
        />
      )}

      {/* Investor Interest Modal */}
      <InvestorInterestModal
        open={showInvestorModal}
        onOpenChange={setShowInvestorModal}
        targetType="problem"
        targetId={problem.id}
        targetTitle={problem.title}
        onSuccess={refetchInterests}
      />
    </article>
  );
}

// Solution Comment Component
interface SolutionCommentProps {
  solution: Solution;
  isProblemOwner: boolean;
  onApprove: () => void;
  onViewDetails: () => void;
}

function SolutionComment({ solution, isProblemOwner, onApprove, onViewDetails }: SolutionCommentProps) {
  const [isApproving, setIsApproving] = useState(false);
  const isApproved = solution.status === "accepted";

  const getInitials = (name: string | null) => {
    if (!name) return "U";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const handleApprove = async () => {
    setIsApproving(true);
    await onApprove();
    setIsApproving(false);
  };

  return (
    <div className="flex items-start gap-3 p-4 bg-muted/20 rounded-lg">
      <UserProfileLink
        userId={solution.innovator_id}
        fullName={solution.profiles?.full_name || null}
        avatarUrl={solution.profiles?.avatar_url || null}
        showName={false}
        avatarSize="md"
      />
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <UserProfileLink
            userId={solution.innovator_id}
            fullName={solution.profiles?.full_name || null}
            avatarUrl={solution.profiles?.avatar_url || null}
            showName={true}
            avatarSize="sm"
            className="[&>*:first-child]:hidden"
            nameClassName="text-sm font-medium"
          />
          <span className="text-xs text-muted-foreground">
            · {format(new Date(solution.created_at), "MMM d, yyyy")}
          </span>
          {isApproved && (
            <Badge className="bg-green-500/10 text-green-600 border-green-500/20 text-xs">
              <CheckCircle className="h-3 w-3 mr-1" />
              Approved
            </Badge>
          )}
        </div>
        
        <h4 className="font-medium mb-1">{solution.title}</h4>
        <p className="text-sm text-muted-foreground line-clamp-2">
          {solution.description}
        </p>
        
        <div className="flex items-center gap-2 mt-3">
          <Button variant="outline" size="sm" onClick={onViewDetails}>
            View Details
          </Button>
          {isProblemOwner && !isApproved && (
            <Button
              size="sm"
              onClick={handleApprove}
              disabled={isApproving}
              className="bg-green-600 hover:bg-green-700"
            >
              {isApproving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Approve
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
