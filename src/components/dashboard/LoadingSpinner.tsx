/**
 * LoadingSpinner component
 * Displays a loading indicator while data is being fetched
 */
export function LoadingSpinner() {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      <p className="mt-4 text-sm text-muted-foreground">Ładowanie planów...</p>
    </div>
  );
}
