import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Search, MessageCircle, Loader2, Flag, MoreVertical } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { ChatThread } from "@/components/messaging/ChatThread";
import { ReportMessageDialog } from "@/components/messaging/ReportMessageDialog";

interface ConversationItem {
  id: string;
  participant_one: string;
  participant_two: string;
  updated_at: string;
  other_user: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  };
  last_message?: {
    text: string;
    created_at: string;
    sender_id: string;
  };
  unread_count: number;
}

const MessagesPage = () => {
  const { conversationId } = useParams<{ conversationId?: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [filteredConversations, setFilteredConversations] = useState<ConversationItem[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<ConversationItem | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);

  const fetchConversations = useCallback(async () => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("conversations")
        .select("*")
        .or(`participant_one.eq.${user.id},participant_two.eq.${user.id}`)
        .order("updated_at", { ascending: false });

      if (error) throw error;

      // Enrich conversations with user profiles and last messages
      const enriched = await Promise.all(
        (data || []).map(async (conv) => {
          const otherUserId =
            conv.participant_one === user.id
              ? conv.participant_two
              : conv.participant_one;

          const { data: profile } = await supabase
            .from("public_profiles")
            .select("id, full_name, avatar_url")
            .eq("id", otherUserId)
            .maybeSingle();

          const { data: lastMsg } = await supabase
            .from("messages")
            .select("text, created_at, sender_id")
            .eq("conversation_id", conv.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

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
      setFilteredConversations(enriched);

      // Auto-select conversation from URL
      if (conversationId) {
        const conv = enriched.find((c) => c.id === conversationId);
        if (conv) {
          setSelectedConversation(conv);
        }
      }
    } catch (error) {
      console.error("Error fetching conversations:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, conversationId]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Filter conversations based on search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredConversations(conversations);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = conversations.filter((conv) => {
      const nameMatch = conv.other_user.full_name?.toLowerCase().includes(query);
      const messageMatch = conv.last_message?.text.toLowerCase().includes(query);
      return nameMatch || messageMatch;
    });

    setFilteredConversations(filtered);
  }, [searchQuery, conversations]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel("messages-page")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
        },
        () => {
          fetchConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, fetchConversations]);

  const handleSelectConversation = (conv: ConversationItem) => {
    setSelectedConversation(conv);
    navigate(`/dashboard/messages/${conv.id}`, { replace: true });
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } else if (diffDays === 1) {
      return "Yesterday";
    } else if (diffDays < 7) {
      return date.toLocaleDateString([], { weekday: "short" });
    }
    return date.toLocaleDateString([], { month: "short", day: "numeric" });
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

  const highlightMatch = (text: string, query: string) => {
    if (!query.trim()) return text;
    const regex = new RegExp(`(${query})`, "gi");
    const parts = text.split(regex);
    return parts.map((part, i) =>
      regex.test(part) ? (
        <mark key={i} className="bg-primary/30 text-foreground rounded px-0.5">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  const showMobileThread = selectedConversation && conversationId;

  return (
    <div className="flex flex-col h-[calc(100vh-80px)]">

      <div className="flex flex-1 gap-4 min-h-0">
        {/* Conversation List - hidden on mobile when a thread is open */}
        <div className={cn(
          "w-full md:w-80 flex flex-col bg-card rounded-lg border border-border",
          showMobileThread && "hidden md:flex"
        )}>
          {/* Search */}
          <div className="p-3 border-b border-border">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search messages..."
                className="pl-9"
              />
            </div>
          </div>

          {/* Conversations */}
          <ScrollArea className="flex-1">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4">
                <MessageCircle className="h-12 w-12 text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground text-center">
                  {searchQuery ? "No conversations match your search" : "No conversations yet"}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {filteredConversations.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => handleSelectConversation(conv)}
                    className={cn(
                      "w-full flex items-start gap-3 p-3 text-left transition-colors",
                      "hover:bg-muted/50",
                      selectedConversation?.id === conv.id && "bg-muted"
                    )}
                  >
                    <Avatar className="h-10 w-10 flex-shrink-0">
                      <AvatarImage src={conv.other_user.avatar_url || undefined} />
                      <AvatarFallback className="bg-muted text-sm">
                        {getInitials(conv.other_user.full_name)}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className={cn(
                          "text-sm truncate",
                          conv.unread_count > 0 ? "font-semibold" : "font-medium"
                        )}>
                          {searchQuery
                            ? highlightMatch(conv.other_user.full_name || "User", searchQuery)
                            : conv.other_user.full_name || "User"}
                        </span>
                        <span className="text-xs text-muted-foreground flex-shrink-0">
                          {conv.last_message && formatTime(conv.last_message.created_at)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className={cn(
                          "text-xs truncate flex-1",
                          conv.unread_count > 0
                            ? "text-foreground font-medium"
                            : "text-muted-foreground"
                        )}>
                          {conv.last_message ? (
                            <>
                              {conv.last_message.sender_id === user?.id && (
                                <span className="text-muted-foreground">You: </span>
                              )}
                              {searchQuery
                                ? highlightMatch(conv.last_message.text, searchQuery)
                                : conv.last_message.text}
                            </>
                          ) : (
                            "No messages yet"
                          )}
                        </p>
                        {conv.unread_count > 0 && (
                          <Badge className="h-5 min-w-[20px] flex items-center justify-center p-0 text-xs bg-primary">
                            {conv.unread_count}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Chat Area - shown on mobile when a thread is selected */}
        <div className={cn(
          "flex-1 flex-col bg-card rounded-lg border border-border overflow-hidden",
          showMobileThread ? "flex" : "hidden md:flex"
        )}>
          {selectedConversation ? (
            <>
              <div className="flex-1 overflow-hidden">
                <ChatThread
                  targetUserId={selectedConversation.other_user.id}
                  targetUserName={selectedConversation.other_user.full_name}
                  targetUserAvatar={selectedConversation.other_user.avatar_url}
                  showBackButton={true}
                  onBack={() => {
                    setSelectedConversation(null);
                    navigate("/dashboard/messages", { replace: true });
                  }}
                />
              </div>

              <ReportMessageDialog
                open={reportDialogOpen}
                onOpenChange={setReportDialogOpen}
                conversationId={selectedConversation.id}
              />
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full">
              <MessageCircle className="h-16 w-16 text-muted-foreground/30 mb-4" />
              <h3 className="text-lg font-semibold mb-1">Your Messages</h3>
              <p className="text-sm text-muted-foreground text-center max-w-xs">
                Select a conversation from the list to start messaging
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessagesPage;
