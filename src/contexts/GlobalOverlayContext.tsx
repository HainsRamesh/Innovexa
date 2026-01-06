import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { SubmissionLoadingOverlay, SubmissionStatus } from "@/components/ui/SubmissionLoadingOverlay";

export type OverlayMode = "submitting" | "saving" | "navigating";
export type OverlayType = "solution" | "problem";

interface OverlayConfig {
  mode: OverlayMode;
  type: OverlayType;
  label?: string;
  sublabel?: string;
}

interface GlobalOverlayContextType {
  showOverlay: (config: OverlayConfig) => void;
  setOverlayStatus: (status: SubmissionStatus) => void;
  hideOverlay: () => void;
  markPageReady: () => void;
  isOverlayVisible: boolean;
  isNavigating: boolean;
}

const GlobalOverlayContext = createContext<GlobalOverlayContextType | undefined>(undefined);

// Custom messages for different modes
const MODE_MESSAGES = {
  submitting: {
    solution: {
      loading: {
        title: "Submitting your solution…",
        subtitle: "Please don't close this tab. We're validating and uploading your submission.",
      },
    },
    problem: {
      loading: {
        title: "Submitting your problem…",
        subtitle: "Please don't close this tab. We're publishing your problem for review.",
      },
    },
  },
  saving: {
    solution: {
      loading: {
        title: "Saving changes…",
        subtitle: "Updating your solution. Please don't close this tab.",
      },
    },
    problem: {
      loading: {
        title: "Saving changes…",
        subtitle: "Updating your problem. Please don't close this tab.",
      },
    },
  },
  navigating: {
    solution: {
      loading: {
        title: "Loading…",
        subtitle: "Please wait while we prepare your page.",
      },
    },
    problem: {
      loading: {
        title: "Loading…",
        subtitle: "Please wait while we prepare your page.",
      },
    },
  },
};

