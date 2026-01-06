import { cn } from "@/lib/utils";

interface InnovexaSkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "circle" | "rounded";
}

export function InnovexaSkeleton({ 
  className, 
  variant = "default",
  style,
  ...props
}: InnovexaSkeletonProps) {
  return (
    <div
      style={style}
      className={cn(
        "relative overflow-hidden",
        "bg-[rgba(255,255,255,0.06)]",
        variant === "circle" && "rounded-full",
        variant === "rounded" && "rounded-xl",
        variant === "default" && "rounded-md",
        className
      )}
      {...props}
    >
      {/* Shimmer overlay */}
      <div 
        className="absolute inset-0 -translate-x-full animate-[shimmer_2s_ease-in-out_infinite]"
        style={{
          background: "linear-gradient(90deg, transparent, rgba(45,212,191,0.18), transparent)",
        }}
      />
    </div>
  );
}

interface InnovexaSkeletonTextProps {
  lines?: number;
  className?: string;
  widths?: string[];
}

export function InnovexaSkeletonText({ 
  lines = 3, 
  className,
  widths = ["60%", "40%", "80%"]
}: InnovexaSkeletonTextProps) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <InnovexaSkeleton 
          key={i} 
          className="h-4" 
          style={{ width: widths[i % widths.length] }}
        />
      ))}
    </div>
  );
}

interface InnovexaSkeletonListProps {
  rows?: number;
  className?: string;
}

export function InnovexaSkeletonList({ rows = 4, className }: InnovexaSkeletonListProps) {
  return (
    <div 
      className={cn(
        "rounded-2xl border border-white/10 bg-card p-6 space-y-4",
        className
      )}
      role="status"
      aria-busy="true"
    >
      <span className="sr-only">Loading...</span>
      {Array.from({ length: rows }).map((_, i) => (
        <div 
          key={i} 
          className="flex items-center gap-4 p-3 rounded-xl bg-background/50"
          style={{ animationDelay: `${i * 100}ms` }}
        >
          {/* Left: Thumbnail skeleton */}
          <InnovexaSkeleton 
            variant="rounded" 
            className="w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0" 
          />
          
          {/* Middle: Text lines */}
          <div className="flex-1 min-w-0 space-y-2">
            <InnovexaSkeleton className="h-5" style={{ width: "60%" }} />
            <InnovexaSkeleton className="h-3" style={{ width: "40%" }} />
            <InnovexaSkeleton className="h-3" style={{ width: "80%" }} />
          </div>
          
          {/* Right: Qty & Price style */}
          <div className="hidden sm:flex flex-col items-end space-y-2 flex-shrink-0">
            <InnovexaSkeleton className="h-3 w-12" />
            <InnovexaSkeleton className="h-5 w-16" />
            <InnovexaSkeleton className="h-3 w-10" />
          </div>
        </div>
      ))}
    </div>
  );
}

interface InnovexaSkeletonCardProps {
  className?: string;
}

export function InnovexaSkeletonCard({ className }: InnovexaSkeletonCardProps) {
  return (
    <div 
      className={cn(
        "rounded-2xl border border-white/10 bg-card p-6 space-y-4",
        className
      )}
      role="status"
      aria-busy="true"
    >
      <span className="sr-only">Loading...</span>
      {/* Header */}
      <div className="flex items-center gap-3">
        <InnovexaSkeleton variant="circle" className="w-10 h-10" />
        <div className="space-y-2 flex-1">
          <InnovexaSkeleton className="h-4" style={{ width: "50%" }} />
          <InnovexaSkeleton className="h-3" style={{ width: "30%" }} />
        </div>
      </div>
      
      {/* Content */}
      <InnovexaSkeleton variant="rounded" className="w-full h-40" />
      
      {/* Footer */}
      <div className="flex gap-2">
        <InnovexaSkeleton className="h-8 w-20 rounded-full" />
        <InnovexaSkeleton className="h-8 w-24 rounded-full" />
        <InnovexaSkeleton className="h-8 w-16 rounded-full" />
      </div>
    </div>
  );
}

