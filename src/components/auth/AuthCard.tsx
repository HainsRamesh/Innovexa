import { ReactNode } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface AuthCardProps {
  title: string;
  description?: string;
  children: ReactNode;
  icon?: ReactNode;
  className?: string;
  footer?: ReactNode;
}

export function AuthCard({ 
  title, 
  description, 
  children, 
  icon,
  className,
  footer 
}: AuthCardProps) {
  return (
    <Card variant="elevated" className={cn("border-border/50", className)}>
      <CardHeader className="text-center pb-2">
        {icon && (
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              {icon}
            </div>
          </div>
        )}
        <CardTitle className="text-2xl">{title}</CardTitle>
        {description && (
          <CardDescription className="text-base">{description}</CardDescription>
        )}
      </CardHeader>
      <CardContent className="pt-2">
        {children}
      </CardContent>
      {footer && (
        <div className="px-6 pb-6 pt-2">
          {footer}
        </div>
      )}
    </Card>
  );
}
