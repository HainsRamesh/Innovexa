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
  TrendingUp,
  Bookmark,
  Plus,
  Target,
  Calendar,
  CheckCircle2,
  Clock,
  User,
} from 'lucide-react';
import { format } from 'date-fns';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';

interface DashboardStats {
  totalProblems: number;
  totalSolutions: number;
  acceptedSolutions: number;
  pendingSolutions: number;
  bookmarksCount: number;
}

const DashboardOverview = () => {
  const { user, profile, role } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalProblems: 0,
    totalSolutions: 0,
    acceptedSolutions: 0,
    pendingSolutions: 0,
    bookmarksCount: 0,
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
        supabase.from('bookmarks').select('*', { count: 'exact', head: true }).eq('user_id', user!.id),
      ]);

      const solutions = solutionsRes.data || [];
      setStats({
        totalProblems: problemsRes.count || 0,
        totalSolutions: solutions.length,
        acceptedSolutions: solutions.filter((s) => s.status === 'accepted').length,
        pendingSolutions: solutions.filter((s) => ['submitted', 'under_review', 'shortlisted'].includes(s.status)).length,
        bookmarksCount: bookmarksRes.count || 0,
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

  const solutionChartData = [
    { name: 'Accepted', value: stats.acceptedSolutions, color: 'hsl(var(--primary))' },
    { name: 'Pending', value: stats.pendingSolutions, color: 'hsl(var(--muted-foreground))' },
  ].filter((d) => d.value > 0);

  const activityData = [
    { name: 'Mon', problems: 2, solutions: 4 },
    { name: 'Tue', problems: 1, solutions: 3 },
    { name: 'Wed', problems: 3, solutions: 2 },
    { name: 'Thu', problems: 0, solutions: 5 },
    { name: 'Fri', problems: 2, solutions: 1 },
  ];

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
              <Link to="/dashboard/problems/new"><Plus className="h-4 w-4 mr-2" />Post Problem</Link>
            </Button>
          )}
          {(role === 'innovator' || role === 'admin') && (
            <Button variant="secondary" asChild>
              <Link to="/dashboard/browse"><Target className="h-4 w-4 mr-2" />Find Problems</Link>
            </Button>
          )}
        </div>
      </div>

      {/* Profile Card + Stats */}
      <div className="grid lg:grid-cols-4 gap-6">
        {/* Profile Summary */}
        <Card className="lg:row-span-2">
          <CardContent className="p-6">
            <div className="flex flex-col items-center text-center">
              <Avatar className="h-20 w-20 mb-4 border-2 border-primary/20">
                <AvatarImage src={profile?.avatar_url || ''} />
                <AvatarFallback className="text-lg bg-primary/10 text-primary">
                  {profile?.full_name?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <h3 className="font-semibold text-lg">{profile?.full_name || 'User'}</h3>
              <Badge variant="secondary" className="mt-2 capitalize">{role}</Badge>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-3">
                <Calendar className="h-4 w-4" />
                Joined {profile?.created_at ? format(new Date(profile.created_at), 'MMM yyyy') : 'Recently'}
              </div>
              <Button variant="outline" size="sm" className="mt-4 w-full" asChild>
                <Link to="/profile"><User className="h-4 w-4 mr-2" />Edit Profile</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Problems Posted</p>
                <p className="text-3xl font-bold mt-1">{stats.totalProblems}</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <FileText className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Solutions Submitted</p>
                <p className="text-3xl font-bold mt-1">{stats.totalSolutions}</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-accent/10 text-accent flex items-center justify-center">
                <Sparkles className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Bookmarks</p>
                <p className="text-3xl font-bold mt-1">{stats.bookmarksCount}</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                <Bookmark className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Solution Status Chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Solution Status</CardTitle>
          </CardHeader>
          <CardContent>
            {solutionChartData.length > 0 ? (
              <div className="flex items-center gap-4">
                <ResponsiveContainer width={80} height={80}>
                  <PieChart>
                    <Pie data={solutionChartData} dataKey="value" cx="50%" cy="50%" innerRadius={25} outerRadius={35}>
                      {solutionChartData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-1 text-sm">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    <span>{stats.acceptedSolutions} Accepted</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{stats.pendingSolutions} Pending</span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No solutions yet</p>
            )}
          </CardContent>
        </Card>

        {/* Activity Chart */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Weekly Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={100}>
              <BarChart data={activityData}>
                <XAxis dataKey="name" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
                <Bar dataKey="solutions" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Quick Links */}
      <div className="grid md:grid-cols-3 gap-4">
        <Button variant="outline" className="h-auto p-4 justify-start" asChild>
          <Link to="/dashboard/solutions">
            <Sparkles className="h-5 w-5 mr-3 text-primary" />
            <div className="text-left"><div className="font-medium">My Solutions</div><div className="text-xs text-muted-foreground">View all your submissions</div></div>
          </Link>
        </Button>
        <Button variant="outline" className="h-auto p-4 justify-start" asChild>
          <Link to="/dashboard/browse">
            <Target className="h-5 w-5 mr-3 text-accent" />
            <div className="text-left"><div className="font-medium">Browse Problems</div><div className="text-xs text-muted-foreground">Find new challenges</div></div>
          </Link>
        </Button>
        <Button variant="outline" className="h-auto p-4 justify-start" asChild>
          <Link to="/dashboard/bookmarks">
            <Bookmark className="h-5 w-5 mr-3 text-amber-500" />
            <div className="text-left"><div className="font-medium">Bookmarks</div><div className="text-xs text-muted-foreground">Your saved items</div></div>
          </Link>
        </Button>
      </div>
    </div>
  );
};

export default DashboardOverview;
