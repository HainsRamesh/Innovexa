import { Card, CardContent } from '@/components/ui/card';
import { Package, Play, Layers, Globe } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  trend?: string;
  trendUp?: boolean;
}

const MetricCard = ({ title, value, icon, trend, trendUp }: MetricCardProps) => (
  <Card className="bg-card/50 border-border/50 hover:border-primary/30 transition-all duration-300 group">
    <CardContent className="p-3 sm:p-5">
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1 sm:space-y-2 min-w-0">
          <p className="text-xs sm:text-sm text-muted-foreground font-medium truncate">{title}</p>
          <p className="text-xl sm:text-3xl font-bold tracking-tight">{value}</p>
          {trend && (
            <p className={`text-[10px] sm:text-xs font-medium ${trendUp ? 'text-emerald-400' : 'text-rose-400'}`}>
              {trendUp ? '↑' : '↓'} {trend}
            </p>
          )}
        </div>
        <div className="h-9 w-9 sm:h-12 sm:w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary/20 transition-colors shrink-0 [&>svg]:h-4 [&>svg]:w-4 sm:[&>svg]:h-6 sm:[&>svg]:w-6">
          {icon}
        </div>
      </div>
    </CardContent>
  </Card>
);

interface MetricsPanelProps {
  productsUploaded: number;
  demoPlays: number;
  categoriesRepresented: number;
  targetMarketsReached: number;
}

export const MetricsPanel = ({
  productsUploaded,
  demoPlays,
  categoriesRepresented,
  targetMarketsReached,
}: MetricsPanelProps) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
      <MetricCard
        title="Products Uploaded"
        value={productsUploaded}
        icon={<Package className="h-6 w-6" />}
        trend="+12% this month"
        trendUp={true}
      />
      <MetricCard
        title="Demo Plays"
        value={demoPlays.toLocaleString()}
        icon={<Play className="h-6 w-6" />}
        trend="+8% this week"
        trendUp={true}
      />
      <MetricCard
        title="Categories"
        value={categoriesRepresented}
        icon={<Layers className="h-6 w-6" />}
      />
      <MetricCard
        title="Target Markets"
        value={targetMarketsReached}
        icon={<Globe className="h-6 w-6" />}
        trend="+3 new markets"
        trendUp={true}
      />
    </div>
  );
};
