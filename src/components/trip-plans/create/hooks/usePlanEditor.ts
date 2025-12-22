import { useState, useCallback, useEffect } from "react";
import type { GeneratedTripPlanDto } from "../../../../types";
import type { EditableGeneratedPlan, PlanEditAction } from "../types";

/**
 * Return type for the usePlanEditor hook
 */
export interface UsePlanEditorReturn {
  editablePlan: EditableGeneratedPlan | null;
  updatePlan: (action: PlanEditAction) => void;
  isEdited: boolean;
  setPlan: (plan: GeneratedTripPlanDto) => void;
  setEditablePlan: (plan: EditableGeneratedPlan) => void;
  resetEdits: () => void;
}

/**
 * Reorders array items by moving an item from one index to another
 */
function reorderArray<T>(array: T[], fromIndex: number, toIndex: number): T[] {
  const result = [...array];
  const [removed] = result.splice(fromIndex, 1);
  result.splice(toIndex, 0, removed);
  return result;
}

/**
 * Custom hook for managing editable trip plan state
 *
 * Provides a reducer-like interface for modifying the generated plan
 * and tracks whether any modifications have been made (isEdited flag).
 *
 * @param initialPlan - The initially generated plan from AI
 * @returns Object containing editable plan, update function, and edit state
 */
export function usePlanEditor(initialPlan: GeneratedTripPlanDto | null): UsePlanEditorReturn {
  const [editablePlan, setEditablePlan] = useState<EditableGeneratedPlan | null>(
    initialPlan ? { ...initialPlan, isEdited: false } : null
  );

  // Sync with initialPlan changes (e.g., after regeneration)
  useEffect(() => {
    if (initialPlan) {
      setEditablePlan({ ...initialPlan, isEdited: false });
    } else {
      setEditablePlan(null);
    }
  }, [initialPlan]);

  /**
   * Updates the plan based on the action type
   * Automatically sets isEdited to true on any modification
   */
  const updatePlan = useCallback((action: PlanEditAction) => {
    setEditablePlan((prev) => {
      if (!prev) return null;

      const { plan_details } = prev;
      let updatedDays = [...plan_details.days];
      let updatedAccommodation = plan_details.accommodation;

      switch (action.type) {
        case "UPDATE_DAY": {
          updatedDays[action.dayIndex] = action.day;
          break;
        }

        case "REMOVE_DAY": {
          updatedDays = updatedDays.filter((_, index) => index !== action.dayIndex);
          // Renumber remaining days
          updatedDays = updatedDays.map((day, index) => ({
            ...day,
            day: index + 1,
          }));
          break;
        }

        case "ADD_DAY": {
          updatedDays = [...updatedDays, action.day];
          break;
        }

        case "UPDATE_ACTIVITY": {
          const dayToUpdate = { ...updatedDays[action.dayIndex] };
          dayToUpdate.activities = [...dayToUpdate.activities];
          dayToUpdate.activities[action.activityIndex] = action.activity;
          updatedDays[action.dayIndex] = dayToUpdate;
          break;
        }

        case "REMOVE_ACTIVITY": {
          const dayWithRemoval = { ...updatedDays[action.dayIndex] };
          dayWithRemoval.activities = dayWithRemoval.activities.filter((_, index) => index !== action.activityIndex);
          updatedDays[action.dayIndex] = dayWithRemoval;
          break;
        }

        case "ADD_ACTIVITY": {
          const dayWithAddition = { ...updatedDays[action.dayIndex] };
          dayWithAddition.activities = [...dayWithAddition.activities, action.activity];
          updatedDays[action.dayIndex] = dayWithAddition;
          break;
        }

        case "REORDER_ACTIVITIES": {
          const dayWithReorder = { ...updatedDays[action.dayIndex] };
          dayWithReorder.activities = reorderArray(dayWithReorder.activities, action.fromIndex, action.toIndex);
          updatedDays[action.dayIndex] = dayWithReorder;
          break;
        }

        case "UPDATE_ACCOMMODATION": {
          updatedAccommodation = action.accommodation;
          break;
        }

        case "REMOVE_ACCOMMODATION": {
          updatedAccommodation = undefined;
          break;
        }

        default:
          return prev;
      }

      return {
        ...prev,
        plan_details: {
          ...plan_details,
          days: updatedDays,
          accommodation: updatedAccommodation,
        },
        isEdited: true,
      };
    });
  }, []);

  /**
   * Sets a new plan (typically after regeneration)
   * Resets the isEdited flag to false
   */
  const setPlan = useCallback((plan: GeneratedTripPlanDto) => {
    setEditablePlan({ ...plan, isEdited: false });
  }, []);

  /**
   * Sets an editable plan directly (preserves isEdited flag)
   * Used when receiving updates from child components
   */
  const setEditablePlanDirect = useCallback((plan: EditableGeneratedPlan) => {
    setEditablePlan(plan);
  }, []);

  /**
   * Resets the edit state while keeping the plan
   * Useful for testing or specific UI flows
   */
  const resetEdits = useCallback(() => {
    setEditablePlan((prev) => (prev ? { ...prev, isEdited: false } : null));
  }, []);

  return {
    editablePlan,
    updatePlan,
    isEdited: editablePlan?.isEdited ?? false,
    setPlan,
    setEditablePlan: setEditablePlanDirect,
    resetEdits,
  };
}
