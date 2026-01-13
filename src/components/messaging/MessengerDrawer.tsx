import { useState, useEffect, useRef, useCallback } from "react";
import { X, MessageCircle, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useChat } from "@/contexts/ChatContext";
import { useAuth } from "@/contexts/AuthContext";
import { ConversationList, ConversationListRef } from "./ConversationList";
import { ChatThread } from "./ChatThread";

type DrawerView = "list" | "chat";

interface SelectedChatState {
  userId: string;
  userName: string | null;
  userAvatar: string | null;
  prefilledMessage?: string;
}

export const MessengerDrawer = () => {
  const { user } = useAuth();
  const {
    isDrawerOpen,
    currentChatTarget,
    activeChats,
    closeDrawer,
    openChat,
    setTotalUnreadCount,
    getTotalUnreadCount,
  } = useChat();

  const [view, setView] = useState<DrawerView>("list");
  const [selectedChat, setSelectedChat] = useState<SelectedChatState | null>(null);
  const conversationListRef = useRef<ConversationListRef>(null);

  // Sync with external chat target (from Innovation modal)
  useEffect(() => {
    if (currentChatTarget && isDrawerOpen) {
      // If userId is empty, just show the list view
      if (!currentChatTarget.userId) {
        setView("list");
        setSelectedChat(null);
      } else {
        setSelectedChat({
          userId: currentChatTarget.userId,
          userName: currentChatTarget.userName,
          userAvatar: currentChatTarget.userAvatar || null,
          prefilledMessage: currentChatTarget.prefilledMessage,
        });
        setView("chat");
      }
    }
  }, [currentChatTarget, isDrawerOpen]);

  const handleSelectConversation = (
    userId: string,
    userName: string | null,
    avatarUrl: string | null
  ) => {
    setSelectedChat({
      userId,
      userName,
      userAvatar: avatarUrl,
    });
    setView("chat");
  };

  const handleBackToList = useCallback(() => {
    setView("list");
    setSelectedChat(null);
    // Refresh conversations list when going back to ensure read status is updated
    conversationListRef.current?.refreshConversations();
  }, []);

  const handleMessagesRead = useCallback(() => {
    // Refresh the conversation list to update unread counts
    conversationListRef.current?.refreshConversations();
  }, []);

  if (!user) return null;

  const totalUnread = getTotalUnreadCount();

  return (
    <>
      {/* Floating Chat Button (when drawer is closed) */}
      {!isDrawerOpen && (
        <button
          onClick={() => {
            // Always open to list view when clicking the floating button
            openChat({
              userId: "",
              userName: null,
            });
            setView("list");
            setSelectedChat(null);
          }}
          className={cn(
            "fixed bottom-6 right-6 z-50",
            "h-14 w-14 rounded-full",
            "bg-primary text-primary-foreground",
            "shadow-lg hover:shadow-xl",
            "flex items-center justify-center",
            "transition-all hover:scale-105 active:scale-95"
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
      )}

      {/* Messenger Drawer */}
      <div
        className={cn(
          "fixed bottom-0 right-0 z-50",
          "w-full sm:w-[380px] h-[500px] sm:h-[550px]",
          "sm:bottom-6 sm:right-6",
          "bg-card border border-border",
          "sm:rounded-xl shadow-2xl",
          "flex flex-col overflow-hidden",
          "transition-all duration-300 ease-out",
          isDrawerOpen
            ? "translate-y-0 opacity-100 pointer-events-auto"
            : "translate-y-4 opacity-0 pointer-events-none"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
          <div className="flex items-center gap-2">
            {view === "chat" && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleBackToList}
                className="h-8 w-8 -ml-1"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            )}
            <h3 className="font-semibold text-sm">
              {view === "chat" ? "Messages" : "Messaging"}
            </h3>
            {totalUnread > 0 && view === "list" && (
              <Badge variant="secondary" className="text-xs">
                {totalUnread} unread
              </Badge>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={closeDrawer}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {view === "list" ? (
            <ConversationList
              ref={conversationListRef}
              onSelectConversation={handleSelectConversation}
              selectedUserId={selectedChat?.userId}
              onTotalUnreadChange={setTotalUnreadCount}
            />
          ) : selectedChat && selectedChat.userId ? (
            <ChatThread
              targetUserId={selectedChat.userId}
              targetUserName={selectedChat.userName}
              targetUserAvatar={selectedChat.userAvatar}
              prefilledMessage={selectedChat.prefilledMessage}
              onBack={handleBackToList}
              showBackButton={true}
              onMessagesRead={handleMessagesRead}
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground text-sm">Select a conversation</p>
            </div>
          )}
        </div>
      </div>

      {/* Backdrop for mobile */}
      {isDrawerOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm sm:hidden"
          onClick={closeDrawer}
        />
      )}
    </>
  );
};
