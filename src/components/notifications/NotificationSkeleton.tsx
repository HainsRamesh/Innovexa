import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface NotificationSkeletonProps {
  count?: number;
  compact?: boolean;
}

export const NotificationSkeleton = ({ count = 5, compact = false }: NotificationSkeletonProps) => {
  return (
    <div className="divide-y divide-border/20">
      {Array.from({ length: count }).map((_, i) => (
        <div 
          key={i} 
          className={cn(
            "flex items-start gap-3 animate-pulse",
            compact ? "px-3 py-2.5" : "px-4 py-3"
          )}
        >
          {/* Avatar skeleton */}
          <Skeleton className={cn("rounded-full flex-shrink-0", compact ? "h-9 w-9" : "h-10 w-10")} />
          
          {/* Content skeleton */}
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-full max-w-[280px]" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
      ))}
    </div>
  );
};
