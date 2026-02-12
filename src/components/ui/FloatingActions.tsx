import { MessageCircle } from "lucide-react";
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
  const { isDrawerOpen, openChat } = useChat();

  if (!user || isDrawerOpen) return null;

  return (
    <button
      onClick={() => {
        openChat({
          userId: "",
          userName: null,
        });
      }}
      className={cn(
        "relative h-11 w-11 sm:h-14 sm:w-14 rounded-full",
        "bg-secondary text-secondary-foreground",
        "shadow-lg hover:shadow-xl",
        "flex items-center justify-center",
        "transition-all hover:scale-105 active:scale-95",
        "border border-border",
        className
      )}
      aria-label="Open messages"
    >
      <MessageCircle className="h-5 w-5 sm:h-6 sm:w-6" />
    </button>
  );
};

export { FloatingActionsContainer };
