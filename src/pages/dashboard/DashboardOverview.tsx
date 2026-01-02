import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  FileText,
  Sparkles,
  Bookmark,
  Plus,
  Target,
  Calendar,
  CheckCircle2,
  Clock,
  User,
  XCircle,
  TrendingUp,
} from 'lucide-react';
import { format } from 'date-fns';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface DashboardStats {
  totalProblems: number;
  totalSolutions: number;
  acceptedSolutions: number;
  pendingSolutions: number;
  rejectedSolutions: number;
  bookmarksCount: number;
  problemBookmarks: number;
  solutionBookmarks: number;
}

const CHART_COLORS = {
  primary: 'hsl(var(--primary))',
  accent: 'hsl(var(--accent))',
  muted: 'hsl(var(--muted-foreground))',
  destructive: 'hsl(var(--destructive))',
  success: 'hsl(142 76% 36%)',
  warning: 'hsl(45 93% 47%)',
  info: 'hsl(221 83% 53%)',
};

const DashboardOverview = () => {
  const { user, profile, role } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalProblems: 0,
    totalSolutions: 0,
    acceptedSolutions: 0,
    pendingSolutions: 0,
    rejectedSolutions: 0,
    bookmarksCount: 0,
    problemBookmarks: 0,
    solutionBookmarks: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) fetchDashboardData();
  }, [user, role]);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const [problemsRes, solutionsRes, bookmarksRes] = await Promise.all([
        supabase.from('problems').select('*', { count: 'exact', head: true }).eq('owner_id', user!.id),
        supabase.from('solutions').select('status').eq('innovator_id', user!.id),
        supabase.from('bookmarks').select('problem_id, solution_id').eq('user_id', user!.id),
      ]);

      const solutions = solutionsRes.data || [];
      const bookmarks = bookmarksRes.data || [];
      
      setStats({
        totalProblems: problemsRes.count || 0,
        totalSolutions: solutions.length,
        acceptedSolutions: solutions.filter((s) => s.status === 'accepted').length,
        pendingSolutions: solutions.filter((s) => ['submitted', 'under_review', 'shortlisted'].includes(s.status)).length,
        rejectedSolutions: solutions.filter((s) => s.status === 'rejected').length,
        bookmarksCount: bookmarks.length,
        problemBookmarks: bookmarks.filter(b => b.problem_id).length,
        solutionBookmarks: bookmarks.filter(b => b.solution_id).length,
      });
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

  // Pie chart data - Solutions Status Distribution
  const solutionStatusData = [
    { name: 'Accepted', value: stats.acceptedSolutions, color: CHART_COLORS.success },
    { name: 'Pending', value: stats.pendingSolutions, color: CHART_COLORS.warning },
    { name: 'Rejected', value: stats.rejectedSolutions, color: CHART_COLORS.destructive },
  ].filter((d) => d.value > 0);

  // Pie chart data - User Activity Breakdown
  const activityBreakdownData = [
    { name: 'Problems', value: stats.totalProblems, color: CHART_COLORS.primary },
    { name: 'Solutions', value: stats.totalSolutions, color: CHART_COLORS.accent },
    { name: 'Bookmarks', value: stats.bookmarksCount, color: CHART_COLORS.warning },
  ].filter((d) => d.value > 0);

  // Pie chart data - Bookmark Distribution
  const bookmarkDistributionData = [
    { name: 'Problems', value: stats.problemBookmarks, color: CHART_COLORS.info },
    { name: 'Solutions', value: stats.solutionBookmarks, color: CHART_COLORS.accent },
  ].filter((d) => d.value > 0);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-lg">
          <p className="text-sm font-medium">{payload[0].name}</p>
          <p className="text-sm text-muted-foreground">{payload[0].value} items</p>
        </div>
      );
    }
    return null;
  };

  const renderPieChart = (data: any[], title: string, icon: React.ReactNode) => {
    if (data.length === 0) {
      return (
        <Card className="h-full">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              {icon}
              {title}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center h-40">
            <p className="text-sm text-muted-foreground">No data yet</p>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card className="h-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            {icon}
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <ResponsiveContainer width={120} height={120}>
              <PieChart>
                <Pie
                  data={data}
                  dataKey="value"
                  cx="50%"
                  cy="50%"
                  innerRadius={35}
                  outerRadius={50}
                  paddingAngle={2}
                >
                  {data.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2 flex-1">
              {data.map((item, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-muted-foreground">{item.name}</span>
                  </div>
                  <span className="font-medium">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">
            {getGreeting()}, {profile?.full_name?.split(' ')[0] || 'there'}
          </h1>
          <p className="text-muted-foreground mt-1">Here's your activity overview</p>
        </div>
        <div className="flex gap-3">
          {(role === 'enterprise' || role === 'admin') && (
            <Button variant="hero" asChild>
              <Link to="/dashboard/problems/new">
                <Plus className="h-4 w-4 mr-2" />
                Post Problem
              </Link>
            </Button>
          )}
          {(role === 'innovator' || role === 'admin') && (
            <Button variant="secondary" asChild>
              <Link to="/dashboard/browse">
                <Target className="h-4 w-4 mr-2" />
                Find Problems
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Profile + Stats Grid */}
      <div className="grid lg:grid-cols-5 gap-6">
        {/* Profile Summary Card */}
        <Card className="lg:col-span-2 lg:row-span-2">
          <CardContent className="p-6">
            <div className="flex flex-col items-center text-center">
              <Avatar className="h-24 w-24 mb-4 border-4 border-primary/20 shadow-lg">
                <AvatarImage src={profile?.avatar_url || ''} />
                <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                  {profile?.full_name?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <h3 className="font-bold text-xl">{profile?.full_name || 'User'}</h3>
              <Badge variant="secondary" className="mt-2 capitalize text-sm px-3 py-1">
                {role}
              </Badge>
              
              <div className="w-full mt-6 space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span className="text-sm">Joined</span>
                  </div>
                  <span className="text-sm font-medium">
                    {profile?.created_at ? format(new Date(profile.created_at), 'MMM yyyy') : 'Recently'}
                  </span>
                </div>
                
                <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <TrendingUp className="h-4 w-4" />
                    <span className="text-sm">Total Activity</span>
                  </div>
                  <span className="text-sm font-medium">
                    {stats.totalProblems + stats.totalSolutions + stats.bookmarksCount}
                  </span>
                </div>
              </div>

              <Button variant="outline" size="sm" className="mt-6 w-full" asChild>
                <Link to="/profile">
                  <User className="h-4 w-4 mr-2" />
                  Edit Profile
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards Row */}
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Problems Posted</p>
                <p className="text-3xl font-bold mt-1">{stats.totalProblems}</p>
              </div>
              <div className="h-14 w-14 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <FileText className="h-7 w-7" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Solutions Submitted</p>
                <p className="text-3xl font-bold mt-1">{stats.totalSolutions}</p>
              </div>
              <div className="h-14 w-14 rounded-xl bg-accent/10 text-accent flex items-center justify-center">
                <Sparkles className="h-7 w-7" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Bookmarks</p>
                <p className="text-3xl font-bold mt-1">{stats.bookmarksCount}</p>
              </div>
              <div className="h-14 w-14 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                <Bookmark className="h-7 w-7" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pie Charts Row */}
        {renderPieChart(
          solutionStatusData,
          'Solutions Status',
          <Sparkles className="h-4 w-4 text-primary" />
        )}

        {renderPieChart(
          activityBreakdownData,
          'Activity Breakdown',
          <TrendingUp className="h-4 w-4 text-primary" />
        )}

        {renderPieChart(
          bookmarkDistributionData,
          'Bookmark Distribution',
          <Bookmark className="h-4 w-4 text-amber-500" />
        )}
      </div>

      {/* Status Summary Cards */}
      <div className="grid sm:grid-cols-3 gap-4">
        <Card className="bg-green-500/5 border-green-500/20 hover:border-green-500/40 transition-colors">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-green-500/10 flex items-center justify-center">
              <CheckCircle2 className="h-6 w-6 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Accepted Solutions</p>
              <p className="text-2xl font-bold">{stats.acceptedSolutions}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-amber-500/5 border-amber-500/20 hover:border-amber-500/40 transition-colors">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
              <Clock className="h-6 w-6 text-amber-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pending Review</p>
              <p className="text-2xl font-bold">{stats.pendingSolutions}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-destructive/5 border-destructive/20 hover:border-destructive/40 transition-colors">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-destructive/10 flex items-center justify-center">
              <XCircle className="h-6 w-6 text-destructive" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Rejected</p>
              <p className="text-2xl font-bold">{stats.rejectedSolutions}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Links */}
      <div className="grid md:grid-cols-3 gap-4">
        <Button variant="outline" className="h-auto p-5 justify-start hover:border-primary/50 transition-colors" asChild>
          <Link to="/dashboard/solutions">
            <Sparkles className="h-6 w-6 mr-4 text-primary" />
            <div className="text-left">
              <div className="font-semibold">My Solutions</div>
              <div className="text-xs text-muted-foreground">View all your submissions</div>
            </div>
          </Link>
        </Button>
        <Button variant="outline" className="h-auto p-5 justify-start hover:border-primary/50 transition-colors" asChild>
          <Link to="/dashboard/browse">
            <Target className="h-6 w-6 mr-4 text-accent" />
            <div className="text-left">
              <div className="font-semibold">Browse Problems</div>
              <div className="text-xs text-muted-foreground">Find new challenges</div>
            </div>
          </Link>
        </Button>
        <Button variant="outline" className="h-auto p-5 justify-start hover:border-primary/50 transition-colors" asChild>
          <Link to="/dashboard/bookmarks">
            <Bookmark className="h-6 w-6 mr-4 text-amber-500" />
            <div className="text-left">
              <div className="font-semibold">Bookmarks</div>
              <div className="text-xs text-muted-foreground">Your saved items</div>
            </div>
          </Link>
        </Button>
      </div>
    </div>
  );
};

export default DashboardOverview;
