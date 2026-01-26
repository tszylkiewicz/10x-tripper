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

// Re-export shared components for backwards compatibility
export { DayCard as PlanDay } from "../shared/DayCard";
export { ActivityCard } from "../shared/ActivityCard";

// Hook
export { useTripPlanDetails } from "./useTripPlanDetails";
export type { UseTripPlanDetailsReturn } from "./useTripPlanDetails";

// Types
export type {
  ViewError,
  ValidationErrors,
  TripPlanViewState,
  TripPlanMetadata,
  ActivityFormData,
  TripPlanAction,
  TripPlanHeaderProps,
  PlanDayProps,
  ActivityCardProps,
  LoadingStateProps,
} from "./types";
