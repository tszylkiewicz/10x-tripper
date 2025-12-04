/**
 * Trip Plan Details Module
 *
 * Exports all components and hooks for the trip plan details view.
 */

// Main view component
export { TripPlanDetailsView } from "./TripPlanDetailsView";

// Sub-components
export { TripPlanHeader } from "./TripPlanHeader";
export { LoadingState } from "./LoadingState";
export { ErrorState } from "./ErrorState";
export { DeleteConfirmDialog } from "./DeleteConfirmDialog";

// Re-export shared components for backwards compatibility
export { DayCard as PlanDay } from "../shared/DayCard";
export { ActivityCard } from "../shared/ActivityCard";
export { AccommodationCard as AccommodationSection } from "../shared/AccommodationCard";

// Hook
export { useTripPlanDetails } from "./useTripPlanDetails";
export type { UseTripPlanDetailsReturn } from "./useTripPlanDetails";

// Types
export type {
  ErrorType,
  ViewError,
  ValidationErrors,
  TripPlanViewState,
  TripPlanMetadata,
  ActivityFormData,
  AccommodationFormData,
  TripPlanAction,
  TripPlanHeaderProps,
  PlanDayProps,
  ActivityCardProps,
  AccommodationSectionProps,
  DeleteConfirmDialogProps,
  ErrorStateProps,
  LoadingStateProps,
} from "./types";
