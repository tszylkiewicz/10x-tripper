/**
 * Types for Trip Plan Details View
 *
 * Contains all type definitions specific to the trip plan details view,
 * including state management, validation, and form handling types.
 */

import type { TripPlanDto, ActivityDto, AccommodationDto } from "../../../types";

// =============================================================================
// ERROR TYPES
// =============================================================================

/**
 * Error type for categorizing different error scenarios
 */
export type ErrorType = "not-found" | "unauthorized" | "server-error" | "network-error" | "validation-error";

/**
 * View error structure
 */
export interface ViewError {
  type: ErrorType;
  message: string;
  details?: Record<string, unknown>;
}

// =============================================================================
// VALIDATION TYPES
// =============================================================================

/**
 * Validation errors map (field name -> error message)
 */
export type ValidationErrors = Record<string, string>;

// =============================================================================
// STATE TYPES
// =============================================================================

/**
 * Main view state for TripPlanDetailsView
 */
export interface TripPlanViewState {
  originalPlan: TripPlanDto | null;
  editedPlan: TripPlanDto | null;
  isLoading: boolean;
  isSaving: boolean;
  isDeleting: boolean;
  isEditMode: boolean;
  showDeleteDialog: boolean;
  error: ViewError | null;
}

/**
 * Initial state for the view
 */
export const initialTripPlanViewState: TripPlanViewState = {
  originalPlan: null,
  editedPlan: null,
  isLoading: true,
  isSaving: false,
  isDeleting: false,
  isEditMode: false,
  showDeleteDialog: false,
  error: null,
};

// =============================================================================
// METADATA TYPES
// =============================================================================

/**
 * Trip plan metadata (editable header fields)
 */
export interface TripPlanMetadata {
  destination: string;
  start_date: string;
  end_date: string;
  people_count: number;
  budget_type: string;
}

// =============================================================================
// FORM DATA TYPES
// =============================================================================

/**
 * Activity form data with editing state
 */
export interface ActivityFormData extends ActivityDto {
  isNew?: boolean;
  isEditing?: boolean;
}

/**
 * Accommodation form data with editing state
 */
export interface AccommodationFormData extends AccommodationDto {
  isEditing?: boolean;
}

// =============================================================================
// REDUCER ACTION TYPES
// =============================================================================

/**
 * Actions for trip plan view reducer
 */
export type TripPlanAction =
  | { type: "FETCH_START" }
  | { type: "FETCH_SUCCESS"; payload: TripPlanDto }
  | { type: "FETCH_ERROR"; payload: ViewError }
  | { type: "ENTER_EDIT_MODE" }
  | { type: "EXIT_EDIT_MODE" }
  | { type: "UPDATE_EDITED_PLAN"; payload: TripPlanDto }
  | { type: "UPDATE_METADATA"; payload: Partial<TripPlanMetadata> }
  | { type: "UPDATE_ACTIVITY"; payload: { dayIndex: number; activityIndex: number; activity: ActivityDto } }
  | { type: "DELETE_ACTIVITY"; payload: { dayIndex: number; activityIndex: number } }
  | { type: "ADD_ACTIVITY"; payload: { dayIndex: number; activity: ActivityDto } }
  | { type: "DELETE_DAY"; payload: { dayIndex: number } }
  | { type: "ADD_DAY"; payload: { day: number; date: string; activities: ActivityDto[] } }
  | { type: "UPDATE_ACCOMMODATION"; payload: AccommodationDto }
  | { type: "REMOVE_ACCOMMODATION" }
  | { type: "ADD_ACCOMMODATION"; payload: AccommodationDto }
  | { type: "SAVE_START" }
  | { type: "SAVE_SUCCESS"; payload: TripPlanDto }
  | { type: "SAVE_ERROR"; payload: ViewError }
  | { type: "DELETE_START" }
  | { type: "DELETE_SUCCESS" }
  | { type: "DELETE_ERROR"; payload: ViewError }
  | { type: "SHOW_DELETE_DIALOG" }
  | { type: "HIDE_DELETE_DIALOG" };

// =============================================================================
// COMPONENT PROPS TYPES
// =============================================================================

/**
 * Props for TripPlanHeader component
 */
export interface TripPlanHeaderProps {
  destination: string;
  startDate: string;
  endDate: string;
  peopleCount: number;
  budgetType: string;
  isEditMode: boolean;
  isSaving: boolean;
  validationErrors?: ValidationErrors;
  onEdit: () => void;
  onDelete: () => void;
  onSave: () => void;
  onCancel: () => void;
  onFieldChange: (field: keyof TripPlanMetadata, value: string | number) => void;
}

/**
 * Props for PlanDay component
 */
export interface PlanDayProps {
  day: number;
  date: string;
  activities: ActivityDto[];
  dayIndex: number;
  isEditMode: boolean;
  onUpdateActivity: (dayIndex: number, activityIndex: number, activity: ActivityDto) => void;
  onDeleteActivity: (dayIndex: number, activityIndex: number) => void;
  onAddActivity: (dayIndex: number, activity: ActivityDto) => void;
  onDeleteDay: (dayIndex: number) => void;
}

/**
 * Props for ActivityCard component
 */
export interface ActivityCardProps {
  activity: ActivityDto;
  isEditMode: boolean;
  validationErrors?: ValidationErrors;
  onUpdate: (activity: ActivityDto) => void;
  onDelete: () => void;
}

/**
 * Props for AccommodationSection component
 */
export interface AccommodationSectionProps {
  accommodation?: AccommodationDto | null;
  isEditMode: boolean;
  validationErrors?: ValidationErrors;
  onUpdate: (accommodation: AccommodationDto) => void;
  onRemove: () => void;
  onAdd: (accommodation: AccommodationDto) => void;
}

/**
 * Props for DeleteConfirmDialog component
 */
export interface DeleteConfirmDialogProps {
  isOpen: boolean;
  planName: string;
  isDeleting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Props for ErrorState component
 */
export interface ErrorStateProps {
  errorType: ErrorType;
  errorMessage?: string;
  onRetry?: () => void;
}

/**
 * Props for LoadingState component
 */
export interface LoadingStateProps {
  message?: string;
}