export function GlobalOverlayProvider({ children }: { children: ReactNode }) {
  const location = useLocation();
  
  const [isVisible, setIsVisible] = useState(false);
  const [status, setStatus] = useState<SubmissionStatus>("loading");
  const [config, setConfig] = useState<OverlayConfig | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const [pageReady, setPageReady] = useState(true);
  const [pendingHide, setPendingHide] = useState(false);
  const [targetPath, setTargetPath] = useState<string | null>(null);
  const [lastError, setLastError] = useState<string | undefined>();
  const [retryCallback, setRetryCallback] = useState<(() => void) | null>(null);

  // Track route changes
  useEffect(() => {
    if (isNavigating && targetPath && location.pathname === targetPath) {
      // We've arrived at the target path
      setPageReady(true);
    }
  }, [location.pathname, targetPath, isNavigating]);

  // Hide overlay when both request is done and page is ready
  useEffect(() => {
    if (pendingHide && pageReady && status === "success") {
      const timer = setTimeout(() => {
        setIsVisible(false);
        setIsNavigating(false);
        setPendingHide(false);
        setConfig(null);
        setTargetPath(null);
      }, 600); // Show success for 600ms
      return () => clearTimeout(timer);
    }
  }, [pendingHide, pageReady, status]);

  const showOverlay = useCallback((newConfig: OverlayConfig) => {
    setConfig(newConfig);
    setStatus("loading");
    setIsVisible(true);
    setPageReady(false);
    setPendingHide(false);
    setLastError(undefined);
  }, []);

  const setOverlayStatus = useCallback((newStatus: SubmissionStatus) => {
    setStatus(newStatus);
    if (newStatus === "success") {
      setPendingHide(true);
    }
  }, []);

  const hideOverlay = useCallback(() => {
    // Force hide immediately (for errors or cancel)
    setIsVisible(false);
    setIsNavigating(false);
    setPendingHide(false);
    setConfig(null);
    setTargetPath(null);
    setPageReady(true);
  }, []);

  const markPageReady = useCallback(() => {
    setPageReady(true);
  }, []);

  // Start navigation tracking
  const startNavigation = useCallback((path: string) => {
    setIsNavigating(true);
    setPageReady(false);
    setTargetPath(path);
  }, []);

  const handleRetry = useCallback(() => {
    if (retryCallback) {
      setStatus("loading");
      retryCallback();
    }
  }, [retryCallback]);

  const handleClose = useCallback(() => {
    hideOverlay();
  }, [hideOverlay]);

  // Get custom title/subtitle based on mode
  const getOverlayContent = () => {
    if (!config) return null;
    
    const modeMessages = MODE_MESSAGES[config.mode]?.[config.type];
    if (config.label) {
      return {
        title: config.label,
        subtitle: config.sublabel || modeMessages?.loading?.subtitle || "",
      };
    }
    return modeMessages?.loading || null;
  };

  const overlayContent = getOverlayContent();

  return (
    <GlobalOverlayContext.Provider
      value={{
        showOverlay,
        setOverlayStatus,
        hideOverlay,
        markPageReady,
        isOverlayVisible: isVisible,
        isNavigating,
      }}
    >
      {children}
      
      {/* Global overlay - always mounted at root, never unmounts during navigation */}
      {isVisible && config && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-gradient-to-br from-[#060B16] via-[#071024] to-[#0a1628]"
          role="status"
          aria-live="polite"
          aria-busy={status === "loading"}
        >
          {/* Teal glow effects */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[120px] animate-pulse" />
            <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-primary/15 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: "0.5s" }} />
          </div>

          {/* Glassmorphism card */}
          <div className="relative z-10 w-full max-w-md mx-4 p-8 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl">
            {/* Logo/Title */}
            <div className="text-center mb-6">
              <div className="flex items-center justify-center gap-2">
                <img src="/zynovexa-logo.png" alt="Zynovexa" className="h-8 w-8 object-contain" />
                <h2 className="text-2xl font-bold text-white tracking-tight">ZYNOVEXA</h2>
              </div>
            </div>

            {/* Status indicator */}
            <div className="flex flex-col items-center space-y-6">
              {status === "loading" && (
                <>
                  {/* Animated spinner with progress ring */}
                  <div className="relative w-20 h-20">
                    <svg className="w-20 h-20 animate-spin" viewBox="0 0 80 80">
                      <circle
                        cx="40"
                        cy="40"
                        r="35"
                        fill="none"
                        stroke="rgba(255,255,255,0.1)"
                        strokeWidth="4"
                      />
                      <circle
                        cx="40"
                        cy="40"
                        r="35"
                        fill="none"
                        stroke="hsl(var(--primary))"
                        strokeWidth="4"
                        strokeLinecap="round"
                        strokeDasharray="120 220"
                        className="origin-center"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-8 h-8 rounded-full bg-primary/30 animate-ping" />
                    </div>
                  </div>

                  {/* Shimmer line */}
                  <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                    <div 
                      className="h-full w-1/3 bg-gradient-to-r from-transparent via-primary to-transparent animate-shimmer"
                      style={{ animationDuration: "1.5s" }}
                    />
                  </div>

                  {/* Animated dots */}
                  <div className="flex space-x-2">
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        className="w-2 h-2 rounded-full bg-primary animate-bounce"
                        style={{ animationDelay: `${i * 0.15}s`, animationDuration: "0.8s" }}
                      />
                    ))}
                  </div>
                </>
              )}

              {status === "success" && (
                <div className="relative">
                  <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
                  <svg className="relative w-20 h-20 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              )}

              {status === "error" && (
                <svg className="w-20 h-20 text-destructive" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M15 9l-6 6M9 9l6 6" strokeLinecap="round" />
                </svg>
              )}

              {/* Messages */}
              <div className="text-center space-y-2">
                <h3 className="text-xl font-semibold text-white">
                  {status === "loading" && overlayContent?.title}
                  {status === "success" && "Success!"}
                  {status === "error" && "Something went wrong"}
                </h3>
                <p className="text-sm text-white/60 max-w-xs">
                  {status === "loading" && overlayContent?.subtitle}
                  {status === "success" && "Redirecting…"}
                  {status === "error" && (lastError || "Please try again.")}
                </p>
              </div>
            </div>

            {/* Visually hidden loading text for screen readers */}
            <span className="sr-only">
              {status === "loading" ? "Loading…" : status === "success" ? "Success" : "Error"}
            </span>
          </div>
        </div>
      )}
    </GlobalOverlayContext.Provider>
  );
}

export function useGlobalOverlay() {
  const context = useContext(GlobalOverlayContext);
  if (context === undefined) {
    throw new Error("useGlobalOverlay must be used within a GlobalOverlayProvider");
  }
  return context;
}

// Component to signal page is ready (place in destination pages)
export function PageReadySignal() {
  const { markPageReady } = useGlobalOverlay();
  
  useEffect(() => {
    markPageReady();
  }, [markPageReady]);
  
  return null;
}
