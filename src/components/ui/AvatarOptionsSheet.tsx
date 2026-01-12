import { useState } from 'react';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
} from '@/components/ui/drawer';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Eye, Camera, ImagePlus, Pencil, Trash2 } from 'lucide-react';

interface AvatarOptionsSheetProps {
  open: boolean;
  onClose: () => void;
  hasAvatar: boolean;
  onViewPhoto: () => void;
  onTakePhoto: () => void;
  onChooseFromGallery: () => void;
  onEditPhoto: () => void;
  onRemovePhoto: () => void;
}

export const AvatarOptionsSheet = ({
  open,
  onClose,
  hasAvatar,
  onViewPhoto,
  onTakePhoto,
  onChooseFromGallery,
  onEditPhoto,
  onRemovePhoto,
}: AvatarOptionsSheetProps) => {
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);

  const handleOptionClick = (action: () => void) => {
    onClose();
    action();
  };

  const handleRemoveClick = () => {
    onClose();
    setShowRemoveConfirm(true);
  };

  const handleConfirmRemove = () => {
    setShowRemoveConfirm(false);
    onRemovePhoto();
  };

  return (
    <>
      <Drawer open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
        <DrawerContent className="max-h-[85vh]">
          <DrawerHeader className="text-center border-b border-border pb-4">
            <DrawerTitle>Profile Photo</DrawerTitle>
          </DrawerHeader>

          <div className="px-4 py-2">
            {/* View Photo - only if avatar exists */}
            {hasAvatar && (
              <Button
                variant="ghost"
                className="w-full justify-start gap-4 h-14 text-base font-normal"
                onClick={() => handleOptionClick(onViewPhoto)}
              >
                <Eye className="h-5 w-5 text-muted-foreground" />
                <span>View Photo</span>
              </Button>
            )}

            {/* Take Photo */}
            <Button
              variant="ghost"
              className="w-full justify-start gap-4 h-14 text-base font-normal"
              onClick={() => handleOptionClick(onTakePhoto)}
            >
              <Camera className="h-5 w-5 text-muted-foreground" />
              <span>Take Photo</span>
            </Button>

            {/* Choose from Gallery */}
            <Button
              variant="ghost"
              className="w-full justify-start gap-4 h-14 text-base font-normal"
              onClick={() => handleOptionClick(onChooseFromGallery)}
            >
              <ImagePlus className="h-5 w-5 text-muted-foreground" />
              <span>Choose from Gallery</span>
            </Button>

            {/* Edit Photo - only if avatar exists */}
            {hasAvatar && (
              <Button
                variant="ghost"
                className="w-full justify-start gap-4 h-14 text-base font-normal"
                onClick={() => handleOptionClick(onEditPhoto)}
              >
                <Pencil className="h-5 w-5 text-muted-foreground" />
                <span>Edit Photo</span>
              </Button>
            )}

            {/* Remove Photo - only if avatar exists, with red styling */}
            {hasAvatar && (
              <Button
                variant="ghost"
                className="w-full justify-start gap-4 h-14 text-base font-normal text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={handleRemoveClick}
              >
                <Trash2 className="h-5 w-5" />
                <span>Remove Photo</span>
              </Button>
            )}
          </div>

          <DrawerFooter className="border-t border-border pt-4">
            <Button variant="outline" onClick={onClose} className="w-full">
              Cancel
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {/* Remove Confirmation Dialog */}
      <AlertDialog open={showRemoveConfirm} onOpenChange={setShowRemoveConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Profile Photo?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove your profile picture?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmRemove}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
