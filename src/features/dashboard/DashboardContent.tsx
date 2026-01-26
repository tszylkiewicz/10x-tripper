import { useState, useCallback } from "react";
import { useTripPlans } from "@components/hooks/useTripPlans";
import { PlansList } from "./PlansList";
import { PageHeader } from "@ui/PageHeader";
import { DeleteConfirmDialog } from "@ui/DeleteConfirmDialog";
import type { TripPlanDto } from "@types";

/**
 * Formats date for display in dialog
 */
function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return date.toLocaleDateString("pl-PL", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return dateString;
  }
}

/**
 * DashboardContent component
 * Main container component that orchestrates the dashboard view
 */
export function DashboardContent() {
  const { plans, isLoading, error, deletePlan, refetch } = useTripPlans();

  // Delete dialog state
  const [selectedPlan, setSelectedPlan] = useState<Pick<
    TripPlanDto,
    "id" | "destination" | "start_date" | "end_date"
  > | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Navigation handlers
  const handlePlanClick = useCallback((planId: string) => {
    window.location.href = `/trip-plans/${planId}`;
  }, []);

  const handleCreatePlan = useCallback(() => {
    window.location.href = "/trip-plans/new";
  }, []);

  // Delete handlers
  const handleDeleteClick = useCallback(
    (planId: string) => {
      const plan = plans.find((p) => p.id === planId);
      if (plan) {
        setSelectedPlan({
          id: plan.id,
          destination: plan.destination,
          start_date: plan.start_date,
          end_date: plan.end_date,
        });
      }
    },
    [plans]
  );

  const handleDeleteConfirm = useCallback(async () => {
    if (!selectedPlan) return;

    setIsDeleting(true);
    const success = await deletePlan(selectedPlan.id);
    setIsDeleting(false);

    if (success) {
      setSelectedPlan(null);
    }
  }, [selectedPlan, deletePlan]);

  const handleDeleteCancel = useCallback(() => {
    if (!isDeleting) {
      setSelectedPlan(null);
    }
  }, [isDeleting]);

  return (
    <>
      <main className="container mx-auto px-4 py-8">
        <PageHeader
          title="Twoje plany"
          description="Zarządzaj swoimi planami wycieczek"
          onCreateClick={handleCreatePlan}
          createButtonLabel="Utwórz plan"
        />

        <PlansList
          plans={plans}
          isLoading={isLoading}
          error={error}
          onPlanClick={handlePlanClick}
          onDeleteClick={handleDeleteClick}
          onCreatePlan={handleCreatePlan}
          onRetry={refetch}
        />
      </main>

      <DeleteConfirmDialog
        open={selectedPlan !== null}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        isDeleting={isDeleting}
        title="Usuń plan wycieczki"
        description={
          selectedPlan ? (
            <>
              Czy na pewno chcesz usunąć plan wycieczki do <strong>{selectedPlan.destination}</strong>?
              <br />
              <span className="text-xs">
                ({formatDate(selectedPlan.start_date)} - {formatDate(selectedPlan.end_date)})
              </span>
              <br />
              <br />
              Ta operacja jest nieodwracalna.
            </>
          ) : null
        }
      />
    </>
  );
}
