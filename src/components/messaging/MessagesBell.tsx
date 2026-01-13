import { useState, useEffect, useCallback } from "react";
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useChat } from "@/contexts/ChatContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export const MessagesBell = () => {
  const { user } = useAuth();
  const { openChat, getTotalUnreadCount, setTotalUnreadCount } = useChat();
  const [hasNewMessage, setHasNewMessage] = useState(false);

  const fetchUnreadCount = useCallback(async () => {
    if (!user?.id) return;

    try {
      // Use the efficient RPC function for global unread count
      const { data: count, error } = await supabase.rpc("get_unread_message_count");

      if (error) {
        console.error("Error fetching unread count:", error);
        return;
      }

      setTotalUnreadCount(count || 0);
    } catch (error) {
      console.error("Error fetching unread count:", error);
    }
  }, [user?.id, setTotalUnreadCount]);

  // Fetch initial count
  useEffect(() => {
    fetchUnreadCount();
  }, [fetchUnreadCount]);

  // Subscribe to new messages
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel("messages-unread")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        (payload) => {
          const newMessage = payload.new as { sender_id: string };
          if (newMessage.sender_id !== user.id) {
            setHasNewMessage(true);
            fetchUnreadCount();
            // Reset animation after a delay
            setTimeout(() => setHasNewMessage(false), 2000);
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "messages",
        },
        () => {
          // Refetch when messages are marked as read
          fetchUnreadCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, fetchUnreadCount]);

  const handleClick = () => {
    openChat({ userId: "", userName: null });
  };

  const unreadCount = getTotalUnreadCount();
  const displayCount = unreadCount > 99 ? "99+" : unreadCount;

  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn(
        "relative h-9 w-9 rounded-full transition-all duration-200",
        "hover:bg-muted/80",
        hasNewMessage && "animate-wiggle"
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

      {/* Unread badge */}
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

      {/* Pulse animation for new messages */}
      {hasNewMessage && (
        <span className="absolute inset-0 rounded-full bg-primary/25 animate-ping" />
      )}
    </Button>
  );
};
