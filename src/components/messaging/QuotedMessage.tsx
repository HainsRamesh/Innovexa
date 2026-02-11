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
          ? "bg-black/15 border-primary-foreground/70"
          : "bg-muted border-primary"
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
          isOwnBubble ? "text-primary-foreground/85" : "text-foreground/70"
        )}
      >
        {snippet || "Message"}
      </p>
    </button>
  );
};
