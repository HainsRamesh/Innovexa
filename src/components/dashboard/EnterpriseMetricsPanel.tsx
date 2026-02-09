import { FileText, Inbox, CheckCircle2, PlayCircle } from 'lucide-react';
import { AnimatedMetricCard } from './AnimatedMetricCard';

interface EnterpriseMetrics {
  problemsPosted: number;
  totalSolutionsReceived: number;
  solutionsApproved: number;
  videosWatched: number;
  problemsTrend: number;
  solutionsTrend: number;
  approvedTrend: number;
  videosTrend: number;
  trendLabel: string;
}

interface EnterpriseMetricsPanelProps {
  metrics: EnterpriseMetrics;
}

export const EnterpriseMetricsPanel = ({ metrics }: EnterpriseMetricsPanelProps) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
      <AnimatedMetricCard
        title="Problems Posted"
        value={metrics.problemsPosted}
        icon={<FileText className="h-6 w-6" />}
        trend={metrics.problemsTrend}
        trendLabel={metrics.trendLabel}
      />
      <AnimatedMetricCard
        title="Solutions Received"
        value={metrics.totalSolutionsReceived}
        icon={<Inbox className="h-6 w-6" />}
        trend={metrics.solutionsTrend}
        trendLabel={metrics.trendLabel}
      />
      <AnimatedMetricCard
        title="Solutions Approved"
        value={metrics.solutionsApproved}
        icon={<CheckCircle2 className="h-6 w-6" />}
        trend={metrics.approvedTrend}
        trendLabel={metrics.trendLabel}
      />
      <AnimatedMetricCard
        title="Videos Watched"
        value={metrics.videosWatched}
        icon={<PlayCircle className="h-6 w-6" />}
        trend={metrics.videosTrend}
        trendLabel={metrics.trendLabel}
      />
    </div>
  );
};
