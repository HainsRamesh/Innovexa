import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import { Briefcase, BarChart3, LineChart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

type TimeRange = 'daily' | 'weekly' | 'monthly';
type ChartType = 'line' | 'bar';

interface ChartDataPoint {
  name: string;
  problemsCreated: number;
  openProblems: number;
  solvedProblems: number;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-xl">
        <p className="text-xs font-medium text-foreground mb-1.5">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-xs" style={{ color: entry.color }}>
            {entry.name}: {entry.value.toLocaleString()}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export const EnterpriseProblemTrendsChart = () => {
  const { user } = useAuth();
  const [timeRange, setTimeRange] = useState<TimeRange>('weekly');
  const [chartType, setChartType] = useState<ChartType>('line');
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

  useEffect(() => {
    if (user?.id) {
      fetchProblemData();
    }
  }, [user?.id]);

  const fetchProblemData = async () => {
    if (!user?.id) return;
    
    setIsLoading(true);
    try {
      const { data: problems } = await supabase
        .from('problems')
        .select('id, created_at, status')
        .eq('owner_id', user.id);

      if (!problems) {
        setChartData({ daily: [], weekly: [], monthly: [] });
        return;
      }

      // Build daily data (last 7 days)
      const now = new Date();
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const daily: ChartDataPoint[] = days.map((day, i) => {
        const dayProblems = problems.filter(p => {
          const date = new Date(p.created_at);
          return date.getDay() === i;
        });
        return {
          name: day,
          problemsCreated: dayProblems.length,
          openProblems: dayProblems.filter(p => p.status === 'open').length,
          solvedProblems: dayProblems.filter(p => p.status === 'closed' || p.status === 'matched').length,
        };
      });

      // Build weekly data (last 4 weeks)
      const weekly: ChartDataPoint[] = ['Week 1', 'Week 2', 'Week 3', 'Week 4'].map((week, i) => {
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - (4 - i) * 7);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 7);

        const weekProblems = problems.filter(p => {
          const date = new Date(p.created_at);
          return date >= weekStart && date < weekEnd;
        });
        return {
          name: week,
          problemsCreated: weekProblems.length,
          openProblems: weekProblems.filter(p => p.status === 'open').length,
          solvedProblems: weekProblems.filter(p => p.status === 'closed' || p.status === 'matched').length,
        };
      });

      // Build monthly data (last 6 months)
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const monthly: ChartDataPoint[] = [];
      for (let i = 5; i >= 0; i--) {
        const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
        
        const monthProblems = problems.filter(p => {
          const date = new Date(p.created_at);
          return date >= monthDate && date <= monthEnd;
        });

        monthly.push({
          name: monthNames[monthDate.getMonth()],
          problemsCreated: monthProblems.length,
          openProblems: monthProblems.filter(p => p.status === 'open').length,
          solvedProblems: monthProblems.filter(p => p.status === 'closed' || p.status === 'matched').length,
        });
      }

      setChartData({ daily, weekly, monthly });
    } catch (error) {
      console.error('Error fetching problem data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getData = () => {
    switch (timeRange) {
      case 'daily':
        return chartData.daily;
      case 'weekly':
        return chartData.weekly;
      case 'monthly':
        return chartData.monthly;
      default:
        return chartData.weekly;
    }
  };

  const data = getData();

  return (
    <Card className="bg-card/50 border-border/50 flex flex-col h-full">
      <CardHeader className="pb-2 flex-shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Briefcase className="h-4 w-4 text-primary" />
            Problem Activity Trends
          </CardTitle>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Time Range Selector */}
            <div className="flex items-center bg-muted/30 rounded-md p-0.5">
              {(['daily', 'weekly', 'monthly'] as TimeRange[]).map((range) => (
                <Button
                  key={range}
                  variant="ghost"
                  size="sm"
                  onClick={() => setTimeRange(range)}
                  className={cn(
                    "h-7 px-2.5 text-[11px] capitalize transition-all duration-200",
                    timeRange === range 
                      ? "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground shadow-sm" 
                      : "hover:bg-muted/50 text-muted-foreground"
                  )}
                >
                  {range}
                </Button>
              ))}
            </div>
            
            {/* Chart Type Selector */}
            <div className="flex items-center bg-muted/30 rounded-md p-0.5">
              {(['line', 'bar'] as ChartType[]).map((type) => (
                <Button
                  key={type}
                  variant="ghost"
                  size="sm"
                  onClick={() => setChartType(type)}
                  className={cn(
                    "h-7 px-2 text-[11px] capitalize transition-all duration-200 gap-1",
                    chartType === type 
                      ? "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground shadow-sm" 
                      : "hover:bg-muted/50 text-muted-foreground"
                  )}
                >
                  {type === 'line' ? <LineChart className="h-3 w-3" /> : <BarChart3 className="h-3 w-3" />}
                  {type}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 pt-0">
        <div className="h-[260px] w-full">
          {isLoading ? (
            <div className="h-full flex items-center justify-center">
              <div className="animate-pulse text-muted-foreground text-sm">Loading...</div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              {chartType === 'line' ? (
                <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="problemsCreatedGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="openProblemsGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(210, 100%, 60%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(210, 100%, 60%)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="solvedProblemsGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                  <XAxis
                    dataKey="name"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => value.toLocaleString()}
                    width={40}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="problemsCreated"
                    name="Problems Created"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#problemsCreatedGradient)"
                  />
                  <Area
                    type="monotone"
                    dataKey="openProblems"
                    name="Open Problems"
                    stroke="hsl(210, 100%, 60%)"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#openProblemsGradient)"
                  />
                  <Area
                    type="monotone"
                    dataKey="solvedProblems"
                    name="Solved Problems"
                    stroke="hsl(142, 76%, 36%)"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#solvedProblemsGradient)"
                  />
                </AreaChart>
              ) : (
                <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                  <XAxis
                    dataKey="name"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => value.toLocaleString()}
                    width={40}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar
                    dataKey="problemsCreated"
                    name="Problems Created"
                    fill="hsl(var(--primary))"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="openProblems"
                    name="Open Problems"
                    fill="hsl(210, 100%, 60%)"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="solvedProblems"
                    name="Solved Problems"
                    fill="hsl(142, 76%, 36%)"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              )}
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
