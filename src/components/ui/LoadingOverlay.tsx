import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingOverlayProps {
  isVisible: boolean;
  message?: string;
  className?: string;
}

export function LoadingOverlay({
  isVisible,
  message = "Loading...",
  className,
}: LoadingOverlayProps) {
  const [shouldRender, setShouldRender] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setShouldRender(true);
      // Small delay to trigger CSS transition
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsAnimating(true);
        });
      });
    } else {
      setIsAnimating(false);
      const timeout = setTimeout(() => {
        setShouldRender(false);
      }, 300); // Match transition duration
      return () => clearTimeout(timeout);
    }
  }, [isVisible]);

  if (!shouldRender) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 z-[9999] flex flex-col items-center justify-center transition-all duration-300 ease-out",
        "bg-background/95 backdrop-blur-md",
        isAnimating ? "opacity-100" : "opacity-0",
        className
      )}
      role="alert"
      aria-busy="true"
      aria-live="polite"
    >
      {/* Glow effect behind spinner */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-48 h-48 rounded-full bg-primary/20 blur-3xl animate-pulse-slow" />
      </div>

      {/* Logo/Brand */}
      <div className="relative z-10 flex flex-col items-center gap-6">
        <div className="text-3xl font-bold tracking-tight">
          <span className="text-gradient-primary">Inno</span>
          <span className="text-foreground">vexa</span>
        </div>

        {/* Spinner */}
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-gradient-primary opacity-20 blur-md animate-pulse" />
          <div className="relative flex items-center justify-center w-16 h-16 rounded-full border-2 border-primary/30 bg-card/50">
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
          </div>
        </div>

        {/* Message */}
        <p className="text-muted-foreground text-sm font-medium animate-pulse">
          {message}
        </p>
      </div>
    </div>
  );
}
