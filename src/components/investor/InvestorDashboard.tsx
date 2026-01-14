import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, TrendingUp, MessageCircle, CheckCircle, XCircle, Clock, Filter } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';

interface InvestorInterest {
  id: string;
  investor_id: string;
  problem_id: string | null;
  innovation_id: string | null;
  investor_name: string;
  interest_type: string;
  investment_range: string | null;
  message: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  innovation?: {
    id: string;
    title: string;
    category: string;
  };
  problem?: {
    id: string;
    title: string;
    category: string;
  };
}

const statusConfig: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  requested: { label: 'Requested', icon: Clock, color: 'bg-yellow-500/20 text-yellow-500' },
  in_discussion: { label: 'In Discussion', icon: MessageCircle, color: 'bg-blue-500/20 text-blue-500' },
  accepted: { label: 'Accepted', icon: CheckCircle, color: 'bg-green-500/20 text-green-500' },
  rejected: { label: 'Rejected', icon: XCircle, color: 'bg-red-500/20 text-red-500' },
};

export const InvestorDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [interests, setInterests] = useState<InvestorInterest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    const fetchInterests = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('investor_interests')
          .select(`
            *,
            innovation:innovations(id, title, category),
            problem:problems(id, title, category)
          `)
          .eq('investor_id', user.id)
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
  }, [user]);

  const filteredInterests = interests.filter((interest) => {
    if (statusFilter === 'all') return true;
    return interest.status === statusFilter;
  });

  const getTabCounts = () => {
    return {
      all: interests.length,
      requested: interests.filter((i) => i.status === 'requested').length,
      in_discussion: interests.filter((i) => i.status === 'in_discussion').length,
      accepted: interests.filter((i) => i.status === 'accepted').length,
      rejected: interests.filter((i) => i.status === 'rejected').length,
    };
  };

  const counts = getTabCounts();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Investment Interests</h2>
          <p className="text-muted-foreground">Track your investment interests and discussions</p>
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All ({counts.all})</SelectItem>
              <SelectItem value="requested">Requested ({counts.requested})</SelectItem>
              <SelectItem value="in_discussion">In Discussion ({counts.in_discussion})</SelectItem>
              <SelectItem value="accepted">Accepted ({counts.accepted})</SelectItem>
              <SelectItem value="rejected">Rejected ({counts.rejected})</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Interests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{counts.all}</div>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Discussions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-500">{counts.in_discussion}</div>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Accepted</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-500">{counts.accepted}</div>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-500">{counts.requested}</div>
          </CardContent>
        </Card>
      </div>

      {/* Interests List */}
      <div className="space-y-4">
        {filteredInterests.length === 0 ? (
          <Card className="border-border bg-card">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <TrendingUp className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">No interests found</h3>
              <p className="text-muted-foreground text-center mt-2">
                {statusFilter === 'all'
                  ? "You haven't expressed interest in any innovations or problems yet."
                  : `No interests with status "${statusFilter}".`}
              </p>
              <Button className="mt-4" onClick={() => navigate('/innovations')}>
                Browse Innovations
              </Button>
            </CardContent>
          </Card>
        ) : (
          filteredInterests.map((interest) => {
            const status = statusConfig[interest.status] || statusConfig.requested;
            const StatusIcon = status.icon;
            const target = interest.innovation || interest.problem;
            const targetType = interest.innovation ? 'innovation' : 'problem';

            return (
              <Card key={interest.id} className="border-border bg-card">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <h4 className="font-semibold truncate">{target?.title || 'Untitled'}</h4>
                        <Badge variant="outline" className="text-xs">
                          {targetType === 'innovation' ? 'Innovation' : 'Problem'}
                        </Badge>
                        <Badge className={status.color}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {status.label}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>Interest: {interest.interest_type}</span>
                        {interest.investment_range && (
                          <span>Range: {interest.investment_range}</span>
                        )}
                        <span>
                          {formatDistanceToNow(new Date(interest.created_at), { addSuffix: true })}
                        </span>
                      </div>
                      {interest.message && (
                        <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                          {interest.message}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        navigate(
                          targetType === 'innovation'
                            ? `/innovations/${target?.id}`
                            : `/dashboard/problems/${target?.id}`
                        )
                      }
                    >
                      View
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};
