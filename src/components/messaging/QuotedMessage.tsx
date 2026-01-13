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
        "w-full text-left rounded-lg px-2 py-1.5 mb-1 border-l-2 transition-colors",
        "hover:bg-black/5 dark:hover:bg-white/5",
        isOwnBubble
          ? "bg-primary-foreground/10 border-primary-foreground/50"
          : "bg-muted/50 border-primary"
      )}
    >
      <p
        className={cn(
          "text-[11px] font-semibold truncate",
          isOwnBubble ? "text-primary-foreground/80" : "text-primary"
        )}
      >
        {senderName}
      </p>
      <p
        className={cn(
          "text-[11px] truncate",
          isOwnBubble ? "text-primary-foreground/60" : "text-muted-foreground"
        )}
      >
        {snippet || "Message"}
      </p>
    </button>
  );
};
