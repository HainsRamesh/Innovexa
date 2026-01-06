// Account age-based trend calculation utilities
import { differenceInDays, subDays, subMonths, startOfDay, endOfDay, startOfMonth, endOfMonth } from 'date-fns';

export interface TrendResult {
  percentage: number;
  label: string;
  type: 'new' | 'yesterday' | 'week' | 'month';
}

export interface TrendData {
  current: number;
  previous: number;
}

/**
 * Calculate trend based on account age
 * < 1 day: No comparison - "New account"
 * 1-6 days: Today vs Yesterday - "↑ Since yesterday"
 * 7-29 days: Last 7 days vs Previous 7 days - "↑ X% this week"
 * >= 30 days: This month vs Last month - "↑ X% this month"
 */
export const calculateTrendByAccountAge = (
  accountCreatedAt: Date | string,
  currentValue: number,
  previousValue: number
): TrendResult => {
  const createdAt = typeof accountCreatedAt === 'string' ? new Date(accountCreatedAt) : accountCreatedAt;
  const now = new Date();
  const accountAgeInDays = differenceInDays(now, createdAt);

  // Less than 1 day - New account
  if (accountAgeInDays < 1) {
    return {
      percentage: 0,
      label: 'New account',
      type: 'new',
    };
  }

  // Handle zero division
  if (previousValue === 0) {
    if (currentValue === 0) {
      return {
        percentage: 0,
        label: getTrendLabel(0, accountAgeInDays),
        type: getTrendType(accountAgeInDays),
      };
    }
    // If previous was 0 and current is not, show 100% increase
    return {
      percentage: 100,
      label: getTrendLabel(accountAgeInDays, accountAgeInDays),
      type: getTrendType(accountAgeInDays),
    };
  }

  // Calculate percentage change
  const percentage = Math.round(((currentValue - previousValue) / previousValue) * 100);

  return {
    percentage,
    label: getTrendLabel(accountAgeInDays, accountAgeInDays),
    type: getTrendType(accountAgeInDays),
  };
};

const getTrendType = (accountAgeInDays: number): TrendResult['type'] => {
  if (accountAgeInDays < 1) return 'new';
  if (accountAgeInDays < 7) return 'yesterday';
  if (accountAgeInDays < 30) return 'week';
  return 'month';
};

const getTrendLabel = (percentage: number, accountAgeInDays: number): string => {
  if (accountAgeInDays < 1) return 'New account';
  if (accountAgeInDays < 7) return 'Since yesterday';
  if (accountAgeInDays < 30) return 'this week';
  return 'this month';
};

/**
 * Get date ranges for data comparison based on account age
 */
export const getComparisonDateRanges = (accountCreatedAt: Date | string) => {
  const createdAt = typeof accountCreatedAt === 'string' ? new Date(accountCreatedAt) : accountCreatedAt;
  const now = new Date();
  const accountAgeInDays = differenceInDays(now, createdAt);

  if (accountAgeInDays < 1) {
    return null; // No comparison for new accounts
  }

  if (accountAgeInDays < 7) {
    // Compare today vs yesterday
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);
    const yesterdayStart = startOfDay(subDays(now, 1));
    const yesterdayEnd = endOfDay(subDays(now, 1));

    return {
      current: { start: todayStart, end: todayEnd },
      previous: { start: yesterdayStart, end: yesterdayEnd },
      type: 'yesterday' as const,
    };
  }

  if (accountAgeInDays < 30) {
    // Compare last 7 days vs previous 7 days
    const last7DaysStart = startOfDay(subDays(now, 6));
    const last7DaysEnd = endOfDay(now);
    const previous7DaysStart = startOfDay(subDays(now, 13));
    const previous7DaysEnd = endOfDay(subDays(now, 7));

    return {
      current: { start: last7DaysStart, end: last7DaysEnd },
      previous: { start: previous7DaysStart, end: previous7DaysEnd },
      type: 'week' as const,
    };
  }

  // Compare this month vs last month
  const thisMonthStart = startOfMonth(now);
  const thisMonthEnd = endOfMonth(now);
  const lastMonthStart = startOfMonth(subMonths(now, 1));
  const lastMonthEnd = endOfMonth(subMonths(now, 1));

  return {
    current: { start: thisMonthStart, end: thisMonthEnd },
    previous: { start: lastMonthStart, end: lastMonthEnd },
    type: 'month' as const,
  };
};

/**
 * Format trend display text
 */
export const formatTrendText = (result: TrendResult): string => {
  if (result.type === 'new') {
    return 'New account';
  }

  const arrow = result.percentage >= 0 ? '↑' : '↓';
  const absPercentage = Math.abs(result.percentage);

  if (result.type === 'yesterday') {
    return `${arrow} ${absPercentage}% since yesterday`;
  }

  return `${arrow} ${absPercentage}% ${result.label}`;
};
