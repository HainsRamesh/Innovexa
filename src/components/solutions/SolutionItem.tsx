import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { DollarSign, Clock, ChevronDown, ChevronUp, Reply, Send, Loader2, Eye, CheckCircle } from "lucide-react";
import { SolutionDetailDialog } from "./SolutionDetailDialog";

interface SolutionReply {
  id: string;
  solution_id: string;
  user_id: string;
  content: string;
  created_at: string;
  profile?: {
    full_name: string | null;
    avatar_url: string | null;
  };
}

interface SolutionItemProps {
  solution: {
    id: string;
    title: string;
    description: string;
    approach?: string | null;
    technology_stack?: string[] | null;
    estimated_cost: number | null;
    timeline_weeks: number | null;
    attachments?: string[] | null;
    innovator_id: string;
    created_at: string;
    status: string;
  };
  problemOwnerId: string;
  onStatusChange?: () => void;
}

export function SolutionItem({ solution, problemOwnerId, onStatusChange }: SolutionItemProps) {
  const { user, role } = useAuth();
  const { toast } = useToast();
  
  const [isExpanded, setIsExpanded] = useState(false);
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const [replies, setReplies] = useState<SolutionReply[]>([]);
  const [isLoadingReplies, setIsLoadingReplies] = useState(false);
  const [innovatorProfile, setInnovatorProfile] = useState<{ full_name: string | null; avatar_url: string | null } | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [currentStatus, setCurrentStatus] = useState(solution.status);

  const descriptionLimit = 200;
  const isLongDescription = solution.description.length > descriptionLimit;
  const displayDescription = isExpanded || !isLongDescription 
    ? solution.description 
    : `${solution.description.slice(0, descriptionLimit)}...`;

  // Check if user can reply (problem owner, solution owner, or investor)
  const canReply = user && (
    user.id === problemOwnerId ||
    user.id === solution.innovator_id ||
    role === "investor"
  );

  // Check if user is the problem owner
  const isProblemOwner = user?.id === problemOwnerId;

  const formatCurrency = (amount: number | null) => {
    if (amount === null) return "Not specified";
    return `$${amount.toLocaleString()}`;
  };

  const getInitials = (name: string | null) => {
    if (!name) return "U";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const handleApproveSolution = async () => {
    setIsApproving(true);
    try {
      const { error } = await supabase.rpc("approve_solution", {
        _solution_id: solution.id,
      });

      if (error) throw error;

      setCurrentStatus("accepted");
      toast({ title: "Solution approved successfully" });
      onStatusChange?.();
    } catch (error) {
      console.error("Error approving solution:", error);
      toast({
        title: "Failed to approve solution",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsApproving(false);
    }
  };

  // Fetch innovator profile
  useEffect(() => {
    const fetchProfile = async () => {
      const { data } = await supabase
        .from("public_profiles")
        .select("full_name, avatar_url")
        .eq("id", solution.innovator_id)
        .maybeSingle();
      
      if (data) {
        setInnovatorProfile(data);
      }
    };
    fetchProfile();
  }, [solution.innovator_id]);

  // Fetch replies
  useEffect(() => {
    const fetchReplies = async () => {
      setIsLoadingReplies(true);
      const { data, error } = await supabase
        .from("solution_replies")
        .select("*")
        .eq("solution_id", solution.id)
        .order("created_at", { ascending: true });

      if (!error && data) {
        // Fetch profiles for each reply
        const repliesWithProfiles = await Promise.all(
          data.map(async (reply) => {
            const { data: profile } = await supabase
              .from("public_profiles")
              .select("full_name, avatar_url")
              .eq("id", reply.user_id)
              .maybeSingle();
            return { ...reply, profile: profile || undefined };
          })
        );
        setReplies(repliesWithProfiles);
      }
      setIsLoadingReplies(false);
    };
    fetchReplies();
  }, [solution.id]);

  const handleSubmitReply = async () => {
    if (!replyContent.trim() || !user) return;

    setIsSubmittingReply(true);
    try {
      const { data, error } = await supabase
        .from("solution_replies")
        .insert({
          solution_id: solution.id,
          user_id: user.id,
          content: replyContent.trim(),
        })
        .select()
        .single();

      if (error) throw error;

      // Fetch the profile for the new reply
      const { data: profile } = await supabase
        .from("public_profiles")
        .select("full_name, avatar_url")
        .eq("id", user.id)
        .maybeSingle();

      setReplies(prev => [...prev, { ...data, profile: profile || undefined }]);
      setReplyContent("");
      setShowReplyForm(false);
      toast({ title: "Reply posted successfully" });
    } catch (error) {
      console.error("Error posting reply:", error);
      toast({
        title: "Failed to post reply",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingReply(false);
    }
  };

  return (
    <>
      <div className="py-6">
        {/* Solution Header with Profile */}
        <div className="flex items-start gap-4">
          <Avatar className="h-10 w-10">
            <AvatarImage src={innovatorProfile?.avatar_url || undefined} />
            <AvatarFallback>{getInitials(innovatorProfile?.full_name)}</AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium">
                {innovatorProfile?.full_name || "Anonymous Innovator"}
              </span>
              <span className="text-sm text-muted-foreground">
                · {format(new Date(solution.created_at), "MMM d, yyyy")}
              </span>
              {currentStatus === "accepted" && (
                <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Approved
                </Badge>
              )}
            </div>

            {/* Solution Title */}
            <h4 className="font-semibold text-lg mb-2">{solution.title}</h4>

          {/* Description with Read More */}
          <p className="text-muted-foreground whitespace-pre-wrap">
            {displayDescription}
          </p>
          {isLongDescription && (
            <Button
              variant="link"
              size="sm"
              className="px-0 h-auto py-1"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="h-4 w-4 mr-1" />
                  Show less
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4 mr-1" />
                  Read more
                </>
              )}
            </Button>
          )}

          {/* Cost and Timeline */}
          <div className="flex flex-wrap items-center gap-4 mt-3">
            <div className="flex items-center gap-1.5 text-sm">
              <DollarSign className="h-4 w-4 text-primary" />
              <span className="font-medium">{formatCurrency(solution.estimated_cost)}</span>
            </div>
            <div className="flex items-center gap-1.5 text-sm">
              <Clock className="h-4 w-4 text-primary" />
              <span className="font-medium">
                {solution.timeline_weeks ? `${solution.timeline_weeks} weeks` : "TBD"}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-3 flex flex-wrap gap-2">
            {/* View Details - only for problem owner */}
            {isProblemOwner && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDetailDialog(true)}
              >
                <Eye className="h-4 w-4 mr-1" />
                View Details
              </Button>
            )}

            {/* Approve Button - only for problem owner */}
            {isProblemOwner && (
              <Button
                variant={currentStatus === "accepted" ? "outline" : "default"}
                size="sm"
                onClick={handleApproveSolution}
                disabled={isApproving || currentStatus === "accepted"}
                className={currentStatus === "accepted" ? "bg-green-500/10 text-green-600 border-green-500/20 hover:bg-green-500/20" : ""}
              >
                {isApproving ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                ) : (
                  <CheckCircle className="h-4 w-4 mr-1" />
                )}
                {currentStatus === "accepted" ? "Approved" : "Approve"}
              </Button>
            )}

            {/* Reply Button */}
            {canReply && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowReplyForm(!showReplyForm)}
              >
                <Reply className="h-4 w-4 mr-1" />
                Reply
              </Button>
            )}
          </div>

          {/* Reply Form */}
          {showReplyForm && (
            <div className="mt-4 space-y-3">
              <Textarea
                placeholder="Write your reply..."
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                className="min-h-[80px]"
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleSubmitReply}
                  disabled={!replyContent.trim() || isSubmittingReply}
                >
                  {isSubmittingReply ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-1" />
                      Post Reply
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowReplyForm(false);
                    setReplyContent("");
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Replies Section */}
          {replies.length > 0 && (
            <div className="mt-4 space-y-4 pl-4 border-l-2 border-border">
              {replies.map((reply) => (
                <div key={reply.id} className="flex items-start gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={reply.profile?.avatar_url || undefined} />
                    <AvatarFallback className="text-xs">
                      {getInitials(reply.profile?.full_name || null)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">
                        {reply.profile?.full_name || "Anonymous"}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        · {format(new Date(reply.created_at), "MMM d, yyyy")}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{reply.content}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
          </div>
        </div>
      </div>

      {/* Solution Detail Dialog */}
      <SolutionDetailDialog
        solution={{ ...solution, status: currentStatus }}
        open={showDetailDialog}
        onOpenChange={setShowDetailDialog}
      />
    </>
  );
}