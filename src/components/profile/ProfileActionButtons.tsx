import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  UserPlus,
  UserCheck,
  Clock,
  MessageCircle,
  MoreHorizontal,
  UserX,
  Shield,
  Flag,
  Link2,
  Loader2,
  Pencil,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import { useProfileActions } from "@/hooks/useProfileActions";
import { BlockConfirmModal } from "./BlockConfirmModal";
import { ReportUserModal } from "./ReportUserModal";
import { MessageDialog } from "./MessageDialog";
import { toast } from "@/hooks/use-toast";

interface ProfileActionButtonsProps {
  targetUserId: string;
  targetUserName: string | null;
}

export const ProfileActionButtons = ({
  targetUserId,
  targetUserName,
}: ProfileActionButtonsProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showMessageDialog, setShowMessageDialog] = useState(false);

  const {
    connectionStatus,
    isBlocked,
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
  } = useProfileActions(targetUserId);

  // Don't show actions on own profile
  if (user?.id === targetUserId) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => navigate("/dashboard/settings")}
        className="gap-2"
      >
        <Pencil className="h-4 w-4" />
        Edit Profile
      </Button>
    );
  }

  // Must be logged in to see actions
  if (!user) return null;

  const handleCopyProfileLink = () => {
    const url = `${window.location.origin}/users/${targetUserId}`;
    navigator.clipboard.writeText(url);
    toast({
      title: "Link copied",
      description: "Profile link copied to clipboard",
    });
  };

  const handleConnectionClick = async () => {
    if (connectionStatus.isConnected) {
      await removeConnection();
    } else if (connectionStatus.isPending && connectionStatus.requestedByMe) {
      await cancelConnectionRequest();
    } else if (connectionStatus.isPending && !connectionStatus.requestedByMe) {
      await acceptConnectionRequest();
    } else {
      await sendConnectionRequest();
    }
  };

  const getConnectionButtonContent = () => {
    if (isLoading) {
      return (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading
        </>
      );
    }

    if (connectionStatus.isConnected) {
      return (
        <>
          <UserCheck className="h-4 w-4" />
          Connected
        </>
      );
    }

    if (connectionStatus.isPending) {
      if (connectionStatus.requestedByMe) {
        return (
          <>
            <Clock className="h-4 w-4" />
            Pending
          </>
        );
      }
      return (
        <>
          <UserPlus className="h-4 w-4" />
          Accept
        </>
      );
    }

    return (
      <>
        <UserPlus className="h-4 w-4" />
        Connect
      </>
    );
  };

  const getConnectionButtonVariant = () => {
    if (connectionStatus.isConnected) return "secondary";
    if (connectionStatus.isPending && !connectionStatus.requestedByMe) return "default";
    if (connectionStatus.isPending) return "outline";
    return "default";
  };

  if (isBlocked) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={unblockUser}
        className="gap-2"
      >
        <UserX className="h-4 w-4" />
        Unblock
      </Button>
    );
  }

  return (
    <>
      <div className="flex items-center gap-2">
        {/* Connect Button */}
        <Button
          variant={getConnectionButtonVariant()}
          size="sm"
          onClick={handleConnectionClick}
          disabled={isLoading}
          className="gap-2"
        >
          {getConnectionButtonContent()}
        </Button>

        {/* Message Button */}
        <Button
          variant="outline"
          size="icon"
          onClick={() => setShowMessageDialog(true)}
          className="h-9 w-9"
        >
          <MessageCircle className="h-4 w-4" />
        </Button>

        {/* More Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={handleCopyProfileLink}>
              <Link2 className="h-4 w-4 mr-2" />
              Copy profile link
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={isRestricted ? unrestrictUser : restrictUser}
            >
              <Shield className="h-4 w-4 mr-2" />
              {isRestricted ? "Unrestrict" : "Restrict"}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setShowBlockModal(true)}
              className="text-destructive focus:text-destructive"
            >
              <UserX className="h-4 w-4 mr-2" />
              Block
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => setShowReportModal(true)}
              className="text-destructive focus:text-destructive"
            >
              <Flag className="h-4 w-4 mr-2" />
              Report
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Block Confirmation Modal */}
      <BlockConfirmModal
        open={showBlockModal}
        onOpenChange={setShowBlockModal}
        userName={targetUserName}
        onConfirm={async () => {
          await blockUser();
          setShowBlockModal(false);
        }}
      />

      {/* Report Modal */}
      <ReportUserModal
        open={showReportModal}
        onOpenChange={setShowReportModal}
        userName={targetUserName}
        onSubmit={async (reason, description) => {
          await reportUser(reason, description);
          setShowReportModal(false);
        }}
      />

      {/* Message Dialog */}
      <MessageDialog
        open={showMessageDialog}
        onOpenChange={setShowMessageDialog}
        targetUserId={targetUserId}
        targetUserName={targetUserName}
      />
    </>
  );
};
