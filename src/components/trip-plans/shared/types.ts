/**
 * Shared types for trip plan components
 *
 * Common prop types used across create and details views.
 * Designed to be flexible and support both use cases.
 */

import type { ActivityDto, AccommodationDto } from "../../../types";

/**
 * Validation errors map (field name -> error message)
 */
export type ValidationErrors = Record<string, string>;

// =============================================================================
// ACTIVITY CARD TYPES
// =============================================================================

/**
 * Props for shared ActivityCard component
 *
 * Supports both create flow (always editable) and details flow (conditional editing)
 */
export interface ActivityCardProps {
  /** Activity data to display/edit */
  activity: ActivityDto;

  /** Whether editing is enabled (default: true for create, conditional for details) */
  isEditMode?: boolean;

  /** Whether to show the edit button when not editing (default: true) */
  showEditButton?: boolean;

  /** Callback when activity is updated */
  onUpdate: (activity: ActivityDto) => void;

  /** Callback when activity is deleted */
  onDelete: () => void;

  /** Optional CSS class for the card */
  className?: string;
}

// =============================================================================
// DAY CARD TYPES
// =============================================================================

/**
 * Day data structure
 */
export interface DayData {
  day: number;
  date: string;
  activities: ActivityDto[];
}

/**
 * Props for shared DayCard component
 *
 * Supports both create flow (single onUpdate callback) and details flow (granular callbacks)
 */
export interface DayCardProps {
  /** Day data including activities */
  day: DayData;

  /** Day index for details flow callbacks */
  dayIndex?: number;

  /** Whether editing is enabled (default: true for create, conditional for details) */
  isEditMode?: boolean;

  /** Whether to show delete day button (default: based on isEditMode) */
  showDeleteButton?: boolean;

  // Callback options - use either unified or granular based on flow

  /** Unified callback for create flow - entire day is updated */
  onUpdate?: (day: DayData) => void;

  /** Granular callbacks for details flow - specific operations */
  onUpdateActivity?: (dayIndex: number, activityIndex: number, activity: ActivityDto) => void;
  onDeleteActivity?: (dayIndex: number, activityIndex: number) => void;
  onAddActivity?: (dayIndex: number, activity: ActivityDto) => void;

  /** Callback when entire day is deleted */
  onDeleteDay?: (dayIndex: number) => void;

  /** Optional CSS class for the card */
  className?: string;
}

// =============================================================================
// ACCOMMODATION CARD TYPES
// =============================================================================

/**
 * Props for shared AccommodationCard component
 *
 * Supports both create flow (simple edit/view) and details flow (add/edit/remove)
 */
export interface AccommodationCardProps {
  /** Accommodation data (can be null/undefined if not set) */
  accommodation?: AccommodationDto | null;

  /** Whether editing is enabled (default: true for create, conditional for details) */
  isEditMode?: boolean;

  /** Whether to show add button when no accommodation exists */
  showAddButton?: boolean;

  /** Whether to show remove button in edit mode */
  showRemoveButton?: boolean;

  /** Callback when accommodation is updated */
  onUpdate: (accommodation: AccommodationDto) => void;

  /** Callback when accommodation is added (for details flow) */
  onAdd?: (accommodation: AccommodationDto) => void;

  /** Callback when accommodation is removed (for details flow) */
  onRemove?: () => void;

  /** Optional CSS class for the card */
  className?: string;
}
