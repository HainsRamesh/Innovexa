import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
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
import { TrendingUp, BarChart3, LineChart, CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

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

const currentYear = new Date().getFullYear();
const yearOptions = Array.from({ length: 10 }, (_, i) => currentYear - i);
const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

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

interface DatePickerProps {
  date: Date;
  onDateChange: (date: Date) => void;
  label: string;
}

const QuickDatePicker = ({ date, onDateChange, label }: DatePickerProps) => {
  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(date.getFullYear());
  const [viewMonth, setViewMonth] = useState(date.getMonth());
  const [mode, setMode] = useState<'year' | 'month' | 'day'>('day');

  const handleYearSelect = (year: number) => {
    setViewYear(year);
    setMode('month');
  };

  const handleMonthSelect = (month: number) => {
    setViewMonth(month);
    setMode('day');
  };

  const handleDaySelect = (day: number) => {
    const newDate = new Date(viewYear, viewMonth, day);
    onDateChange(newDate);
    setOpen(false);
    setMode('day');
  };

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth);

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewYear(viewYear - 1);
      setViewMonth(11);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewYear(viewYear + 1);
      setViewMonth(0);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 text-xs font-normal bg-muted/30 border-border/50 hover:bg-muted/50"
        >
          <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-muted-foreground">{label}:</span>
          <span className="font-medium">{format(date, 'MMM d, yyyy')}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[280px] p-0 bg-card border-border" align="start">
        <div className="p-3">
          {/* Header with navigation */}
          <div className="flex items-center justify-between mb-3">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={prevMonth}
              disabled={mode !== 'day'}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-sm font-medium hover:bg-muted"
                onClick={() => setMode('month')}
              >
                {monthNames[viewMonth]}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-sm font-medium hover:bg-muted"
                onClick={() => setMode('year')}
              >
                {viewYear}
              </Button>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={nextMonth}
              disabled={mode !== 'day'}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Year Selector */}
          {mode === 'year' && (
            <div className="grid grid-cols-4 gap-1.5">
              {yearOptions.map((year) => (
                <Button
                  key={year}
                  variant={year === viewYear ? 'default' : 'ghost'}
                  size="sm"
                  className={cn(
                    "h-8 text-xs",
                    year === viewYear && "bg-primary text-primary-foreground"
                  )}
                  onClick={() => handleYearSelect(year)}
                >
                  {year}
                </Button>
              ))}
            </div>
          )}

          {/* Month Selector */}
          {mode === 'month' && (
            <div className="grid grid-cols-4 gap-1.5">
              {monthNames.map((month, idx) => (
                <Button
                  key={month}
                  variant={idx === viewMonth ? 'default' : 'ghost'}
                  size="sm"
                  className={cn(
                    "h-8 text-xs",
                    idx === viewMonth && "bg-primary text-primary-foreground"
                  )}
                  onClick={() => handleMonthSelect(idx)}
                >
                  {month}
                </Button>
              ))}
            </div>
          )}

          {/* Day Selector */}
          {mode === 'day' && (
            <>
              {/* Day headers */}
              <div className="grid grid-cols-7 gap-1 mb-1">
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
                  <div key={day} className="h-7 flex items-center justify-center text-[10px] font-medium text-muted-foreground">
                    {day}
                  </div>
                ))}
              </div>
              {/* Days grid */}
              <div className="grid grid-cols-7 gap-1">
                {/* Empty cells for days before first of month */}
                {Array.from({ length: firstDay }, (_, i) => (
                  <div key={`empty-${i}`} className="h-7" />
                ))}
                {/* Day buttons */}
                {Array.from({ length: daysInMonth }, (_, i) => {
                  const day = i + 1;
                  const isSelected = 
                    date.getFullYear() === viewYear && 
                    date.getMonth() === viewMonth && 
                    date.getDate() === day;
                  const isToday = 
                    new Date().getFullYear() === viewYear &&
                    new Date().getMonth() === viewMonth &&
                    new Date().getDate() === day;
                  
                  return (
                    <Button
                      key={day}
                      variant={isSelected ? 'default' : 'ghost'}
                      size="sm"
                      className={cn(
                        "h-7 w-full p-0 text-xs font-normal",
                        isSelected && "bg-primary text-primary-foreground",
                        isToday && !isSelected && "border border-primary/50 text-primary"
                      )}
                      onClick={() => handleDaySelect(day)}
                    >
                      {day}
                    </Button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export const DemoTrendsChart = ({ dailyData, weeklyData, monthlyData }: DemoTrendsChartProps) => {
  const [timeRange, setTimeRange] = useState<TimeRange>('weekly');
  const [chartType, setChartType] = useState<ChartType>('line');
  const [fromDate, setFromDate] = useState<Date>(new Date(currentYear, 0, 1));
  const [toDate, setToDate] = useState<Date>(new Date());

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
    <Card className="bg-card/50 border-border/50 flex flex-col">
      <CardHeader className="pb-3 flex-shrink-0">
        <div className="flex flex-col gap-3">
          {/* Title and controls row */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Demo Play Trends
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
          
          {/* Date Range Selectors */}
          <div className="flex items-center gap-2 flex-wrap">
            <QuickDatePicker date={fromDate} onDateChange={setFromDate} label="From" />
            <span className="text-muted-foreground text-xs">→</span>
            <QuickDatePicker date={toDate} onDateChange={setToDate} label="To" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 pt-0">
        <div className="h-[260px] w-full">
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
