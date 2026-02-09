import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';
import { TrendingUp, Building2, Briefcase, Loader2 } from 'lucide-react';
import { AppRole } from '@/types';

interface ChartDataPoint {
  name: string;
  [key: string]: string | number;
}

interface RoleAwareProgressChartProps {
  role: AppRole | null;
  data: ChartDataPoint[];
  isLoading?: boolean;
}

// Premium dark-theme color palette - muted and professional
const CHART_COLORS = {
  // Muted Slate Blue - calm, professional
  blue: 'hsl(215, 50%, 50%)',
  // Soft Amber - warm but not bright
  amber: 'hsl(35, 55%, 50%)',
  // Muted Teal/Emerald - positive but subtle
  emerald: 'hsl(165, 45%, 42%)',
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-xl">
        <p className="text-xs font-medium text-foreground mb-1.5">{label}</p>
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

const EmptyState = ({ message }: { message: string }) => (
  <div className="flex flex-col items-center justify-center h-[220px] text-muted-foreground">
    <TrendingUp className="h-10 w-10 mb-3 opacity-40" />
    <p className="text-xs">{message}</p>
  </div>
);

// Stat Chip Legend - readable, responsive
interface StatChipLegendProps {
  items: Array<{ name: string; color: string; value?: number }>;
  data: ChartDataPoint[];
}

const StatChipLegend = ({ items, data }: StatChipLegendProps) => {
  // Calculate totals from data
  const totals = items.map((item) => {
    const key = item.name.toLowerCase().replace(/ /g, '');
    const matchingKey = Object.keys(data[0] || {}).find(
      (k) => k.toLowerCase().replace(/[^a-z]/g, '') === key.replace(/[^a-z]/g, '')
    );
    
    if (matchingKey) {
      return data.reduce((sum, d) => sum + (Number(d[matchingKey]) || 0), 0);
    }
    return 0;
  });

  return (
    <div className="flex flex-wrap gap-1 sm:gap-2 justify-center">
      {items.map((item, index) => (
        <div
          key={item.name}
          className="flex items-center gap-1 sm:gap-1.5 px-1.5 sm:px-3 py-0.5 sm:py-1.5 rounded-md bg-muted/30 border border-border/50"
        >
          <div
            className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full flex-shrink-0"
            style={{ backgroundColor: item.color }}
          />
          <span className="text-[9px] sm:text-xs font-medium text-foreground whitespace-nowrap">
            {item.name}
          </span>
          <span className="text-[9px] sm:text-xs text-muted-foreground font-semibold">
            {totals[index]}
          </span>
        </div>
      ))}
    </div>
  );
};

// Innovator Chart: Problem → Solution Progress
const InnovatorChart = ({ data }: { data: ChartDataPoint[] }) => {
  const hasData = data.some(d => 
    (d.problemsCreated as number) > 0 || 
    (d.solutionsSubmitted as number) > 0 || 
    (d.solutionsApproved as number) > 0
  );

  const legendItems = [
    { name: 'Problems Created', color: CHART_COLORS.blue },
    { name: 'Solutions Submitted', color: CHART_COLORS.amber },
    { name: 'Solutions Approved', color: CHART_COLORS.emerald },
  ];

  if (!hasData) {
    return <EmptyState message="Start creating problems and solutions to see progress" />;
  }

  return (
    <div className="flex flex-col h-full">
      <StatChipLegend items={legendItems} data={data} />
      <div className="flex-1 mt-2 sm:mt-3">
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={data} margin={{ top: 5, right: 5, left: -15, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} vertical={false} />
            <XAxis 
              dataKey="name" 
              stroke="hsl(var(--muted-foreground))" 
              fontSize={9} 
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
            />
            <YAxis 
              stroke="hsl(var(--muted-foreground))" 
              fontSize={9} 
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
              width={22}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted))', opacity: 0.15 }} />
            <Bar 
              dataKey="problemsCreated" 
              name="Problems Created" 
              fill={CHART_COLORS.blue} 
              radius={[3, 3, 0, 0]} 
              barSize={14}
            />
            <Bar 
              dataKey="solutionsSubmitted" 
              name="Solutions Submitted" 
              fill={CHART_COLORS.amber} 
              radius={[3, 3, 0, 0]} 
              barSize={14}
            />
            <Bar 
              dataKey="solutionsApproved" 
              name="Solutions Approved" 
              fill={CHART_COLORS.emerald} 
              radius={[3, 3, 0, 0]} 
              barSize={14}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

// Enterprise Chart: Problem Engagement & Resolution
const EnterpriseChart = ({ data }: { data: ChartDataPoint[] }) => {
  const hasData = data.some(d => 
    (d.problemsPosted as number) > 0 || 
    (d.submissionsReceived as number) > 0 || 
    (d.problemsResolved as number) > 0
  );

  const legendItems = [
    { name: 'Problems Posted', color: CHART_COLORS.blue },
    { name: 'Submissions Received', color: CHART_COLORS.amber },
    { name: 'Problems Resolved', color: CHART_COLORS.emerald },
  ];

  if (!hasData) {
    return <EmptyState message="Post problems to start tracking engagement" />;
  }

  return (
    <div className="flex flex-col h-full">
      <StatChipLegend items={legendItems} data={data} />
      <div className="flex-1 mt-2 sm:mt-3">
        <ResponsiveContainer width="100%" height={160}>
          <AreaChart data={data} margin={{ top: 5, right: 5, left: -15, bottom: 5 }}>
            <defs>
              <linearGradient id="colorProblems" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={CHART_COLORS.blue} stopOpacity={0.25}/>
                <stop offset="95%" stopColor={CHART_COLORS.blue} stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorSubmissions" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={CHART_COLORS.amber} stopOpacity={0.25}/>
                <stop offset="95%" stopColor={CHART_COLORS.amber} stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorResolved" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={CHART_COLORS.emerald} stopOpacity={0.25}/>
                <stop offset="95%" stopColor={CHART_COLORS.emerald} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} vertical={false} />
            <XAxis 
              dataKey="name" 
              stroke="hsl(var(--muted-foreground))" 
              fontSize={9} 
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
            />
            <YAxis 
              stroke="hsl(var(--muted-foreground))" 
              fontSize={9} 
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
              width={22}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted))', opacity: 0.15 }} />
            <Area 
              type="monotone" 
              dataKey="problemsPosted" 
              name="Problems Posted" 
              stroke={CHART_COLORS.blue} 
              fillOpacity={1}
              fill="url(#colorProblems)"
              strokeWidth={2}
            />
            <Area 
              type="monotone" 
              dataKey="submissionsReceived" 
              name="Submissions Received" 
              stroke={CHART_COLORS.amber} 
              fillOpacity={1}
              fill="url(#colorSubmissions)"
              strokeWidth={2}
            />
            <Area 
              type="monotone" 
              dataKey="problemsResolved" 
              name="Problems Resolved" 
              stroke={CHART_COLORS.emerald} 
              fillOpacity={1}
              fill="url(#colorResolved)"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

// Investor Chart: Innovation Performance & Interest
const InvestorChart = ({ data }: { data: ChartDataPoint[] }) => {
  const hasData = data.some(d => 
    (d.activeProblems as number) > 0 || 
    (d.highEngagement as number) > 0 || 
    (d.investmentReady as number) > 0
  );

  const legendItems = [
    { name: 'Active Problems', color: CHART_COLORS.blue },
    { name: 'High-Engagement', color: CHART_COLORS.amber },
    { name: 'Investment-Ready', color: CHART_COLORS.emerald },
  ];

  if (!hasData) {
    return <EmptyState message="No investment opportunities tracked yet" />;
  }

  return (
    <div className="flex flex-col h-full">
      <StatChipLegend items={legendItems} data={data} />
      <div className="flex-1 mt-2 sm:mt-3">
        <ResponsiveContainer width="100%" height={160}>
          <LineChart data={data} margin={{ top: 5, right: 5, left: -15, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} vertical={false} />
            <XAxis 
              dataKey="name" 
              stroke="hsl(var(--muted-foreground))" 
              fontSize={9} 
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
            />
            <YAxis 
              stroke="hsl(var(--muted-foreground))" 
              fontSize={9} 
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
              width={22}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted))', opacity: 0.15 }} />
            <Line 
              type="monotone" 
              dataKey="activeProblems" 
              name="Active Problems" 
              stroke={CHART_COLORS.blue} 
              strokeWidth={2}
              dot={{ fill: CHART_COLORS.blue, strokeWidth: 0, r: 3 }}
              activeDot={{ r: 5, fill: CHART_COLORS.blue }}
            />
            <Line 
              type="monotone" 
              dataKey="highEngagement" 
              name="High-Engagement" 
              stroke={CHART_COLORS.amber} 
              strokeWidth={2}
              dot={{ fill: CHART_COLORS.amber, strokeWidth: 0, r: 3 }}
              activeDot={{ r: 5, fill: CHART_COLORS.amber }}
            />
            <Line 
              type="monotone" 
              dataKey="investmentReady" 
              name="Investment-Ready" 
              stroke={CHART_COLORS.emerald} 
              strokeWidth={2}
              dot={{ fill: CHART_COLORS.emerald, strokeWidth: 0, r: 3 }}
              activeDot={{ r: 5, fill: CHART_COLORS.emerald }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

const getRoleConfig = (role: AppRole | null) => {
  switch (role) {
    case 'innovator':
    case 'admin':
      return {
        title: 'Problem → Solution Progress',
        description: 'Track your journey from problem identification to solution approval',
        icon: TrendingUp,
      };
    case 'enterprise':
      return {
        title: 'Problem Engagement & Resolution',
        description: 'Monitor problem engagement and resolution rates over time',
        icon: Building2,
      };
    case 'investor':
      return {
        title: 'Innovation Performance & Interest',
        description: 'Track active opportunities and investment-ready innovations',
        icon: Briefcase,
      };
    default:
      return {
        title: 'Activity Overview',
        description: 'Your activity summary',
        icon: TrendingUp,
      };
  }
};

export const RoleAwareProgressChart = ({ role, data, isLoading }: RoleAwareProgressChartProps) => {
  const config = getRoleConfig(role);
  const Icon = config.icon;

  return (
    <Card className="bg-card/50 border-border/50 flex flex-col h-full">
      <CardHeader className="pb-2 flex-shrink-0 px-2 sm:px-6 pt-3 sm:pt-6">
        <CardTitle className="text-sm sm:text-base font-semibold flex items-center gap-2">
          <Icon className="h-4 w-4 text-accent shrink-0" />
          <span className="truncate">{config.title}</span>
        </CardTitle>
        <CardDescription className="text-[10px] sm:text-xs text-muted-foreground leading-relaxed">
          {config.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pt-0 px-1 sm:px-6 pb-3 sm:pb-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-[200px] sm:h-[260px]">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {(role === 'innovator' || role === 'admin') && <InnovatorChart data={data} />}
            {role === 'enterprise' && <EnterpriseChart data={data} />}
            {role === 'investor' && <InvestorChart data={data} />}
            {!role && <EmptyState message="Please log in to view your progress" />}
          </>
        )}
      </CardContent>
    </Card>
  );
};