// Solution card skeleton - matches the SolutionCard layout exactly
export function InnovexaSolutionCardSkeleton({ className }: { className?: string }) {
  return (
    <div 
      className={cn(
        "rounded-lg border border-border/50 bg-card p-6 space-y-4",
        className
      )}
      role="status"
      aria-busy="true"
    >
      <span className="sr-only">Loading solution...</span>
      {/* Header: badges */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-2">
            <InnovexaSkeleton className="h-5 w-20 rounded-full" />
            <InnovexaSkeleton className="h-5 w-16 rounded-full" />
          </div>
          {/* Title */}
          <InnovexaSkeleton className="h-5" style={{ width: "80%" }} />
        </div>
        {/* Match badge */}
        <InnovexaSkeleton className="h-5 w-16 rounded-full flex-shrink-0" />
      </div>
      
      {/* Description */}
      <InnovexaSkeleton className="h-4" style={{ width: "95%" }} />
      <InnovexaSkeleton className="h-4" style={{ width: "70%" }} />
      
      {/* Problem title */}
      <div className="pt-1">
        <InnovexaSkeleton className="h-4" style={{ width: "50%" }} />
      </div>
      
      {/* Meta: cost, time, date */}
      <div className="flex flex-wrap gap-4">
        <InnovexaSkeleton className="h-4 w-20" />
        <InnovexaSkeleton className="h-4 w-16" />
        <InnovexaSkeleton className="h-4 w-24" />
      </div>
      
      {/* Tech stack badges */}
      <div className="flex gap-2">
        <InnovexaSkeleton className="h-6 w-14 rounded-full" />
        <InnovexaSkeleton className="h-6 w-16 rounded-full" />
        <InnovexaSkeleton className="h-6 w-12 rounded-full" />
      </div>
      
      {/* View button */}
      <InnovexaSkeleton className="h-9 w-28 rounded-md mt-2" />
    </div>
  );
}

// Solutions grid skeleton - matches the solutions grid layout
export function InnovexaSolutionsGridSkeleton({ cards = 6, className }: { cards?: number; className?: string }) {
  return (
    <div 
      className={cn(
        "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6",
        className
      )}
      role="status"
      aria-busy="true"
    >
      <span className="sr-only">Loading solutions...</span>
      {Array.from({ length: cards }).map((_, i) => (
        <InnovexaSolutionCardSkeleton key={i} />
      ))}
    </div>
  );
}

interface InnovexaSkeletonGridProps {
  cards?: number;
  className?: string;
}

export function InnovexaSkeletonGrid({ cards = 6, className }: InnovexaSkeletonGridProps) {
  return (
    <div 
      className={cn(
        "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6",
        className
      )}
      role="status"
      aria-busy="true"
    >
      <span className="sr-only">Loading...</span>
      {Array.from({ length: cards }).map((_, i) => (
        <InnovexaSkeletonCard key={i} />
      ))}
    </div>
  );
}

// Page-level skeleton with branding
export function InnovexaPageSkeleton({ message = "Loading..." }: { message?: string }) {
  return (
    <div 
      className="min-h-screen bg-background flex flex-col items-center justify-center p-6"
      role="status"
      aria-busy="true"
    >
      <span className="sr-only">{message}</span>
      
      {/* Glow effect */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
        <div className="w-64 h-64 rounded-full bg-primary/10 blur-3xl animate-pulse-slow" />
      </div>
      
      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-8 w-full max-w-2xl">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <img src="/zynovexa-logo.png" alt="Zynovexa" className="h-8 w-8 rounded-lg" />
          <span className="text-2xl font-bold tracking-tight text-foreground">ZYNOVEXA</span>
        </div>
        
        {/* Skeleton list preview */}
        <InnovexaSkeletonList rows={3} className="w-full" />
        
        {/* Message */}
        <p className="text-muted-foreground text-sm animate-pulse">{message}</p>
      </div>
    </div>
  );
}
