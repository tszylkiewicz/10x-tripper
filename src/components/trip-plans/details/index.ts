/**
 * Trip Plan Details Module
 *
 * Exports all components and hooks for the trip plan details view.
 */

// Main view component
export { TripPlanDetailsView } from "./TripPlanDetailsView";

// Sub-components
export { TripPlanHeader } from "./TripPlanHeader";
export { PlanDay } from "./PlanDay";
export { ActivityCard } from "./ActivityCard";
export { AccommodationSection } from "./AccommodationSection";
export { LoadingState } from "./LoadingState";
export { ErrorState } from "./ErrorState";
export { DeleteConfirmDialog } from "./DeleteConfirmDialog";

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
