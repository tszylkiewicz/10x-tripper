import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorStateProps {
  error: string;
  onRetry: () => void;
}

/**
 * ErrorState component
 * Displayed when there's an error fetching trip plans
 */
export function ErrorState({ error, onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="rounded-full bg-destructive/10 p-4">
        <AlertCircle className="size-8 text-destructive" />
      </div>
      <h2 className="mt-4 text-lg font-semibold">Nie udało się pobrać planów</h2>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">{error}</p>
      <Button onClick={onRetry} variant="outline" className="mt-6">
        Spróbuj ponownie
      </Button>
    </div>
  );
}
