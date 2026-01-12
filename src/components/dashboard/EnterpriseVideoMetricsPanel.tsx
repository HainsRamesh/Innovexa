import { FileText, PlayCircle, CheckCircle2, Inbox } from 'lucide-react';
import { AnimatedMetricCard } from './AnimatedMetricCard';

interface EnterpriseMetrics {
  problemsPosted: number;
  videosWatched: number;
  solutionsApproved: number;
  totalSolutionsReceived: number;
  problemsTrend: number;
  videosTrend: number;
  approvedTrend: number;
  solutionsTrend: number;
  trendLabel: string;
}

interface EnterpriseVideoMetricsPanelProps {
  metrics: EnterpriseMetrics;
}

export const EnterpriseVideoMetricsPanel = ({ metrics }: EnterpriseVideoMetricsPanelProps) => {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <AnimatedMetricCard
        title="Problems Posted"
        value={metrics.problemsPosted}
        icon={<FileText className="h-6 w-6" />}
        trend={metrics.problemsTrend}
        trendLabel={metrics.trendLabel}
      />
      <AnimatedMetricCard
        title="Videos Watched"
        value={metrics.videosWatched}
        icon={<PlayCircle className="h-6 w-6" />}
        trend={metrics.videosTrend}
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
        title="Solutions Received"
        value={metrics.totalSolutionsReceived}
        icon={<Inbox className="h-6 w-6" />}
        trend={metrics.solutionsTrend}
        trendLabel={metrics.trendLabel}
      />
    </div>
  );
};
