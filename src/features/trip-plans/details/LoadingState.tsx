/**
 * LoadingState component
 * Displays a loading indicator while trip plan data is being fetched
 */

import type { LoadingStateProps } from "./types";

export function LoadingState({ message = "Ładowanie planu..." }: LoadingStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="size-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      <p className="mt-4 text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
