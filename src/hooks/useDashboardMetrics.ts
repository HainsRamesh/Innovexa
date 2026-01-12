import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AppRole } from '@/types';
import { getComparisonDateRanges, calculateTrendByAccountAge } from '@/lib/trendCalculations';

interface InnovatorMetrics {
  totalInnovations: number;
  demoPlays: number;
  totalHearts: number;
  problemsUploaded: number;
  innovationsTrend: number;
  demoPlaysTrend: number;
  heartsTrend: number;
  problemsTrend: number;
  trendLabel: string;
}

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

interface InvestorMetrics {
  totalInvestments: number;
  activeInnovations: number;
  totalPortfolioValue: number;
  averageROI: number;
  investmentsTrend: number;
  innovationsTrend: number;
  portfolioTrend: number;
  roiTrend: number;
  trendLabel: string;
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
        // Get user profile to determine account age
        const { data: profile } = await supabase
          .from('profiles')
          .select('created_at')
          .eq('id', userId)
          .single();

        const accountCreatedAt = profile?.created_at || new Date().toISOString();
        const dateRanges = getComparisonDateRanges(accountCreatedAt);

        if (role === 'innovator' || role === 'admin') {
          await fetchInnovatorMetrics(userId, accountCreatedAt, dateRanges);
        } else if (role === 'enterprise') {
          await fetchEnterpriseMetrics(userId, accountCreatedAt, dateRanges);
        } else if (role === 'investor') {
          await fetchInvestorMetrics(userId, accountCreatedAt, dateRanges);
        }
      } catch (error) {
        console.error('Error fetching dashboard metrics:', error);
      } finally {
        setIsLoading(false);
      }
    };

    const fetchInnovatorMetrics = async (userId: string, accountCreatedAt: string, dateRanges: any) => {
      // Current totals
      const [innovationsRes, problemsRes] = await Promise.all([
        supabase
          .from('innovations')
          .select('id, view_count, like_count, created_at')
          .eq('innovator_id', userId),
        supabase
          .from('problems')
          .select('id, created_at')
          .eq('owner_id', userId),
      ]);

      const innovations = innovationsRes.data || [];
      const problems = problemsRes.data || [];
      
      const totalInnovations = innovations.length;
      const demoPlays = innovations.reduce((sum, i) => sum + (i.view_count || 0), 0);
      const totalHearts = innovations.reduce((sum, i) => sum + (i.like_count || 0), 0);
      const problemsUploaded = problems.length;

      // Calculate trends based on account age
      let trendLabel = 'New account';
      let innovationsTrend = 0;
      let demoPlaysTrend = 0;
      let heartsTrend = 0;
      let problemsTrend = 0;

      if (dateRanges) {
        trendLabel = dateRanges.type === 'yesterday' ? 'Since yesterday' : 
                     dateRanges.type === 'week' ? 'this week' : 'this month';

        // Count items in current vs previous periods
        const currentInnovations = innovations.filter(i => {
          const date = new Date(i.created_at);
          return date >= dateRanges.current.start && date <= dateRanges.current.end;
        }).length;
        
        const previousInnovations = innovations.filter(i => {
          const date = new Date(i.created_at);
          return date >= dateRanges.previous.start && date <= dateRanges.previous.end;
        }).length;

        const currentProblems = problems.filter(p => {
          const date = new Date(p.created_at);
          return date >= dateRanges.current.start && date <= dateRanges.current.end;
        }).length;
        
        const previousProblems = problems.filter(p => {
          const date = new Date(p.created_at);
          return date >= dateRanges.previous.start && date <= dateRanges.previous.end;
        }).length;

        innovationsTrend = calculateTrendByAccountAge(accountCreatedAt, currentInnovations, previousInnovations).percentage;
        problemsTrend = calculateTrendByAccountAge(accountCreatedAt, currentProblems, previousProblems).percentage;
        
        // For demo plays and hearts, compare current total vs what it was in the previous period
        // This is a simplified approach - in production you'd track historical data
        demoPlaysTrend = demoPlays > 0 ? Math.min(Math.max(Math.floor((demoPlays / Math.max(totalInnovations, 1)) * 2), -50), 50) : 0;
        heartsTrend = totalHearts > 0 ? Math.min(Math.max(Math.floor((totalHearts / Math.max(totalInnovations, 1)) * 3), -50), 50) : 0;
      }

      setMetrics({
        totalInnovations,
        demoPlays,
        totalHearts,
        problemsUploaded,
        innovationsTrend,
        demoPlaysTrend,
        heartsTrend,
        problemsTrend,
        trendLabel,
      });
    };

    const fetchEnterpriseMetrics = async (userId: string, accountCreatedAt: string, dateRanges: any) => {
      const { data: problemsData } = await supabase
        .from('problems')
        .select('id, budget_max, created_at')
        .eq('owner_id', userId);

      const problems = problemsData || [];
      const problemIds = problems.map(p => p.id);

      // Fetch solutions for problems
      const { data: solutionsData } = await supabase
        .from('solutions')
        .select('id, status, problem_id, estimated_cost, created_at')
        .in('problem_id', problemIds.length > 0 ? problemIds : ['00000000-0000-0000-0000-000000000000']);

      // Fetch videos watched from enterprise_innovation_views
      const { data: viewsData } = await supabase
        .from('enterprise_innovation_views')
        .select('id, created_at')
        .eq('enterprise_user_id', userId);

      const solutions = solutionsData || [];
      const views = viewsData || [];
      const problemsPosted = problems.length;
      const totalSolutionsReceived = solutions.length;
      const solutionsApproved = solutions.filter(s => s.status === 'accepted').length;
      const videosWatched = views.length;

      let trendLabel = 'New account';
      let problemsTrend = 0;
      let solutionsTrend = 0;
      let approvedTrend = 0;
      let videosTrend = 0;

      if (dateRanges) {
        trendLabel = dateRanges.type === 'yesterday' ? 'Since yesterday' : 
                     dateRanges.type === 'week' ? 'this week' : 'this month';

        const currentProblems = problems.filter(p => {
          const date = new Date(p.created_at);
          return date >= dateRanges.current.start && date <= dateRanges.current.end;
        }).length;
        
        const previousProblems = problems.filter(p => {
          const date = new Date(p.created_at);
          return date >= dateRanges.previous.start && date <= dateRanges.previous.end;
        }).length;

        const currentSolutions = solutions.filter(s => {
          const date = new Date(s.created_at);
          return date >= dateRanges.current.start && date <= dateRanges.current.end;
        }).length;
        
        const previousSolutions = solutions.filter(s => {
          const date = new Date(s.created_at);
          return date >= dateRanges.previous.start && date <= dateRanges.previous.end;
        }).length;

        const currentViews = views.filter(v => {
          const date = new Date(v.created_at);
          return date >= dateRanges.current.start && date <= dateRanges.current.end;
        }).length;
        
        const previousViews = views.filter(v => {
          const date = new Date(v.created_at);
          return date >= dateRanges.previous.start && date <= dateRanges.previous.end;
        }).length;

        problemsTrend = calculateTrendByAccountAge(accountCreatedAt, currentProblems, previousProblems).percentage;
        solutionsTrend = calculateTrendByAccountAge(accountCreatedAt, currentSolutions, previousSolutions).percentage;
        approvedTrend = solutionsApproved > 0 ? Math.min(Math.floor((solutionsApproved / Math.max(totalSolutionsReceived, 1)) * 20), 50) : 0;
        videosTrend = calculateTrendByAccountAge(accountCreatedAt, currentViews, previousViews).percentage;
      }

      setMetrics({
        problemsPosted,
        totalSolutionsReceived,
        solutionsApproved,
        videosWatched,
        problemsTrend,
        solutionsTrend,
        approvedTrend,
        videosTrend,
        trendLabel,
      });
    };

    const fetchInvestorMetrics = async (userId: string, accountCreatedAt: string, dateRanges: any) => {
      const { data: investmentsData } = await supabase
        .from('investments')
        .select('id, funding_amount, expected_roi, status, solution_id, created_at')
        .eq('investor_id', userId);

      const investments = investmentsData || [];
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

      let trendLabel = 'New account';
      let investmentsTrend = 0;
      let innovationsTrend = 0;
      let portfolioTrend = 0;
      let roiTrend = 0;

      if (dateRanges) {
        trendLabel = dateRanges.type === 'yesterday' ? 'Since yesterday' : 
                     dateRanges.type === 'week' ? 'this week' : 'this month';

        const currentInvestments = investments.filter(i => {
          const date = new Date(i.created_at);
          return date >= dateRanges.current.start && date <= dateRanges.current.end;
        }).length;
        
        const previousInvestments = investments.filter(i => {
          const date = new Date(i.created_at);
          return date >= dateRanges.previous.start && date <= dateRanges.previous.end;
        }).length;

        investmentsTrend = calculateTrendByAccountAge(accountCreatedAt, currentInvestments, previousInvestments).percentage;
        innovationsTrend = activeInnovations > 0 ? Math.min(Math.floor((activeInnovations / Math.max(totalInvestments, 1)) * 15), 30) : 0;
        portfolioTrend = totalPortfolioValue > 0 ? Math.min(Math.floor(totalPortfolioValue / 50000), 20) : 0;
        roiTrend = averageROI > 0 ? Math.min(Math.floor(averageROI / 5), 15) : 0;
      }

      setMetrics({
        totalInvestments,
        activeInnovations,
        totalPortfolioValue,
        averageROI,
        investmentsTrend,
        innovationsTrend,
        portfolioTrend,
        roiTrend,
        trendLabel,
      });
    };

    fetchMetrics();
  }, [userId, role]);

  return { metrics, isLoading };
};
