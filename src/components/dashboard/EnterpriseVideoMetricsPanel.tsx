import { FileText, PlayCircle, CheckCircle2, DollarSign } from 'lucide-react';
import { AnimatedMetricCard } from './AnimatedMetricCard';

interface EnterpriseMetrics {
  problemsPosted: number;
  videosWatched: number;
  solutionsApproved: number;
  totalBudgetAllotted: number;
  problemsTrend: number;
  videosTrend: number;
  approvedTrend: number;
  budgetTrend: number;
  trendLabel: string;
}

interface EnterpriseVideoMetricsPanelProps {
  metrics: EnterpriseMetrics;
}

const formatBudget = (value: number): string => {
  if (value >= 1000000) {
    return '$' + (value / 1000000).toFixed(1) + 'M';
  }
  if (value >= 1000) {
    return '$' + (value / 1000).toFixed(1) + 'K';
  }
  return '$' + value.toLocaleString();
};

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
        title="Budget Allotted"
        value={metrics.totalBudgetAllotted}
        icon={<DollarSign className="h-6 w-6" />}
        trend={metrics.budgetTrend}
        trendLabel={metrics.trendLabel}
        formatValue={formatBudget}
      />
    </div>
  );
};
