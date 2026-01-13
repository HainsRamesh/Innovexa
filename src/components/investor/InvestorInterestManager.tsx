import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, CheckCircle, XCircle, MessageCircle, Clock, TrendingUp } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { useChat } from '@/contexts/ChatContext';

interface InvestorInterest {
  id: string;
  investor_id: string;
  investor_name: string;
  interest_type: string;
  investment_range: string | null;
  message: string | null;
  status: string;
  created_at: string;
  investor_profile?: {
    full_name: string | null;
    avatar_url: string | null;
  };
}

interface InvestorInterestManagerProps {
  innovationId: string;
  innovationTitle: string;
}

const statusConfig: Record<string, { label: string; color: string }> = {
  requested: { label: 'Pending', color: 'bg-yellow-500/20 text-yellow-500' },
  in_discussion: { label: 'In Discussion', color: 'bg-blue-500/20 text-blue-500' },
  accepted: { label: 'Accepted', color: 'bg-green-500/20 text-green-500' },
  rejected: { label: 'Rejected', color: 'bg-red-500/20 text-red-500' },
};

export const InvestorInterestManager = ({
  innovationId,
  innovationTitle,
}: InvestorInterestManagerProps) => {
  const { user } = useAuth();
  const { openChat } = useChat();
  const [interests, setInterests] = useState<InvestorInterest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    const fetchInterests = async () => {
      try {
        const { data, error } = await supabase
          .from('investor_interests')
          .select(`
            *,
            investor_profile:public_profiles!investor_id(full_name, avatar_url)
          `)
          .eq('innovation_id', innovationId)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setInterests((data as unknown as InvestorInterest[]) || []);
      } catch (error) {
        console.error('Error fetching interests:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInterests();
  }, [innovationId]);

  const updateStatus = async (interestId: string, newStatus: string) => {
    setUpdatingId(interestId);
    try {
      const { error } = await supabase
        .from('investor_interests')
        .update({ status: newStatus })
        .eq('id', interestId);

      if (error) throw error;

      setInterests((prev) =>
        prev.map((i) => (i.id === interestId ? { ...i, status: newStatus } : i))
      );

      toast.success(`Interest ${newStatus === 'accepted' ? 'accepted' : newStatus === 'rejected' ? 'rejected' : 'updated'}`);
    } catch (error) {
      console.error('Error updating interest:', error);
      toast.error('Failed to update interest');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleStartDiscussion = (interest: InvestorInterest) => {
    openChat({
      userId: interest.investor_id,
      userName: interest.investor_profile?.full_name || interest.investor_name,
      userAvatar: interest.investor_profile?.avatar_url || null,
      prefilledMessage: `Hi ${interest.investor_name}, thank you for your interest in "${innovationTitle}". I'd love to discuss this further.`,
      innovationId,
      innovationTitle,
    });

    // Update status to in_discussion if it's still requested
    if (interest.status === 'requested') {
      updateStatus(interest.id, 'in_discussion');
    }
  };

  const getInitials = (name: string | null) => {
    if (!name) return 'I';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (interests.length === 0) {
    return (
      <Card className="border-border bg-card">
        <CardContent className="flex flex-col items-center justify-center py-8">
          <TrendingUp className="h-10 w-10 text-muted-foreground mb-3" />
          <p className="text-muted-foreground text-center">No investor interests yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <TrendingUp className="h-5 w-5" />
        Investor Interests ({interests.length})
      </h3>

      {interests.map((interest) => {
        const status = statusConfig[interest.status] || statusConfig.requested;

        return (
          <Card key={interest.id} className="border-border bg-card">
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={interest.investor_profile?.avatar_url || undefined} />
                  <AvatarFallback>
                    {getInitials(interest.investor_profile?.full_name || interest.investor_name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-medium">
                      {interest.investor_profile?.full_name || interest.investor_name}
                    </span>
                    <Badge className={status.color}>{status.label}</Badge>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground mb-2">
                    <span className="capitalize">{interest.interest_type}</span>
                    {interest.investment_range && <span>• {interest.investment_range}</span>}
                    <span>
                      • {formatDistanceToNow(new Date(interest.created_at), { addSuffix: true })}
                    </span>
                  </div>
                  {interest.message && (
                    <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                      {interest.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 mt-4 justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleStartDiscussion(interest)}
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Message
                </Button>
                {interest.status === 'requested' && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateStatus(interest.id, 'rejected')}
                      disabled={updatingId === interest.id}
                      className="text-destructive hover:text-destructive"
                    >
                      {updatingId === interest.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <XCircle className="h-4 w-4 mr-2" />
                          Decline
                        </>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => updateStatus(interest.id, 'accepted')}
                      disabled={updatingId === interest.id}
                    >
                      {updatingId === interest.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Accept
                        </>
                      )}
                    </Button>
                  </>
                )}
                {interest.status === 'in_discussion' && (
                  <Button
                    size="sm"
                    onClick={() => updateStatus(interest.id, 'accepted')}
                    disabled={updatingId === interest.id}
                  >
                    {updatingId === interest.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Mark Accepted
                      </>
                    )}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
