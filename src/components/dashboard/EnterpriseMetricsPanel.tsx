import { FileText, Inbox, CheckCircle2, DollarSign } from 'lucide-react';
import { AnimatedMetricCard } from './AnimatedMetricCard';

interface EnterpriseMetrics {
  problemsPosted: number;
  totalSolutionsReceived: number;
  solutionsApproved: number;
  totalBudgetAllotted: number;
  problemsTrend: number;
  solutionsTrend: number;
  approvedTrend: number;
  budgetTrend: number;
}

interface EnterpriseMetricsPanelProps {
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

export const EnterpriseMetricsPanel = ({ metrics }: EnterpriseMetricsPanelProps) => {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <AnimatedMetricCard
        title="Problems Posted"
        value={metrics.problemsPosted}
        icon={<FileText className="h-6 w-6" />}
        trend={metrics.problemsTrend}
      />
      <AnimatedMetricCard
        title="Solutions Received"
        value={metrics.totalSolutionsReceived}
        icon={<Inbox className="h-6 w-6" />}
        trend={metrics.solutionsTrend}
      />
      <AnimatedMetricCard
        title="Solutions Approved"
        value={metrics.solutionsApproved}
        icon={<CheckCircle2 className="h-6 w-6" />}
        trend={metrics.approvedTrend}
      />
      <AnimatedMetricCard
        title="Budget Allotted"
        value={metrics.totalBudgetAllotted}
        icon={<DollarSign className="h-6 w-6" />}
        trend={metrics.budgetTrend}
        formatValue={formatBudget}
      />
    </div>
  );
};
