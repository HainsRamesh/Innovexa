import { cn } from "@/lib/utils";

interface QuotedMessageProps {
  senderName: string;
  snippet: string;
  isOwnBubble: boolean;
  onClick?: () => void;
}

export const QuotedMessage = ({
  senderName,
  snippet,
  isOwnBubble,
  onClick,
}: QuotedMessageProps) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full text-left rounded-lg px-3 py-2 mb-1 border-l-3 transition-colors",
        "hover:bg-black/5 dark:hover:bg-white/5",
        isOwnBubble
          ? "bg-primary-foreground/20 border-primary-foreground/70"
          : "bg-accent/60 border-primary"
      )}
    >
      <p
        className={cn(
          "text-xs font-bold truncate",
          isOwnBubble ? "text-primary-foreground/90" : "text-primary"
        )}
      >
        {senderName}
      </p>
      <p
        className={cn(
          "text-xs truncate mt-0.5",
          isOwnBubble ? "text-primary-foreground/70" : "text-muted-foreground"
        )}
      >
        {snippet || "Message"}
      </p>
    </button>
  );
};
