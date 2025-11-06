/**
 * LoadingSpinner Component
 *
 * Wyświetla wskaźnik ładowania podczas pobierania danych z API.
 * Centrowany na ekranie z opcjonalnym komunikatem.
 */

import { Loader2 } from "lucide-react";

interface LoadingSpinnerProps {
  message?: string;
}

export function LoadingSpinner({ message = "Ładowanie..." }: LoadingSpinnerProps) {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center gap-4">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      {message && <p className="text-sm text-muted-foreground">{message}</p>}
    </div>
  );
}
