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

const CHART_COLORS = {
  primary: 'hsl(var(--primary))',
  secondary: 'hsl(var(--accent))',
  success: 'hsl(142, 76%, 36%)',
  warning: 'hsl(45, 93%, 47%)',
  info: 'hsl(217, 91%, 60%)',
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border rounded-lg px-4 py-3 shadow-xl">
        <p className="text-sm font-medium text-foreground mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: <span className="font-bold">{entry.value}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const EmptyState = ({ message }: { message: string }) => (
  <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
    <TrendingUp className="h-12 w-12 mb-4 opacity-50" />
    <p className="text-sm">{message}</p>
  </div>
);

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
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} vertical={false} />
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
          allowDecimals={false}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted))', opacity: 0.2 }} />
        <Legend 
          wrapperStyle={{ paddingTop: '16px' }}
          iconType="circle"
        />
        <Bar 
          dataKey="problemsCreated" 
          name="Problems Created" 
          fill={CHART_COLORS.info} 
          radius={[4, 4, 0, 0]} 
          barSize={20}
        />
        <Bar 
          dataKey="solutionsSubmitted" 
          name="Solutions Submitted" 
          fill={CHART_COLORS.warning} 
          radius={[4, 4, 0, 0]} 
          barSize={20}
        />
        <Bar 
          dataKey="solutionsApproved" 
          name="Solutions Approved" 
          fill={CHART_COLORS.success} 
          radius={[4, 4, 0, 0]} 
          barSize={20}
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
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
        <defs>
          <linearGradient id="colorProblems" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={CHART_COLORS.info} stopOpacity={0.3}/>
            <stop offset="95%" stopColor={CHART_COLORS.info} stopOpacity={0}/>
          </linearGradient>
          <linearGradient id="colorSubmissions" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={CHART_COLORS.warning} stopOpacity={0.3}/>
            <stop offset="95%" stopColor={CHART_COLORS.warning} stopOpacity={0}/>
          </linearGradient>
          <linearGradient id="colorResolved" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={CHART_COLORS.success} stopOpacity={0.3}/>
            <stop offset="95%" stopColor={CHART_COLORS.success} stopOpacity={0}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} vertical={false} />
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
          allowDecimals={false}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted))', opacity: 0.2 }} />
        <Legend 
          wrapperStyle={{ paddingTop: '16px' }}
          iconType="circle"
        />
        <Area 
          type="monotone" 
          dataKey="problemsPosted" 
          name="Problems Posted" 
          stroke={CHART_COLORS.info} 
          fillOpacity={1}
          fill="url(#colorProblems)"
          strokeWidth={2}
        />
        <Area 
          type="monotone" 
          dataKey="submissionsReceived" 
          name="Submissions Received" 
          stroke={CHART_COLORS.warning} 
          fillOpacity={1}
          fill="url(#colorSubmissions)"
          strokeWidth={2}
        />
        <Area 
          type="monotone" 
          dataKey="problemsResolved" 
          name="Problems Resolved" 
          stroke={CHART_COLORS.success} 
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
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} vertical={false} />
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
          allowDecimals={false}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted))', opacity: 0.2 }} />
        <Legend 
          wrapperStyle={{ paddingTop: '16px' }}
          iconType="circle"
        />
        <Line 
          type="monotone" 
          dataKey="activeProblems" 
          name="Active Problems" 
          stroke={CHART_COLORS.info} 
          strokeWidth={3}
          dot={{ fill: CHART_COLORS.info, strokeWidth: 2, r: 4 }}
          activeDot={{ r: 6, fill: CHART_COLORS.info }}
        />
        <Line 
          type="monotone" 
          dataKey="highEngagement" 
          name="High-Engagement Solutions" 
          stroke={CHART_COLORS.warning} 
          strokeWidth={3}
          dot={{ fill: CHART_COLORS.warning, strokeWidth: 2, r: 4 }}
          activeDot={{ r: 6, fill: CHART_COLORS.warning }}
        />
        <Line 
          type="monotone" 
          dataKey="investmentReady" 
          name="Investment-Ready Ideas" 
          stroke={CHART_COLORS.success} 
          strokeWidth={3}
          dot={{ fill: CHART_COLORS.success, strokeWidth: 2, r: 4 }}
          activeDot={{ r: 6, fill: CHART_COLORS.success }}
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
    <Card className="bg-card/50 border-border/50">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Icon className="h-5 w-5 text-accent" />
          {config.title}
        </CardTitle>
        <CardDescription className="text-sm text-muted-foreground">
          {config.description}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center h-[300px]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
