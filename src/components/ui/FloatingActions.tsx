import { MessageCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useChat } from "@/contexts/ChatContext";
import { useAuth } from "@/contexts/AuthContext";
import { FloatingActionsContainer } from "@/components/ui/FloatingActionsContainer";

interface FloatingMessageButtonProps {
  className?: string;
}

/**
 * Standalone floating message button to be placed inside FloatingActionsContainer.
 * This replaces the FAB that was inside MessengerDrawer to prevent overlap with other FABs.
 */
export const FloatingMessageButton = ({ className }: FloatingMessageButtonProps) => {
  const { user } = useAuth();
  const { isDrawerOpen, openChat, getTotalUnreadCount } = useChat();

  if (!user || isDrawerOpen) return null;

  const totalUnread = getTotalUnreadCount();

  return (
    <button
      onClick={() => {
        openChat({
          userId: "",
          userName: null,
        });
      }}
      className={cn(
        "relative h-14 w-14 rounded-full",
        "bg-secondary text-secondary-foreground",
        "shadow-lg hover:shadow-xl",
        "flex items-center justify-center",
        "transition-all hover:scale-105 active:scale-95",
        "border border-border",
        className
      )}
      aria-label="Open messages"
    >
      <MessageCircle className="h-6 w-6" />
      {totalUnread > 0 && (
        <Badge
          className={cn(
            "absolute -top-1 -right-1",
            "h-5 min-w-[20px] flex items-center justify-center",
            "p-0 text-xs bg-destructive text-destructive-foreground"
          )}
        >
          {totalUnread > 99 ? "99+" : totalUnread}
        </Badge>
      )}
    </button>
  );
};

export { FloatingActionsContainer };
