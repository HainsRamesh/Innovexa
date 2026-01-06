import { Lightbulb, Play, Heart, FileText } from 'lucide-react';
import { AnimatedMetricCard } from './AnimatedMetricCard';

interface InnovatorMetrics {
  totalInnovations: number;
  demoPlays: number;
  totalHearts: number;
  problemsUploaded: number;
  innovationsTrend: number;
  demoPlaysTrend: number;
  heartsTrend: number;
  problemsTrend: number;
}

interface InnovatorMetricsPanelProps {
  metrics: InnovatorMetrics;
}

export const InnovatorMetricsPanel = ({ metrics }: InnovatorMetricsPanelProps) => {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <AnimatedMetricCard
        title="Total Innovations"
        value={metrics.totalInnovations}
        icon={<Lightbulb className="h-6 w-6" />}
        trend={metrics.innovationsTrend}
      />
      <AnimatedMetricCard
        title="Demo Plays"
        value={metrics.demoPlays}
        icon={<Play className="h-6 w-6" />}
        trend={metrics.demoPlaysTrend}
      />
      <AnimatedMetricCard
        title="Total Hearts"
        value={metrics.totalHearts}
        icon={<Heart className="h-6 w-6" />}
        trend={metrics.heartsTrend}
      />
      <AnimatedMetricCard
        title="Problems Uploaded"
        value={metrics.problemsUploaded}
        icon={<FileText className="h-6 w-6" />}
        trend={metrics.problemsTrend}
      />
    </div>
  );
};
