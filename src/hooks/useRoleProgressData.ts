import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AppRole } from '@/types';
import { format, subMonths, startOfMonth, endOfMonth, parseISO } from 'date-fns';

interface ChartDataPoint {
  name: string;
  [key: string]: string | number;
}

export const useRoleProgressData = (userId: string | undefined, role: AppRole | null) => {
  const [data, setData] = useState<ChartDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const getLastSixMonths = useCallback(() => {
    const months: { name: string; start: Date; end: Date }[] = [];
    for (let i = 5; i >= 0; i--) {
      const date = subMonths(new Date(), i);
      months.push({
        name: format(date, 'MMM'),
        start: startOfMonth(date),
        end: endOfMonth(date),
      });
    }
    return months;
  }, []);

  const fetchInnovatorData = useCallback(async (uid: string) => {
    const months = getLastSixMonths();
    
    // Fetch problems created by this user
    const { data: problems } = await supabase
      .from('problems')
      .select('id, created_at')
      .eq('owner_id', uid);

    // Fetch solutions submitted by this user
    const { data: solutions } = await supabase
      .from('solutions')
      .select('id, created_at, status')
      .eq('innovator_id', uid);

    const chartData: ChartDataPoint[] = months.map(month => {
      const problemsInMonth = (problems || []).filter(p => {
        const date = parseISO(p.created_at);
        return date >= month.start && date <= month.end;
      }).length;

      const solutionsInMonth = (solutions || []).filter(s => {
        const date = parseISO(s.created_at);
        return date >= month.start && date <= month.end;
      });

      const submittedCount = solutionsInMonth.length;
      const approvedCount = solutionsInMonth.filter(s => s.status === 'accepted').length;

      return {
        name: month.name,
        problemsCreated: problemsInMonth,
        solutionsSubmitted: submittedCount,
        solutionsApproved: approvedCount,
      };
    });

    return chartData;
  }, [getLastSixMonths]);

  const fetchEnterpriseData = useCallback(async (uid: string) => {
    const months = getLastSixMonths();
    
    // Fetch problems posted by this enterprise
    const { data: problems } = await supabase
      .from('problems')
      .select('id, created_at, status')
      .eq('owner_id', uid);

    const problemIds = (problems || []).map(p => p.id);

    // Fetch solutions submitted to these problems
    const { data: solutions } = problemIds.length > 0 
      ? await supabase
          .from('solutions')
          .select('id, created_at, status, problem_id')
          .in('problem_id', problemIds)
      : { data: [] };

    const chartData: ChartDataPoint[] = months.map(month => {
      const problemsInMonth = (problems || []).filter(p => {
        const date = parseISO(p.created_at);
        return date >= month.start && date <= month.end;
      });

      const submissionsInMonth = (solutions || []).filter(s => {
        const date = parseISO(s.created_at);
        return date >= month.start && date <= month.end;
      }).length;

      // Problems with at least one accepted solution are considered "resolved"
      const resolvedProblems = problemsInMonth.filter(p => 
        (solutions || []).some(s => s.problem_id === p.id && s.status === 'accepted')
      ).length;

      return {
        name: month.name,
        problemsPosted: problemsInMonth.length,
        submissionsReceived: submissionsInMonth,
        problemsResolved: resolvedProblems,
      };
    });

    return chartData;
  }, [getLastSixMonths]);

  const fetchInvestorData = useCallback(async (uid: string) => {
    const months = getLastSixMonths();
    
    // Fetch all open problems (active opportunities)
    const { data: problems } = await supabase
      .from('problems')
      .select('id, created_at, status');

    // Fetch accepted solutions with high engagement (public visibility)
    const { data: solutions } = await supabase
      .from('solutions')
      .select('id, created_at, status, visibility')
      .eq('status', 'accepted')
      .eq('visibility', 'public');

    // Fetch investments made by this investor
    const { data: investments } = await supabase
      .from('investments')
      .select('id, created_at, status')
      .eq('investor_id', uid);

    const chartData: ChartDataPoint[] = months.map(month => {
      const activeProblemsInMonth = (problems || []).filter(p => {
        const date = parseISO(p.created_at);
        return date >= month.start && date <= month.end && p.status === 'open';
      }).length;

      const highEngagementInMonth = (solutions || []).filter(s => {
        const date = parseISO(s.created_at);
        return date >= month.start && date <= month.end;
      }).length;

      const investmentReadyInMonth = (investments || []).filter(inv => {
        const date = parseISO(inv.created_at);
        return date >= month.start && date <= month.end;
      }).length;

      return {
        name: month.name,
        activeProblems: activeProblemsInMonth,
        highEngagement: highEngagementInMonth,
        investmentReady: investmentReadyInMonth,
      };
    });

    return chartData;
  }, [getLastSixMonths]);

  useEffect(() => {
    const fetchData = async () => {
      if (!userId || !role) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        let chartData: ChartDataPoint[] = [];

        switch (role) {
          case 'innovator':
          case 'admin':
            chartData = await fetchInnovatorData(userId);
            break;
          case 'enterprise':
            chartData = await fetchEnterpriseData(userId);
            break;
          case 'investor':
            chartData = await fetchInvestorData(userId);
            break;
        }

        setData(chartData);
      } catch (error) {
        console.error('Error fetching role progress data:', error);
        setData([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [userId, role, fetchInnovatorData, fetchEnterpriseData, fetchInvestorData]);

  return { data, isLoading };
};
