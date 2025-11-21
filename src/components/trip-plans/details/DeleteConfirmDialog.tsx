/**
 * DeleteConfirmDialog component
 * Modal dialog for confirming trip plan deletion
 */

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
import type { DeleteConfirmDialogProps } from "./types";

export function DeleteConfirmDialog({ isOpen, planName, isDeleting, onConfirm, onCancel }: DeleteConfirmDialogProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Usunąć plan wycieczki?</AlertDialogTitle>
          <AlertDialogDescription>
            Czy na pewno chcesz usunąć plan wycieczki do <strong>{planName}</strong>?
            <br />
            <br />
            Ta operacja jest nieodwracalna. Wszystkie dane planu zostaną trwale usunięte.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting} onClick={onCancel}>
            Anuluj
          </AlertDialogCancel>
          <AlertDialogAction
            disabled={isDeleting}
            onClick={onConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? "Usuwanie..." : "Usuń"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
