import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MoreVertical, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface InnovationTileMenuProps {
  innovationId: string;
  onDelete?: () => void;
  onOpenChange?: (open: boolean) => void;
}

export const InnovationTileMenu = ({ innovationId, onDelete, onOpenChange }: InnovationTileMenuProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const tileRootRef = useRef<HTMLElement | null>(null);

  // Notify parent when menu opens/closes
  useEffect(() => {
    onOpenChange?.(dropdownOpen || showDeleteDialog);
  }, [dropdownOpen, showDeleteDialog, onOpenChange]);

  // Auto-close the dropdown when the cursor leaves the tile + menu popover
  useEffect(() => {
    if (!dropdownOpen) return;

    tileRootRef.current =
      (triggerRef.current?.closest('[data-innovation-tile-root]') as HTMLElement | null) ?? null;

    const handlePointerMove = (e: PointerEvent) => {
      const target = e.target as Node | null;
      if (!target) return;

      const inTile = tileRootRef.current?.contains(target) ?? false;
      const inContent = contentRef.current?.contains(target) ?? false;

      if (!inTile && !inContent) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('pointermove', handlePointerMove);
    return () => document.removeEventListener('pointermove', handlePointerMove);
  }, [dropdownOpen]);

  const handleEdit = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(`/innovations/${innovationId}/edit`);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('innovations')
        .delete()
        .eq('id', innovationId);

      if (error) throw error;

      toast({
        title: 'Innovation deleted',
        description: 'The innovation has been permanently deleted.',
      });

      onDelete?.();
    } catch (error) {
      console.error('Error deleting innovation:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete innovation. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  return (
    <>
      <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            ref={triggerRef}
            variant="ghost"
            size="icon"
            className="h-7 w-7 bg-background/80 backdrop-blur-sm hover:bg-background/90"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          ref={contentRef}
          align="end"
          className="z-[100] bg-popover"
          onCloseAutoFocus={(e) => e.preventDefault()}
        >
          <DropdownMenuItem onClick={handleEdit}>
            <Pencil className="h-4 w-4 mr-2" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={handleDeleteClick}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this innovation?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the innovation
              and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Confirm'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
