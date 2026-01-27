/**
 * Plan validation utilities
 *
 * Validates trip plans before acceptance to ensure all required data is complete.
 */

import type { PlanDetailsDto } from "../../types";
import { validateActivity } from "./activity-validation";

/**
 * Validation error for a specific activity
 */
export interface ActivityValidationError {
  dayIndex: number;
  dayNumber: number;
  activityIndex: number;
  fieldErrors: Record<string, string>;
}

/**
 * Plan validation result
 */
export interface PlanValidationResult {
  isValid: boolean;
  errors: ActivityValidationError[];
  summary: string;
}

/**
 * Validates a trip plan before acceptance
 *
 * Checks that:
 * - Plan has at least one day
 * - Each day has at least one activity
 * - All activities have required fields filled
 *
 * @param planDetails - Plan details to validate
 * @returns Validation result with errors and summary
 */
export function validatePlan(planDetails: PlanDetailsDto): PlanValidationResult {
  const errors: ActivityValidationError[] = [];

  // Check if plan has days
  if (!planDetails.days || planDetails.days.length === 0) {
    return {
      isValid: false,
      errors: [],
      summary: "Plan musi zawierać co najmniej jeden dzień",
    };
  }

  // Validate each day
  planDetails.days.forEach((day, dayIndex) => {
    // Check if day has activities
    if (!day.activities || day.activities.length === 0) {
      errors.push({
        dayIndex,
        dayNumber: day.day,
        activityIndex: -1,
        fieldErrors: { _day: "Dzień musi zawierać co najmniej jedną aktywność" },
      });
      return;
    }

    // Validate each activity
    day.activities.forEach((activity, activityIndex) => {
      const fieldErrors = validateActivity(activity);

      if (Object.keys(fieldErrors).length > 0) {
        errors.push({
          dayIndex,
          dayNumber: day.day,
          activityIndex,
          fieldErrors,
        });
      }
    });
  });

  // Generate summary
  let summary = "";
  if (errors.length > 0) {
    const dayErrors = new Set(errors.map((e) => e.dayNumber));
    const activityErrorCount = errors.filter((e) => e.activityIndex >= 0).length;

    if (dayErrors.size === 1) {
      summary = `Dzień ${Array.from(dayErrors)[0]} zawiera ${activityErrorCount} ${activityErrorCount === 1 ? "nieprawidłową aktywność" : "nieprawidłowych aktywności"}`;
    } else {
      summary = `${dayErrors.size} dni zawiera nieprawidłowe aktywności. Sprawdź pola wymagane.`;
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    summary,
  };
}

/**
 * Checks if activity is empty (all required fields are empty or whitespace)
 *
 * @param activity - Activity to check
 * @returns true if activity appears to be a placeholder/empty
 */
export function isActivityEmpty(activity: {
  time?: string;
  title?: string;
  description?: string;
  location?: string;
}): boolean {
  return (
    (!activity.time || activity.time.trim() === "") &&
    (!activity.title || activity.title.trim() === "") &&
    (!activity.description || activity.description.trim() === "") &&
    (!activity.location || activity.location.trim() === "")
  );
}

/**
 * Counts the number of empty activities in a plan
 *
 * @param planDetails - Plan details to check
 * @returns Number of empty activities
 */
export function countEmptyActivities(planDetails: PlanDetailsDto): number {
  let count = 0;

  planDetails.days.forEach((day) => {
    day.activities.forEach((activity) => {
      if (isActivityEmpty(activity)) {
        count++;
      }
    });
  });

  return count;
}
