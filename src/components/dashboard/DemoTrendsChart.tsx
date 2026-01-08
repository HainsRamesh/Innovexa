import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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

// Generate year options (current year and past 5 years)
const currentYear = new Date().getFullYear();
const yearOptions = Array.from({ length: 6 }, (_, i) => currentYear - i);

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border rounded-lg px-4 py-3 shadow-xl">
        <p className="text-sm font-medium text-foreground mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
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
  const [fromYear, setFromYear] = useState<number>(currentYear);
  const [toYear, setToYear] = useState<number>(currentYear);

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
    <Card className="bg-card/50 border-border/50">
      <CardHeader className="pb-4">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Demo Play Trends
            </CardTitle>
            <div className="flex items-center gap-2 flex-wrap">
              {/* Time Range Selector */}
              <div className="flex items-center bg-muted/50 rounded-lg p-1">
                {(['daily', 'weekly', 'monthly'] as TimeRange[]).map((range) => (
                  <Button
                    key={range}
                    variant="ghost"
                    size="sm"
                    onClick={() => setTimeRange(range)}
                    className={cn(
                      "text-xs capitalize transition-all duration-200",
                      timeRange === range 
                        ? "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground shadow-sm" 
                        : "hover:bg-muted"
                    )}
                  >
                    {range}
                  </Button>
                ))}
              </div>
              
              {/* Chart Type Selector */}
              <div className="flex items-center bg-muted/50 rounded-lg p-1">
                {(['line', 'bar'] as ChartType[]).map((type) => (
                  <Button
                    key={type}
                    variant="ghost"
                    size="sm"
                    onClick={() => setChartType(type)}
                    className={cn(
                      "text-xs capitalize transition-all duration-200 gap-1.5",
                      chartType === type 
                        ? "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground shadow-sm" 
                        : "hover:bg-muted"
                    )}
                  >
                    {type === 'line' ? <LineChart className="h-3.5 w-3.5" /> : <BarChart3 className="h-3.5 w-3.5" />}
                    {type}
                  </Button>
                ))}
              </div>
            </div>
          </div>
          
          {/* Year Range Selectors */}
          <div className="flex items-center gap-3 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">From:</span>
              <Select value={fromYear.toString()} onValueChange={(v) => setFromYear(parseInt(v))}>
                <SelectTrigger className="w-[100px] h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {yearOptions.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">To:</span>
              <Select value={toYear.toString()} onValueChange={(v) => setToYear(parseInt(v))}>
                <SelectTrigger className="w-[100px] h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {yearOptions.filter(y => y >= fromYear).map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'line' ? (
              <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
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
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => value.toLocaleString()}
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
              <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis
                  dataKey="name"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => value.toLocaleString()}
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
