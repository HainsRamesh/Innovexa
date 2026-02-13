import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface ChatTarget {
  userId: string;
  userName: string | null;
  userAvatar?: string | null;
  prefilledMessage?: string;
  innovationId?: string;
  innovationTitle?: string;
}

interface ChatContextType {
  isDrawerOpen: boolean;
  activeChats: ChatTarget[];
  currentChatTarget: ChatTarget | null;
  openChat: (target: ChatTarget) => void;
  closeDrawer: () => void;
  toggleDrawer: () => void;
  switchToChat: (userId: string) => void;
  removeChat: (userId: string) => void;
  unreadCount: number;
  refreshUnreadCount: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [activeChats, setActiveChats] = useState<ChatTarget[]>([]);
  const [currentChatTarget, setCurrentChatTarget] = useState<ChatTarget | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  const refreshUnreadCount = useCallback(async () => {
    if (!user?.id) {
      setUnreadCount(0);
      return;
    }
    try {
      const { data, error } = await supabase.rpc("get_unread_message_count");
      if (!error && typeof data === "number") {
        setUnreadCount(data);
      }
    } catch {
      // silent
    }
  }, [user?.id]);

  // Fetch on mount & when user changes
  useEffect(() => {
    refreshUnreadCount();
  }, [refreshUnreadCount]);

  // Realtime: listen for new messages across ALL conversations
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel("unread-messages-global")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          const msg = payload.new as { sender_id: string };
          if (msg.sender_id !== user.id) {
            // New message from someone else – refresh count
            refreshUnreadCount();
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "messages" },
        () => {
          // read_at was set – refresh count
          refreshUnreadCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, refreshUnreadCount]);

  const openChat = useCallback((target: ChatTarget) => {
    setActiveChats((prev) => {
      const existingIndex = prev.findIndex((c) => c.userId === target.userId);
      if (existingIndex >= 0) {
        const updated = [...prev];
        if (target.prefilledMessage) {
          updated[existingIndex] = { ...updated[existingIndex], ...target };
        }
        return updated;
      }
      return [...prev, target];
    });
    setCurrentChatTarget(target);
    setIsDrawerOpen(true);
  }, []);

  const closeDrawer = useCallback(() => {
    setIsDrawerOpen(false);
  }, []);

  const toggleDrawer = useCallback(() => {
    setIsDrawerOpen((prev) => !prev);
  }, []);

  const switchToChat = useCallback((userId: string) => {
    const chat = activeChats.find((c) => c.userId === userId);
    if (chat) {
      setCurrentChatTarget(chat);
    }
  }, [activeChats]);

  const removeChat = useCallback((userId: string) => {
    setActiveChats((prev) => prev.filter((c) => c.userId !== userId));
    if (currentChatTarget?.userId === userId) {
      setCurrentChatTarget(null);
    }
  }, [currentChatTarget]);

  return (
    <ChatContext.Provider
      value={{
        isDrawerOpen,
        activeChats,
        currentChatTarget,
        openChat,
        closeDrawer,
        toggleDrawer,
        switchToChat,
        removeChat,
        unreadCount,
        refreshUnreadCount,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    return {
      isDrawerOpen: false,
      activeChats: [],
      currentChatTarget: null,
      openChat: () => {},
      closeDrawer: () => {},
      toggleDrawer: () => {},
      switchToChat: () => {},
      removeChat: () => {},
      unreadCount: 0,
      refreshUnreadCount: () => {},
    } as ChatContextType;
  }
  return context;
};
