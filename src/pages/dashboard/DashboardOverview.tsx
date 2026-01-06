import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Plus,
  Target,
  Calendar,
  User,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { format } from 'date-fns';
import { MetricsPanel } from '@/components/dashboard/MetricsPanel';
import { CategoryPerformanceTable, CategoryData } from '@/components/dashboard/CategoryPerformanceTable';
import { ProductTrackerTable, ProductData } from '@/components/dashboard/ProductTrackerTable';
import { DemoTrendsChart } from '@/components/dashboard/DemoTrendsChart';
import { CategoryMomentumChart } from '@/components/dashboard/CategoryMomentumChart';
import { DashboardFilters } from '@/components/dashboard/DashboardFilters';

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

// Sample data for the new dashboard
const sampleCategoryData: CategoryData[] = [
  { category: 'AI & ML', productsUploaded: 12, demoPlays: 2450, targetMarketSpread: 'Global', momentumChange: 15 },
  { category: 'HealthTech', productsUploaded: 8, demoPlays: 1890, targetMarketSpread: 'NA, EU', momentumChange: 8 },
  { category: 'EdTech', productsUploaded: 6, demoPlays: 1240, targetMarketSpread: 'APAC', momentumChange: -3 },
  { category: 'Sustainability', productsUploaded: 4, demoPlays: 890, targetMarketSpread: 'EU, NA', momentumChange: 22 },
  { category: 'Others', productsUploaded: 3, demoPlays: 456, targetMarketSpread: 'Global', momentumChange: 0 },
];

const sampleProductData: ProductData[] = [
  { id: '1', name: 'SmartVision AI', category: 'AI & ML', demoPlays: 1245, status: 'active', dateUploaded: '2025-12-15' },
  { id: '2', name: 'EcoTrack', category: 'Sustainability', demoPlays: 890, status: 'active', dateUploaded: '2025-12-10' },
  { id: '3', name: 'MedAssist XR', category: 'HealthTech', demoPlays: 567, status: 'pending', dateUploaded: '2025-12-08' },
  { id: '4', name: 'LearnFlow Pro', category: 'EdTech', demoPlays: 423, status: 'active', dateUploaded: '2025-12-05' },
  { id: '5', name: 'DataSync Hub', category: 'AI & ML', demoPlays: 312, status: 'draft', dateUploaded: '2025-12-01' },
];

const dailyChartData = [
  { name: 'Mon', demoPlays: 320, momentum: 120 },
  { name: 'Tue', demoPlays: 450, momentum: 180 },
  { name: 'Wed', demoPlays: 380, momentum: 150 },
  { name: 'Thu', demoPlays: 520, momentum: 210 },
  { name: 'Fri', demoPlays: 680, momentum: 280 },
  { name: 'Sat', demoPlays: 420, momentum: 160 },
  { name: 'Sun', demoPlays: 380, momentum: 140 },
];

const weeklyChartData = [
  { name: 'Week 1', demoPlays: 2400, momentum: 900 },
  { name: 'Week 2', demoPlays: 2800, momentum: 1100 },
  { name: 'Week 3', demoPlays: 3200, momentum: 1400 },
  { name: 'Week 4', demoPlays: 3600, momentum: 1600 },
];

const monthlyChartData = [
  { name: 'Sep', demoPlays: 8500, momentum: 3200 },
  { name: 'Oct', demoPlays: 9800, momentum: 3800 },
  { name: 'Nov', demoPlays: 11200, momentum: 4500 },
  { name: 'Dec', demoPlays: 12800, momentum: 5200 },
];

