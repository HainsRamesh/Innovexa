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
import { UserX } from "lucide-react";

interface BlockConfirmModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userName: string | null;
  onConfirm: () => void;
}

export const BlockConfirmModal = ({
  open,
  onOpenChange,
  userName,
  onConfirm,
}: BlockConfirmModalProps) => {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="bg-card border-border">
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-full bg-destructive/10">
              <UserX className="h-5 w-5 text-destructive" />
            </div>
            <AlertDialogTitle>
              Block {userName || "this user"}?
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className="space-y-3 text-muted-foreground">
            <p>When you block someone:</p>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>They won't be able to find your profile</li>
              <li>They can't message you</li>
              <li>They won't see your content</li>
              <li>Any existing connection will be removed</li>
            </ul>
            <p className="text-sm">They won't be notified that you've blocked them.</p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="bg-secondary hover:bg-secondary/80">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-destructive hover:bg-destructive/90"
          >
            Block
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
