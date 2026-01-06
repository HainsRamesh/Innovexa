import { useEffect, useState, useRef } from "react";
import { CheckCircle, XCircle, RefreshCw } from "lucide-react";
import { Button } from "./button";

export type SubmissionStatus = "loading" | "success" | "error";
export type SubmissionType = "solution" | "problem";

interface SubmissionLoadingOverlayProps {
  open: boolean;
  type: SubmissionType;
  status: SubmissionStatus;
  onRetry?: () => void;
  onClose?: () => void;
  errorMessage?: string;
}

const MESSAGES = {
  solution: {
    loading: {
      title: "Submitting your solution…",
      subtitle: "Please don't close this tab. We're validating and uploading your submission.",
    },
    success: {
      title: "Submitted successfully!",
      subtitle: "Your solution has been submitted for review.",
    },
    error: {
      title: "Submission failed",
      subtitle: "Something went wrong. Please try again.",
    },
  },
  problem: {
    loading: {
      title: "Submitting your problem…",
      subtitle: "Please don't close this tab. We're publishing your problem for review.",
    },
    success: {
      title: "Submitted successfully!",
      subtitle: "Your problem is now live and visible to innovators.",
    },
    error: {
      title: "Submission failed",
      subtitle: "Something went wrong. Please try again.",
    },
  },
};

const MIN_DISPLAY_TIME = 800; // ms

export function SubmissionLoadingOverlay({
  open,
  type,
  status,
  onRetry,
  onClose,
  errorMessage,
}: SubmissionLoadingOverlayProps) {
  const [displayedStatus, setDisplayedStatus] = useState<SubmissionStatus>(status);
  const [shouldShow, setShouldShow] = useState(open);
  const startTimeRef = useRef<number | null>(null);

  // Handle minimum display time for loading state
  useEffect(() => {
    if (open && status === "loading") {
      startTimeRef.current = Date.now();
      setShouldShow(true);
      setDisplayedStatus("loading");
    }
  }, [open, status]);

  // Handle status transitions with minimum display time
  useEffect(() => {
    if (status !== "loading" && startTimeRef.current) {
      const elapsed = Date.now() - startTimeRef.current;
      const remaining = Math.max(0, MIN_DISPLAY_TIME - elapsed);
      
      const timer = setTimeout(() => {
        setDisplayedStatus(status);
        startTimeRef.current = null;
      }, remaining);
      
      return () => clearTimeout(timer);
    } else if (status !== "loading") {
      setDisplayedStatus(status);
    }
  }, [status]);

  // Handle success state transition (show for 600ms then allow close)
  useEffect(() => {
    if (displayedStatus === "success") {
      const timer = setTimeout(() => {
        setShouldShow(false);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [displayedStatus]);

  // Sync shouldShow with open prop
  useEffect(() => {
    if (open) {
      setShouldShow(true);
    } else if (displayedStatus !== "loading") {
      setShouldShow(false);
    }
  }, [open, displayedStatus]);

  // Prevent scroll when overlay is open
  useEffect(() => {
    if (shouldShow) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [shouldShow]);

  if (!shouldShow) return null;

  const messages = MESSAGES[type][displayedStatus];

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-gradient-to-br from-[#060B16] via-[#071024] to-[#0a1628]"
      role="status"
      aria-live="polite"
      aria-busy={displayedStatus === "loading"}
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
            <img src="/zynovexa-logo.png" alt="Zynovexa" className="h-8 w-8 rounded-lg" />
            <h2 className="text-2xl font-bold text-white tracking-tight">ZYNOVEXA</h2>
          </div>
        </div>

        {/* Status indicator */}
        <div className="flex flex-col items-center space-y-6">
          {displayedStatus === "loading" && (
            <>
              {/* Animated spinner with progress ring */}
              <div className="relative w-20 h-20">
                {/* Outer ring */}
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
                {/* Inner pulse */}
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

          {displayedStatus === "success" && (
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
              <CheckCircle className="relative w-20 h-20 text-primary animate-scale-in" />
            </div>
          )}

          {displayedStatus === "error" && (
            <XCircle className="w-20 h-20 text-destructive" />
          )}

          {/* Messages */}
          <div className="text-center space-y-2">
            <h3 className="text-xl font-semibold text-white">
              {messages.title}
            </h3>
            <p className="text-sm text-white/60 max-w-xs">
              {errorMessage && displayedStatus === "error" ? errorMessage : messages.subtitle}
            </p>
          </div>

          {/* Error actions */}
          {displayedStatus === "error" && (
            <div className="flex gap-3 mt-4">
              {onRetry && (
                <Button
                  onClick={onRetry}
                  className="bg-primary hover:bg-primary/90"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
              )}
              {onClose && (
                <Button variant="outline" onClick={onClose}>
                  Close
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Visually hidden loading text for screen readers */}
        <span className="sr-only">
          {displayedStatus === "loading" ? "Loading…" : displayedStatus === "success" ? "Success" : "Error"}
        </span>
      </div>
    </div>
  );
}
