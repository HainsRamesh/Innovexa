import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useChat } from "@/contexts/ChatContext";

// Event emitter for closing notifications when messages is opened
export const closeNotificationsEvent = new CustomEvent('closeNotifications');

export const MessagesBell = () => {
  const { openChat } = useChat();

  const handleClick = () => {
    // Dispatch event to close notification dropdown
    window.dispatchEvent(new CustomEvent('closeNotifications'));
    openChat({ userId: "", userName: null });
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn(
        "relative h-9 w-9 rounded-full transition-all duration-200",
        "hover:bg-muted/80"
      )}
      onClick={handleClick}
      aria-label="Messages"
    >
      <MessageCircle className="h-[18px] w-[18px] text-muted-foreground" />
    </Button>
  );
};
