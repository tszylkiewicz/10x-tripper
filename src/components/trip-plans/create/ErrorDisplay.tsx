import { AlertCircle, RefreshCw, Edit } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import type { ErrorDisplayProps, CreatePlanErrorType } from "./types";

/**
 * Maps API error codes to user-friendly error types
 */
function getErrorType(code: string): CreatePlanErrorType {
  switch (code) {
    case "UNAUTHORIZED":
      return "unauthorized";
    case "RATE_LIMIT":
    case "TOO_MANY_REQUESTS":
      return "rate_limit";
    case "TIMEOUT":
    case "REQUEST_TIMEOUT":
      return "timeout";
    case "VALIDATION_ERROR":
      return "validation";
    case "NETWORK_ERROR":
      return "network_error";
    default:
      return "server_error";
  }
}

/**
 * Gets a user-friendly title based on error type
 */
function getErrorTitle(errorType: CreatePlanErrorType): string {
  switch (errorType) {
    case "timeout":
      return "Generowanie przekroczyło limit czasu";
    case "rate_limit":
      return "Przekroczono limit zapytań";
    case "validation":
      return "Nieprawidłowe dane formularza";
    case "network_error":
      return "Brak połączenia z internetem";
    case "unauthorized":
      return "Sesja wygasła";
    default:
      return "Wystąpił błąd podczas generowania planu";
  }
}

/**
 * ErrorDisplay component
 *
 * Displays error messages with appropriate styling and action buttons.
 * Supports different error types (timeout, rate limit, validation, etc.)
 * and provides relevant actions for each type.
 */
export function ErrorDisplay({ error, onRetry, onEditForm }: ErrorDisplayProps) {
  if (!error) return null;

  const errorType = getErrorType(error.error.code);
  const errorTitle = getErrorTitle(errorType);

  // Don't show retry for unauthorized errors (redirect will happen)
  const showRetry = errorType !== "unauthorized";
  const showEditForm = onEditForm && errorType === "validation";

  return (
    <div className="mx-auto w-full max-w-2xl px-4">
      <Alert variant="destructive" className="mb-6">
        <AlertCircle className="size-4" />
        <AlertTitle>{errorTitle}</AlertTitle>
        <AlertDescription>
          <p className="mb-4">{error.error.message}</p>

          {/* Error details if available */}
          {error.error.details && (
            <div className="mb-4 rounded bg-destructive/10 p-2 text-xs">
              <pre className="whitespace-pre-wrap">{JSON.stringify(error.error.details, null, 2)}</pre>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-col gap-2 sm:flex-row">
            {showRetry && (
              <Button variant="outline" size="sm" onClick={onRetry} className="gap-2">
                <RefreshCw className="size-4" />
                Spróbuj ponownie
              </Button>
            )}
            {showEditForm && (
              <Button variant="outline" size="sm" onClick={onEditForm} className="gap-2">
                <Edit className="size-4" />
                Edytuj formularz
              </Button>
            )}
          </div>
        </AlertDescription>
      </Alert>
    </div>
  );
}
