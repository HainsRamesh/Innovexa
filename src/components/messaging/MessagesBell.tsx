import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useChat } from "@/contexts/ChatContext";

// Event emitter for closing notifications when messages is opened
export const closeNotificationsEvent = new CustomEvent('closeNotifications');

export const MessagesBell = () => {
  const { openChat, unreadCount } = useChat();

  const handleClick = () => {
    window.dispatchEvent(new CustomEvent('closeNotifications'));
    openChat({ userId: "", userName: null });
  };

  const displayCount = unreadCount > 99 ? "99+" : unreadCount;

  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn(
        "relative h-9 w-9 rounded-full transition-all duration-200",
        "hover:bg-muted/80"
      )}
      onClick={handleClick}
      aria-label={`Messages${unreadCount > 0 ? `, ${unreadCount} unread` : ""}`}
    >
      <MessageCircle
        className={cn(
          "h-[18px] w-[18px] transition-colors",
          unreadCount > 0 ? "text-foreground" : "text-muted-foreground"
        )}
      />
      {unreadCount > 0 && (
        <span
          className={cn(
            "absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] px-1",
            "flex items-center justify-center",
            "text-[10px] font-bold text-primary-foreground",
            "bg-primary rounded-full",
            "shadow-[0_0_6px_hsl(var(--primary)/0.4)]",
            "animate-in fade-in zoom-in duration-200"
          )}
        >
          {displayCount}
        </span>
      )}
    </Button>
  );
};
