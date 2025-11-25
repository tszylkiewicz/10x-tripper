/**
 * Types for Create Trip Plan View
 *
 * Contains all type definitions specific to the create trip plan view,
 * including state management, form handling, and plan editing types.
 */

import type { GeneratedTripPlanDto, ApiErrorResponse, DayDto, ActivityDto, AccommodationDto } from "../../../types";

// =============================================================================
// FORM DATA TYPES
// =============================================================================

/**
 * ViewModel for the trip plan creation form
 * Used in TripPlanForm to manage form state
 */
export interface TripPlanFormData {
  destination: string;
  start_date: string; // Format: YYYY-MM-DD
  end_date: string; // Format: YYYY-MM-DD
  people_count: number;
  budget_type: string;
  preferences?: {
    transport?: string;
    todo?: string;
    avoid?: string;
  };
}

/**
 * Form validation errors
 * Structure mirrors TripPlanFormData for easy field mapping
 */
export interface TripPlanFormErrors {
  destination?: string;
  start_date?: string;
  end_date?: string;
  people_count?: string;
  budget_type?: string;
  preferences?: {
    transport?: string;
    todo?: string;
    avoid?: string;
  };
}

// =============================================================================
// GENERATION STATE TYPES
// =============================================================================

/**
 * State of the plan generation process
 */
export type GenerationState =
  | "idle" // Initial state, form ready
  | "generating" // Generation in progress (API call running)
  | "success" // Generation completed successfully
  | "error"; // Generation failed with error

// =============================================================================
// EDITABLE PLAN TYPES
// =============================================================================

/**
 * Extended GeneratedTripPlanDto with edit tracking flag
 * Used in component state to track if user has made any modifications
 */
export interface EditableGeneratedPlan extends GeneratedTripPlanDto {
  isEdited: boolean; // true if user has made any changes
}

// =============================================================================
// VIEW STATE TYPES
// =============================================================================

/**
 * Main view state for CreateTripPlanView
 * Manages the entire form -> generation -> edit -> accept flow
 */
export interface CreateTripPlanViewState {
  formData: TripPlanFormData | null;
  generationState: GenerationState;
  generatedPlan: EditableGeneratedPlan | null;
  generationError: ApiErrorResponse | null;
  isAccepting: boolean;
}

/**
 * Initial state for the create trip plan view
 */
export const initialCreateTripPlanViewState: CreateTripPlanViewState = {
  formData: null,
  generationState: "idle",
  generatedPlan: null,
  generationError: null,
  isAccepting: false,
};

// =============================================================================
// PLAN EDIT ACTION TYPES
// =============================================================================

/**
 * Actions for editing the generated plan
 * Used in reducer for managing plan modifications
 */
export type PlanEditAction =
  | { type: "UPDATE_DAY"; dayIndex: number; day: DayDto }
  | { type: "REMOVE_DAY"; dayIndex: number }
  | { type: "ADD_DAY"; day: DayDto }
  | { type: "UPDATE_ACTIVITY"; dayIndex: number; activityIndex: number; activity: ActivityDto }
  | { type: "REMOVE_ACTIVITY"; dayIndex: number; activityIndex: number }
  | { type: "ADD_ACTIVITY"; dayIndex: number; activity: ActivityDto }
  | { type: "REORDER_ACTIVITIES"; dayIndex: number; fromIndex: number; toIndex: number }
  | { type: "UPDATE_ACCOMMODATION"; accommodation: AccommodationDto }
  | { type: "REMOVE_ACCOMMODATION" };

// =============================================================================
// BUDGET TYPE CONFIGURATION
// =============================================================================

/**
 * Budget type option for Select component
 */
export interface BudgetTypeOption {
  value: string;
  label: string;
}

/**
 * Available budget type options
 */
export const BUDGET_TYPE_OPTIONS: BudgetTypeOption[] = [
  { value: "low", label: "Niski" },
  { value: "medium", label: "Średni" },
  { value: "high", label: "Wysoki" },
];

// =============================================================================
// ERROR TYPES
// =============================================================================

/**
 * Error type for categorizing different error scenarios
 */
export type CreatePlanErrorType =
  | "timeout"
  | "rate_limit"
  | "validation"
  | "server_error"
  | "network_error"
  | "unauthorized";

// =============================================================================
// COMPONENT PROPS TYPES
// =============================================================================

/**
 * Props for TripPlanForm component
 */
export interface TripPlanFormProps {
  onSubmit: (data: TripPlanFormData) => void;
  isSubmitting?: boolean;
  initialData?: Partial<TripPlanFormData>;
}

/**
 * Props for LoadingOverlay component
 */
export interface LoadingOverlayProps {
  isVisible: boolean;
  message?: string;
  subMessage?: string;
}

/**
 * Props for ErrorDisplay component
 */
export interface ErrorDisplayProps {
  error: ApiErrorResponse | null;
  onRetry: () => void;
  onEditForm?: () => void;
}

/**
 * Props for GeneratedPlanSection component
 */
export interface GeneratedPlanSectionProps {
  plan: EditableGeneratedPlan;
  onRegeneratePlan: () => void;
  onAcceptPlan: (plan: EditableGeneratedPlan) => void;
  onPlanChange: (updatedPlan: EditableGeneratedPlan) => void;
  isAccepting?: boolean;
}

/**
 * Props for PlanHeader component
 */
export interface PlanHeaderProps {
  destination: string;
  startDate: string;
  endDate: string;
  peopleCount: number;
  budgetType: string;
}

/**
 * Props for AccommodationCard component
 */
export interface AccommodationCardProps {
  accommodation: AccommodationDto;
  onUpdate: (updated: AccommodationDto) => void;
}

/**
 * Props for DayCard component
 */
export interface DayCardProps {
  day: DayDto;
  onUpdate: (updated: DayDto) => void;
  onRemove: () => void;
}

/**
 * Props for ActivityCard component
 */
export interface CreateActivityCardProps {
  activity: ActivityDto;
  onUpdate: (updated: ActivityDto) => void;
  onRemove: () => void;
}

/**
 * Props for PlanActions component
 */
export interface PlanActionsProps {
  onRegenerate: () => void;
  onAccept: () => void;
  isAccepting?: boolean;
  isEdited?: boolean;
}
