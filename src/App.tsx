import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/components/layout/DashboardLayout";

// Pages
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Explore from "./pages/Explore";
import ProblemDetails from "./pages/ProblemDetails";
import Solutions from "./pages/Solutions";
import About from "./pages/About";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import Innovations from "./pages/Innovations";
import NewInnovation from "./pages/NewInnovation";
import EditInnovation from "./pages/EditInnovation";

// Dashboard Pages
import DashboardOverview from "./pages/dashboard/DashboardOverview";
import ProblemsPage from "./pages/dashboard/ProblemsPage";
import ProblemDetailPage from "./pages/dashboard/ProblemDetailPage";
import EditProblemPage from "./pages/dashboard/EditProblemPage";
import NewProblemPage from "./pages/dashboard/NewProblemPage";
import BrowseProblemsPage from "./pages/dashboard/BrowseProblemsPage";
import SolutionsPage from "./pages/dashboard/SolutionsPage";

const queryClient = new QueryClient();

// Protected Route Component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
};

// Dashboard Routes
const DashboardRoutes = () => {
  return (
    <DashboardLayout>
      <Routes>
        <Route index element={<DashboardOverview />} />
        <Route path="innovator" element={<DashboardOverview />} />
        <Route path="enterprise" element={<DashboardOverview />} />
        <Route path="investor" element={<DashboardOverview />} />
        <Route path="admin" element={<DashboardOverview />} />
        <Route path="problems" element={<ProblemsPage />} />
        <Route path="problems/new" element={<NewProblemPage />} />
        <Route path="problems/:problemId" element={<ProblemDetailPage />} />
        <Route path="problems/:problemId/edit" element={<EditProblemPage />} />
        <Route path="browse" element={<BrowseProblemsPage />} />
        <Route path="solutions" element={<SolutionsPage />} />
        <Route path="bookmarks" element={<DashboardOverview />} />
        <Route path="settings" element={<DashboardOverview />} />
        <Route path="investments" element={<DashboardOverview />} />
        <Route path="organizations" element={<DashboardOverview />} />
        <Route path="users" element={<DashboardOverview />} />
      </Routes>
    </DashboardLayout>
  );
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/auth" element={<Auth />} />
      <Route path="/innovations" element={<Innovations />} />
      <Route path="/innovations/new" element={
        <ProtectedRoute><NewInnovation /></ProtectedRoute>
      } />
      <Route path="/innovations/:innovationId/edit" element={
        <ProtectedRoute><EditInnovation /></ProtectedRoute>
      } />
      <Route path="/explore" element={<Explore />} />
      <Route path="/explore/:problemId" element={<ProblemDetails />} />
      <Route path="/solutions" element={<Solutions />} />
      <Route path="/about" element={<About />} />
      <Route path="/profile" element={<Profile />} />
      <Route
        path="/dashboard/*"
        element={
          <ProtectedRoute>
            <DashboardRoutes />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
