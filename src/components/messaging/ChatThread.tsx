import { useState, useEffect, useRef, useCallback } from "react";
import { format } from "date-fns";
import { Send, Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  text: string;
  read_at: string | null;
  created_at: string;
}

interface ChatThreadProps {
  targetUserId: string;
  targetUserName: string | null;
  targetUserAvatar?: string | null;
  prefilledMessage?: string;
  onBack?: () => void;
  showBackButton?: boolean;
  onMessagesRead?: () => void;
}

export const ChatThread = ({
  targetUserId,
  targetUserName,
  targetUserAvatar,
  prefilledMessage,
  onBack,
  showBackButton = false,
  onMessagesRead,
}: ChatThreadProps) => {
  const { user } = useAuth();
  const [messageText, setMessageText] = useState("");
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [hasSetPrefilled, setHasSetPrefilled] = useState(false);
  const [otherUserProfile, setOtherUserProfile] = useState<{
    full_name: string | null;
    avatar_url: string | null;
  } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Mark messages as read function
  const markMessagesAsRead = useCallback(async (convId: string) => {
    if (!user?.id || !convId) return;

    try {
      const { error } = await supabase
        .from("messages")
        .update({ read_at: new Date().toISOString() })
        .eq("conversation_id", convId)
        .neq("sender_id", user.id)
        .is("read_at", null);

      if (!error) {
        // Update local messages state to reflect read status
        setMessages(prev => prev.map(msg => ({
          ...msg,
          read_at: msg.sender_id !== user.id ? new Date().toISOString() : msg.read_at
        })));
        // Notify parent that messages were read
        onMessagesRead?.();
      }
    } catch (error) {
      console.error("Error marking messages as read:", error);
    }
  }, [user?.id, onMessagesRead]);

  // Fetch messages function
  const fetchMessages = useCallback(async (convId: string) => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", convId)
        .order("created_at", { ascending: true });

      if (error) throw error;

      setMessages(data || []);

      // Mark messages as read immediately after fetching
      await markMessagesAsRead(convId);
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, markMessagesAsRead]);

  // Send message function
  const sendMessage = useCallback(async (convId: string, text: string): Promise<boolean> => {
    if (!user?.id || !text.trim()) return false;

    setIsSending(true);
    try {
      const { data, error } = await supabase
        .from("messages")
        .insert({
          conversation_id: convId,
          sender_id: user.id,
          text: text.trim(),
        })
        .select()
        .single();

      if (error) throw error;

      setMessages((prev) => [...prev, data]);

      // Update conversation timestamp
      await supabase
        .from("conversations")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", convId);

      return true;
    } catch (error) {
      console.error("Error sending message:", error);
      return false;
    } finally {
      setIsSending(false);
    }
  }, [user?.id]);

  // Initialize conversation
  useEffect(() => {
    if (user?.id && targetUserId) {
      initializeConversation();
      fetchOtherUserProfile();
    }
  }, [user?.id, targetUserId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Set prefilled message (only once per conversation)
  useEffect(() => {
    if (prefilledMessage && !hasSetPrefilled && messages.length === 0 && !isLoading && conversationId) {
      setMessageText(prefilledMessage);
      setHasSetPrefilled(true);
    }
  }, [prefilledMessage, hasSetPrefilled, messages.length, isLoading, conversationId]);

  // Reset prefilled flag when target user changes
  useEffect(() => {
    setHasSetPrefilled(false);
    setMessageText("");
    setMessages([]);
    setConversationId(null);
  }, [targetUserId]);

  // Subscribe to real-time messages
  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase
      .channel(`chat-thread:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const newMessage = payload.new as Message;
          // Only add if not already in messages (avoid duplicates)
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMessage.id)) return prev;
            return [...prev, newMessage];
          });

          // Mark as read if from other user
          if (newMessage.sender_id !== user?.id) {
            markMessagesAsRead(conversationId);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, user?.id, markMessagesAsRead]);

  const fetchOtherUserProfile = async () => {
    const { data } = await supabase
      .from("public_profiles")
      .select("full_name, avatar_url")
      .eq("id", targetUserId)
      .maybeSingle();

    setOtherUserProfile(data);
  };

  const initializeConversation = async () => {
    if (!user?.id) return;

    setIsInitializing(true);
    try {
      const { data: convId, error } = await supabase.rpc(
        "get_or_create_conversation",
        {
          _user_one: user.id,
          _user_two: targetUserId,
        }
      );

      if (error) throw error;

      setConversationId(convId);
      await fetchMessages(convId);
    } catch (error) {
      console.error("Error initializing conversation:", error);
    } finally {
      setIsInitializing(false);
    }
  };

  const handleSend = async () => {
    if (!conversationId || !messageText.trim()) return;

    const success = await sendMessage(conversationId, messageText);
    if (success) {
      setMessageText("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
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

  const displayName = targetUserName || otherUserProfile?.full_name || "User";
  const displayAvatar = targetUserAvatar || otherUserProfile?.avatar_url;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-border flex-shrink-0">
        {showBackButton && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="h-8 w-8 -ml-1"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
        )}
        <Avatar className="h-9 w-9">
          <AvatarImage src={displayAvatar || undefined} />
          <AvatarFallback className="bg-muted text-sm">
            {getInitials(displayName)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate">{displayName}</p>
        </div>
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1 p-4">
        {isInitializing || isLoading ? (
          <div className="flex items-center justify-center h-full py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full py-8 text-muted-foreground">
            <p className="text-sm text-center">
              Start a conversation with {displayName}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((message) => {
              const isOwn = message.sender_id === user?.id;
              return (
                <div
                  key={message.id}
                  className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-3 py-2 ${
                      isOwn
                        ? "bg-primary text-primary-foreground rounded-br-md"
                        : "bg-muted text-foreground rounded-bl-md"
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap break-words">
                      {message.text}
                    </p>
                    <p
                      className={`text-[10px] mt-1 ${
                        isOwn
                          ? "text-primary-foreground/70"
                          : "text-muted-foreground"
                      }`}
                    >
                      {format(new Date(message.created_at), "h:mm a")}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </ScrollArea>

      {/* Input Area */}
      <div className="p-3 border-t border-border flex-shrink-0">
        <div className="flex items-center gap-2">
          <Input
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="flex-1 bg-background border-border text-sm"
            disabled={isSending || isInitializing}
          />
          <Button
            size="icon"
            onClick={handleSend}
            disabled={!messageText.trim() || isSending || isInitializing}
            className="h-9 w-9"
          >
            {isSending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};
