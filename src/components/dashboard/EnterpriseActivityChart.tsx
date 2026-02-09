import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LineChart, BarChart } from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { format, subDays, subWeeks, subMonths, startOfDay, startOfWeek, startOfMonth, parseISO } from 'date-fns';

interface ChartDataPoint {
  name: string;
  problemsCreated: number;
  problemsViewed: number;
  solutionsReviewed: number;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card/95 border border-border/50 rounded-lg p-3 shadow-xl backdrop-blur-sm">
        <p className="text-sm font-medium text-foreground mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-xs" style={{ color: entry.color }}>
            {entry.name}: <span className="font-semibold">{entry.value}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export const EnterpriseActivityChart = () => {
  const { user } = useAuth();
  const [timeRange, setTimeRange] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [chartType, setChartType] = useState<'line' | 'bar'>('line');
  const [chartData, setChartData] = useState<{
    daily: ChartDataPoint[];
    weekly: ChartDataPoint[];
    monthly: ChartDataPoint[];
  }>({
    daily: [],
    weekly: [],
    monthly: [],
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchEnterpriseData = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      // Fetch problems owned by this enterprise
      const { data: problems } = await supabase
        .from('problems')
        .select('id, created_at, view_count')
        .eq('owner_id', user.id);

      const problemIds = (problems || []).map(p => p.id);

      // Fetch solutions submitted to these problems
      const { data: solutions } = problemIds.length > 0
        ? await supabase
            .from('solutions')
            .select('id, created_at, problem_id')
            .in('problem_id', problemIds)
        : { data: [] };

      // Build daily data (last 7 days)
      const dailyData: ChartDataPoint[] = [];
      for (let i = 6; i >= 0; i--) {
        const date = subDays(new Date(), i);
        const dayStart = startOfDay(date);
        const dayEnd = new Date(dayStart);
        dayEnd.setDate(dayEnd.getDate() + 1);

        const problemsCreated = (problems || []).filter(p => {
          const created = parseISO(p.created_at);
          return created >= dayStart && created < dayEnd;
        }).length;

        const problemsViewed = (problems || []).filter(p => {
          const created = parseISO(p.created_at);
          return created >= dayStart && created < dayEnd;
        }).reduce((sum, p) => sum + (p.view_count || 0), 0);

        const solutionsReviewed = (solutions || []).filter(s => {
          const created = parseISO(s.created_at);
          return created >= dayStart && created < dayEnd;
        }).length;

        dailyData.push({
          name: format(date, 'EEE'),
          problemsCreated,
          problemsViewed,
          solutionsReviewed,
        });
      }

      // Build weekly data (last 4 weeks)
      const weeklyData: ChartDataPoint[] = [];
      for (let i = 3; i >= 0; i--) {
        const date = subWeeks(new Date(), i);
        const weekStart = startOfWeek(date);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 7);

        const problemsCreated = (problems || []).filter(p => {
          const created = parseISO(p.created_at);
          return created >= weekStart && created < weekEnd;
        }).length;

        const problemsViewed = (problems || []).filter(p => {
          const created = parseISO(p.created_at);
          return created >= weekStart && created < weekEnd;
        }).reduce((sum, p) => sum + (p.view_count || 0), 0);

        const solutionsReviewed = (solutions || []).filter(s => {
          const created = parseISO(s.created_at);
          return created >= weekStart && created < weekEnd;
        }).length;

        weeklyData.push({
          name: `Week ${4 - i}`,
          problemsCreated,
          problemsViewed,
          solutionsReviewed,
        });
      }

      // Build monthly data (last 6 months)
      const monthlyData: ChartDataPoint[] = [];
      for (let i = 5; i >= 0; i--) {
        const date = subMonths(new Date(), i);
        const monthStart = startOfMonth(date);
        const monthEnd = new Date(monthStart);
        monthEnd.setMonth(monthEnd.getMonth() + 1);

        const problemsCreated = (problems || []).filter(p => {
          const created = parseISO(p.created_at);
          return created >= monthStart && created < monthEnd;
        }).length;

        const problemsViewed = (problems || []).filter(p => {
          const created = parseISO(p.created_at);
          return created >= monthStart && created < monthEnd;
        }).reduce((sum, p) => sum + (p.view_count || 0), 0);

        const solutionsReviewed = (solutions || []).filter(s => {
          const created = parseISO(s.created_at);
          return created >= monthStart && created < monthEnd;
        }).length;

        monthlyData.push({
          name: format(date, 'MMM'),
          problemsCreated,
          problemsViewed,
          solutionsReviewed,
        });
      }

      setChartData({ daily: dailyData, weekly: weeklyData, monthly: monthlyData });
    } catch (error) {
      console.error('Error fetching enterprise activity data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchEnterpriseData();
  }, [fetchEnterpriseData]);

  const getData = () => {
    switch (timeRange) {
      case 'daily':
        return chartData.daily;
      case 'weekly':
        return chartData.weekly;
      case 'monthly':
        return chartData.monthly;
      default:
        return chartData.daily;
    }
  };

  const data = getData();

  return (
    <Card className="bg-card/50 border-border/50 h-full">
      <CardHeader className="pb-2 px-3 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <CardTitle className="text-sm sm:text-lg font-semibold flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            Enterprise Activity
          </CardTitle>

          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
            {/* Time Range Toggle */}
            <div className="flex rounded-lg border border-border/50 overflow-hidden">
              {(['daily', 'weekly', 'monthly'] as const).map((range) => (
                <Button
                  key={range}
                  variant="ghost"
                  size="sm"
                  onClick={() => setTimeRange(range)}
                  className={`h-7 px-2 sm:px-3 rounded-none text-[11px] sm:text-xs capitalize ${
                    timeRange === range
                      ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                      : 'hover:bg-muted/50'
                  }`}
                >
                  {range}
                </Button>
              ))}
            </div>

            {/* Chart Type Toggle */}
            <div className="flex rounded-lg border border-border/50 overflow-hidden">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setChartType('line')}
                className={`h-7 px-2 rounded-none ${
                  chartType === 'line'
                    ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                    : 'hover:bg-muted/50'
                }`}
              >
                <LineChart className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setChartType('bar')}
                className={`h-7 px-2 rounded-none ${
                  chartType === 'bar'
                    ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                    : 'hover:bg-muted/50'
                }`}
              >
                <BarChart className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-4 px-2 sm:px-6">
        <div className="h-[200px] sm:h-[240px]">
          {isLoading ? (
            <div className="h-full flex items-center justify-center">
              <div className="animate-pulse text-muted-foreground">Loading...</div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              {chartType === 'line' ? (
                <AreaChart data={data}>
                  <defs>
                    <linearGradient id="enterpriseProblemsCreated" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6B7A99" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#6B7A99" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="enterpriseProblemsViewed" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#D4A574" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#D4A574" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="enterpriseSolutionsReviewed" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#5BA3A3" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#5BA3A3" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} width={30} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="problemsCreated" name="Problems Created" stroke="#6B7A99" fill="url(#enterpriseProblemsCreated)" strokeWidth={2} />
                  <Area type="monotone" dataKey="problemsViewed" name="Problems Viewed" stroke="#D4A574" fill="url(#enterpriseProblemsViewed)" strokeWidth={2} />
                  <Area type="monotone" dataKey="solutionsReviewed" name="Solutions Reviewed" stroke="#5BA3A3" fill="url(#enterpriseSolutionsReviewed)" strokeWidth={2} />
                </AreaChart>
              ) : (
                <RechartsBarChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} width={30} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="problemsCreated" name="Problems Created" fill="#6B7A99" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="problemsViewed" name="Problems Viewed" fill="#D4A574" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="solutionsReviewed" name="Solutions Reviewed" fill="#5BA3A3" radius={[4, 4, 0, 0]} />
                </RechartsBarChart>
              )}
            </ResponsiveContainer>
          )}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-3 sm:gap-6 mt-3 sm:mt-4 flex-wrap">
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: '#6B7A99' }} />
            <span className="text-[10px] sm:text-xs text-muted-foreground">Problems Created</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: '#D4A574' }} />
            <span className="text-[10px] sm:text-xs text-muted-foreground">Problems Viewed</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: '#5BA3A3' }} />
            <span className="text-[10px] sm:text-xs text-muted-foreground">Solutions Reviewed</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
