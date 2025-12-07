/**
 * TripPlanDetailsView component
 * Main container for trip plan details page
 *
 * Manages the overall view state and coordinates all child components.
 */

import { useCallback, useMemo } from "react";
import { useTripPlanDetails } from "./useTripPlanDetails";
import { LoadingState } from "./LoadingState";
import { ErrorState } from "./ErrorState";
import { TripPlanHeader } from "./TripPlanHeader";
import { DayCard } from "../shared/DayCard";
import { AccommodationCard } from "../shared/AccommodationCard";
import { DeleteConfirmDialog } from "./DeleteConfirmDialog";
import type { TripPlanMetadata, ValidationErrors } from "./types";

interface TripPlanDetailsViewProps {
  planId: string;
}

/**
 * Validates the entire plan before saving
 */
function validatePlan(plan: {
  destination: string;
  start_date: string;
  end_date: string;
  people_count: number;
  budget_type: string;
  plan_details: { days: { activities: unknown[] }[] };
}): ValidationErrors {
  const errors: ValidationErrors = {};

  if (!plan.destination?.trim()) {
    errors.destination = "Cel podróży jest wymagany";
  }

  if (!plan.start_date) {
    errors.start_date = "Data rozpoczęcia jest wymagana";
  }

  if (!plan.end_date) {
    errors.end_date = "Data zakończenia jest wymagana";
  } else if (plan.start_date && plan.end_date < plan.start_date) {
    errors.end_date = "Data zakończenia musi być >= data rozpoczęcia";
  }

  if (!plan.people_count || plan.people_count < 1) {
    errors.people_count = "Liczba osób musi być >= 1";
  }

  if (!plan.budget_type?.trim()) {
    errors.budget_type = "Typ budżetu jest wymagany";
  }

  if (!plan.plan_details?.days || plan.plan_details.days.length === 0) {
    errors.days = "Plan musi zawierać co najmniej jeden dzień";
  } else {
    const emptyDays = plan.plan_details.days.filter((day) => !day.activities || day.activities.length === 0);
    if (emptyDays.length > 0) {
      errors.activities = "Każdy dzień musi zawierać co najmniej jedną aktywność";
    }
  }

  return errors;
}

export function TripPlanDetailsView({ planId }: TripPlanDetailsViewProps): JSX.Element {
  const {
    state,
    enterEditMode,
    exitEditMode,
    updateMetadata,
    updateActivity,
    deleteActivity,
    addActivity,
    deleteDay,
    updateAccommodation,
    removeAccommodation,
    addAccommodation,
    savePlan,
    deletePlan,
    refetch,
    showDeleteDialog,
    hideDeleteDialog,
  } = useTripPlanDetails(planId);

  const {
    originalPlan,
    editedPlan,
    isLoading,
    isSaving,
    isDeleting,
    isEditMode,
    showDeleteDialog: isDeleteDialogOpen,
    error,
  } = state;

  // Use edited plan when in edit mode, otherwise original
  const displayPlan = isEditMode ? editedPlan : originalPlan;

  // Validation errors (only computed in edit mode before save)
  const validationErrors = useMemo(() => {
    if (!isEditMode || !editedPlan) return {};
    return validatePlan(editedPlan);
  }, [isEditMode, editedPlan]);

  // Handle metadata field changes
  const handleFieldChange = useCallback(
    (field: keyof TripPlanMetadata, value: string | number) => {
      updateMetadata(field, value);
    },
    [updateMetadata]
  );

  // Handle save with validation
  const handleSave = useCallback(async () => {
    if (!editedPlan) return;

    const errors = validatePlan(editedPlan);
    if (Object.keys(errors).length > 0) {
      // Errors will be displayed through validationErrors memo
      return;
    }

    await savePlan();
  }, [editedPlan, savePlan]);

  // Handle delete confirmation
  const handleDeleteConfirm = useCallback(async () => {
    await deletePlan();
  }, [deletePlan]);

  // Loading state
  if (isLoading) {
    return <LoadingState message="Ładowanie planu wycieczki..." />;
  }

  // Error state
  if (error) {
    return <ErrorState errorType={error.type} errorMessage={error.message} onRetry={refetch} />;
  }

  // No plan found (shouldn't happen if error handling is correct)
  if (!displayPlan) {
    return <ErrorState errorType="not-found" />;
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="mx-auto max-w-4xl">
        {/* Header with metadata and actions */}
        <TripPlanHeader
          destination={displayPlan.destination}
          startDate={displayPlan.start_date}
          endDate={displayPlan.end_date}
          peopleCount={displayPlan.people_count}
          budgetType={displayPlan.budget_type}
          isEditMode={isEditMode}
          isSaving={isSaving}
          validationErrors={validationErrors}
          onEdit={enterEditMode}
          onDelete={showDeleteDialog}
          onSave={handleSave}
          onCancel={exitEditMode}
          onFieldChange={handleFieldChange}
        />

        {/* Plan structure validation errors */}
        {isEditMode && (validationErrors.days || validationErrors.activities) && (
          <div className="mb-4 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
            {validationErrors.days && <p>{validationErrors.days}</p>}
            {validationErrors.activities && <p>{validationErrors.activities}</p>}
          </div>
        )}

        {/* Days list */}
        <div className="space-y-2">
          {displayPlan.plan_details.days.map((day, dayIndex) => (
            <DayCard
              key={`day-${day.day}-${dayIndex}`}
              day={day}
              dayIndex={dayIndex}
              isEditMode={isEditMode}
              onUpdateActivity={updateActivity}
              onDeleteActivity={deleteActivity}
              onAddActivity={addActivity}
              onDeleteDay={deleteDay}
            />
          ))}
        </div>

        {/* Accommodation section */}
        <AccommodationCard
          accommodation={displayPlan.plan_details.accommodation}
          isEditMode={isEditMode}
          onUpdate={updateAccommodation}
          onRemove={removeAccommodation}
          onAdd={addAccommodation}
        />

        {/* Notes section (read-only for now) */}
        {displayPlan.plan_details.notes && (
          <div className="mt-6 rounded-lg border bg-muted/50 p-4">
            <h3 className="mb-2 font-semibold">Notatki</h3>
            <p className="text-sm text-muted-foreground">{displayPlan.plan_details.notes}</p>
          </div>
        )}

        {/* Total estimated cost (read-only) */}
        {displayPlan.plan_details.total_estimated_cost !== undefined && (
          <div className="mt-4 text-right">
            <span className="text-sm text-muted-foreground">Szacunkowy całkowity koszt: </span>
            <span className="font-semibold">{displayPlan.plan_details.total_estimated_cost} PLN</span>
          </div>
        )}

        {/* Delete confirmation dialog */}
        <DeleteConfirmDialog
          isOpen={isDeleteDialogOpen}
          planName={displayPlan.destination}
          isDeleting={isDeleting}
          onConfirm={handleDeleteConfirm}
          onCancel={hideDeleteDialog}
        />
      </div>
    </main>
  );
}
