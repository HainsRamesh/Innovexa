import { cn } from "@/lib/utils";

interface FloatingActionsContainerProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * A fixed-position container for floating action buttons at the bottom-right.
 * Stacks children vertically with proper spacing to prevent overlap.
 */
export const FloatingActionsContainer = ({
  children,
  className,
}: FloatingActionsContainerProps) => {
  return (
    <div
      className={cn(
        "fixed bottom-6 right-6 z-[100]",
        "flex flex-col items-end gap-3",
        "overflow-visible",
        className
      )}
    >
      {children}
    </div>
  );
};
