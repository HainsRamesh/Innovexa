import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { useDashboardMetrics } from '@/hooks/useDashboardMetrics';
import { InnovatorMetricsPanel } from '@/components/dashboard/InnovatorMetricsPanel';
import { EnterpriseMetricsPanel } from '@/components/dashboard/EnterpriseMetricsPanel';
import { InvestorMetricsPanel } from '@/components/dashboard/InvestorMetricsPanel';
import { CategoryPerformanceTable, CategoryData } from '@/components/dashboard/CategoryPerformanceTable';
import { ProductTrackerTable, ProductData } from '@/components/dashboard/ProductTrackerTable';
import { EnterpriseProblemsTable } from '@/components/dashboard/EnterpriseProblemsTable';
import { InvestorPortfolioTable } from '@/components/dashboard/InvestorPortfolioTable';
import { DemoTrendsChart } from '@/components/dashboard/DemoTrendsChart';
import { EnterpriseProblemTrendsChart } from '@/components/dashboard/EnterpriseProblemTrendsChart';
import { RoleAwareProgressChart } from '@/components/dashboard/RoleAwareProgressChart';
import { useRoleProgressData } from '@/hooks/useRoleProgressData';
import { DashboardFilters } from '@/components/dashboard/DashboardFilters';
import { ConfirmationModal } from '@/components/dashboard/ConfirmationModal';
import { Problem, Innovation, Investment } from '@/types';
import { toast } from 'sonner';

// Market spread data (dummy allowed per requirements)
const marketSpreadData: CategoryData[] = [
  { category: 'AI & ML', productsUploaded: 0, demoPlays: 0, targetMarketSpread: 'Global' },
  { category: 'HealthTech', productsUploaded: 0, demoPlays: 0, targetMarketSpread: 'NA, EU' },
  { category: 'EdTech', productsUploaded: 0, demoPlays: 0, targetMarketSpread: 'APAC' },
  { category: 'Sustainability', productsUploaded: 0, demoPlays: 0, targetMarketSpread: 'EU, NA' },
  { category: 'Others', productsUploaded: 0, demoPlays: 0, targetMarketSpread: 'Global' },
];

