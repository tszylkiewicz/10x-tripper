/**
 * DeleteConfirmDialog Component
 *
 * Reusable modal dialog for confirming deletion operations across the application.
 * Accepts custom title and description content for flexibility.
 */

import { Loader2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@ui/alert-dialog";

interface DeleteConfirmDialogProps {
  open: boolean;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
  isDeleting: boolean;
  title: string;
  description: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
}

export function DeleteConfirmDialog({
  open,
  onConfirm,
  onCancel,
  isDeleting,
  title,
  description,
  confirmText = "Usuń",
  cancelText = "Anuluj",
}: DeleteConfirmDialogProps) {
  const handleConfirm = async () => {
    await onConfirm();
  };

  return (
    <AlertDialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel} disabled={isDeleting}>
            {cancelText}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isDeleting}
            className="gap-2 bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Usuwanie...
              </>
            ) : (
              confirmText
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
