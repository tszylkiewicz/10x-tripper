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

interface DeleteConfirmDialogProps {
  isOpen: boolean;
  plan: {
    id: string;
    destination: string;
    start_date: string;
    end_date: string;
  } | null;
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting: boolean;
}

/**
 * Formats date for display in dialog
 */
function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return date.toLocaleDateString("pl-PL", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return dateString;
  }
}

/**
 * DeleteConfirmDialog component
 * Modal dialog for confirming trip plan deletion
 */
export function DeleteConfirmDialog({ isOpen, plan, onConfirm, onCancel, isDeleting }: DeleteConfirmDialogProps) {
  if (!plan) return null;

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Usuń plan wycieczki</AlertDialogTitle>
          <AlertDialogDescription>
            Czy na pewno chcesz usunąć plan wycieczki do <strong>{plan.destination}</strong>?
            <br />
            <span className="text-xs">
              ({formatDate(plan.start_date)} - {formatDate(plan.end_date)})
            </span>
            <br />
            <br />
            Ta operacja jest nieodwracalna.
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
