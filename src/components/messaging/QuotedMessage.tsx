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
        "w-full text-left px-3 py-2 rounded-lg border-l-[3px]",
        isOwnBubble
          ? "bg-[hsl(var(--chat-reply-sent))] border-[hsl(var(--chat-reply-accent-sent))]"
          : "bg-[hsl(var(--chat-reply-received))] border-[hsl(var(--chat-reply-accent-received))]"
      )}
    >
      <p
        className={cn(
          "text-xs font-bold truncate",
          isOwnBubble
            ? "text-[hsl(var(--chat-reply-accent-sent))]"
            : "text-[hsl(var(--chat-reply-accent-received))]"
        )}
      >
        {senderName}
      </p>
      <p
        className={cn(
          "text-xs truncate mt-0.5 opacity-80",
          isOwnBubble
            ? "text-[hsl(var(--chat-sent-foreground))]"
            : "text-[hsl(var(--chat-received-foreground))]"
        )}
      >
        {snippet || "Message"}
      </p>
    </button>
  );
};
