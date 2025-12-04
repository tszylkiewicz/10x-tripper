/**
 * GeneratedPlanSection component
 *
 * Main container for displaying the AI-generated trip plan.
 * Orchestrates PlanHeader, AccommodationCard, DayCards, and PlanActions.
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
} from "@/components/ui/alert-dialog";
import { PlanHeader } from "./PlanHeader";
import { PlanActions } from "./PlanActions";
import { DayCard } from "../shared/DayCard";
import { AccommodationCard } from "../shared/AccommodationCard";
import type { DayDto, AccommodationDto } from "../../../types";
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

  // Handler for day updates
  const handleDayUpdate = useCallback(
    (dayIndex: number, updatedDay: DayDto) => {
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
    [plan, onPlanChange]
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

  // Handler for accommodation update
  const handleAccommodationUpdate = useCallback(
    (updatedAccommodation: AccommodationDto) => {
      const updatedPlan: EditableGeneratedPlan = {
        ...plan,
        plan_details: {
          ...plan.plan_details,
          accommodation: updatedAccommodation,
        },
        isEdited: true,
      };
      onPlanChange(updatedPlan);
    },
    [plan, onPlanChange]
  );

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

      {/* Accommodation card (if exists) */}
      {plan.plan_details.accommodation && (
        <AccommodationCard accommodation={plan.plan_details.accommodation} onUpdate={handleAccommodationUpdate} />
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
