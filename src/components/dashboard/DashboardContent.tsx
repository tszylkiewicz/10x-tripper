import { useState, useCallback } from "react";
import { useTripPlans } from "../hooks/useTripPlans";
import { PlansList } from "./PlansList";
import { CreatePlanButton } from "./CreatePlanButton";
import { DeleteConfirmDialog } from "./DeleteConfirmDialog";
import type { TripPlanDto } from "../../types";

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
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Twoje plany</h1>
            <p className="text-muted-foreground">Zarządzaj swoimi planami wycieczek</p>
          </div>
          <div className="hidden md:block">
            <CreatePlanButton onClick={handleCreatePlan} />
          </div>
        </div>

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

      {/* Mobile FAB */}
      <div className="md:hidden">
        <CreatePlanButton onClick={handleCreatePlan} />
      </div>

      <DeleteConfirmDialog
        isOpen={selectedPlan !== null}
        plan={selectedPlan}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        isDeleting={isDeleting}
      />
    </>
  );
}
