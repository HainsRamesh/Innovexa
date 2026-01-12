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
  Legend,
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

// Refined color palette for dark theme - softer, more professional
const CHART_COLORS = {
  // Soft Cool Blue - calm, neutral, readable
  blue: 'hsl(210, 60%, 55%)',
  // Muted Amber / Warm Gold - not too bright
  amber: 'hsl(38, 65%, 50%)',
  // Soft Emerald / Teal Green - subtle but positive
  emerald: 'hsl(160, 50%, 45%)',
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
  <div className="flex flex-col items-center justify-center h-[260px] text-muted-foreground">
    <TrendingUp className="h-10 w-10 mb-3 opacity-40" />
    <p className="text-xs">{message}</p>
  </div>
);

// Custom legend component for compact styling
const CustomLegend = ({ payload }: any) => {
  if (!payload || payload.length === 0) return null;
  
  return (
    <div className="flex items-center justify-center gap-4 pt-3 flex-wrap">
      {payload.map((entry: any, index: number) => (
        <div key={index} className="flex items-center gap-1.5">
          <div 
            className="w-2 h-2 rounded-full" 
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-[10px] font-medium text-muted-foreground">
            {entry.value}
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

  if (!hasData) {
    return <EmptyState message="Start creating problems and solutions to see progress" />;
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} vertical={false} />
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
          allowDecimals={false}
          width={30}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted))', opacity: 0.15 }} />
        <Legend content={<CustomLegend />} />
        <Bar 
          dataKey="problemsCreated" 
          name="Problems Created" 
          fill={CHART_COLORS.blue} 
          radius={[3, 3, 0, 0]} 
          barSize={16}
        />
        <Bar 
          dataKey="solutionsSubmitted" 
          name="Solutions Submitted" 
          fill={CHART_COLORS.amber} 
          radius={[3, 3, 0, 0]} 
          barSize={16}
        />
        <Bar 
          dataKey="solutionsApproved" 
          name="Solutions Approved" 
          fill={CHART_COLORS.emerald} 
          radius={[3, 3, 0, 0]} 
          barSize={16}
        />
      </BarChart>
    </ResponsiveContainer>
  );
};

// Enterprise Chart: Problem Engagement & Resolution
const EnterpriseChart = ({ data }: { data: ChartDataPoint[] }) => {
  const hasData = data.some(d => 
    (d.problemsPosted as number) > 0 || 
    (d.submissionsReceived as number) > 0 || 
    (d.problemsResolved as number) > 0
  );

  if (!hasData) {
    return <EmptyState message="Post problems to start tracking engagement" />;
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
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
          fontSize={10} 
          tickLine={false}
          axisLine={false}
        />
        <YAxis 
          stroke="hsl(var(--muted-foreground))" 
          fontSize={10} 
          tickLine={false}
          axisLine={false}
          allowDecimals={false}
          width={30}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted))', opacity: 0.15 }} />
        <Legend content={<CustomLegend />} />
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
  );
};

// Investor Chart: Innovation Performance & Interest
const InvestorChart = ({ data }: { data: ChartDataPoint[] }) => {
  const hasData = data.some(d => 
    (d.activeProblems as number) > 0 || 
    (d.highEngagement as number) > 0 || 
    (d.investmentReady as number) > 0
  );

  if (!hasData) {
    return <EmptyState message="No investment opportunities tracked yet" />;
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} vertical={false} />
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
          allowDecimals={false}
          width={30}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted))', opacity: 0.15 }} />
        <Legend content={<CustomLegend />} />
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
    <Card className="bg-card/50 border-border/50 flex flex-col">
      <CardHeader className="pb-3 flex-shrink-0">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Icon className="h-4 w-4 text-accent" />
          {config.title}
        </CardTitle>
        <CardDescription className="text-xs text-muted-foreground leading-relaxed">
          {config.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pt-0">
        {isLoading ? (
          <div className="flex items-center justify-center h-[260px]">
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