const categoryMomentumData = [
  { category: 'AI & ML', momentum: 15 },
  { category: 'HealthTech', momentum: 8 },
  { category: 'EdTech', momentum: -3 },
  { category: 'Sustainability', momentum: 22 },
  { category: 'Others', momentum: 0 },
];

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

  const handleProductView = (id: string) => {
    console.log('View product:', id);
  };

  const handleProductEdit = (id: string) => {
    console.log('Edit product:', id);
  };

  const handleProductDelete = (id: string) => {
    console.log('Delete product:', id);
  };

  // Calculate metrics from sample data
  const totalProducts = sampleCategoryData.reduce((sum, cat) => sum + cat.productsUploaded, 0);
  const totalDemoPlays = sampleCategoryData.reduce((sum, cat) => sum + cat.demoPlays, 0);
  const totalCategories = sampleCategoryData.length;
  const totalMarkets = 4; // Global, NA, EU, APAC

  return (
    <div className="space-y-6">
      {/* Header with Profile Summary */}
      <div className="grid lg:grid-cols-12 gap-6">
        {/* Profile Card - Left Side */}
        <Card className="lg:col-span-4 bg-gradient-to-br from-card/80 to-card/40 border-border/50 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex flex-col items-center text-center">
              <div className="relative">
                <Avatar className="h-20 w-20 border-4 border-primary/20 shadow-lg shadow-primary/10">
                  <AvatarImage src={profile?.avatar_url || ''} />
                  <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                    {profile?.full_name?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-emerald-500 border-2 border-background flex items-center justify-center">
                  <Zap className="h-3 w-3 text-white" />
                </div>
              </div>
              
              <div className="mt-4 space-y-1">
                <p className="text-sm text-muted-foreground">{getGreeting()}</p>
                <h3 className="font-bold text-xl">{profile?.full_name || 'User'}</h3>
                <Badge variant="secondary" className="capitalize text-xs px-3 py-0.5 bg-primary/10 text-primary border-primary/20">
                  {role}
                </Badge>
              </div>
              
              <div className="w-full mt-6 space-y-2">
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span className="text-sm">Joined</span>
                  </div>
                  <span className="text-sm font-medium">
                    {profile?.created_at ? format(new Date(profile.created_at), 'MMM yyyy') : 'Recently'}
                  </span>
                </div>
                
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <TrendingUp className="h-4 w-4" />
                    <span className="text-sm">Activity Score</span>
                  </div>
                  <span className="text-sm font-medium text-emerald-400">
                    +{stats.totalProblems + stats.totalSolutions + stats.bookmarksCount}
                  </span>
                </div>
              </div>

              <Button variant="outline" size="sm" className="mt-4 w-full hover:bg-primary/10 hover:text-primary hover:border-primary/30" asChild>
                <Link to="/profile">
                  <User className="h-4 w-4 mr-2" />
                  Edit Profile
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Right Side - Header + Metrics */}
        <div className="lg:col-span-8 space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                Dashboard Overview
              </h1>
              <p className="text-muted-foreground mt-1">Track your products, demos, and market performance</p>
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

          {/* Metrics Panel */}
          <MetricsPanel
            productsUploaded={totalProducts}
            demoPlays={totalDemoPlays}
            categoriesRepresented={totalCategories}
            targetMarketsReached={totalMarkets}
          />
        </div>
      </div>

      {/* Filters */}
      <DashboardFilters />

      {/* Charts Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        <DemoTrendsChart
          dailyData={dailyChartData}
          weeklyData={weeklyChartData}
          monthlyData={monthlyChartData}
        />
        <CategoryMomentumChart data={categoryMomentumData} />
      </div>

      {/* Tables */}
      <CategoryPerformanceTable data={sampleCategoryData} />
      
      <ProductTrackerTable
        data={sampleProductData}
        onView={handleProductView}
        onEdit={handleProductEdit}
        onDelete={handleProductDelete}
      />

      {/* Quick Actions */}
      <div className="grid md:grid-cols-3 gap-4">
        <Button variant="outline" className="h-auto p-5 justify-start hover:border-primary/50 hover:bg-primary/5 transition-all group" asChild>
          <Link to="/dashboard/solutions">
            <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary/20 transition-colors mr-4">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div className="text-left">
              <div className="font-semibold">My Solutions</div>
              <div className="text-xs text-muted-foreground">View all your submissions</div>
            </div>
          </Link>
        </Button>
        <Button variant="outline" className="h-auto p-5 justify-start hover:border-accent/50 hover:bg-accent/5 transition-all group" asChild>
          <Link to="/dashboard/browse">
            <div className="h-10 w-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center group-hover:bg-accent/20 transition-colors mr-4">
              <Target className="h-5 w-5" />
            </div>
            <div className="text-left">
              <div className="font-semibold">Browse Problems</div>
              <div className="text-xs text-muted-foreground">Find new challenges</div>
            </div>
          </Link>
        </Button>
        <Button variant="outline" className="h-auto p-5 justify-start hover:border-amber-500/50 hover:bg-amber-500/5 transition-all group" asChild>
          <Link to="/dashboard/bookmarks">
            <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center group-hover:bg-amber-500/20 transition-colors mr-4">
              <Zap className="h-5 w-5" />
            </div>
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
