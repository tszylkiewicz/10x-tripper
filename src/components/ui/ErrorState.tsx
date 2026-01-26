/**
 * ErrorState Component
 *
 * Generic error state display with different error types and appropriate actions.
 * Supports multiple error scenarios with customizable icons and actions.
 */

import { AlertCircle, WifiOff, Lock, ServerCrash } from "lucide-react";
import { Button } from "@ui/button";

export type ErrorType =
  | "not-found"
  | "unauthorized"
  | "server-error"
  | "network-error"
  | "validation-error"
  | "fetch-error";

interface ErrorStateProps {
  errorType: ErrorType;
  errorMessage?: string;
  onRetry?: () => void;
  onBack?: () => void;
  backLabel?: string;
  containerTestId?: string;
  errorTypeTestId?: string;
  errorMessageTestId?: string;
}

const errorConfig = {
  "not-found": {
    icon: AlertCircle,
    title: "Nie znaleziono",
    defaultMessage: "Zasób o podanym identyfikatorze nie istnieje lub został usunięty.",
    showRetry: false,
    showBack: true,
  },
  unauthorized: {
    icon: Lock,
    title: "Brak dostępu",
    defaultMessage: "Nie masz uprawnień do wyświetlenia tego zasobu. Zaloguj się ponownie.",
    showRetry: true,
    showBack: true,
  },
  "server-error": {
    icon: ServerCrash,
    title: "Błąd serwera",
    defaultMessage: "Wystąpił błąd serwera. Spróbuj ponownie później.",
    showRetry: true,
    showBack: true,
  },
  "network-error": {
    icon: WifiOff,
    title: "Brak połączenia",
    defaultMessage: "Nie można połączyć z serwerem. Sprawdź połączenie internetowe.",
    showRetry: true,
    showBack: false,
  },
  "validation-error": {
    icon: AlertCircle,
    title: "Błąd walidacji",
    defaultMessage: "Dane zawierają błędy. Popraw je i spróbuj ponownie.",
    showRetry: false,
    showBack: false,
  },
  "fetch-error": {
    icon: AlertCircle,
    title: "Nie udało się pobrać danych",
    defaultMessage: "Wystąpił problem podczas pobierania danych.",
    showRetry: true,
    showBack: false,
  },
};

export function ErrorState({
  errorType,
  errorMessage,
  onRetry,
  onBack,
  backLabel = "Wróć",
  containerTestId = "error-state",
  errorTypeTestId = "error-type",
  errorMessageTestId = "error-message",
}: ErrorStateProps) {
  const config = errorConfig[errorType];
  const Icon = config.icon;

  return (
    <div className="flex flex-col items-center justify-center py-12 text-center" data-testid={containerTestId}>
      <div className="rounded-full bg-destructive/10 p-4">
        <Icon className="size-10 text-destructive" />
      </div>
      <div className="sr-only" data-testid={errorTypeTestId}>
        {errorType}
      </div>
      <h2 className="mt-4 text-lg font-semibold">{config.title}</h2>
      <p className="mt-2 max-w-md text-sm text-muted-foreground" data-testid={errorMessageTestId}>
        {errorMessage || config.defaultMessage}
      </p>
      <div className="mt-6 flex gap-3">
        {config.showRetry && onRetry && (
          <Button onClick={onRetry} variant="outline" data-testid="retry-button">
            Spróbuj ponownie
          </Button>
        )}
        {config.showBack && onBack && (
          <Button onClick={onBack} variant={config.showRetry ? "ghost" : "outline"}>
            {backLabel}
          </Button>
        )}
      </div>
    </div>
  );
}
