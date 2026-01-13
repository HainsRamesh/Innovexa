import { createContext, useContext, useState, useCallback, ReactNode } from "react";

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
  getTotalUnreadCount: () => number;
  setTotalUnreadCount: (count: number) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider = ({ children }: { children: ReactNode }) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [activeChats, setActiveChats] = useState<ChatTarget[]>([]);
  const [currentChatTarget, setCurrentChatTarget] = useState<ChatTarget | null>(null);
  const [totalUnreadCount, setTotalUnreadCountState] = useState(0);

  const openChat = useCallback((target: ChatTarget) => {
    setActiveChats((prev) => {
      // Check if chat with this user already exists
      const existingIndex = prev.findIndex((c) => c.userId === target.userId);
      if (existingIndex >= 0) {
        // Update with new prefilled message if provided
        const updated = [...prev];
        if (target.prefilledMessage) {
          updated[existingIndex] = { ...updated[existingIndex], ...target };
        }
        return updated;
      }
      // Add new chat
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

  const getTotalUnreadCount = useCallback(() => totalUnreadCount, [totalUnreadCount]);

  const setTotalUnreadCount = useCallback((count: number) => {
    setTotalUnreadCountState(count);
  }, []);

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
        getTotalUnreadCount,
        setTotalUnreadCount,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
};
