import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { InvestorDashboard } from '@/components/investor/InvestorDashboard';

export default function InvestorDashboardPage() {
  const { role, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  // Only investors can access this page
  if (role !== 'investor') {
    return <Navigate to="/dashboard" replace />;
  }

  return <InvestorDashboard />;
}
