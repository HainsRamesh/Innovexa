import { useState } from 'react';
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
import { TrendingUp, BarChart3, LineChart } from 'lucide-react';
import { cn } from '@/lib/utils';

type TimeRange = 'daily' | 'weekly' | 'monthly';
type ChartType = 'line' | 'bar';

interface ChartDataPoint {
  name: string;
  demoPlays: number;
  momentum: number;
}

interface DemoTrendsChartProps {
  dailyData: ChartDataPoint[];
  weeklyData: ChartDataPoint[];
  monthlyData: ChartDataPoint[];
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

export const DemoTrendsChart = ({ dailyData, weeklyData, monthlyData }: DemoTrendsChartProps) => {
  const [timeRange, setTimeRange] = useState<TimeRange>('weekly');
  const [chartType, setChartType] = useState<ChartType>('line');

  const getData = () => {
    switch (timeRange) {
      case 'daily':
        return dailyData;
      case 'weekly':
        return weeklyData;
      case 'monthly':
        return monthlyData;
      default:
        return weeklyData;
    }
  };

  const data = getData();

  return (
    <Card className="bg-card/50 border-border/50 flex flex-col h-full">
      <CardHeader className="pb-2 flex-shrink-0 px-3 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <CardTitle className="text-sm sm:text-base font-semibold flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            Demo Play Trends
          </CardTitle>
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
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
      <CardContent className="flex-1 pt-0 px-2 sm:px-6">
        <div className="h-[220px] sm:h-[260px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'line' ? (
              <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="demoPlaysGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="momentumGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0} />
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
                  dataKey="demoPlays"
                  name="Demo Plays"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#demoPlaysGradient)"
                />
                <Area
                  type="monotone"
                  dataKey="momentum"
                  name="Momentum"
                  stroke="hsl(var(--accent))"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#momentumGradient)"
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
                  dataKey="demoPlays"
                  name="Demo Plays"
                  fill="hsl(var(--primary))"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="momentum"
                  name="Momentum"
                  fill="hsl(var(--accent))"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
