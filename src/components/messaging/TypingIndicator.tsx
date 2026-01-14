import { cn } from "@/lib/utils";

interface TypingIndicatorProps {
  userName: string | null;
  className?: string;
}

export const TypingIndicator = ({ userName, className }: TypingIndicatorProps) => {
  return (
    <div className={cn("flex items-center gap-2 text-sm text-muted-foreground px-4 py-2", className)}>
      <div className="flex items-center gap-1">
        <span className="font-medium">{userName || "User"}</span>
        <span>is typing</span>
      </div>
      <div className="flex gap-1">
        <span 
          className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce"
          style={{ animationDelay: "0ms", animationDuration: "600ms" }}
        />
        <span 
          className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce"
          style={{ animationDelay: "150ms", animationDuration: "600ms" }}
        />
        <span 
          className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce"
          style={{ animationDelay: "300ms", animationDuration: "600ms" }}
        />
      </div>
    </div>
  );
};
