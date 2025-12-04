/**
 * Activity validation utilities
 *
 * Shared validation logic for ActivityDto used across trip plan components.
 * Ensures consistent validation rules in create and details views.
 */

import type { ActivityDto } from "../../types";

/**
 * Validation errors map (field name -> error message)
 */
export type ValidationErrors = Record<string, string>;

/**
 * Validates activity fields with comprehensive business rules
 *
 * @param activity - Activity data to validate
 * @returns Object with field names as keys and error messages as values
 *
 * Validation rules:
 * - time: required, must match HH:MM format
 * - title: required, max 200 characters
 * - description: required
 * - location: required
 * - estimated_cost: optional, must be >= 0 if provided
 *
 * @example
 * const errors = validateActivity({
 *   time: "25:00",
 *   title: "",
 *   description: "Visit museum",
 *   location: "Paris"
 * });
 * // Returns: { time: "Nieprawidłowy format (HH:MM)", title: "Tytuł jest wymagany" }
 */
export function validateActivity(activity: ActivityDto): ValidationErrors {
  const errors: ValidationErrors = {};

  // Time validation
  if (!activity.time?.trim()) {
    errors.time = "Godzina jest wymagana";
  } else if (!/^\d{2}:\d{2}$/.test(activity.time)) {
    errors.time = "Nieprawidłowy format (HH:MM)";
  }

  // Title validation
  if (!activity.title?.trim()) {
    errors.title = "Tytuł jest wymagany";
  } else if (activity.title.length > 200) {
    errors.title = "Tytuł może mieć max 200 znaków";
  }

  // Description validation
  if (!activity.description?.trim()) {
    errors.description = "Opis jest wymagany";
  }

  // Location validation
  if (!activity.location?.trim()) {
    errors.location = "Lokalizacja jest wymagana";
  }

  // Estimated cost validation (optional field)
  if (activity.estimated_cost !== undefined && activity.estimated_cost < 0) {
    errors.estimated_cost = "Koszt musi być >= 0";
  }

  return errors;
}

/**
 * Validates only required fields for quick validation
 * Used when you only need to check if minimum required fields are present
 *
 * @param activity - Activity data to validate
 * @returns Object with validation errors for required fields only
 */
export function validateActivityRequired(activity: ActivityDto): ValidationErrors {
  const errors: ValidationErrors = {};

  if (!activity.time?.trim()) {
    errors.time = "Godzina jest wymagana";
  }

  if (!activity.title?.trim()) {
    errors.title = "Tytuł jest wymagany";
  }

  if (!activity.description?.trim()) {
    errors.description = "Opis jest wymagany";
  }

  if (!activity.location?.trim()) {
    errors.location = "Lokalizacja jest wymagana";
  }

  return errors;
}

/**
 * Checks if activity has any validation errors
 *
 * @param activity - Activity data to validate
 * @returns true if valid, false if has errors
 */
export function isActivityValid(activity: ActivityDto): boolean {
  const errors = validateActivity(activity);
  return Object.keys(errors).length === 0;
}
