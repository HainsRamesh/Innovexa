import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AppRole } from '@/types';

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

export type DashboardMetrics = InnovatorMetrics | EnterpriseMetrics | InvestorMetrics;

export const useDashboardMetrics = (userId: string | undefined, role: AppRole | null) => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!userId || !role) {
      setIsLoading(false);
      return;
    }

    const fetchMetrics = async () => {
      setIsLoading(true);
      try {
        if (role === 'innovator' || role === 'admin') {
          await fetchInnovatorMetrics(userId);
        } else if (role === 'enterprise') {
          await fetchEnterpriseMetrics(userId);
        } else if (role === 'investor') {
          await fetchInvestorMetrics(userId);
        }
      } catch (error) {
        console.error('Error fetching dashboard metrics:', error);
      } finally {
        setIsLoading(false);
      }
    };

    const fetchInnovatorMetrics = async (userId: string) => {
      const [innovationsRes, problemsRes] = await Promise.all([
        supabase
          .from('innovations')
          .select('id, view_count, like_count')
          .eq('innovator_id', userId),
        supabase
          .from('problems')
          .select('id', { count: 'exact', head: true })
          .eq('owner_id', userId),
      ]);

      const innovations = innovationsRes.data || [];
      const totalInnovations = innovations.length;
      const demoPlays = innovations.reduce((sum, i) => sum + (i.view_count || 0), 0);
      const totalHearts = innovations.reduce((sum, i) => sum + (i.like_count || 0), 0);
      const problemsUploaded = problemsRes.count || 0;

      // Calculate simple trends (mock for now - in production, compare with last month)
      const innovationsTrend = totalInnovations > 0 ? Math.floor(Math.random() * 20) - 5 : 0;
      const demoPlaysTrend = demoPlays > 0 ? Math.floor(Math.random() * 15) + 5 : 0;
      const heartsTrend = totalHearts > 0 ? Math.floor(Math.random() * 25) : 0;
      const problemsTrend = problemsUploaded > 0 ? Math.floor(Math.random() * 10) : 0;

      setMetrics({
        totalInnovations,
        demoPlays,
        totalHearts,
        problemsUploaded,
        innovationsTrend,
        demoPlaysTrend,
        heartsTrend,
        problemsTrend,
      });
    };

    const fetchEnterpriseMetrics = async (userId: string) => {
      const [problemsRes, solutionsRes] = await Promise.all([
        supabase
          .from('problems')
          .select('id, budget_max')
          .eq('owner_id', userId),
        supabase
          .from('solutions')
          .select('id, status, problem_id, estimated_cost')
          .in('problem_id', (
            await supabase.from('problems').select('id').eq('owner_id', userId)
          ).data?.map(p => p.id) || []),
      ]);

      const problems = problemsRes.data || [];
      const solutions = solutionsRes.data || [];
      const problemsPosted = problems.length;
      const totalSolutionsReceived = solutions.length;
      const solutionsApproved = solutions.filter(s => s.status === 'accepted').length;
      
      // Calculate total budget from accepted solutions
      const totalBudgetAllotted = solutions
        .filter(s => s.status === 'accepted')
        .reduce((sum, s) => sum + (s.estimated_cost || 0), 0);

      const problemsTrend = problemsPosted > 0 ? Math.floor(Math.random() * 15) : 0;
      const solutionsTrend = totalSolutionsReceived > 0 ? Math.floor(Math.random() * 20) + 5 : 0;
      const approvedTrend = solutionsApproved > 0 ? Math.floor(Math.random() * 10) : 0;
      const budgetTrend = totalBudgetAllotted > 0 ? Math.floor(Math.random() * 12) : 0;

      setMetrics({
        problemsPosted,
        totalSolutionsReceived,
        solutionsApproved,
        totalBudgetAllotted,
        problemsTrend,
        solutionsTrend,
        approvedTrend,
        budgetTrend,
      });
    };

    const fetchInvestorMetrics = async (userId: string) => {
      const investmentsRes = await supabase
        .from('investments')
        .select('id, funding_amount, expected_roi, status, solution_id')
        .eq('investor_id', userId);

      const investments = investmentsRes.data || [];
      const totalInvestments = investments.length;
      const activeInnovations = investments.filter(i => i.status === 'accepted').length;
      const totalPortfolioValue = investments
        .filter(i => i.status === 'accepted')
        .reduce((sum, i) => sum + (Number(i.funding_amount) || 0), 0);
      const roiValues = investments
        .filter(i => i.expected_roi)
        .map(i => Number(i.expected_roi) || 0);
      const averageROI = roiValues.length > 0 
        ? roiValues.reduce((sum, roi) => sum + roi, 0) / roiValues.length 
        : 0;

      const investmentsTrend = totalInvestments > 0 ? Math.floor(Math.random() * 15) + 5 : 0;
      const innovationsTrend = activeInnovations > 0 ? Math.floor(Math.random() * 10) : 0;
      const portfolioTrend = totalPortfolioValue > 0 ? Math.floor(Math.random() * 20) : 0;
      const roiTrend = averageROI > 0 ? Math.floor(Math.random() * 8) : 0;

      setMetrics({
        totalInvestments,
        activeInnovations,
        totalPortfolioValue,
        averageROI,
        investmentsTrend,
        innovationsTrend,
        portfolioTrend,
        roiTrend,
      });
    };

    fetchMetrics();
  }, [userId, role]);

  return { metrics, isLoading };
};
