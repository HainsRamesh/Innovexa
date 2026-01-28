import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { LoadingProvider } from "@/contexts/LoadingContext";
import { GlobalOverlayProvider } from "@/contexts/GlobalOverlayContext";
import { ChatProvider } from "@/contexts/ChatContext";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { MessengerDrawer } from "@/components/messaging";
// Pages
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import ExploreProblems from "./pages/ExploreProblems";
import ProblemDetails from "./pages/ProblemDetails";
import Solutions from "./pages/Solutions";
import About from "./pages/About";
import Profile from "./pages/Profile";
import PublicProfile from "./pages/PublicProfile";
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
import Cookies from "./pages/Cookies";
import HelpCenter from "./pages/HelpCenter";
import FAQs from "./pages/FAQs";
import Troubleshooting from "./pages/Troubleshooting";
import ReportBug from "./pages/ReportBug";
import FeatureRequests from "./pages/FeatureRequests";
import Accessibility from "./pages/Accessibility";
import Roadmap from "./pages/Roadmap";
import Community from "./pages/Community";

// Dashboard Pages
import DashboardOverview from "./pages/dashboard/DashboardOverview";
import ProblemsPage from "./pages/dashboard/ProblemsPage";
import ProblemDetailPage from "./pages/dashboard/ProblemDetailPage";
import EditProblemPage from "./pages/dashboard/EditProblemPage";
import NewProblemPage from "./pages/dashboard/NewProblemPage";
import BrowseProblemsPage from "./pages/dashboard/BrowseProblemsPage";
import MySolutionsPage from "./pages/dashboard/MySolutionsPage";
import MyInnovationsPage from "./pages/dashboard/MyInnovationsPage";
import SolutionDetailPage from "./pages/dashboard/SolutionDetailPage";
import EditSolutionPage from "./pages/dashboard/EditSolutionPage";
import InnovationViewPage from "./pages/dashboard/InnovationViewPage";
import InnovationEditPage from "./pages/dashboard/InnovationEditPage";
import BookmarksPage from "./pages/dashboard/BookmarksPage";
import SettingsPage from "./pages/dashboard/SettingsPage";
import NotificationsPage from "./pages/dashboard/NotificationsPage";
import MessagesPage from "./pages/dashboard/MessagesPage";
import InvestorDashboardPage from "./pages/dashboard/InvestorDashboardPage";

const queryClient = new QueryClient();

// Protected Route Component - redirects to auth if not authenticated
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading, role } = useAuth();
  const [showTimeout, setShowTimeout] = useState(false);

  // Show timeout message after 10 seconds of loading
  useEffect(() => {
    if (isLoading) {
      const timer = setTimeout(() => setShowTimeout(true), 10000);
      return () => clearTimeout(timer);
    }
    setShowTimeout(false);
  }, [isLoading]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
        {showTimeout && (
          <div className="text-center space-y-2">
            <p className="text-muted-foreground">Taking longer than expected...</p>
            <button 
              onClick={() => window.location.reload()} 
              className="text-primary hover:underline text-sm"
            >
              Retry
            </button>
          </div>
        )}
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Wait for role to be loaded for dashboard routes
  if (!role) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
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
        <Route path="browse/:problemId" element={<ProblemDetailPage />} />
        <Route path="browse/:problemId/edit" element={<EditProblemPage />} />
        <Route path="solutions" element={<MySolutionsPage />} />
        <Route path="solutions/:solutionId" element={<SolutionDetailPage />} />
        <Route path="solutions/:solutionId/edit" element={<EditSolutionPage />} />
        <Route path="innovations" element={<MyInnovationsPage />} />
        <Route path="innovations/:innovationId" element={<InnovationViewPage />} />
        <Route path="innovations/:innovationId/edit" element={<InnovationEditPage />} />
        <Route path="bookmarks" element={<BookmarksPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="messages" element={<MessagesPage />} />
        <Route path="messages/:conversationId" element={<MessagesPage />} />
        <Route path="settings" element={<SettingsPage />} />
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
      <Route path="/about" element={<About />} />
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
      <Route path="/cookies" element={<Cookies />} />
      <Route path="/help-center" element={<HelpCenter />} />
      <Route path="/faqs" element={<FAQs />} />
      <Route path="/troubleshooting" element={<Troubleshooting />} />
      <Route path="/report-bug" element={<ReportBug />} />
      <Route path="/feature-requests" element={<FeatureRequests />} />
      <Route path="/accessibility" element={<Accessibility />} />
      <Route path="/roadmap" element={<Roadmap />} />
      <Route path="/community" element={<Community />} />
      
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
        <ProtectedRoute><ExploreProblems /></ProtectedRoute>
      } />
      <Route path="/explore/problems" element={<Navigate to="/explore" replace />} />
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
      <Route path="/users/:userId" element={
        <ProtectedRoute><PublicProfile /></ProtectedRoute>
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
      <LoadingProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <GlobalOverlayProvider>
              <ChatProvider>
                <AppRoutes />
                <MessengerDrawer />
              </ChatProvider>
            </GlobalOverlayProvider>
          </BrowserRouter>
        </TooltipProvider>
      </LoadingProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
