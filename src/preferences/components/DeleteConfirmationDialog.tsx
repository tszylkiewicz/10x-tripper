/**
 * DeleteConfirmationDialog Component
 *
 * Modalny dialog potwierdzający zamiar usunięcia preferencji.
 * Wyświetla nazwę preferencji do usunięcia i wymaga potwierdzenia akcji.
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
} from "@/components/ui/alert-dialog";
import type { UserPreferenceDto } from "../../types";

interface DeleteConfirmationDialogProps {
  open: boolean;
  preference: UserPreferenceDto | null;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
  isDeleting: boolean;
}

export function DeleteConfirmationDialog({
  open,
  preference,
  onConfirm,
  onCancel,
  isDeleting,
}: DeleteConfirmationDialogProps) {
  const handleConfirm = async () => {
    await onConfirm();
  };

  return (
    <AlertDialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <AlertDialogContent data-testid="delete-confirmation-dialog">
        <AlertDialogHeader>
          <AlertDialogTitle data-testid="delete-dialog-title">Czy na pewno chcesz usunąć?</AlertDialogTitle>
          <AlertDialogDescription>
            Ta akcja jest nieodwracalna. Preferencja{" "}
            <strong className="font-semibold text-foreground" data-testid="delete-dialog-preference-name">
              {preference?.name}
            </strong>{" "}
            zostanie trwale usunięta z twojego konta.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel} disabled={isDeleting} data-testid="delete-dialog-cancel-button">
            Anuluj
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            data-testid="delete-dialog-confirm-button"
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Usuwanie...
              </>
            ) : (
              "Usuń"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