const DashboardOverview = () => {
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const { metrics, isLoading: metricsLoading } = useDashboardMetrics(user?.id, role);
  const { data: roleProgressData, isLoading: progressLoading } = useRoleProgressData(user?.id, role);

  // Role-specific data states
  const [innovations, setInnovations] = useState<Innovation[]>([]);
  const [problems, setProblems] = useState<Problem[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [chartData, setChartData] = useState({
    daily: [] as { name: string; demoPlays: number; momentum: number }[],
    weekly: [] as { name: string; demoPlays: number; momentum: number }[],
    monthly: [] as { name: string; demoPlays: number; momentum: number }[],
  });
  const [categoryMomentum, setCategoryMomentum] = useState<{ category: string; momentum: number }[]>([]);
  const [categoryPerformance, setCategoryPerformance] = useState<CategoryData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; id: string; type: 'innovation' | 'problem' }>({
    open: false,
    id: '',
    type: 'innovation',
  });

  useEffect(() => {
    if (user && role) {
      fetchRoleData();
    }
  }, [user, role]);

  const fetchRoleData = async () => {
    setIsLoading(true);
    try {
      if (role === 'innovator' || role === 'admin') {
        await fetchInnovatorData();
      } else if (role === 'enterprise') {
        await fetchEnterpriseData();
      } else if (role === 'investor') {
        await fetchInvestorData();
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchInnovatorData = async () => {
    const { data: innovationsData } = await supabase
      .from('innovations')
      .select('*')
      .eq('innovator_id', user!.id)
      .order('created_at', { ascending: false });

    const innovs = innovationsData || [];
    setInnovations(innovs as Innovation[]);

    // Calculate real chart data from innovations
    const categoryMap = new Map<string, { views: number; likes: number }>();
    innovs.forEach((inn) => {
      const cat = getCategoryLabel(inn.category);
      const existing = categoryMap.get(cat) || { views: 0, likes: 0 };
      categoryMap.set(cat, {
        views: existing.views + (inn.view_count || 0),
        likes: existing.likes + (inn.like_count || 0),
      });
    });

    // Build category performance from real data
    const catPerf: CategoryData[] = Array.from(categoryMap.entries()).map(([cat, data]) => ({
      category: cat,
      productsUploaded: innovs.filter(i => getCategoryLabel(i.category) === cat).length,
      demoPlays: data.views,
      targetMarketSpread: 'Global', // Dummy
    }));
    setCategoryPerformance(catPerf.length > 0 ? catPerf : marketSpreadData);

    // Category momentum from real data
    const catMomentum = Array.from(categoryMap.entries()).map(([cat, data]) => ({
      category: cat,
      momentum: Math.floor((data.views + data.likes) / Math.max(innovs.length, 1)),
    }));
    setCategoryMomentum(catMomentum.length > 0 ? catMomentum : marketSpreadData.map(m => ({ category: m.category, momentum: 0 })));

    // Build chart data from innovations
    buildChartData(innovs);
  };

  const fetchEnterpriseData = async () => {
    const { data: problemsData } = await supabase
      .from('problems')
      .select('*')
      .eq('owner_id', user!.id)
      .order('created_at', { ascending: false });

    setProblems((problemsData || []) as Problem[]);

    // Build chart data based on solutions received
    const { data: solutionsData } = await supabase
      .from('solutions')
      .select('created_at, status')
      .in('problem_id', (problemsData || []).map(p => p.id));

    buildChartDataFromSolutions(solutionsData || []);
    setCategoryMomentum(marketSpreadData.map(m => ({ category: m.category, momentum: 0 })));
  };

  const fetchInvestorData = async () => {
    const { data: investmentsData } = await supabase
      .from('investments')
      .select('*, problems(*)')
      .eq('investor_id', user!.id)
      .order('created_at', { ascending: false });

    setInvestments((investmentsData || []) as Investment[]);

    // Build chart data from investments
    buildChartDataFromInvestments(investmentsData || []);
    setCategoryMomentum(marketSpreadData.map(m => ({ category: m.category, momentum: 0 })));
  };

  const buildChartData = (innovs: any[]) => {
    // Group by day/week/month
    const now = new Date();
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    const daily = days.map((day, i) => {
      const dayInnovs = innovs.filter(inn => {
        const date = new Date(inn.created_at);
        return date.getDay() === i;
      });
      return {
        name: day,
        demoPlays: dayInnovs.reduce((sum, i) => sum + (i.view_count || 0), 0),
        momentum: dayInnovs.reduce((sum, i) => sum + (i.like_count || 0), 0),
      };
    });

    const weekly = ['Week 1', 'Week 2', 'Week 3', 'Week 4'].map((week, i) => ({
      name: week,
      demoPlays: Math.floor(innovs.reduce((sum, inn) => sum + (inn.view_count || 0), 0) / 4 * (i + 1)),
      momentum: Math.floor(innovs.reduce((sum, inn) => sum + (inn.like_count || 0), 0) / 4 * (i + 1)),
    }));

    const months = ['Sep', 'Oct', 'Nov', 'Dec'];
    const monthly = months.map((month) => ({
      name: month,
      demoPlays: innovs.reduce((sum, inn) => sum + (inn.view_count || 0), 0),
      momentum: innovs.reduce((sum, inn) => sum + (inn.like_count || 0), 0),
    }));

    setChartData({ daily, weekly, monthly });
  };

  const buildChartDataFromSolutions = (solutions: any[]) => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    const daily = days.map((day, i) => ({
      name: day,
      demoPlays: solutions.filter(s => new Date(s.created_at).getDay() === i).length * 10,
      momentum: solutions.filter(s => s.status === 'accepted' && new Date(s.created_at).getDay() === i).length * 20,
    }));

    const weekly = ['Week 1', 'Week 2', 'Week 3', 'Week 4'].map((week, i) => ({
      name: week,
      demoPlays: Math.floor(solutions.length / 4 * (i + 1)) * 10,
      momentum: Math.floor(solutions.filter(s => s.status === 'accepted').length / 4 * (i + 1)) * 20,
    }));

    const months = ['Sep', 'Oct', 'Nov', 'Dec'];
    const monthly = months.map((month) => ({
      name: month,
      demoPlays: solutions.length * 10,
      momentum: solutions.filter(s => s.status === 'accepted').length * 20,
    }));

    setChartData({ daily, weekly, monthly });
  };

  const buildChartDataFromInvestments = (invs: any[]) => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    const daily = days.map((day, i) => ({
      name: day,
      demoPlays: invs.filter(inv => new Date(inv.created_at).getDay() === i).reduce((sum, inv) => sum + Number(inv.funding_amount || 0), 0),
      momentum: invs.filter(inv => inv.status === 'accepted' && new Date(inv.created_at).getDay() === i).reduce((sum, inv) => sum + Number(inv.expected_roi || 0), 0),
    }));

    const weekly = ['Week 1', 'Week 2', 'Week 3', 'Week 4'].map((week, i) => ({
      name: week,
      demoPlays: invs.reduce((sum, inv) => sum + Number(inv.funding_amount || 0), 0) / 4 * (i + 1),
      momentum: invs.filter(inv => inv.status === 'accepted').reduce((sum, inv) => sum + Number(inv.expected_roi || 0), 0) / 4 * (i + 1),
    }));

    const months = ['Sep', 'Oct', 'Nov', 'Dec'];
    const monthly = months.map((month) => ({
      name: month,
      demoPlays: invs.reduce((sum, inv) => sum + Number(inv.funding_amount || 0), 0),
      momentum: invs.filter(inv => inv.status === 'accepted').reduce((sum, inv) => sum + Number(inv.expected_roi || 0), 0),
    }));

    setChartData({ daily, weekly, monthly });
  };

  const getCategoryLabel = (category: string): string => {
    const labels: Record<string, string> = {
      ai: 'AI & ML',
      healthtech: 'HealthTech',
      edtech: 'EdTech',
      climatetech: 'Sustainability',
      fintech: 'FinTech',
      saas: 'SaaS',
      hardware: 'Hardware',
      web3: 'Web3',
      other: 'Others',
    };
    return labels[category] || 'Others';
  };

  // Product Tracker data for innovators (removed status column)
  const productTrackerData: ProductData[] = innovations.map((inn) => ({
    id: inn.id,
    name: inn.title,
    category: getCategoryLabel(inn.category),
    demoPlays: inn.view_count || 0,
    dateUploaded: inn.created_at,
  }));

  const handleViewAllProducts = () => {
    navigate('/dashboard/innovations');
  };

  const handleProductView = (id: string) => {
    navigate(`/dashboard/innovations/${id}`, { state: { from: 'overview' } });
  };

  const handleProductEdit = (id: string) => {
    navigate(`/dashboard/innovations/${id}/edit`, { state: { from: 'overview' } });
  };

  const handleProductDelete = (id: string) => {
    setDeleteModal({ open: true, id, type: 'innovation' });
  };

  const handleProblemView = (id: string) => {
    navigate(`/dashboard/problems/${id}`, { state: { from: 'overview' } });
  };

  const handleProblemEdit = (id: string) => {
    navigate(`/dashboard/problems/${id}/edit`, { state: { from: 'overview' } });
  };

  const handleProblemDelete = (id: string) => {
    setDeleteModal({ open: true, id, type: 'problem' });
  };

  const handleInvestmentView = (id: string) => {
    navigate(`/dashboard/investments/${id}`);
  };

  const confirmDelete = async () => {
    try {
      if (deleteModal.type === 'innovation') {
        const { error } = await supabase.from('innovations').delete().eq('id', deleteModal.id);
        if (error) throw error;
        setInnovations(prev => prev.filter(i => i.id !== deleteModal.id));
        toast.success('Innovation deleted successfully');
      } else {
        const { error } = await supabase.from('problems').delete().eq('id', deleteModal.id);
        if (error) throw error;
        setProblems(prev => prev.filter(p => p.id !== deleteModal.id));
        toast.success('Problem deleted successfully');
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete');
    } finally {
      setDeleteModal({ open: false, id: '', type: 'innovation' });
    }
  };

  if (metricsLoading || isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Role-based Metrics Panel */}
      {role === 'innovator' || role === 'admin' ? (
        metrics && 'totalInnovations' in metrics && (
          <InnovatorMetricsPanel metrics={metrics} />
        )
      ) : role === 'enterprise' ? (
        metrics && 'problemsPosted' in metrics && (
          <EnterpriseMetricsPanel metrics={metrics} />
        )
      ) : role === 'investor' ? (
        metrics && 'totalInvestments' in metrics && (
          <InvestorMetricsPanel metrics={metrics} />
        )
      ) : null}

      {/* Filters */}
      <DashboardFilters />

      {/* Charts Row - Aligned with consistent heights */}
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="min-h-[340px]">
          {role === 'enterprise' ? (
            <EnterpriseProblemTrendsChart />
          ) : (
            <DemoTrendsChart
              dailyData={chartData.daily}
              weeklyData={chartData.weekly}
              monthlyData={chartData.monthly}
            />
          )}
        </div>
        <div className="min-h-[340px]">
          <RoleAwareProgressChart role={role} data={roleProgressData} isLoading={progressLoading} />
        </div>
      </div>

      {/* Role-specific Tables */}
      {(role === 'innovator' || role === 'admin') && (
        <>
          <CategoryPerformanceTable data={categoryPerformance} />
          <ProductTrackerTable
            data={productTrackerData}
            onView={handleProductView}
            onEdit={handleProductEdit}
            onDelete={handleProductDelete}
            onViewAll={handleViewAllProducts}
            showViewAll={true}
            limit={5}
          />
        </>
      )}

      {role === 'enterprise' && (
        <EnterpriseProblemsTable
          problems={problems}
          onView={handleProblemView}
          onEdit={handleProblemEdit}
          onDelete={handleProblemDelete}
        />
      )}

      {role === 'investor' && (
        <InvestorPortfolioTable
          investments={investments}
          onView={handleInvestmentView}
        />
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        open={deleteModal.open}
        onOpenChange={(open) => setDeleteModal(prev => ({ ...prev, open }))}
        onConfirm={confirmDelete}
        title={`Delete ${deleteModal.type === 'innovation' ? 'Innovation' : 'Problem'}`}
        description={`Are you sure you want to delete this ${deleteModal.type}? This action cannot be undone.`}
      />
    </div>
  );
};

export default DashboardOverview;
