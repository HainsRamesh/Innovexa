import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  FileText,
  Sparkles,
  TrendingUp,
  Eye,
  ArrowRight,
  Plus,
  Rocket,
  Target,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { Problem, Solution, DashboardStats } from '@/types';

const DashboardOverview = () => {
  const { user, profile, role } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalProblems: 0,
    totalSolutions: 0,
    activeChallenges: 0,
    matchRate: 0,
  });
  const [recentProblems, setRecentProblems] = useState<Problem[]>([]);
  const [recentSolutions, setRecentSolutions] = useState<Solution[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user, role]);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      // Fetch stats based on role
      if (role === 'enterprise' || role === 'admin') {
        const { count: problemCount } = await supabase
          .from('problems')
          .select('*', { count: 'exact', head: true })
          .eq('owner_id', user!.id);

        const { data: problems } = await supabase
          .from('problems')
          .select('*')
          .eq('owner_id', user!.id)
          .order('created_at', { ascending: false })
          .limit(5);

        setStats((prev) => ({
          ...prev,
          totalProblems: problemCount || 0,
        }));
        setRecentProblems((problems as Problem[]) || []);
      }

      if (role === 'innovator' || role === 'admin') {
        const { count: solutionCount } = await supabase
          .from('solutions')
          .select('*', { count: 'exact', head: true })
          .eq('innovator_id', user!.id);

        const { data: solutions } = await supabase
          .from('solutions')
          .select('*, problems(title, category)')
          .eq('innovator_id', user!.id)
          .order('created_at', { ascending: false })
          .limit(5);

        setStats((prev) => ({
          ...prev,
          totalSolutions: solutionCount || 0,
        }));
        setRecentSolutions((solutions as Solution[]) || []);
      }

      // Fetch active challenges
      const { count: activeCount } = await supabase
        .from('problems')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'open');

      setStats((prev) => ({
        ...prev,
        activeChallenges: activeCount || 0,
      }));
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'status_open' | 'status_in_review' | 'status_matched' | 'status_closed'> = {
      open: 'status_open',
      in_review: 'status_in_review',
      matched: 'status_matched',
      closed: 'status_closed',
    };
    return variants[status] || 'outline';
  };

  const quickActions = {
    enterprise: [
      { label: 'Post New Problem', href: '/dashboard/problems/new', icon: <Plus className="h-4 w-4" /> },
      { label: 'View Solutions', href: '/dashboard/problems', icon: <Sparkles className="h-4 w-4" /> },
    ],
    innovator: [
      { label: 'Browse Problems', href: '/dashboard/browse', icon: <Target className="h-4 w-4" /> },
      { label: 'My Solutions', href: '/dashboard/solutions', icon: <Sparkles className="h-4 w-4" /> },
    ],
    investor: [
      { label: 'Discover Innovations', href: '/dashboard/browse', icon: <Rocket className="h-4 w-4" /> },
      { label: 'Tracked Investments', href: '/dashboard/investments', icon: <TrendingUp className="h-4 w-4" /> },
    ],
    admin: [
      { label: 'Manage Users', href: '/dashboard/users', icon: <Target className="h-4 w-4" /> },
      { label: 'View All Problems', href: '/dashboard/problems', icon: <FileText className="h-4 w-4" /> },
    ],
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold">
          {getGreeting()}, {profile?.full_name?.split(' ')[0] || 'there'}
        </h1>
        <p className="text-muted-foreground mt-1">
          Here's what's happening with your {role === 'enterprise' ? 'challenges' : 'innovations'} today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {(role === 'enterprise' || role === 'admin') && (
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">My Problems</p>
                  <p className="text-2xl font-bold mt-1">{stats.totalProblems}</p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <FileText className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {(role === 'innovator' || role === 'admin') && (
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">My Solutions</p>
                  <p className="text-2xl font-bold mt-1">{stats.totalSolutions}</p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-accent/10 text-accent flex items-center justify-center">
                  <Sparkles className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Challenges</p>
                <p className="text-2xl font-bold mt-1">{stats.activeChallenges}</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                <Target className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Views This Week</p>
                <p className="text-2xl font-bold mt-1">--</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
                <Eye className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3">
        {role && quickActions[role]?.map((action) => (
          <Button key={action.href} variant="secondary" asChild>
            <Link to={action.href}>
              {action.icon}
              {action.label}
            </Link>
          </Button>
        ))}
      </div>

      {/* Content Sections */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Problems (Enterprise/Admin) */}
        {(role === 'enterprise' || role === 'admin') && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">Recent Problems</CardTitle>
                <CardDescription>Your latest posted challenges</CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/dashboard/problems">
                  View all <ArrowRight className="h-4 w-4 ml-1" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-16 bg-secondary/50 rounded-lg animate-pulse" />
                  ))}
                </div>
              ) : recentProblems.length > 0 ? (
                <div className="space-y-3">
                  {recentProblems.map((problem) => (
                    <div
                      key={problem.id}
                      className="p-4 rounded-lg border border-border/50 hover:border-border transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium truncate">{problem.title}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant={problem.category as any}>{problem.category}</Badge>
                            <Badge variant={getStatusBadge(problem.status)}>{problem.status}</Badge>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" asChild>
                          <Link to={`/dashboard/problems/${problem.id}`}>View</Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
                  <p className="text-muted-foreground">No problems posted yet</p>
                  <Button variant="hero" size="sm" className="mt-4" asChild>
                    <Link to="/dashboard/problems/new">Post Your First Problem</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Recent Solutions (Innovator/Admin) */}
        {(role === 'innovator' || role === 'admin') && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">Recent Solutions</CardTitle>
                <CardDescription>Your submitted solutions</CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/dashboard/solutions">
                  View all <ArrowRight className="h-4 w-4 ml-1" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-16 bg-secondary/50 rounded-lg animate-pulse" />
                  ))}
                </div>
              ) : recentSolutions.length > 0 ? (
                <div className="space-y-3">
                  {recentSolutions.map((solution) => (
                    <div
                      key={solution.id}
                      className="p-4 rounded-lg border border-border/50 hover:border-border transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium truncate">{solution.title}</h4>
                          <p className="text-sm text-muted-foreground truncate">
                            For: {(solution as any).problems?.title || 'Unknown problem'}
                          </p>
                        </div>
                        <Badge
                          variant={
                            solution.status === 'accepted'
                              ? 'status_matched'
                              : solution.status === 'rejected'
                              ? 'destructive'
                              : 'outline'
                          }
                        >
                          {solution.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Sparkles className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
                  <p className="text-muted-foreground">No solutions submitted yet</p>
                  <Button variant="hero" size="sm" className="mt-4" asChild>
                    <Link to="/dashboard/browse">Browse Problems</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Activity Feed */}
        <Card className={role === 'investor' ? 'lg:col-span-2' : ''}>
          <CardHeader>
            <CardTitle className="text-lg">Recent Activity</CardTitle>
            <CardDescription>Latest updates on the platform</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { icon: <Clock className="h-4 w-4" />, text: 'New problems added in Technology', time: '2 hours ago' },
                { icon: <CheckCircle2 className="h-4 w-4" />, text: 'Platform update: AI matching improved', time: '1 day ago' },
                { icon: <TrendingUp className="h-4 w-4" />, text: '50+ new solutions this week', time: '3 days ago' },
              ].map((activity, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center text-muted-foreground">
                    {activity.icon}
                  </div>
                  <div>
                    <p className="text-sm">{activity.text}</p>
                    <p className="text-xs text-muted-foreground">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardOverview;
