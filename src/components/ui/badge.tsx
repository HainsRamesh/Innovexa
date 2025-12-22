import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive: "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
        // Category variants
        technology: "border-transparent bg-primary/20 text-primary",
        healthcare: "border-transparent bg-pink-500/20 text-pink-400",
        sustainability: "border-transparent bg-emerald-500/20 text-emerald-400",
        finance: "border-transparent bg-amber-500/20 text-amber-400",
        education: "border-transparent bg-violet-500/20 text-violet-400",
        infrastructure: "border-transparent bg-orange-500/20 text-orange-400",
        manufacturing: "border-transparent bg-sky-500/20 text-sky-400",
        agriculture: "border-transparent bg-lime-500/20 text-lime-400",
        other: "border-transparent bg-muted text-muted-foreground",
        // Status variants
        status_open: "border-transparent bg-emerald-500/20 text-emerald-400",
        status_in_review: "border-transparent bg-amber-500/20 text-amber-400",
        status_matched: "border-transparent bg-primary/20 text-primary",
        status_closed: "border-transparent bg-muted text-muted-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
