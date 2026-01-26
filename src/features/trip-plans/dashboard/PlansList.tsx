import { MapPin } from "lucide-react";
import type { TripPlanDto } from "@types";
import { LoadingSpinner } from "./LoadingSpinner.tsx";
import { ErrorState } from "@ui/ErrorState.tsx";
import { EmptyState } from "@ui/EmptyState.tsx";
import { PlanCard } from "./PlanCard.tsx";

interface PlansListProps {
  plans: TripPlanDto[];
  isLoading: boolean;
  error: string | null;
  onPlanClick: (planId: string) => void;
  onDeleteClick: (planId: string) => void;
  onCreatePlan: () => void;
  onRetry: () => void;
}

/**
 * PlansList component
 * Main list component that renders trip plans with conditional states
 */
export function PlansList({
                            plans,
                            isLoading,
                            error,
                            onPlanClick,
                            onDeleteClick,
                            onCreatePlan,
                            onRetry,
                          }: PlansListProps) {
  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorState errorType="fetch-error" errorMessage={error} onRetry={onRetry} />;
  }

  if (plans.length === 0) {
    return (
      <EmptyState
        icon={MapPin}
        title="Brak planów wycieczek"
        description="Zacznij planować swoją następną przygodę! Utwórz swój pierwszy plan wycieczki."
        actionLabel="Utwórz pierwszy plan"
        onAction={onCreatePlan}
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {plans.map((plan) => (
        <PlanCard
          key={plan.id}
          plan={plan}
          onClick={() => onPlanClick(plan.id)}
          onDelete={() => onDeleteClick(plan.id)}
        />
      ))}
    </div>
  );
}
