import { MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  onCreatePlan: () => void;
}

/**
 * EmptyState component
 * Displayed when user has no trip plans yet
 */
export function EmptyState({ onCreatePlan }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="rounded-full bg-muted p-4">
        <MapPin className="size-8 text-muted-foreground" />
      </div>
      <h2 className="mt-4 text-lg font-semibold">Brak planów wycieczek</h2>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        Zacznij planować swoją następną przygodę! Utwórz swój pierwszy plan wycieczki.
      </p>
      <Button onClick={onCreatePlan} className="mt-6">
        Utwórz pierwszy plan
      </Button>
    </div>
  );
}
