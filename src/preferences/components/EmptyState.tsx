/**
 * EmptyState Component
 *
 * Wyświetlany gdy użytkownik nie ma jeszcze żadnych preferencji.
 * Zachęca do utworzenia pierwszej preferencji.
 */

import { FileHeart } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  onCreateClick: () => void;
}

export function EmptyState({ onCreateClick }: EmptyStateProps) {
  return (
    <div
      className="flex min-h-[400px] flex-col items-center justify-center gap-4 text-center"
      data-testid="preferences-empty-state"
    >
      <div className="rounded-full bg-muted p-6">
        <FileHeart className="h-12 w-12 text-muted-foreground" />
      </div>
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Brak preferencji</h3>
        <p className="max-w-md text-sm text-muted-foreground">
          Utwórz swoją pierwszą preferencję, aby szybciej planować przyszłe wyjazdy. Zapisane preferencje pozwolą Ci
          łatwiej konfigurować parametry planów podróży.
        </p>
      </div>
      <Button onClick={onCreateClick} className="mt-4" data-testid="empty-state-create-button">
        Utwórz pierwszą preferencję
      </Button>
    </div>
  );
}
