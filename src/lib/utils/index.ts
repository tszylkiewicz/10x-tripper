/**
 * Utility functions index
 *
 * Central export point for all utility functions used in trip plan components.
 * Import from this file for better tree-shaking and cleaner imports.
 */

// Date formatting
export {
  formatDate,
  formatAccommodationDate,
  formatDateRange,
} from "./date-formatting";

// Activity validation
export {
  validateActivity,
  validateActivityRequired,
  isActivityValid,
  type ValidationErrors as ActivityValidationErrors,
} from "./activity-validation";

// Accommodation validation
export {
  validateAccommodation,
  validateAccommodationRequired,
  isAccommodationValid,
  isValidUrl,
  validateDateRange,
  type ValidationErrors as AccommodationValidationErrors,
} from "./accommodation-validation";

// Constants
export {
  EMPTY_ACTIVITY,
  EMPTY_ACCOMMODATION,
  DEFAULT_ACTIVITY_TIME,
  MAX_ACTIVITY_TITLE_LENGTH,
  MIN_ACTIVITIES_PER_DAY,
  ACTIVITY_CATEGORIES,
  TIME_FORMAT_REGEX,
  PLACEHOLDERS,
  ERROR_MESSAGES,
} from "./trip-plan-constants";
