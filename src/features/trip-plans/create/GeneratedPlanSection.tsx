/**
 * GeneratedPlanSection component
 *
 * Main container for displaying the AI-generated trip plan.
 * Orchestrates PlanHeader, DayCards, and PlanActions.
 */

import { useCallback, useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@ui/alert-dialog";
import { Alert, AlertDescription, AlertTitle } from "@ui/alert";
import { Button } from "@ui/button";
import { Plus, AlertCircle } from "lucide-react";
import { useFeatureFlag } from "@feature-flags";
import { PlanHeader } from "./PlanHeader";
import { PlanActions } from "./PlanActions";
import { DayCard } from "../shared/DayCard";
import { calculateDateRange, calculateDayDate } from "../../../lib/utils/date-calculations";
import { EMPTY_ACTIVITY, MAX_DAYS_PER_PLAN } from "../../../lib/utils/trip-plan-constants";
import { validatePlan, type PlanValidationResult } from "../../../lib/utils/plan-validation";
import type { DayDto } from "../../../types";
import type { GeneratedPlanSectionProps, EditableGeneratedPlan } from "./types";

/**
 * GeneratedPlanSection component
 */
export function GeneratedPlanSection({
  plan,
  onRegeneratePlan,
  onAcceptPlan,
  onPlanChange,
  isAccepting = false,
}: GeneratedPlanSectionProps) {
  const [showRegenerateDialog, setShowRegenerateDialog] = useState(false);
  const [validationResult, setValidationResult] = useState<PlanValidationResult | null>(null);

  // Feature flag: day-adding (nice to have)
  const dayAddingEnabled = useFeatureFlag("day-adding");

  // Handler for day updates
  const handleDayUpdate = useCallback(
    (dayIndex: number, updatedDay: DayDto) => {
      // Clear validation errors when user makes changes
      if (validationResult) {
        setValidationResult(null);
      }

      const updatedDays = [...plan.plan_details.days];
      updatedDays[dayIndex] = updatedDay;

      const updatedPlan: EditableGeneratedPlan = {
        ...plan,
        plan_details: {
          ...plan.plan_details,
          days: updatedDays,
        },
        isEdited: true,
      };
      onPlanChange(updatedPlan);
    },
    [plan, onPlanChange, validationResult]
  );

  // Handler for day removal
  const handleDayRemove = useCallback(
    (dayIndex: number) => {
      // Prevent removing the last day
      if (plan.plan_details.days.length <= 1) return;

      const updatedDays = plan.plan_details.days
        .filter((_, index) => index !== dayIndex)
        .map((day, index) => ({ ...day, day: index + 1 })); // Renumber days

      const updatedPlan: EditableGeneratedPlan = {
        ...plan,
        plan_details: {
          ...plan.plan_details,
          days: updatedDays,
        },
        isEdited: true,
      };
      onPlanChange(updatedPlan);
    },
    [plan, onPlanChange]
  );

  // Handler for adding a day
  const handleAddDay = useCallback(() => {
    const currentDays = plan.plan_details.days;
    const currentDayCount = currentDays.length;
    const newDayNumber = currentDayCount + 1;

    // Calculate the date for the new day
    const newDayDate = calculateDayDate(plan.start_date, newDayNumber);

    // Check if we need to extend end_date
    const currentDateRange = calculateDateRange(plan.start_date, plan.end_date);
    const newDayCount = currentDayCount + 1;

    let newEndDate = plan.end_date;

    if (newDayCount > currentDateRange) {
      // Need to extend end_date
      const daysToExtend = newDayCount - currentDateRange;
      const extendedDate = new Date(plan.end_date);
      extendedDate.setDate(extendedDate.getDate() + daysToExtend);
      newEndDate = extendedDate.toISOString().split("T")[0];

      // Validate we don't exceed 30-day limit
      const newDateRange = calculateDateRange(plan.start_date, newEndDate);
      if (newDateRange > MAX_DAYS_PER_PLAN) {
        // Should not happen if button is properly disabled, but double-check
        return;
      }
    }

    // Create new day with empty activity
    const newDay: DayDto = {
      day: newDayNumber,
      date: newDayDate,
      activities: [{ ...EMPTY_ACTIVITY }],
    };

    const updatedPlan: EditableGeneratedPlan = {
      ...plan,
      end_date: newEndDate,
      plan_details: {
        ...plan.plan_details,
        days: [...currentDays, newDay],
      },
      isEdited: true,
    };

    onPlanChange(updatedPlan);
  }, [plan, onPlanChange]);

  // Check if adding a day would exceed the 30-day limit
  const canAddDay = useCallback(() => {
    const currentDayCount = plan.plan_details.days.length;
    const currentDateRange = calculateDateRange(plan.start_date, plan.end_date);
    const newDayCount = currentDayCount + 1;

    // If new day count fits within current date range, we can add it
    if (newDayCount <= currentDateRange) {
      return true;
    }

    // Otherwise, check if extending end_date would exceed 30 days
    const daysToExtend = newDayCount - currentDateRange;
    const extendedDate = new Date(plan.end_date);
    extendedDate.setDate(extendedDate.getDate() + daysToExtend);
    const newEndDate = extendedDate.toISOString().split("T")[0];
    const newDateRange = calculateDateRange(plan.start_date, newEndDate);

    return newDateRange <= MAX_DAYS_PER_PLAN;
  }, [plan]);

  // Handler for regenerate click
  const handleRegenerateClick = useCallback(() => {
    if (plan.isEdited) {
      setShowRegenerateDialog(true);
    } else {
      onRegeneratePlan();
    }
  }, [plan.isEdited, onRegeneratePlan]);

  // Handler for confirm regenerate
  const handleConfirmRegenerate = useCallback(() => {
    setShowRegenerateDialog(false);
    onRegeneratePlan();
  }, [onRegeneratePlan]);

  // Handler for accept click
  const handleAcceptClick = useCallback(() => {
    // Validate plan before accepting
    const result = validatePlan(plan.plan_details);

    if (!result.isValid) {
      // Show validation errors
      setValidationResult(result);
      // Scroll to top to show error message
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    // Clear any previous validation errors
    setValidationResult(null);

    // Accept the plan
    onAcceptPlan(plan);
  }, [plan, onAcceptPlan]);

  return (
    <div className="space-y-6">
      {/* Plan header */}
      <PlanHeader
        destination={plan.destination}
        startDate={plan.start_date}
        endDate={plan.end_date}
        peopleCount={plan.people_count}
        budgetType={plan.budget_type}
      />

      {/* Validation errors */}
      {validationResult && !validationResult.isValid && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Uzupełnij wymagane pola</AlertTitle>
          <AlertDescription>
            {validationResult.summary}
            {validationResult.errors.length > 0 && (
              <ul className="mt-2 list-inside list-disc space-y-1">
                {validationResult.errors.slice(0, 5).map((error, index) => (
                  <li key={index}>
                    Dzień {error.dayNumber}, aktywność {error.activityIndex + 1}:{" "}
                    {Object.values(error.fieldErrors).join(", ")}
                  </li>
                ))}
                {validationResult.errors.length > 5 && (
                  <li className="text-muted-foreground">... i {validationResult.errors.length - 5} więcej</li>
                )}
              </ul>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Days list */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Plan dnia po dniu</h2>
        {plan.plan_details.days.map((day, index) => (
          <DayCard
            key={`day-${day.day}-${day.date}`}
            day={day}
            dayIndex={index}
            onUpdate={(updatedDay) => handleDayUpdate(index, updatedDay)}
            onDeleteDay={() => handleDayRemove(index)}
          />
        ))}

        {/* Add Day button (feature flag: day-adding) */}
        {dayAddingEnabled && (
          <>
            <div className="flex justify-center pt-2">
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={handleAddDay}
                disabled={!canAddDay()}
                className="w-full max-w-md"
              >
                <Plus className="mr-2 h-5 w-5" />
                Dodaj dzień
              </Button>
            </div>

            {/* 30-day limit message */}
            {!canAddDay() && (
              <p className="text-center text-sm text-muted-foreground">
                Osiągnięto maksymalną długość podróży ({MAX_DAYS_PER_PLAN} dni)
              </p>
            )}
          </>
        )}
      </div>

      {/* Total cost (if available) */}
      {plan.plan_details.total_estimated_cost !== undefined && (
        <div className="rounded-lg bg-muted/50 p-4">
          <p className="text-sm text-muted-foreground">
            Szacunkowy całkowity koszt:{" "}
            <span className="font-semibold text-foreground">{plan.plan_details.total_estimated_cost} PLN</span>
          </p>
        </div>
      )}

      {/* Plan actions (sticky at bottom) */}
      <PlanActions
        onRegenerate={handleRegenerateClick}
        onAccept={handleAcceptClick}
        isAccepting={isAccepting}
        isEdited={plan.isEdited}
      />

      {/* Regenerate confirmation dialog */}
      <AlertDialog open={showRegenerateDialog} onOpenChange={setShowRegenerateDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Regenerować plan?</AlertDialogTitle>
            <AlertDialogDescription>
              Dokonałeś zmian w planie. Regenerowanie utworzy nowy plan i wszystkie Twoje modyfikacje zostaną utracone.
              Czy na pewno chcesz kontynuować?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anuluj</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmRegenerate}>Regeneruj plan</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
