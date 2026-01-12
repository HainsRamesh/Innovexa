import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface AvatarViewDialogProps {
  open: boolean;
  onClose: () => void;
  avatarUrl: string | null;
  fallbackText: string;
}

export const AvatarViewDialog = ({
  open,
  onClose,
  avatarUrl,
  fallbackText,
}: AvatarViewDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-[400px] p-4 flex items-center justify-center bg-background/95 backdrop-blur">
        <div className="relative">
          <Avatar className="h-64 w-64 sm:h-80 sm:w-80 border-4 border-border">
            <AvatarImage src={avatarUrl || ''} className="object-cover" />
            <AvatarFallback className="bg-secondary text-foreground text-6xl">
              {fallbackText}
            </AvatarFallback>
          </Avatar>
        </div>
      </DialogContent>
    </Dialog>
  );
};
