import { useState, useEffect, lazy, Suspense } from "react";
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
import { ScrollToTop } from "@/components/layout/ScrollToTop";
import { MessengerDrawer } from "@/components/messaging";
import { supabase } from "@/integrations/supabase/client";

// Critical pages loaded eagerly
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

// Lazy-loaded pages for code splitting
const ExploreProblems = lazy(() => import("./pages/ExploreProblems"));
const ProblemDetails = lazy(() => import("./pages/ProblemDetails"));
const Solutions = lazy(() => import("./pages/Solutions"));
const About = lazy(() => import("./pages/About"));
const Profile = lazy(() => import("./pages/Profile"));
const PublicProfile = lazy(() => import("./pages/PublicProfile"));
const Innovations = lazy(() => import("./pages/Innovations"));
const InnovationDetail = lazy(() => import("./pages/InnovationDetail"));
const NewInnovation = lazy(() => import("./pages/NewInnovation"));
const EditInnovation = lazy(() => import("./pages/EditInnovation"));
const NewProblem = lazy(() => import("./pages/NewProblem"));
const SolutionDetail = lazy(() => import("./pages/SolutionDetail"));
const EditProblem = lazy(() => import("./pages/EditProblem"));
const Features = lazy(() => import("./pages/Features"));
const Pricing = lazy(() => import("./pages/Pricing"));
const Docs = lazy(() => import("./pages/Docs"));
const Blog = lazy(() => import("./pages/Blog"));
const Careers = lazy(() => import("./pages/Careers"));
const Contact = lazy(() => import("./pages/Contact"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Terms = lazy(() => import("./pages/Terms"));
const Cookies = lazy(() => import("./pages/Cookies"));
const HelpCenter = lazy(() => import("./pages/HelpCenter"));
const FAQs = lazy(() => import("./pages/FAQs"));
const Troubleshooting = lazy(() => import("./pages/Troubleshooting"));
const ReportBug = lazy(() => import("./pages/ReportBug"));
const FeatureRequests = lazy(() => import("./pages/FeatureRequests"));
const Accessibility = lazy(() => import("./pages/Accessibility"));
const Roadmap = lazy(() => import("./pages/Roadmap"));
const Community = lazy(() => import("./pages/Community"));
const Messages = lazy(() => import("./pages/Messages"));
const Notifications = lazy(() => import("./pages/Notifications"));

// Dashboard Pages
const DashboardOverview = lazy(() => import("./pages/dashboard/DashboardOverview"));
const ProblemsPage = lazy(() => import("./pages/dashboard/ProblemsPage"));
const ProblemDetailPage = lazy(() => import("./pages/dashboard/ProblemDetailPage"));
const EditProblemPage = lazy(() => import("./pages/dashboard/EditProblemPage"));
const NewProblemPage = lazy(() => import("./pages/dashboard/NewProblemPage"));
const BrowseProblemsPage = lazy(() => import("./pages/dashboard/BrowseProblemsPage"));
const MySolutionsPage = lazy(() => import("./pages/dashboard/MySolutionsPage"));
const MyInnovationsPage = lazy(() => import("./pages/dashboard/MyInnovationsPage"));
const SolutionDetailPage = lazy(() => import("./pages/dashboard/SolutionDetailPage"));
const EditSolutionPage = lazy(() => import("./pages/dashboard/EditSolutionPage"));
const InnovationViewPage = lazy(() => import("./pages/dashboard/InnovationViewPage"));
const InnovationEditPage = lazy(() => import("./pages/dashboard/InnovationEditPage"));
const BookmarksPage = lazy(() => import("./pages/dashboard/BookmarksPage"));
const SettingsPage = lazy(() => import("./pages/dashboard/SettingsPage"));
const NotificationsPage = lazy(() => import("./pages/dashboard/NotificationsPage"));
const MessagesPage = lazy(() => import("./pages/dashboard/MessagesPage"));
const InvestorDashboardPage = lazy(() => import("./pages/dashboard/InvestorDashboardPage"));

const queryClient = new QueryClient();

// Suspense fallback that matches the app's background
const PageFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
  </div>
);

// Protected Route Component - redirects to auth if not authenticated
// STRICT: No dev bypass, only real Supabase authentication
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading, role, profile } = useAuth();
  const [showTimeout, setShowTimeout] = useState(false);
  const [roleTimeout, setRoleTimeout] = useState(false);
  const [sessionVerified, setSessionVerified] = useState<boolean | null>(null);

  // Verify session using supabase.auth.getUser() as single source of truth
  useEffect(() => {
    const verifySession = async () => {
      console.log("[ProtectedRoute] Verifying session with getUser()...");
      const { data, error } = await supabase.auth.getUser();
      
      console.log("[ProtectedRoute] Session verification result:", {
        hasUser: !!data?.user,
        userId: data?.user?.id ?? null,
        email: data?.user?.email ?? null,
        error: error?.message ?? null,
      });
      
      setSessionVerified(!!data?.user && !error);
    };
    
    if (!isLoading) {
      verifySession();
    }
  }, [isLoading, user]);

  // Show timeout message after 10 seconds of loading
  useEffect(() => {
    if (isLoading) {
      const timer = setTimeout(() => setShowTimeout(true), 10000);
      return () => clearTimeout(timer);
    }
    setShowTimeout(false);
  }, [isLoading]);

  // Role timeout - if role doesn't load in 3 seconds, proceed anyway
  useEffect(() => {
    if (user && !role && !isLoading) {
      const timer = setTimeout(() => {
        console.warn("[ProtectedRoute] Role not found after timeout, proceeding without role");
        setRoleTimeout(true);
      }, 3000);
      return () => clearTimeout(timer);
    }
    if (role) {
      setRoleTimeout(false);
    }
  }, [user, role, isLoading]);

  // Log guard decisions
  useEffect(() => {
    const decision = isLoading
      ? "loading"
      : sessionVerified === null
        ? "verifying_session"
        : !sessionVerified
          ? "redirect_auth_no_session"
          : !user
            ? "redirect_auth_no_user"
            : !role && !roleTimeout
              ? "waiting_role"
              : "allow";

    console.log("[ProtectedRoute] Guard decision:", {
      user_id: user?.id ?? null,
      role,
      profile_id: profile?.id ?? null,
      sessionVerified,
      decision,
    });
  }, [user, role, profile, isLoading, roleTimeout, sessionVerified]);

  if (isLoading || sessionVerified === null) {
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

  // CRITICAL: Block access if session verification failed or no user
  if (!sessionVerified || !user) {
    console.log("[ProtectedRoute] BLOCKED: Redirecting to /auth - no valid session");
    return <Navigate to="/auth" replace />;
  }

  // Wait for role to be loaded, but with timeout fallback
  if (!role && !roleTimeout) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
        <p className="text-muted-foreground text-sm">Loading your profile...</p>
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
      <Suspense fallback={<PageFallback />}>
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
      </Suspense>
    </DashboardLayout>
  );
};

const AppRoutes = () => {
  return (
    <Suspense fallback={<PageFallback />}>
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
        <Route path="/innovations/:innovationId" element={
          <ProtectedRoute><InnovationDetail /></ProtectedRoute>
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
        <Route path="/solutions/:solutionId" element={
          <ProtectedRoute><SolutionDetail /></ProtectedRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute><Profile /></ProtectedRoute>
        } />
        <Route path="/users/:userId" element={
          <ProtectedRoute><PublicProfile /></ProtectedRoute>
        } />
        <Route path="/messages" element={
          <ProtectedRoute><Messages /></ProtectedRoute>
        } />
        <Route path="/messages/:conversationId" element={
          <ProtectedRoute><Messages /></ProtectedRoute>
        } />
        <Route path="/notifications" element={
          <ProtectedRoute><Notifications /></ProtectedRoute>
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
    </Suspense>
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
            <ScrollToTop />
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