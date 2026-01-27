/**
 * Utility functions index
 *
 * Central export point for all utility functions used in trip plan components.
 * Import from this file for better tree-shaking and cleaner imports.
 */

// Date formatting
export { formatDate } from "./date-formatting";

// Date calculations
export {
  calculateDateRange,
  addDays,
  calculateDayDate,
  isWithinMaxDays,
  getLastDayDate,
  isValidDateRange,
} from "./date-calculations";

// Activity validation
export {
  validateActivity,
  validateActivityRequired,
  isActivityValid,
  type ValidationErrors as ActivityValidationErrors,
} from "./activity-validation";

// Plan validation
export {
  validatePlan,
  isActivityEmpty,
  countEmptyActivities,
  type PlanValidationResult,
  type ActivityValidationError,
} from "./plan-validation";

// Constants
export {
  EMPTY_ACTIVITY,
  DEFAULT_ACTIVITY_TIME,
  MAX_ACTIVITY_TITLE_LENGTH,
  MIN_ACTIVITIES_PER_DAY,
  MAX_DAYS_PER_PLAN,
  ACTIVITY_CATEGORIES,
  TIME_FORMAT_REGEX,
  PLACEHOLDERS,
  ERROR_MESSAGES,
} from "./trip-plan-constants";

// Environment utilities
export { getMergedEnv } from "./env";
