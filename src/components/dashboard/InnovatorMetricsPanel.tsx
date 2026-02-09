import { Lightbulb, Play, Sparkles, FileText } from 'lucide-react';
import { AnimatedMetricCard } from './AnimatedMetricCard';

interface InnovatorMetrics {
  totalInnovations: number;
  demoPlays: number;
  totalInterests: number;
  problemsUploaded: number;
  innovationsTrend: number;
  demoPlaysTrend: number;
  interestsTrend: number;
  problemsTrend: number;
  trendLabel: string;
}

interface InnovatorMetricsPanelProps {
  metrics: InnovatorMetrics;
}

export const InnovatorMetricsPanel = ({ metrics }: InnovatorMetricsPanelProps) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
      <AnimatedMetricCard
        title="Total Innovations"
        value={metrics.totalInnovations}
        icon={<Lightbulb className="h-6 w-6" />}
        trend={metrics.innovationsTrend}
        trendLabel={metrics.trendLabel}
      />
      <AnimatedMetricCard
        title="Demo Plays"
        value={metrics.demoPlays}
        icon={<Play className="h-6 w-6" />}
        trend={metrics.demoPlaysTrend}
        trendLabel={metrics.trendLabel}
      />
      <AnimatedMetricCard
        title="Total Interests"
        value={metrics.totalInterests}
        icon={<Sparkles className="h-6 w-6" />}
        trend={metrics.interestsTrend}
        trendLabel={metrics.trendLabel}
      />
      <AnimatedMetricCard
        title="Problems Uploaded"
        value={metrics.problemsUploaded}
        icon={<FileText className="h-6 w-6" />}
        trend={metrics.problemsTrend}
        trendLabel={metrics.trendLabel}
      />
    </div>
  );
};
