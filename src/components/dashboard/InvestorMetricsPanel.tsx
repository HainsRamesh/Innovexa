import { Wallet, Lightbulb, TrendingUp, Percent } from 'lucide-react';
import { AnimatedMetricCard } from './AnimatedMetricCard';

interface InvestorMetrics {
  totalInvestments: number;
  activeInnovations: number;
  totalPortfolioValue: number;
  averageROI: number;
  investmentsTrend: number;
  innovationsTrend: number;
  portfolioTrend: number;
  roiTrend: number;
}

interface InvestorMetricsPanelProps {
  metrics: InvestorMetrics;
}

const formatCurrency = (value: number): string => {
  if (value >= 1000000) {
    return '$' + (value / 1000000).toFixed(1) + 'M';
  }
  if (value >= 1000) {
    return '$' + (value / 1000).toFixed(1) + 'K';
  }
  return '$' + value.toLocaleString();
};

const formatROI = (value: number): string => {
  return value.toFixed(1);
};

export const InvestorMetricsPanel = ({ metrics }: InvestorMetricsPanelProps) => {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <AnimatedMetricCard
        title="Total Investments"
        value={metrics.totalInvestments}
        icon={<Wallet className="h-6 w-6" />}
        trend={metrics.investmentsTrend}
      />
      <AnimatedMetricCard
        title="Active Innovations"
        value={metrics.activeInnovations}
        icon={<Lightbulb className="h-6 w-6" />}
        trend={metrics.innovationsTrend}
      />
      <AnimatedMetricCard
        title="Portfolio Value"
        value={metrics.totalPortfolioValue}
        icon={<TrendingUp className="h-6 w-6" />}
        trend={metrics.portfolioTrend}
        formatValue={formatCurrency}
      />
      <AnimatedMetricCard
        title="Average ROI"
        value={metrics.averageROI}
        icon={<Percent className="h-6 w-6" />}
        trend={metrics.roiTrend}
        suffix="%"
        formatValue={formatROI}
      />
    </div>
  );
};
