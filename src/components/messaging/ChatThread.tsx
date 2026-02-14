import { useState, useEffect, useRef, useCallback, DragEvent } from "react";
import { format } from "date-fns";
import { Send, Loader2, ArrowLeft, MoreVertical, Flag, UserX, ShieldOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useProfileActions } from "@/hooks/useProfileActions";
import { ReportUserModal } from "@/components/profile/ReportUserModal";
import { BlockConfirmModal } from "@/components/profile/BlockConfirmModal";
import { EmojiPickerPopover } from "./EmojiPickerPopover";
import { AttachmentPicker, PendingAttachment } from "./AttachmentPicker";
import { AttachmentPreview } from "./AttachmentPreview";
import { MessageAttachmentsList, MessageAttachmentData } from "./MessageAttachment";
import { MessageActions } from "./MessageActions";
import { MessageEditForm } from "./MessageEditForm";
import { ReplyPreview, ReplyingTo } from "./ReplyPreview";
import { QuotedMessage } from "./QuotedMessage";
import { TypingIndicator } from "./TypingIndicator";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  text: string;
  type: string;
  message_type?: "text" | "file" | "image" | "mixed";
  file_url?: string | null;
  file_name?: string | null;
  file_mime?: string | null;
  file_size?: number | null;
  read_at: string | null;
  created_at: string;
  edited_at?: string | null;
  is_deleted?: boolean;
  attachments?: MessageAttachmentData[];
  reply_to_message_id?: string | null;
  reply_to_sender_id?: string | null;
  reply_to_snippet?: string | null;
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

