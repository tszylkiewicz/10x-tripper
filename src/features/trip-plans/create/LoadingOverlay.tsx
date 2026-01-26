import type { LoadingOverlayProps } from "./types";

/**
 * LoadingOverlay component
 *
 * Full-screen overlay displayed during AI plan generation.
 * Shows an animated spinner and informational messages.
 * The overlay cannot be dismissed by the user.
 */
export function LoadingOverlay({
  isVisible,
  message = "Generowanie spersonalizowanego planu wycieczki...",
  subMessage = "To może potrwać do 3 minut",
}: LoadingOverlayProps) {
  if (!isVisible) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="loading-title"
      aria-describedby="loading-description"
    >
      <div className="flex flex-col items-center rounded-lg bg-card p-8 shadow-lg">
        {/* Animated spinner */}
        <div className="size-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />

        {/* Main message */}
        <p id="loading-title" className="mt-6 text-center text-lg font-medium text-foreground">
          {message}
        </p>

        {/* Sub message */}
        <p id="loading-description" className="mt-2 text-center text-sm text-muted-foreground">
          {subMessage}
        </p>
      </div>
    </div>
  );
}
