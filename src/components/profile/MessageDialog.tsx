import { useState, useEffect, useRef } from "react";
import { format } from "date-fns";
import { Send, Loader2, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useMessaging } from "@/hooks/useMessaging";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface MessageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetUserId: string;
  targetUserName: string | null;
  targetUserAvatar?: string | null;
}

export const MessageDialog = ({
  open,
  onOpenChange,
  targetUserId,
  targetUserName,
  targetUserAvatar,
}: MessageDialogProps) => {
  const { user } = useAuth();
  const [messageText, setMessageText] = useState("");
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [otherUserProfile, setOtherUserProfile] = useState<{
    full_name: string | null;
    avatar_url: string | null;
  } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { messages, isLoading, isSending, sendMessage, fetchMessages } =
    useMessaging();

  // Initialize conversation when dialog opens
  useEffect(() => {
    if (open && user?.id && targetUserId) {
      initializeConversation();
      fetchOtherUserProfile();
    }
  }, [open, user?.id, targetUserId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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

  const displayName =
    targetUserName || otherUserProfile?.full_name || "User";
  const displayAvatar = targetUserAvatar || otherUserProfile?.avatar_url;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border sm:max-w-lg p-0 gap-0 max-h-[85vh] flex flex-col">
        {/* Header */}
        <DialogHeader className="p-4 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={displayAvatar || undefined} />
              <AvatarFallback className="bg-muted">
                {getInitials(displayName)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <DialogTitle className="text-base font-semibold">
                {displayName}
              </DialogTitle>
            </div>
          </div>
        </DialogHeader>

        {/* Messages Area */}
        <ScrollArea className="flex-1 p-4 min-h-[300px] max-h-[400px]">
          {isInitializing || isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <p className="text-sm text-center">
                Start a conversation with {displayName}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => {
                const isOwn = message.sender_id === user?.id;
                return (
                  <div
                    key={message.id}
                    className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                        isOwn
                          ? "bg-primary text-primary-foreground rounded-br-md"
                          : "bg-muted text-foreground rounded-bl-md"
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap break-words">
                        {message.text}
                      </p>
                      <p
                        className={`text-xs mt-1 ${
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
        <div className="p-4 border-t border-border flex-shrink-0">
          <div className="flex items-center gap-2">
            <Input
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              className="flex-1 bg-background border-border"
              disabled={isSending || isInitializing}
            />
            <Button
              size="icon"
              onClick={handleSend}
              disabled={!messageText.trim() || isSending || isInitializing}
              className="h-10 w-10"
            >
              {isSending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
