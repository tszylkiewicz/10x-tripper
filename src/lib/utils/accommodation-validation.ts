/**
 * Accommodation validation utilities
 *
 * Shared validation logic for AccommodationDto used across trip plan components.
 * Ensures consistent validation rules in create and details views.
 */

import type { AccommodationDto } from "../../types";

/**
 * Validation errors map (field name -> error message)
 */
export type ValidationErrors = Record<string, string>;

/**
 * Validates URL format
 *
 * @param url - URL string to validate
 * @returns true if valid URL, false otherwise
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validates accommodation fields with comprehensive business rules
 *
 * @param accommodation - Accommodation data to validate
 * @returns Object with field names as keys and error messages as values
 *
 * Validation rules:
 * - name: required
 * - address: required
 * - check_in: required
 * - check_out: required, must be >= check_in
 * - estimated_cost: optional, must be >= 0 if provided
 * - booking_url: optional, must be valid URL if provided
 *
 * @example
 * const errors = validateAccommodation({
 *   name: "",
 *   address: "Street 1",
 *   check_in: "2025-06-03",
 *   check_out: "2025-06-01"
 * });
 * // Returns: {
 * //   name: "Nazwa zakwaterowania jest wymagana",
 * //   check_out: "Data wymeldowania musi być >= data zameldowania"
 * // }
 */
export function validateAccommodation(accommodation: AccommodationDto): ValidationErrors {
  const errors: ValidationErrors = {};

  // Name validation
  if (!accommodation.name?.trim()) {
    errors.name = "Nazwa zakwaterowania jest wymagana";
  }

  // Address validation
  if (!accommodation.address?.trim()) {
    errors.address = "Adres jest wymagany";
  }

  // Check-in validation
  if (!accommodation.check_in?.trim()) {
    errors.check_in = "Data zameldowania jest wymagana";
  }

  // Check-out validation
  if (!accommodation.check_out?.trim()) {
    errors.check_out = "Data wymeldowania jest wymagana";
  } else if (accommodation.check_in && accommodation.check_out < accommodation.check_in) {
    errors.check_out = "Data wymeldowania musi być >= data zameldowania";
  }

  // Estimated cost validation (optional field)
  if (accommodation.estimated_cost !== undefined && accommodation.estimated_cost < 0) {
    errors.estimated_cost = "Koszt musi być >= 0";
  }

  // Booking URL validation (optional field)
  if (accommodation.booking_url && !isValidUrl(accommodation.booking_url)) {
    errors.booking_url = "Nieprawidłowy format URL";
  }

  return errors;
}

/**
 * Validates only required fields for quick validation
 *
 * @param accommodation - Accommodation data to validate
 * @returns Object with validation errors for required fields only
 */
export function validateAccommodationRequired(accommodation: AccommodationDto): ValidationErrors {
  const errors: ValidationErrors = {};

  if (!accommodation.name?.trim()) {
    errors.name = "Nazwa zakwaterowania jest wymagana";
  }

  if (!accommodation.address?.trim()) {
    errors.address = "Adres jest wymagany";
  }

  if (!accommodation.check_in?.trim()) {
    errors.check_in = "Data zameldowania jest wymagana";
  }

  if (!accommodation.check_out?.trim()) {
    errors.check_out = "Data wymeldowania jest wymagana";
  }

  return errors;
}

/**
 * Checks if accommodation has any validation errors
 *
 * @param accommodation - Accommodation data to validate
 * @returns true if valid, false if has errors
 */
export function isAccommodationValid(accommodation: AccommodationDto): boolean {
  const errors = validateAccommodation(accommodation);
  return Object.keys(errors).length === 0;
}

/**
 * Validates date range (check-out must be after check-in)
 *
 * @param checkIn - Check-in date string (ISO format)
 * @param checkOut - Check-out date string (ISO format)
 * @returns Error message if invalid, null if valid
 */
export function validateDateRange(checkIn: string, checkOut: string): string | null {
  if (!checkIn || !checkOut) {
    return null; // Let required field validation handle this
  }

  if (checkOut < checkIn) {
    return "Data wymeldowania musi być >= data zameldowania";
  }

  return null;
}