// 15 minute edit window
const EDIT_WINDOW_MS = 15 * 60 * 1000;

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
  const { isBlocked, blockUser, unblockUser, reportUser } = useProfileActions(targetUserId);
  const [isBlockedByOther, setIsBlockedByOther] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [hasSetPrefilled, setHasSetPrefilled] = useState(false);
  const [pendingAttachments, setPendingAttachments] = useState<PendingAttachment[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<ReplyingTo | null>(null);
  const [otherUserProfile, setOtherUserProfile] = useState<{
    full_name: string | null;
    avatar_url: string | null;
  } | null>(null);
  const [isOtherUserTyping, setIsOtherUserTyping] = useState(false);
  const [deletedMessageIds, setDeletedMessageIds] = useState<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messageRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const typingChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const deletedMessageIdsRef = useRef<Set<string>>(new Set());

  // Keep ref in sync for real-time handlers
  useEffect(() => {
    deletedMessageIdsRef.current = deletedMessageIds;
  }, [deletedMessageIds]);

  const fetchAttachmentsForMessage = useCallback(async (messageId: string) => {
    const { data: attachmentsData } = await supabase
      .from("message_attachments")
      .select("*")
      .eq("message_id", messageId);

    if (!attachmentsData || attachmentsData.length === 0) return [];

    const attachmentsWithUrls = await Promise.all(
      attachmentsData.map(async (att) => {
        const { data: signedUrlData } = await supabase.storage
          .from("chat-attachments")
          .createSignedUrl(att.url.replace(/^.*chat-attachments\//, ""), 3600);
        return {
          ...att,
          url: signedUrlData?.signedUrl || att.url,
        };
      })
    );

    return attachmentsWithUrls;
  }, []);

  // Mark messages as read using the secure RPC function
  const markMessagesAsRead = useCallback(async (convId: string) => {
    if (!user?.id || !convId) return;

    try {
      const { data: updatedCount, error } = await supabase.rpc("mark_conversation_read", {
        p_conversation_id: convId,
      });

      if (error) {
        console.error("Error marking messages as read:", error);
        return;
      }

      if (updatedCount && updatedCount > 0) {
        // Update local state
        setMessages(prev => prev.map(msg => ({
          ...msg,
          read_at: msg.sender_id !== user.id && !msg.read_at 
            ? new Date().toISOString() 
            : msg.read_at
        })));
        
        // Notify parent to update unread counts
        onMessagesRead?.();
      }
    } catch (error) {
      console.error("Error marking messages as read:", error);
    }
  }, [user?.id, onMessagesRead]);

  // Fetch messages with attachments
  const fetchMessages = useCallback(async (convId: string) => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      const [
        { data: messagesData, error: messagesError },
      ] = await Promise.all([
        supabase
          .from("messages")
          .select("*")
          .eq("conversation_id", convId)
          .order("created_at", { ascending: true }),
      ]);

      if (messagesError) throw messagesError;

      const filteredMessages = (messagesData || [])
        .filter((msg) => !(msg.deleted_for_user_ids && msg.deleted_for_user_ids.includes(user.id)))
        .filter((msg) => !deletedMessageIds.has(msg.id));

      // Fetch attachments for all messages
      const messageIds = filteredMessages.map(m => m.id);
      const attachmentsMap: Record<string, MessageAttachmentData[]> = {};

      if (messageIds.length > 0) {
        const { data: attachmentsData } = await supabase
          .from("message_attachments")
          .select("*")
          .in("message_id", messageIds);

        if (attachmentsData) {
          // Get signed URLs for private attachments
          const attachmentsWithUrls = await Promise.all(
            attachmentsData.map(async (att) => {
              const { data: signedUrlData } = await supabase.storage
                .from("chat-attachments")
                .createSignedUrl(att.url.replace(/^.*chat-attachments\//, ""), 3600);
              
              return {
                ...att,
                url: signedUrlData?.signedUrl || att.url,
              };
            })
          );

          attachmentsWithUrls.forEach(att => {
            if (!attachmentsMap[att.message_id]) {
              attachmentsMap[att.message_id] = [];
            }
            attachmentsMap[att.message_id].push(att);
          });
        }
      }

      const messagesWithAttachments = filteredMessages.map(msg => ({
        ...msg,
        attachments: attachmentsMap[msg.id] || [],
        message_type: (msg as any).type || "text",
      }));

      setMessages(messagesWithAttachments);
      
      // Mark messages as read after loading
      await markMessagesAsRead(convId);
    } catch (error) {
      console.error("Error fetching messages:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load messages",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, markMessagesAsRead]);

  // Edit message
  const handleEditMessage = async (messageId: string, newText: string) => {
    if (!user?.id) return;

    try {
      const { error } = await supabase
        .from("messages")
        .update({ 
          text: newText, 
          edited_at: new Date().toISOString() 
        })
        .eq("id", messageId)
        .eq("sender_id", user.id);

      if (error) throw error;

      setMessages(prev => prev.map(msg => 
        msg.id === messageId 
          ? { ...msg, text: newText, edited_at: new Date().toISOString() }
          : msg
      ));
      setEditingMessageId(null);
      
      toast({ description: "Message edited" });
    } catch (error) {
      console.error("Error editing message:", error);
      toast({
        title: "Error",
        description: "Failed to edit message",
        variant: "destructive",
      });
    }
  };

  // Delete message for me
  const handleDeleteForMe = async (messageId: string) => {
    if (!user?.id) return;

    try {
      const { error } = await supabase.rpc("soft_delete_message_for_me", {
        p_message_id: messageId,
      });

      if (error) throw error;

      // Track deletion locally so realtime + refetch keep it hidden
      setDeletedMessageIds((prev) => {
        const next = new Set(prev);
        next.add(messageId);
        return next;
      });

      // Remove from local state immediately
      setMessages((prev) => prev.filter((msg) => msg.id !== messageId));
      
      toast({ description: "Message deleted for you" });
    } catch (error) {
      console.error("Error deleting message for me:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete message",
        variant: "destructive",
      });
    }
  };

  // Delete message for everyone
  const handleDeleteForEveryone = async (messageId: string) => {
    if (!user?.id) return;

    try {
      const { error } = await supabase
        .from("messages")
        .update({ 
          is_deleted: true,
          text: "",
        })
        .eq("id", messageId)
        .eq("sender_id", user.id); // Only allow deleting own messages

      if (error) throw error;

      // Update local state to show "deleted" message
      setMessages(prev => prev.map(msg => 
        msg.id === messageId 
          ? { ...msg, is_deleted: true, text: "" }
          : msg
      ));
      
      toast({ description: "Message deleted for everyone" });
    } catch (error) {
      console.error("Error deleting message for everyone:", error);
      toast({
        title: "Error",
        description: "Failed to delete message",
        variant: "destructive",
      });
    }
  };

  // Check if message can be edited (within 15 min window)
  const canEditMessage = (createdAt: string) => {
    const messageTime = new Date(createdAt).getTime();
    const now = Date.now();
    return now - messageTime < EDIT_WINDOW_MS;
  };

  // Upload attachment to storage
  const uploadAttachment = async (file: File): Promise<{ url: string; thumbnailUrl?: string } | null> => {
    if (!user?.id || !conversationId) return null;

    const fileExt = file.name.split(".").pop();
    const fileName = `${user.id}/${conversationId}/${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from("chat-attachments")
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      console.error("Upload error:", error);
      throw error;
    }

    return {
      url: data.path,
    };
  };

  // Send message with attachments
  const sendMessageWithAttachments = async () => {
    if (!conversationId || (!messageText.trim() && pendingAttachments.length === 0)) return;
    if (!user?.id) return;

    const currentReply = replyingTo; // Capture before clearing
    const currentText = messageText.trim();
    const currentAttachments = [...pendingAttachments];
    
    // Optimistic update - clear inputs immediately for instant UX
    setMessageText("");
    setPendingAttachments([]);
    setReplyingTo(null);

    // Create optimistic message for instant UI
    const optimisticId = `optimistic-${Date.now()}`;
    const optimisticMessage: Message = {
      id: optimisticId,
      conversation_id: conversationId,
      sender_id: user.id,
      text: currentText || "",
      type: currentAttachments.length > 0 ? "mixed" : "text",
      read_at: null,
      created_at: new Date().toISOString(),
      attachments: [],
      reply_to_message_id: currentReply?.messageId || null,
      reply_to_sender_id: currentReply?.senderId || null,
      reply_to_snippet: currentReply?.snippet?.slice(0, 100) || null,
    };

    // Show message instantly
    setMessages(prev => [...prev, optimisticMessage]);

    try {
      // Upload all attachments first
      const uploadedAttachments: Array<{
        file: File;
        url: string;
        signedUrl: string;
        thumbnailUrl?: string;
      }> = [];

      for (const attachment of currentAttachments) {
        try {
          const result = await uploadAttachment(attachment.file);
          if (result) {
            const { data: signedUrlData } = await supabase.storage
              .from("chat-attachments")
              .createSignedUrl(result.url.replace(/^.*chat-attachments\//, ""), 3600);
            uploadedAttachments.push({
              file: attachment.file,
              ...result,
              signedUrl: signedUrlData?.signedUrl || result.url,
            });
          }
        } catch (error) {
          console.error("Upload failed:", error);
          throw error;
        }
      }

      const optimisticAttachments = uploadedAttachments.map((att, index) => ({
        id: `${optimisticId}-att-${index}`,
        url: att.signedUrl,
        file_name: att.file.name,
        mime_type: att.file.type,
        size: att.file.size,
        thumbnail_url: att.thumbnailUrl || null,
        message_id: optimisticId,
      }));

      if (optimisticAttachments.length > 0) {
        setMessages(prev => prev.map(msg =>
          msg.id === optimisticId ? { ...msg, attachments: optimisticAttachments } : msg
        ));
      }

      // Determine message type
      let messageType = "text";
      if (uploadedAttachments.length > 0 && currentText) {
        messageType = "mixed";
      } else if (uploadedAttachments.length > 0) {
        const hasImages = uploadedAttachments.some(a => a.file.type.startsWith("image/"));
        const hasFiles = uploadedAttachments.some(a => !a.file.type.startsWith("image/"));
        if (hasImages && !hasFiles) {
          messageType = "image";
        } else {
          messageType = "file";
        }
      }

      // Insert message with reply metadata
      const messagePayload: any = {
        conversation_id: conversationId,
        sender_id: user.id,
        text: currentText || "",
        type: messageType,
      };

      if (currentReply) {
        messagePayload.reply_to_message_id = currentReply.messageId;
        messagePayload.reply_to_sender_id = currentReply.senderId;
        messagePayload.reply_to_snippet = currentReply.snippet.slice(0, 100);
      }

      console.log("[REPLY DEBUG] messagePayload:", JSON.stringify(messagePayload));

      const { data: newMessage, error: msgError } = await supabase
        .from("messages")
        .insert(messagePayload)
        .select()
        .single();

      if (msgError) throw msgError;

      console.log("[REPLY DEBUG] newMessage from DB:", JSON.stringify({
        id: newMessage.id,
        reply_to_message_id: newMessage.reply_to_message_id,
        reply_to_sender_id: newMessage.reply_to_sender_id,
        reply_to_snippet: newMessage.reply_to_snippet,
      }));

      // Replace optimistic message with real one
      setMessages(prev => prev.map(msg => 
        msg.id === optimisticId 
          ? { ...newMessage, attachments: optimisticAttachments.length ? optimisticAttachments : [] } 
          : msg
      ));

      // Insert attachments
      if (uploadedAttachments.length > 0) {
        const attachmentRecords = uploadedAttachments.map(att => ({
          message_id: newMessage.id,
          url: att.url,
          file_name: att.file.name,
          mime_type: att.file.type,
          size: att.file.size,
          thumbnail_url: att.thumbnailUrl || null,
        }));

        const { error: attError } = await supabase
          .from("message_attachments")
          .insert(attachmentRecords);

        if (attError) {
          console.error("Error inserting attachments:", attError);
        } else {
          // Refresh attachments with real IDs & signed URLs
          const signed = await fetchAttachmentsForMessage(newMessage.id);
          setMessages(prev => prev.map(msg =>
            msg.id === newMessage.id ? { ...msg, attachments: signed } : msg
          ));
        }
      }

      // Update conversation timestamp (fire and forget)
      supabase
        .from("conversations")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", conversationId)
        .then(() => {});
    } catch (error) {
      console.error("Error sending message:", error);
      // Remove optimistic message on failure
      setMessages(prev => prev.filter(msg => msg.id !== optimisticId));
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    }
  };

  // Handle file selection
  const handleFilesSelected = (files: File[]) => {
    const newAttachments: PendingAttachment[] = files.map(file => ({
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      file,
      type: file.type.startsWith("image/") ? "image" : "file",
      preview: file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined,
    }));
    setPendingAttachments(prev => [...prev, ...newAttachments]);
  };

  // Handle attachment removal
  const handleRemoveAttachment = (id: string) => {
    setPendingAttachments(prev => {
      const attachment = prev.find(a => a.id === id);
      if (attachment?.preview) {
        URL.revokeObjectURL(attachment.preview);
      }
      return prev.filter(a => a.id !== id);
    });
  };

  const handleAttachmentDeleted = (messageId: string, attachmentId: string) => {
    setMessages(prev => prev
      .map(msg => msg.id === messageId
        ? { ...msg, attachments: (msg.attachments || []).filter(att => att.id !== attachmentId) }
        : msg
      )
      // If a message has no text and no attachments after deletion, drop it
      .filter(msg => (msg.attachments && msg.attachments.length > 0) || (msg.text?.trim().length ?? 0) > 0)
    );
  };

  // Handle emoji selection
  const handleEmojiSelect = (emoji: string) => {
    const textarea = textareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newText = messageText.slice(0, start) + emoji + messageText.slice(end);
      setMessageText(newText);
      // Set cursor position after emoji
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + emoji.length;
        textarea.focus();
      }, 0);
    } else {
      setMessageText(prev => prev + emoji);
    }
  };

  // Drag and drop handlers
  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFilesSelected(files);
    }
  };

  // Check bidirectional block status
  useEffect(() => {
    const checkBidirectionalBlock = async () => {
      if (!user?.id || !targetUserId) return;
      const { data } = await supabase.rpc("is_user_blocked", {
        _user_id: user.id,
        _other_user_id: targetUserId,
      });
      // is_user_blocked returns true if EITHER direction has a block
      // isBlocked from useProfileActions only checks if WE blocked them
      // So if is_user_blocked is true but isBlocked is false, THEY blocked US
      setIsBlockedByOther(data === true && !isBlocked);
    };
    checkBidirectionalBlock();
  }, [user?.id, targetUserId, isBlocked]);

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

  // Reset state when target user changes
  useEffect(() => {
    setHasSetPrefilled(false);
    setMessageText("");
    setMessages([]);
    setConversationId(null);
    setPendingAttachments([]);
    setEditingMessageId(null);
    setReplyingTo(null);
    setIsOtherUserTyping(false);
  }, [targetUserId]);

  // Typing indicator presence channel
  useEffect(() => {
    if (!conversationId || !user?.id) return;

    const channelName = `typing:${conversationId}`;
    const channel = supabase.channel(channelName);
    typingChannelRef.current = channel;

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        // Check if other user is typing
        const otherTyping = Object.values(state).some((presences: any[]) =>
          presences.some(p => p.user_id === targetUserId && p.is_typing)
        );
        setIsOtherUserTyping(otherTyping);
      })
      .subscribe();

    return () => {
      if (typingChannelRef.current) {
        supabase.removeChannel(typingChannelRef.current);
        typingChannelRef.current = null;
      }
    };
  }, [conversationId, user?.id, targetUserId]);

  // Broadcast typing status
  const broadcastTyping = useCallback((isTyping: boolean) => {
    if (!typingChannelRef.current || !user?.id) return;

    typingChannelRef.current.track({
      user_id: user.id,
      is_typing: isTyping,
      timestamp: Date.now(),
    });
  }, [user?.id]);

  // Handle text input change with typing indicator
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    setMessageText(newText);

    // Broadcast typing started
    if (newText.length > 0) {
      broadcastTyping(true);

      // Clear previous timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Stop typing after 2 seconds of no input
      typingTimeoutRef.current = setTimeout(() => {
        broadcastTyping(false);
      }, 2000);
    } else {
      broadcastTyping(false);
    }
  };

  // Clean up typing timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  // Subscribe to real-time messages (INSERT and UPDATE for edits/deletes)
  useEffect(() => {
    if (!conversationId || !user?.id) return;

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
        async (payload) => {
          const newMessage = payload.new as Message;

          // Skip if deleted for current user
          if (deletedMessageIdsRef.current.has(newMessage.id)) return;

          // For own messages, the optimistic message is already replaced
          // by the sendMessage handler. Skip to avoid duplicates.
          if (newMessage.sender_id === user.id) {
            setMessages(prev => {
              // If real message already exists, skip
              if (prev.some(m => m.id === newMessage.id)) return prev;
              // If there's still an optimistic version, replace it
              const optimisticIdx = prev.findIndex(m => m.id.startsWith("optimistic-") && m.text === newMessage.text);
              if (optimisticIdx >= 0) {
                const updated = [...prev];
                updated[optimisticIdx] = { ...newMessage, attachments: prev[optimisticIdx].attachments || [] };
                return updated;
              }
              return prev;
            });
            return;
          }

          // Fetch attachments for new message from other user
          let attachments: MessageAttachmentData[] = await fetchAttachmentsForMessage(newMessage.id);
          if (!attachments || attachments.length === 0) {
            // Retry once in case attachments insert races the message insert
            await new Promise(res => setTimeout(res, 500));
            attachments = await fetchAttachmentsForMessage(newMessage.id);
          }

          // Use functional update to avoid duplicates
          setMessages(prev => {
            if (prev.some(m => m.id === newMessage.id)) return prev;
            return [...prev, { ...newMessage, attachments }];
          });

          markMessagesAsRead(conversationId);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const updatedMessage = payload.new as Message;

          // If message is now deleted for current user, remove it
          if (deletedMessageIdsRef.current.has(updatedMessage.id)) {
            setMessages(prev => prev.filter(m => m.id !== updatedMessage.id));
            return;
          }
          
          // Update the message in state
          setMessages(prev => prev.map(msg => 
            msg.id === updatedMessage.id 
              ? { ...msg, ...updatedMessage, attachments: msg.attachments }
              : msg
          ));
        }
      )
      .subscribe();

    // Listen for attachment inserts to backfill when they arrive after the message
    const attachmentChannel = supabase
      .channel(`chat-attachments:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "message_attachments",
        },
        async (payload) => {
          const attachment = payload.new as MessageAttachmentData & { message_id: string };
          // Only care about messages currently in view
          const signedAttachment = await fetchAttachmentsForMessage(attachment.message_id);
          if (!signedAttachment || signedAttachment.length === 0) return;

          setMessages(prev => prev.map(msg =>
            msg.id === attachment.message_id
              ? { ...msg, attachments: signedAttachment }
              : msg
          ));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(attachmentChannel);
    };
  }, [conversationId, user?.id, markMessagesAsRead, fetchAttachmentsForMessage]);

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
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to start conversation",
        variant: "destructive",
      });
    } finally {
      setIsInitializing(false);
    }
  };

  const handleSend = async () => {
    await sendMessageWithAttachments();
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
  const canSend = messageText.trim() || pendingAttachments.length > 0;

  return (
    <div 
      className="flex flex-col h-full"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
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

        {/* Safety menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44 z-[200]">
            <DropdownMenuItem onClick={() => setShowReportModal(true)} className="gap-2">
              <Flag className="h-4 w-4" />
              Report User
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {isBlocked ? (
              <DropdownMenuItem onClick={() => unblockUser()} className="gap-2">
                <ShieldOff className="h-4 w-4" />
                Unblock User
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem
                onClick={() => setShowBlockModal(true)}
                className="gap-2 text-destructive focus:text-destructive"
              >
                <UserX className="h-4 w-4" />
                Block User
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Report User Modal */}
      <ReportUserModal
        open={showReportModal}
        onOpenChange={setShowReportModal}
        userName={displayName}
        onSubmit={async (reason, description) => {
          await reportUser(reason, description);
          setShowReportModal(false);
        }}
      />

      {/* Block User Confirm Modal */}
      <BlockConfirmModal
        open={showBlockModal}
        onOpenChange={setShowBlockModal}
        userName={displayName}
        onConfirm={async () => {
          await blockUser();
          setShowBlockModal(false);
          onBack?.();
        }}
      />

      {/* Drag overlay */}
      {isDragOver && (
        <div className="absolute inset-0 z-50 bg-primary/10 border-2 border-dashed border-primary flex items-center justify-center">
          <p className="text-primary font-medium">Drop files here</p>
        </div>
      )}

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
              const hasText = message.text && message.text.trim().length > 0;
              const hasAttachments = message.attachments && message.attachments.length > 0;
              const isDeleted = message.is_deleted;
              const isEditing = editingMessageId === message.id;
              const hasReply = !!message.reply_to_message_id;

              // Handler to scroll to the original message
              const scrollToOriginal = () => {
                if (!message.reply_to_message_id) return;
                const el = messageRefs.current[message.reply_to_message_id];
                if (el) {
                  el.scrollIntoView({ behavior: "smooth", block: "center" });
                  el.classList.add("ring-2", "ring-primary");
                  setTimeout(() => el.classList.remove("ring-2", "ring-primary"), 1500);
                }
              };

              // Get sender name for quoted message
              const getReplySenderName = () => {
                if (message.reply_to_sender_id === user?.id) return "You";
                if (message.reply_to_sender_id === targetUserId) return displayName;
                return "User";
              };

              // Handle reply action
              const handleReply = () => {
                const snippet = message.text?.slice(0, 100) || "";
                const hasAtt = (message.attachments?.length ?? 0) > 0;
                const attType = message.attachments?.[0]?.mime_type?.startsWith("image/") ? "image" : "file";
                
                setReplyingTo({
                  messageId: message.id,
                  senderId: message.sender_id,
                  senderName: isOwn ? "You" : displayName,
                  snippet: hasAtt && !snippet ? (attType === "image" ? "Photo" : "File") : snippet,
                  hasAttachment: hasAtt && !snippet,
                  attachmentType: attType as "image" | "file",
                });
                textareaRef.current?.focus();
              };

              // Render deleted message placeholder
              if (isDeleted) {
                return (
                  <div
                    key={message.id}
                    ref={(el) => { messageRefs.current[message.id] = el; }}
                    className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                  >
                      <div className={cn("max-w-[80%] flex flex-col", isOwn ? "items-end" : "items-start")}>
                      <div
                        className={cn(
                          "rounded-xl px-3 py-2 italic opacity-60 shadow-md",
                          isOwn
                            ? "bg-primary text-primary-foreground rounded-tr-sm"
                            : "bg-muted text-foreground rounded-tl-sm"
                        )}
                      >
                        <p className="text-sm">This message was deleted</p>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {format(new Date(message.created_at), "h:mm a")}
                      </p>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={message.id}
                  ref={(el) => { messageRefs.current[message.id] = el; }}
                  className={`flex ${isOwn ? "justify-end" : "justify-start"} group transition-all`}
                >
                  <div className={cn(
                    "max-w-[80%] flex gap-1",
                    isOwn ? "flex-row-reverse" : "flex-row"
                  )}>
                    {/* Message Actions */}
                    {!isDeleted && !isEditing && (
                      <MessageActions
                        messageId={message.id}
                        messageText={message.text}
                        isOwnMessage={isOwn}
                        canEdit={canEditMessage(message.created_at)}
                        onEdit={() => setEditingMessageId(message.id)}
                        onReply={handleReply}
                        onDeleteForMe={() => handleDeleteForMe(message.id)}
                        onDeleteForEveryone={() => handleDeleteForEveryone(message.id)}
                      />
                    )}
                    <div className={cn("flex flex-col", isOwn ? "items-end" : "items-start")}>
                      {/* Attachments */}
                      {hasAttachments && (
                        <MessageAttachmentsList
                          attachments={message.attachments!}
                          isOwn={isOwn}
                          onAttachmentDeleted={handleAttachmentDeleted}
                        />
                      )}
                      
                      {/* Message bubble with inline reply */}
                      {isEditing ? (
                        <MessageEditForm
                          initialText={message.text}
                          onSave={(newText) => handleEditMessage(message.id, newText)}
                          onCancel={() => setEditingMessageId(null)}
                          isOwn={isOwn}
                        />
                      ) : (hasText || hasReply) ? (
                        <div
                          className={cn(
                            "rounded-xl px-3 pt-1.5 pb-1 max-w-full shadow-md",
                            isOwn
                              ? "bg-primary text-primary-foreground rounded-tr-sm"
                              : "bg-muted text-foreground rounded-tl-sm"
                          )}
                        >
                          {/* Quoted reply inside bubble */}
                          {hasReply && (
                            <div className="mb-1 -mx-1.5 mt-0.5">
                              <QuotedMessage
                                senderName={getReplySenderName()}
                                snippet={message.reply_to_snippet || "Message"}
                                isOwnBubble={isOwn}
                                onClick={scrollToOriginal}
                              />
                            </div>
                          )}
                          {hasText && (
                            <p className="text-sm whitespace-pre-wrap break-words text-white">
                              {message.text}
                            </p>
                          )}
                          {/* Inline timestamp */}
                          <div className="flex items-center gap-1 justify-end mt-0.5 -mb-0.5">
                            {message.edited_at && (
                              <span className="text-[10px] opacity-60 italic">edited</span>
                            )}
                            <span className="text-[10px] opacity-60">
                              {format(new Date(message.created_at), "h:mm a")}
                            </span>
                          </div>
                        </div>
                      ) : null}
                      
                      {/* Timestamp outside only when no text bubble */}
                      {!hasText && !hasReply && (
                        <div className="flex items-center gap-1">
                          {message.edited_at && (
                            <span className="text-[10px] text-muted-foreground italic">edited</span>
                          )}
                          <p className="text-[10px] text-muted-foreground">
                            {format(new Date(message.created_at), "h:mm a")}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            
            {/* Typing Indicator */}
            {isOtherUserTyping && (
              <TypingIndicator userName={displayName} />
            )}
            
            <div ref={messagesEndRef} />
          </div>
        )}
      </ScrollArea>

      {/* Reply Preview */}
      {replyingTo && (
        <ReplyPreview
          replyingTo={replyingTo}
          onCancel={() => setReplyingTo(null)}
          isOwnMessage={replyingTo.senderId === user?.id}
        />
      )}

      {/* Attachment Preview */}
      <AttachmentPreview
        attachments={pendingAttachments}
        onRemove={handleRemoveAttachment}
      />

      {/* Input Area */}
      {isBlocked ? (
        <div className="p-4 border-t border-border flex-shrink-0 text-center">
          <p className="text-sm text-muted-foreground">
            You have blocked this user. <button onClick={() => unblockUser()} className="text-primary hover:underline font-medium">Unblock</button> to send messages.
          </p>
        </div>
      ) : isBlockedByOther ? (
        <div className="p-4 border-t border-border flex-shrink-0 text-center">
          <p className="text-sm text-muted-foreground">
            You can't send messages to this user.
          </p>
        </div>
      ) : (
      <div className="p-3 border-t border-border flex-shrink-0">
        <div className="flex items-end gap-2">
          <AttachmentPicker
            onFilesSelected={handleFilesSelected}
            currentCount={pendingAttachments.length}
            disabled={isInitializing}
          />
          <EmojiPickerPopover
            onEmojiSelect={handleEmojiSelect}
            disabled={isInitializing}
            focusTargetRef={textareaRef}
          />
          <Textarea
            ref={textareaRef}
            value={messageText}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="flex-1 min-h-[36px] max-h-[120px] resize-none bg-background border-border text-sm py-2"
            disabled={isInitializing}
            rows={1}
          />
          <Button
            size="icon"
            onClick={handleSend}
            disabled={!canSend || isInitializing}
            className="h-9 w-9 flex-shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
      )}
    </div>
  );
};
