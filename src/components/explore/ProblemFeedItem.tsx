import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Heart, MessageCircle, ChevronDown, ChevronUp, Send, Loader2, CheckCircle, Eye, DollarSign, Calendar } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Problem, Solution } from "@/types";
import { SolutionDetailDialog } from "@/components/solutions/SolutionDetailDialog";

interface ProblemFeedItemProps {
  problem: Problem & { like_count?: number; solutions_count?: number };
  ownerProfile?: { full_name: string | null; avatar_url: string | null } | null;
}

export function ProblemFeedItem({ problem, ownerProfile }: ProblemFeedItemProps) {
  const { user, role } = useAuth();
  const { toast } = useToast();
  
  const [isExpanded, setIsExpanded] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [solutions, setSolutions] = useState<Solution[]>([]);
  const [isLoadingSolutions, setIsLoadingSolutions] = useState(false);
  const [likeCount, setLikeCount] = useState(problem.like_count ?? 0);
  const [solutionsCount, setSolutionsCount] = useState(problem.solutions_count ?? 0);
  const [isLiked, setIsLiked] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  
  // Solution submission state
  const [showSolutionForm, setShowSolutionForm] = useState(false);
  const [solutionTitle, setSolutionTitle] = useState("");
  const [solutionDescription, setSolutionDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Selected solution for detail view
  const [selectedSolution, setSelectedSolution] = useState<Solution | null>(null);
  const [showSolutionDetail, setShowSolutionDetail] = useState(false);

  const isInnovator = role === "innovator";
  const isEnterprise = role === "enterprise";
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

  const handleLike = async () => {
    setIsLiking(true);
    // For simplicity, just toggle the visual - full implementation would use problem_likes table
    setIsLiked(!isLiked);
    setLikeCount(prev => isLiked ? prev - 1 : prev + 1);
    setIsLiking(false);
  };

  const handleSubmitSolution = async () => {
    if (!solutionTitle.trim() || !solutionDescription.trim() || !user) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("solutions").insert({
        problem_id: problem.id,
        innovator_id: user.id,
        title: solutionTitle.trim(),
        description: solutionDescription.trim(),
        status: "submitted",
      });

      if (error) throw error;

      toast({ title: "Solution submitted successfully" });
      setSolutionTitle("");
      setSolutionDescription("");
      setShowSolutionForm(false);
      fetchSolutions();
    } catch (error) {
      console.error("Error submitting solution:", error);
      toast({
        title: "Failed to submit solution",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
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
        <Avatar className="h-12 w-12">
          <AvatarImage src={ownerProfile?.avatar_url || undefined} />
          <AvatarFallback>{getInitials(ownerProfile?.full_name)}</AvatarFallback>
        </Avatar>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold">
              {ownerProfile?.full_name || "Anonymous"}
            </span>
            <span className="text-sm text-muted-foreground">
              · {format(new Date(problem.created_at), "MMM d, yyyy")}
            </span>
          </div>
          <Badge variant={problem.category as any} className="mt-1">
            {problem.category}
          </Badge>
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
        <span>{likeCount} likes</span>
        <span>{solutions.length > 0 ? solutions.length : solutionsCount} solutions</span>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2 pt-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLike}
          disabled={isLiking}
          className={isLiked ? "text-red-500" : ""}
        >
          <Heart className={`h-5 w-5 mr-2 ${isLiked ? "fill-current" : ""}`} />
          Like
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowComments(!showComments)}
        >
          <MessageCircle className="h-5 w-5 mr-2" />
          Solutions ({solutions.length > 0 ? solutions.length : solutionsCount})
        </Button>
      </div>

      {/* Comments/Solutions Section */}
      {showComments && (
        <div className="mt-4 pt-4 border-t border-border/50">
          {/* Solution Submission Form - Only for Innovators */}
          {isInnovator && !isProblemOwner && (
            <div className="mb-6">
              {showSolutionForm ? (
                <div className="space-y-3 p-4 bg-muted/30 rounded-lg">
                  <input
                    type="text"
                    placeholder="Solution title..."
                    value={solutionTitle}
                    onChange={(e) => setSolutionTitle(e.target.value)}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <Textarea
                    placeholder="Describe your solution approach..."
                    value={solutionDescription}
                    onChange={(e) => setSolutionDescription(e.target.value)}
                    className="min-h-[100px]"
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={handleSubmitSolution}
                      disabled={!solutionTitle.trim() || !solutionDescription.trim() || isSubmitting}
                    >
                      {isSubmitting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-2" />
                          Submit Solution
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setShowSolutionForm(false);
                        setSolutionTitle("");
                        setSolutionDescription("");
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
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
      <Avatar className="h-10 w-10">
        <AvatarImage src={solution.profiles?.avatar_url || undefined} />
        <AvatarFallback>{getInitials(solution.profiles?.full_name || null)}</AvatarFallback>
      </Avatar>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <span className="font-medium text-sm">
            {solution.profiles?.full_name || "Anonymous Innovator"}
          </span>
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
        
        <h4 className="font-semibold mb-1">{solution.title}</h4>
        <p className="text-sm text-muted-foreground line-clamp-2">{solution.description}</p>
        
        <div className="flex items-center gap-2 mt-3">
          <Button variant="outline" size="sm" onClick={onViewDetails}>
            <Eye className="h-4 w-4 mr-1" />
            View Details
          </Button>
          
          {isProblemOwner && !isApproved && (
            <Button
              size="sm"
              onClick={handleApprove}
              disabled={isApproving}
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
