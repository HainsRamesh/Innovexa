import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

interface ConnectionStatus {
  isConnected: boolean;
  isPending: boolean;
  requestedByMe: boolean;
}

export const useProfileActions = (targetUserId: string | undefined) => {
  const { user } = useAuth();
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    isConnected: false,
    isPending: false,
    requestedByMe: false,
  });
  const [isBlocked, setIsBlocked] = useState(false);
  const [isBlockedByOther, setIsBlockedByOther] = useState(false);
  const [isRestricted, setIsRestricted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user?.id && targetUserId && user.id !== targetUserId) {
      fetchRelationshipStatus();
    } else {
      setIsLoading(false);
    }
  }, [user?.id, targetUserId]);

  const fetchRelationshipStatus = async () => {
    if (!user?.id || !targetUserId) return;

    setIsLoading(true);
    try {
      // Check connection status
      const { data: connections } = await supabase
        .from("connections")
        .select("*")
        .or(
          `and(requester_id.eq.${user.id},recipient_id.eq.${targetUserId}),and(requester_id.eq.${targetUserId},recipient_id.eq.${user.id})`
        );

      if (connections && connections.length > 0) {
        const connection = connections[0];
        setConnectionStatus({
          isConnected: connection.status === "accepted",
          isPending: connection.status === "pending",
          requestedByMe: connection.requester_id === user.id,
        });
      } else {
        setConnectionStatus({
          isConnected: false,
          isPending: false,
          requestedByMe: false,
        });
      }

      // Check if I blocked them
      const { data: blocks } = await supabase
        .from("user_blocks")
        .select("id")
        .eq("blocker_id", user.id)
        .eq("blocked_user_id", targetUserId)
        .maybeSingle();

      setIsBlocked(!!blocks);

      // Check if they blocked me (using RPC which checks bidirectionally)
      const { data: mutualBlock } = await supabase.rpc("is_user_blocked", {
        _user_id: user.id,
        _other_user_id: targetUserId,
      });

      setIsBlockedByOther(!blocks && !!mutualBlock);

      // Check if restricted
      const { data: restrictions } = await supabase
        .from("user_restrictions")
        .select("id")
        .eq("restrictor_id", user.id)
        .eq("restricted_user_id", targetUserId)
        .maybeSingle();

      setIsRestricted(!!restrictions);
    } catch (error) {
      console.error("Error fetching relationship status:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const sendConnectionRequest = async () => {
    if (!user?.id || !targetUserId) return false;

    try {
      const { error } = await supabase.from("connections").insert({
        requester_id: user.id,
        recipient_id: targetUserId,
        status: "pending",
      });

      if (error) throw error;

      setConnectionStatus({
        isConnected: false,
        isPending: true,
        requestedByMe: true,
      });

      toast({
        title: "Connection request sent",
        description: "Your connection request has been sent.",
      });

      return true;
    } catch (error: any) {
      console.error("Error sending connection request:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to send connection request",
        variant: "destructive",
      });
      return false;
    }
  };

  const cancelConnectionRequest = async () => {
    if (!user?.id || !targetUserId) return false;

    try {
      const { error } = await supabase
        .from("connections")
        .delete()
        .eq("requester_id", user.id)
        .eq("recipient_id", targetUserId);

      if (error) throw error;

      setConnectionStatus({
        isConnected: false,
        isPending: false,
        requestedByMe: false,
      });

      toast({
        title: "Request cancelled",
        description: "Your connection request has been cancelled.",
      });

      return true;
    } catch (error: any) {
      console.error("Error cancelling connection request:", error);
      return false;
    }
  };

  const acceptConnectionRequest = async () => {
    if (!user?.id || !targetUserId) return false;

    try {
      const { error } = await supabase
        .from("connections")
        .update({ status: "accepted" })
        .eq("requester_id", targetUserId)
        .eq("recipient_id", user.id);

      if (error) throw error;

      setConnectionStatus({
        isConnected: true,
        isPending: false,
        requestedByMe: false,
      });

      toast({
        title: "Connection accepted",
        description: "You are now connected!",
      });

      return true;
    } catch (error: any) {
      console.error("Error accepting connection request:", error);
      return false;
    }
  };

  const removeConnection = async () => {
    if (!user?.id || !targetUserId) return false;

    try {
      const { error } = await supabase
        .from("connections")
        .delete()
        .or(
          `and(requester_id.eq.${user.id},recipient_id.eq.${targetUserId}),and(requester_id.eq.${targetUserId},recipient_id.eq.${user.id})`
        );

      if (error) throw error;

      setConnectionStatus({
        isConnected: false,
        isPending: false,
        requestedByMe: false,
      });

      toast({
        title: "Connection removed",
        description: "You are no longer connected.",
      });

      return true;
    } catch (error: any) {
      console.error("Error removing connection:", error);
      return false;
    }
  };

  const blockUser = async () => {
    if (!user?.id || !targetUserId) return false;

    try {
      // First remove any existing connection
      await supabase
        .from("connections")
        .delete()
        .or(
          `and(requester_id.eq.${user.id},recipient_id.eq.${targetUserId}),and(requester_id.eq.${targetUserId},recipient_id.eq.${user.id})`
        );

      // Then block
      const { error } = await supabase.from("user_blocks").insert({
        blocker_id: user.id,
        blocked_user_id: targetUserId,
      });

      if (error) throw error;

      setIsBlocked(true);
      setConnectionStatus({
        isConnected: false,
        isPending: false,
        requestedByMe: false,
      });

      toast({
        title: "User blocked",
        description: "This user has been blocked.",
      });

      return true;
    } catch (error: any) {
      console.error("Error blocking user:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to block user",
        variant: "destructive",
      });
      return false;
    }
  };

  const unblockUser = async () => {
    if (!user?.id || !targetUserId) return false;

    try {
      const { error } = await supabase
        .from("user_blocks")
        .delete()
        .eq("blocker_id", user.id)
        .eq("blocked_user_id", targetUserId);

      if (error) throw error;

      setIsBlocked(false);

      // Re-check if the other user still has us blocked
      const { data: stillBlocked } = await supabase.rpc("is_user_blocked", {
        _user_id: user.id,
        _other_user_id: targetUserId,
      });
      setIsBlockedByOther(!!stillBlocked);

      toast({
        title: "User unblocked",
        description: "This user has been unblocked.",
      });

      return true;
    } catch (error: any) {
      console.error("Error unblocking user:", error);
      return false;
    }
  };

  const restrictUser = async () => {
    if (!user?.id || !targetUserId) return false;

    try {
      const { error } = await supabase.from("user_restrictions").insert({
        restrictor_id: user.id,
        restricted_user_id: targetUserId,
      });

      if (error) throw error;

      setIsRestricted(true);

      toast({
        title: "User restricted",
        description: "This user has been restricted. They won't be notified.",
      });

      return true;
    } catch (error: any) {
      console.error("Error restricting user:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to restrict user",
        variant: "destructive",
      });
      return false;
    }
  };

  const unrestrictUser = async () => {
    if (!user?.id || !targetUserId) return false;

    try {
      const { error } = await supabase
        .from("user_restrictions")
        .delete()
        .eq("restrictor_id", user.id)
        .eq("restricted_user_id", targetUserId);

      if (error) throw error;

      setIsRestricted(false);

      toast({
        title: "User unrestricted",
        description: "This user is no longer restricted.",
      });

      return true;
    } catch (error: any) {
      console.error("Error unrestricting user:", error);
      return false;
    }
  };

  const reportUser = async (reason: string, description?: string) => {
    if (!user?.id || !targetUserId) return false;

    try {
      const { error } = await supabase.from("user_reports").insert({
        reporter_id: user.id,
        reported_user_id: targetUserId,
        reason,
        description,
      });

      if (error) throw error;

      toast({
        title: "Report submitted",
        description: "Thank you for reporting. We'll review this soon.",
      });

      return true;
    } catch (error: any) {
      console.error("Error reporting user:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to submit report",
        variant: "destructive",
      });
      return false;
    }
  };

  return {
    connectionStatus,
    isBlocked,
    isBlockedByOther,
    isRestricted,
    isLoading,
    sendConnectionRequest,
    cancelConnectionRequest,
    acceptConnectionRequest,
    removeConnection,
    blockUser,
    unblockUser,
    restrictUser,
    unrestrictUser,
    reportUser,
  };
};
