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
        "w-full text-left px-3 py-2 mb-1 border-l-4 transition-colors rounded-none",
        "hover:bg-black/5 dark:hover:bg-white/5",
        isOwnBubble
          ? "bg-primary/30 border-foreground"
          : "bg-secondary/50 border-foreground"
      )}
    >
      <p
        className={cn(
          "text-xs font-bold truncate",
          isOwnBubble ? "text-primary-foreground" : "text-primary"
        )}
      >
        {senderName}
      </p>
      <p
        className={cn(
          "text-xs truncate mt-0.5",
          isOwnBubble ? "text-primary-foreground" : "text-foreground"
        )}
      >
        {snippet || "Message"}
      </p>
    </button>
  );
};
