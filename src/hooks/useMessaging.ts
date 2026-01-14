import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  text: string;
  read_at: string | null;
  created_at: string;
}

interface Conversation {
  id: string;
  participant_one: string;
  participant_two: string;
  created_at: string;
  updated_at: string;
  other_user?: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  };
  last_message?: Message;
  unread_count?: number;
}

export const useMessaging = (otherUserId?: string) => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const fetchConversations = useCallback(async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from("conversations")
        .select("*")
        .or(`participant_one.eq.${user.id},participant_two.eq.${user.id}`)
        .order("updated_at", { ascending: false });

      if (error) throw error;

      // Fetch other user profiles and last messages
      const enrichedConversations = await Promise.all(
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
            .select("*")
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

      setConversations(enrichedConversations);
    } catch (error) {
      console.error("Error fetching conversations:", error);
    }
  }, [user?.id]);

  const getOrCreateConversation = useCallback(
    async (targetUserId: string): Promise<string | null> => {
      if (!user?.id) return null;

      try {
        // Use the database function to get or create conversation
        const { data, error } = await supabase.rpc("get_or_create_conversation", {
          _user_one: user.id,
          _user_two: targetUserId,
        });

        if (error) throw error;

        return data;
      } catch (error) {
        console.error("Error getting/creating conversation:", error);
        toast({
          title: "Error",
          description: "Failed to start conversation",
          variant: "destructive",
        });
        return null;
      }
    },
    [user?.id]
  );

  const fetchMessages = useCallback(
    async (conversationId: string) => {
      if (!user?.id) return;

      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from("messages")
          .select("*")
          .eq("conversation_id", conversationId)
          .order("created_at", { ascending: true });

        if (error) throw error;

        setMessages(data || []);

        // Mark messages as read
        await supabase
          .from("messages")
          .update({ read_at: new Date().toISOString() })
          .eq("conversation_id", conversationId)
          .neq("sender_id", user.id)
          .is("read_at", null);
      } catch (error) {
        console.error("Error fetching messages:", error);
      } finally {
        setIsLoading(false);
      }
    },
    [user?.id]
  );

  const sendMessage = async (conversationId: string, text: string): Promise<boolean> => {
    if (!user?.id || !text.trim()) return false;

    setIsSending(true);
    try {
      const { data, error } = await supabase
        .from("messages")
        .insert({
          conversation_id: conversationId,
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
        .eq("id", conversationId);

      return true;
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsSending(false);
    }
  };

  const openConversationWithUser = async (targetUserId: string) => {
    const conversationId = await getOrCreateConversation(targetUserId);
    if (!conversationId) return null;

    // Fetch the conversation details
    const { data: conv } = await supabase
      .from("conversations")
      .select("*")
      .eq("id", conversationId)
      .single();

    if (conv) {
      // Get other user profile
      const { data: profile } = await supabase
        .from("public_profiles")
        .select("id, full_name, avatar_url")
        .eq("id", targetUserId)
        .maybeSingle();

      const enrichedConv: Conversation = {
        ...conv,
        other_user: profile || { id: targetUserId, full_name: null, avatar_url: null },
      };

      setCurrentConversation(enrichedConv);
      await fetchMessages(conversationId);
      return conversationId;
    }

    return null;
  };

  // Subscribe to new messages in real-time
  useEffect(() => {
    if (!currentConversation?.id) return;

    const channel = supabase
      .channel(`messages:${currentConversation.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${currentConversation.id}`,
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
            supabase
              .from("messages")
              .update({ read_at: new Date().toISOString() })
              .eq("id", newMessage.id);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentConversation?.id, user?.id]);

  return {
    conversations,
    currentConversation,
    messages,
    isLoading,
    isSending,
    fetchConversations,
    fetchMessages,
    sendMessage,
    openConversationWithUser,
    setCurrentConversation,
  };
};
