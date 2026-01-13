import { X, Reply } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface ReplyingTo {
  messageId: string;
  senderId: string;
  senderName: string;
  snippet: string;
  hasAttachment?: boolean;
  attachmentType?: "image" | "file";
}

interface ReplyPreviewProps {
  replyingTo: ReplyingTo;
  onCancel: () => void;
  isOwnMessage?: boolean;
}

export const ReplyPreview = ({
  replyingTo,
  onCancel,
  isOwnMessage,
}: ReplyPreviewProps) => {
  const displayName = isOwnMessage ? "You" : replyingTo.senderName;

  return (
    <div className="flex items-center gap-2 px-3 py-2 border-t border-border bg-muted/50">
      <Reply className="h-4 w-4 text-muted-foreground flex-shrink-0" />
      <div className="flex-1 min-w-0 border-l-2 border-primary pl-2">
        <p className="text-xs font-semibold text-primary truncate">
          {displayName}
        </p>
        <p className="text-xs text-muted-foreground truncate">
          {replyingTo.hasAttachment ? (
            replyingTo.attachmentType === "image" ? (
              "📷 Photo"
            ) : (
              "📎 File"
            )
          ) : (
            replyingTo.snippet
          )}
        </p>
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={onCancel}
        className="h-6 w-6 flex-shrink-0"
      >
        <X className="h-3 w-3" />
      </Button>
    </div>
  );
};
