/**
 * ErrorState component
 * Displays error message with appropriate actions based on error type
 */

import { AlertCircle, WifiOff, Lock, ServerCrash } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ErrorStateProps } from "./types";

const errorConfig = {
  "not-found": {
    icon: AlertCircle,
    title: "Plan nie został znaleziony",
    defaultMessage: "Plan wycieczki o podanym identyfikatorze nie istnieje lub został usunięty.",
    showRetry: false,
    showBackToList: true,
  },
  unauthorized: {
    icon: Lock,
    title: "Brak dostępu",
    defaultMessage: "Nie masz uprawnień do wyświetlenia tego planu. Zaloguj się ponownie.",
    showRetry: false,
    showBackToList: true,
  },
  "server-error": {
    icon: ServerCrash,
    title: "Błąd serwera",
    defaultMessage: "Wystąpił błąd serwera. Spróbuj ponownie później.",
    showRetry: true,
    showBackToList: true,
  },
  "network-error": {
    icon: WifiOff,
    title: "Brak połączenia",
    defaultMessage: "Nie można połączyć z serwerem. Sprawdź połączenie internetowe.",
    showRetry: true,
    showBackToList: false,
  },
  "validation-error": {
    icon: AlertCircle,
    title: "Błąd walidacji",
    defaultMessage: "Dane zawierają błędy. Popraw je i spróbuj ponownie.",
    showRetry: false,
    showBackToList: false,
  },
};

export function ErrorState({ errorType, errorMessage, onRetry }: ErrorStateProps) {
  const config = errorConfig[errorType];
  const Icon = config.icon;

  const handleBackToList = () => {
    window.location.href = "/";
  };

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="rounded-full bg-destructive/10 p-4">
        <Icon className="size-10 text-destructive" />
      </div>
      <h2 className="mt-4 text-lg font-semibold">{config.title}</h2>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">{errorMessage || config.defaultMessage}</p>
      <div className="mt-6 flex gap-3">
        {config.showRetry && onRetry && (
          <Button onClick={onRetry} variant="outline">
            Spróbuj ponownie
          </Button>
        )}
        {config.showBackToList && (
          <Button onClick={handleBackToList} variant={config.showRetry ? "ghost" : "outline"}>
            Wróć do listy planów
          </Button>
        )}
      </div>
    </div>
  );
}
