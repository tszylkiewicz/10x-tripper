/**
 * ErrorAlert Component
 *
 * Wyświetla komunikaty błędów z możliwością zamknięcia lub ponowienia próby.
 */

import { AlertCircle, X } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

interface ErrorAlertProps {
  message: string;
  onDismiss: () => void;
  onRetry?: () => void;
}

export function ErrorAlert({ message, onDismiss, onRetry }: ErrorAlertProps) {
  return (
    <Alert variant="destructive" className="relative" data-testid="error-alert">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Wystąpił błąd</AlertTitle>
      <AlertDescription className="pr-8" data-testid="error-alert-message">
        {message}
      </AlertDescription>

      {/* Przycisk zamykania */}
      <button
        onClick={onDismiss}
        className="absolute right-2 top-2 rounded-md p-1 text-destructive-foreground/50 opacity-70 transition-opacity hover:opacity-100 focus:opacity-100 focus:outline-none focus:ring-2"
        aria-label="Zamknij"
        data-testid="error-alert-dismiss-button"
      >
        <X className="h-4 w-4" />
      </button>

      {/* Opcjonalny przycisk "Spróbuj ponownie" */}
      {onRetry && (
        <div className="mt-3">
          <Button variant="outline" size="sm" onClick={onRetry} className="h-8" data-testid="error-alert-retry-button">
            Spróbuj ponownie
          </Button>
        </div>
      )}
    </Alert>
  );
}
