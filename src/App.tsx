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
import NewProblem from "./pages/NewProblem";
import EditProblem from "./pages/EditProblem";
import Features from "./pages/Features";
import Pricing from "./pages/Pricing";
import Docs from "./pages/Docs";
import Blog from "./pages/Blog";
import Careers from "./pages/Careers";
import Contact from "./pages/Contact";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";

// Dashboard Pages
import DashboardOverview from "./pages/dashboard/DashboardOverview";
import ProblemsPage from "./pages/dashboard/ProblemsPage";
import ProblemDetailPage from "./pages/dashboard/ProblemDetailPage";
import EditProblemPage from "./pages/dashboard/EditProblemPage";
import NewProblemPage from "./pages/dashboard/NewProblemPage";
import BrowseProblemsPage from "./pages/dashboard/BrowseProblemsPage";
import SolutionsPage from "./pages/dashboard/SolutionsPage";
import SolutionDetailPage from "./pages/dashboard/SolutionDetailPage";
import EditSolutionPage from "./pages/dashboard/EditSolutionPage";

const queryClient = new QueryClient();

// Protected Route Component - redirects to landing if not authenticated
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
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

// Public Only Route - redirects authenticated users based on role
const PublicOnlyRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, role, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (user && role) {
    // Redirect based on role
    switch (role) {
      case 'innovator':
      case 'investor':
        return <Navigate to="/innovations" replace />;
      case 'enterprise':
        return <Navigate to="/explore" replace />;
      default:
        return <Navigate to="/innovations" replace />;
    }
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
        <Route path="solutions/:solutionId" element={<SolutionDetailPage />} />
        <Route path="solutions/:solutionId/edit" element={<EditSolutionPage />} />
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
      {/* Public only routes - redirect authenticated users */}
      <Route path="/" element={
        <PublicOnlyRoute><Index /></PublicOnlyRoute>
      } />
      <Route path="/about" element={
        <PublicOnlyRoute><About /></PublicOnlyRoute>
      } />
      <Route path="/auth" element={<Auth />} />
      
      {/* Public informational pages */}
      <Route path="/features" element={<Features />} />
      <Route path="/pricing" element={<Pricing />} />
      <Route path="/docs" element={<Docs />} />
      <Route path="/blog" element={<Blog />} />
      <Route path="/careers" element={<Careers />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/privacy" element={<Privacy />} />
      <Route path="/terms" element={<Terms />} />
      
      {/* Protected routes - require authentication */}
      <Route path="/innovations" element={
        <ProtectedRoute><Innovations /></ProtectedRoute>
      } />
      <Route path="/innovations/new" element={
        <ProtectedRoute><NewInnovation /></ProtectedRoute>
      } />
      <Route path="/innovations/:innovationId/edit" element={
        <ProtectedRoute><EditInnovation /></ProtectedRoute>
      } />
      <Route path="/explore" element={
        <ProtectedRoute><Explore /></ProtectedRoute>
      } />
      <Route path="/explore/:problemId" element={
        <ProtectedRoute><ProblemDetails /></ProtectedRoute>
      } />
      <Route path="/problems/new" element={
        <ProtectedRoute><NewProblem /></ProtectedRoute>
      } />
      <Route path="/problems/:problemId/edit" element={
        <ProtectedRoute><EditProblem /></ProtectedRoute>
      } />
      <Route path="/solutions" element={
        <ProtectedRoute><Solutions /></ProtectedRoute>
      } />
      <Route path="/profile" element={
        <ProtectedRoute><Profile /></ProtectedRoute>
      } />
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
