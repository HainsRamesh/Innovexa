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
  innovationsViewed: number;
  innovationsBookmarked: number;
  investmentsMade: number;
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

export const InvestorInnovationChart = () => {
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

  const fetchInvestorData = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      // Fetch investments made by this investor
      const { data: investments } = await supabase
        .from('investments')
        .select('id, created_at')
        .eq('investor_id', user.id);

      // Fetch bookmarks for innovations by this user
      const { data: bookmarks } = await supabase
        .from('bookmarks')
        .select('id, created_at, innovation_id')
        .eq('user_id', user.id)
        .not('innovation_id', 'is', null);

      // Fetch all published innovations for trending data
      const { data: innovations } = await supabase
        .from('innovations')
        .select('id, created_at, view_count')
        .in('status', ['published', 'featured']);

      // Build daily data (last 7 days)
      const dailyData: ChartDataPoint[] = [];
      for (let i = 6; i >= 0; i--) {
        const date = subDays(new Date(), i);
        const dayStart = startOfDay(date);
        const dayEnd = new Date(dayStart);
        dayEnd.setDate(dayEnd.getDate() + 1);

        const innovationsViewed = (innovations || []).filter(inn => {
          const created = parseISO(inn.created_at);
          return created >= dayStart && created < dayEnd;
        }).reduce((sum, inn) => sum + (inn.view_count || 0), 0);

        const innovationsBookmarked = (bookmarks || []).filter(b => {
          const created = parseISO(b.created_at);
          return created >= dayStart && created < dayEnd;
        }).length;

        const investmentsMade = (investments || []).filter(inv => {
          const created = parseISO(inv.created_at);
          return created >= dayStart && created < dayEnd;
        }).length;

        dailyData.push({
          name: format(date, 'EEE'),
          innovationsViewed,
          innovationsBookmarked,
          investmentsMade,
        });
      }

      // Build weekly data (last 4 weeks)
      const weeklyData: ChartDataPoint[] = [];
      for (let i = 3; i >= 0; i--) {
        const date = subWeeks(new Date(), i);
        const weekStart = startOfWeek(date);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 7);

        const innovationsViewed = (innovations || []).filter(inn => {
          const created = parseISO(inn.created_at);
          return created >= weekStart && created < weekEnd;
        }).reduce((sum, inn) => sum + (inn.view_count || 0), 0);

        const innovationsBookmarked = (bookmarks || []).filter(b => {
          const created = parseISO(b.created_at);
          return created >= weekStart && created < weekEnd;
        }).length;

        const investmentsMade = (investments || []).filter(inv => {
          const created = parseISO(inv.created_at);
          return created >= weekStart && created < weekEnd;
        }).length;

        weeklyData.push({
          name: `Week ${4 - i}`,
          innovationsViewed,
          innovationsBookmarked,
          investmentsMade,
        });
      }

      // Build monthly data (last 6 months)
      const monthlyData: ChartDataPoint[] = [];
      for (let i = 5; i >= 0; i--) {
        const date = subMonths(new Date(), i);
        const monthStart = startOfMonth(date);
        const monthEnd = new Date(monthStart);
        monthEnd.setMonth(monthEnd.getMonth() + 1);

        const innovationsViewed = (innovations || []).filter(inn => {
          const created = parseISO(inn.created_at);
          return created >= monthStart && created < monthEnd;
        }).reduce((sum, inn) => sum + (inn.view_count || 0), 0);

        const innovationsBookmarked = (bookmarks || []).filter(b => {
          const created = parseISO(b.created_at);
          return created >= monthStart && created < monthEnd;
        }).length;

        const investmentsMade = (investments || []).filter(inv => {
          const created = parseISO(inv.created_at);
          return created >= monthStart && created < monthEnd;
        }).length;

        monthlyData.push({
          name: format(date, 'MMM'),
          innovationsViewed,
          innovationsBookmarked,
          investmentsMade,
        });
      }

      setChartData({ daily: dailyData, weekly: weeklyData, monthly: monthlyData });
    } catch (error) {
      console.error('Error fetching investor innovation data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchInvestorData();
  }, [fetchInvestorData]);

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
      <CardHeader className="pb-2 px-2 sm:px-6 pt-3 sm:pt-6">
        <div className="flex flex-col gap-2">
          <CardTitle className="text-sm sm:text-base font-semibold flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-accent animate-pulse shrink-0" />
            Innovation Insights
          </CardTitle>

          <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
            {/* Time Range Toggle */}
            <div className="flex rounded-lg border border-border/50 overflow-hidden">
              {(['daily', 'weekly', 'monthly'] as const).map((range) => (
                <Button
                  key={range}
                  variant="ghost"
                  size="sm"
                  onClick={() => setTimeRange(range)}
                  className={`h-6 sm:h-7 px-1.5 sm:px-3 rounded-none text-[10px] sm:text-xs capitalize ${
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
                className={`h-6 sm:h-7 px-1.5 sm:px-2 rounded-none ${
                  chartType === 'line'
                    ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                    : 'hover:bg-muted/50'
                }`}
              >
                <LineChart className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setChartType('bar')}
                className={`h-6 sm:h-7 px-1.5 sm:px-2 rounded-none ${
                  chartType === 'bar'
                    ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                    : 'hover:bg-muted/50'
                }`}
              >
                <BarChart className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-3 sm:pt-4 px-1 sm:px-6 pb-3 sm:pb-6">
        <div className="h-[180px] sm:h-[240px]">
          {isLoading ? (
            <div className="h-full flex items-center justify-center">
              <div className="animate-pulse text-muted-foreground">Loading...</div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              {chartType === 'line' ? (
                <AreaChart data={data}>
                  <defs>
                    <linearGradient id="investorInnovationsViewed" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="investorInnovationsBookmarked" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="investorInvestmentsMade" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={9} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={9} tickLine={false} axisLine={false} width={22} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="innovationsViewed" name="Viewed" stroke="#8B5CF6" fill="url(#investorInnovationsViewed)" strokeWidth={2} />
                  <Area type="monotone" dataKey="innovationsBookmarked" name="Bookmarked" stroke="#F59E0B" fill="url(#investorInnovationsBookmarked)" strokeWidth={2} />
                  <Area type="monotone" dataKey="investmentsMade" name="Invested" stroke="#10B981" fill="url(#investorInvestmentsMade)" strokeWidth={2} />
                </AreaChart>
              ) : (
                <RechartsBarChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={9} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={9} tickLine={false} axisLine={false} width={22} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="innovationsViewed" name="Viewed" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="innovationsBookmarked" name="Bookmarked" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="investmentsMade" name="Invested" fill="#10B981" radius={[4, 4, 0, 0]} />
                </RechartsBarChart>
              )}
            </ResponsiveContainer>
          )}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-2 sm:gap-6 mt-2 sm:mt-4 flex-wrap">
          <div className="flex items-center gap-1">
            <div className="h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full shrink-0" style={{ backgroundColor: '#8B5CF6' }} />
            <span className="text-[9px] sm:text-xs text-muted-foreground">Viewed</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full shrink-0" style={{ backgroundColor: '#F59E0B' }} />
            <span className="text-[9px] sm:text-xs text-muted-foreground">Bookmarked</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full shrink-0" style={{ backgroundColor: '#10B981' }} />
            <span className="text-[9px] sm:text-xs text-muted-foreground">Invested</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
