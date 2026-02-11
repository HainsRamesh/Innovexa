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
        "block w-full text-left px-3 py-2 rounded-lg border-l-[3px]",
        isOwnBubble
          ? "bg-primary-foreground/10 border-primary-foreground/60"
          : "bg-foreground/5 border-primary"
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
          "text-xs truncate mt-0.5 opacity-75",
          isOwnBubble ? "text-primary-foreground" : "text-foreground"
        )}
      >
        {snippet || "Message"}
      </p>
    </button>
  );
};
