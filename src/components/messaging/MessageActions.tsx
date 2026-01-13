import { useState } from "react";
import { Copy, Pencil, Trash2, MoreVertical, Check, Reply } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface MessageActionsProps {
  messageId: string;
  messageText: string;
  isOwnMessage: boolean;
  canEdit: boolean; // true if within 15 min window
  onEdit: () => void;
  onReply: () => void;
  onDeleteForMe: () => void;
  onDeleteForEveryone: () => void;
  className?: string;
}

export const MessageActions = ({
  messageId,
  messageText,
  isOwnMessage,
  canEdit,
  onEdit,
  onReply,
  onDeleteForMe,
  onDeleteForEveryone,
  className,
}: MessageActionsProps) => {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(messageText);
      setCopied(true);
      toast({
        description: "Copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy message",
        variant: "destructive",
      });
    }
  };

  const handleDeleteForMe = () => {
    setShowDeleteDialog(false);
    onDeleteForMe();
  };

  const handleDeleteForEveryone = () => {
    setShowDeleteDialog(false);
    onDeleteForEveryone();
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity",
              "focus:opacity-100",
              className
            )}
          >
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align={isOwnMessage ? "end" : "start"} className="w-40">
          <DropdownMenuItem onClick={handleCopy} className="gap-2">
            {copied ? (
              <Check className="h-4 w-4 text-green-500" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
            Copy
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={onReply} className="gap-2">
            <Reply className="h-4 w-4" />
            Reply
          </DropdownMenuItem>
          
          {isOwnMessage && canEdit && (
            <DropdownMenuItem onClick={onEdit} className="gap-2">
              <Pencil className="h-4 w-4" />
              Edit
            </DropdownMenuItem>
          )}
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem
            onClick={() => setShowDeleteDialog(true)}
            className="gap-2 text-destructive focus:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete message?</AlertDialogTitle>
            <AlertDialogDescription>
              Choose how you want to delete this message.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col gap-2 sm:flex-col">
            <AlertDialogAction
              onClick={handleDeleteForMe}
              className="w-full bg-muted text-foreground hover:bg-muted/80"
            >
              Delete for me
            </AlertDialogAction>
            {isOwnMessage && (
              <AlertDialogAction
                onClick={handleDeleteForEveryone}
                className="w-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete for everyone
              </AlertDialogAction>
            )}
            <AlertDialogCancel className="w-full mt-0">Cancel</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
