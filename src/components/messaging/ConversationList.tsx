import { useEffect, useState } from "react";
import { format } from "date-fns";
import { MessageCircle, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface ConversationItem {
  id: string;
  participant_one: string;
  participant_two: string;
  updated_at: string;
  other_user?: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  };
  last_message?: {
    text: string;
    created_at: string;
    sender_id: string;
  };
  unread_count?: number;
}

interface ConversationListProps {
  onSelectConversation: (userId: string, userName: string | null, avatarUrl: string | null) => void;
  selectedUserId?: string | null;
  onTotalUnreadChange?: (count: number) => void;
}

export const ConversationList = ({
  onSelectConversation,
  selectedUserId,
  onTotalUnreadChange,
}: ConversationListProps) => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      fetchConversations();
    }
  }, [user?.id]);

  // Real-time subscription for new messages
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel("conversations-list")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
        },
        () => {
          // Refetch conversations when messages change
          fetchConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const fetchConversations = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from("conversations")
        .select("*")
        .or(`participant_one.eq.${user.id},participant_two.eq.${user.id}`)
        .order("updated_at", { ascending: false });

      if (error) throw error;

      // Enrich with other user profiles and last messages
      const enriched = await Promise.all(
        (data || []).map(async (conv) => {
          const otherUserId =
            conv.participant_one === user.id
              ? conv.participant_two
              : conv.participant_one;

          // Get other user profile
          const { data: profile } = await supabase
            .from("public_profiles")
            .select("id, full_name, avatar_url")
            .eq("id", otherUserId)
            .maybeSingle();

          // Get last message
          const { data: lastMsg } = await supabase
            .from("messages")
            .select("text, created_at, sender_id")
            .eq("conversation_id", conv.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

          // Get unread count
          const { count } = await supabase
            .from("messages")
            .select("*", { count: "exact", head: true })
            .eq("conversation_id", conv.id)
            .neq("sender_id", user.id)
            .is("read_at", null);

          return {
            ...conv,
            other_user: profile || { id: otherUserId, full_name: null, avatar_url: null },
            last_message: lastMsg,
            unread_count: count || 0,
          };
        })
      );

      setConversations(enriched);

      // Calculate total unread
      const totalUnread = enriched.reduce((sum, c) => sum + (c.unread_count || 0), 0);
      onTotalUnreadChange?.(totalUnread);
    } catch (error) {
      console.error("Error fetching conversations:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getInitials = (name: string | null) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return format(date, "h:mm a");
    } else if (diffDays === 1) {
      return "Yesterday";
    } else if (diffDays < 7) {
      return format(date, "EEE");
    }
    return format(date, "MMM d");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-8 px-4 text-center">
        <MessageCircle className="h-12 w-12 text-muted-foreground mb-3" />
        <p className="text-sm text-muted-foreground">No conversations yet</p>
        <p className="text-xs text-muted-foreground mt-1">
          Start messaging innovators to see your chats here
        </p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="divide-y divide-border">
        {conversations.map((conv) => {
          const isSelected = selectedUserId === conv.other_user?.id;
          const hasUnread = (conv.unread_count || 0) > 0;

          return (
            <button
              key={conv.id}
              onClick={() =>
                onSelectConversation(
                  conv.other_user?.id || "",
                  conv.other_user?.full_name || null,
                  conv.other_user?.avatar_url || null
                )
              }
              className={cn(
                "w-full flex items-start gap-3 p-3 hover:bg-muted/50 transition-colors text-left",
                isSelected && "bg-muted",
                hasUnread && "bg-primary/5"
              )}
            >
              <Avatar className="h-10 w-10 flex-shrink-0">
                <AvatarImage src={conv.other_user?.avatar_url || undefined} />
                <AvatarFallback className="bg-muted text-muted-foreground text-sm">
                  {getInitials(conv.other_user?.full_name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={cn(
                      "text-sm truncate",
                      hasUnread ? "font-semibold text-foreground" : "font-medium text-foreground"
                    )}
                  >
                    {conv.other_user?.full_name || "User"}
                  </span>
                  {conv.last_message && (
                    <span className="text-xs text-muted-foreground flex-shrink-0">
                      {formatTime(conv.last_message.created_at)}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <p
                    className={cn(
                      "text-xs truncate flex-1",
                      hasUnread ? "text-foreground font-medium" : "text-muted-foreground"
                    )}
                  >
                    {conv.last_message
                      ? conv.last_message.sender_id === user?.id
                        ? `You: ${conv.last_message.text}`
                        : conv.last_message.text
                      : "No messages yet"}
                  </p>
                  {hasUnread && (
                    <Badge className="h-5 min-w-[20px] flex items-center justify-center p-0 text-xs bg-primary text-primary-foreground">
                      {conv.unread_count}
                    </Badge>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </ScrollArea>
  );
};
