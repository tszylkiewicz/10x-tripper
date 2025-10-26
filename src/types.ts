/**
 * Dto and Command Model Type Definitions for Tripper API
 *
 * This file contains all Data Transfer Objects (Dtos) and Command Models
 * used in the REST API. All types are derived from the database schema
 * defined in src/db/database.types.ts to ensure type safety and consistency
 * between the database layer and API layer.
 */

import type { Tables, TablesInsert, TablesUpdate } from "./db/database.types";

// =============================================================================
// PLAN DETAILS STRUCTURE TYPES
// =============================================================================

/**
 * Represents a single activity within a day's itinerary
 */
export interface ActivityDto {
  time: string;
  title: string;
  description: string;
  location: string;
  estimated_cost?: number;
  duration?: string;
  category?: string;
}

/**
 * Represents a single day in the trip plan
 */
export interface DayDto {
  day: number;
  date: string;
  activities: ActivityDto[];
}

/**
 * Represents accommodation details for the trip
 */
export interface AccommodationDto {
  name: string;
  address: string;
  check_in: string;
  check_out: string;
  estimated_cost?: number;
  booking_url?: string;
}

/**
 * Complete structure for the plan_details JSONB field
 * This is the structured format for trip plan details stored in the database
 */
export interface PlanDetailsDto {
  days: DayDto[];
  accommodation?: AccommodationDto;
  notes?: string;
  total_estimated_cost?: number;
  accepted_at?: string;
}

// =============================================================================
// USER PREFERENCES Dtos
// =============================================================================

/**
 * User Preference response Dto
 * Derived from: Tables<'user_preferences'>
 * Used in: GET /api/preferences, GET /api/preferences/:id, POST /api/preferences, PUT /api/preferences/:id responses
 *
 * Explicitly picks only the fields that should be exposed via API.
 * This ensures new database fields won't automatically leak into the API response.
 */
export type UserPreferenceDto = Pick<Tables<"user_preferences">, "id" | "name" | "people_count" | "budget_type">;

/**
 * Create User Preference request Dto
 * Derived from: TablesInsert<'user_preferences'>
 * Used in: POST /api/preferences request body
 */
export interface CreateUserPreferenceDto {
  name: string;
  people_count?: number | null;
  budget_type?: string | null;
}

/**
 * Update User Preference request Dto
 * Derived from: TablesUpdate<'user_preferences'>
 * Used in: PUT /api/preferences/:id request body
 */
export interface UpdateUserPreferenceDto {
  name?: string;
  people_count?: number | null;
  budget_type?: string | null;
}

// =============================================================================
// TRIP PLANS Dtos
// =============================================================================

/**
 * Trip Plan response Dto
 * Derived from: Tables<'trip_plans'>
 * Used in: GET /api/trip-plans, GET /api/trip-plans/:id, POST /api/trip-plans, PATCH /api/trip-plans/:id responses
 *
 * Explicitly picks only the fields that should be exposed via API.
 * Excludes: user_id, deleted_at, and deleted_by for security and clarity.
 * This ensures new database fields won't automatically leak into the API response.
 */
export type TripPlanDto = Pick<
  Tables<"trip_plans">,
  "id" | "destination" | "start_date" | "end_date" | "people_count" | "budget_type"
> & {
  plan_details: PlanDetailsDto;
};

/**
 * User notes and preferences for trip generation
 * Used in: POST /api/trip-plans/generate request body
 */
export interface TripPlanNotesDto {
  transport?: string;
  todo?: string;
  avoid?: string;
  [key: string]: string | undefined;
}

/**
 * Generate Trip Plan request Dto
 * Used in: POST /api/trip-plans/generate request body
 */
export interface GenerateTripPlanRequestDto {
  destination: string;
  start_date: string;
  end_date: string;
  people_count: number;
  budget_type: string;
  notes?: TripPlanNotesDto;
}

/**
 * Generated Trip Plan response Dto
 * Used in: POST /api/trip-plans/generate response
 *
 * Note: This includes generation_id to link the generated plan to its analytics record
 */
export interface GeneratedTripPlanDto {
  generation_id: string;
  destination: string;
  start_date: string;
  end_date: string;
  people_count: number;
  budget_type: string;
  plan_details: PlanDetailsDto;
}

/**
 * Accept Trip Plan request Dto
 * Derived from: TablesInsert<'trip_plans'>
 * Used in: POST /api/trip-plans request body
 *
 * This is used when the user accepts a generated plan (with or without edits)
 */
export interface AcceptTripPlanDto {
  generation_id?: string | null;
  destination: string;
  start_date: string;
  end_date: string;
  people_count: number;
  budget_type: string;
  plan_details: PlanDetailsDto;
  source: "ai" | "ai-edited";
}

/**
 * Update Trip Plan request Dto
 * Derived from: TablesUpdate<'trip_plans'>
 * Used in: PATCH /api/trip-plans/:id request body
 */
export interface UpdateTripPlanDto {
  destination?: string;
  start_date?: string;
  end_date?: string;
  people_count?: number;
  budget_type?: string;
  plan_details?: PlanDetailsDto;
}

// =============================================================================
// COMMAND MODELS
// =============================================================================

/**
 * Command for generating a trip plan
 * Used in backend to validate and process generation requests
 *
 * Validation rules:
 * - destination: Required, non-empty string
 * - start_date: Required, valid ISO date (YYYY-MM-DD), not in the past
 * - end_date: Required, valid ISO date (YYYY-MM-DD), must be >= start_date
 * - people_count: Required, positive integer (>= 1)
 * - budget_type: Required, non-empty string
 * - notes: Optional, object with user's notes for AI generation
 */
export interface GeneratePlanCommand {
  destination: string;
  start_date: string;
  end_date: string;
  people_count: number;
  budget_type: string;
  notes?: TripPlanNotesDto;
  user_id: string;
}

/**
 * Command for accepting a generated trip plan
 * Used in backend to validate and process plan acceptance
 *
 * Validation rules:
 * - generation_id: Optional, uuid linking to the generation that created this plan
 * - destination: Required, non-empty string
 * - start_date: Required, valid ISO date (YYYY-MM-DD)
 * - end_date: Required, valid ISO date (YYYY-MM-DD), must be >= start_date
 * - people_count: Required, positive integer (>= 1)
 * - budget_type: Required, non-empty string
 * - plan_details: Required, non-empty valid JSON structure
 * - source: Required, must be either "ai" or "ai-edited"
 */
export interface AcceptPlanCommand {
  generation_id?: string | null;
  destination: string;
  start_date: string;
  end_date: string;
  people_count: number;
  budget_type: string;
  plan_details: PlanDetailsDto;
  source: "ai" | "ai-edited";
  user_id: string;
}

/**
 * Command for updating a saved trip plan
 * Used in backend to validate and process plan updates
 *
 * Validation rules:
 * - All fields are optional
 * - If provided, same validation as AcceptPlanCommand
 * - plan_details: Must be valid PlanDetailsDto structure
 *
 * Note: Any edit to plan_details automatically changes source from "ai" to "ai-edited"
 */
export interface UpdatePlanCommand {
  id: string;
  destination?: string;
  start_date?: string;
  end_date?: string;
  people_count?: number;
  budget_type?: string;
  plan_details?: PlanDetailsDto;
  user_id: string;
}

/**
 * Command for creating a user preference
 * Used in backend to validate and process preference creation
 *
 * Validation rules:
 * - name: Required, max 256 characters, must be unique per user
 * - people_count: Optional, positive integer (>= 1)
 * - budget_type: Optional, string (recommended values: "low", "medium", "high")
 */
export interface CreatePreferenceCommand {
  name: string;
  people_count?: number | null;
  budget_type?: string | null;
  user_id: string;
}

/**
 * Command for updating a user preference
 * Used in backend to validate and process preference updates
 *
 * Validation rules:
 * - Same as CreatePreferenceCommand
 * - All fields optional
 */
export interface UpdatePreferenceCommand {
  id: string;
  name?: string;
  people_count?: number | null;
  budget_type?: string | null;
  user_id: string;
}

/**
 * Command for deleting a user preference
 * Used in backend to validate and process preference deletion
 *
 * Validation rules:
 * - id: Required, valid UUID format
 * - user_id: Required, extracted from authenticated session
 */
export interface DeletePreferenceCommand {
  id: string;
  user_id: string;
}

// =============================================================================
// QUERY PARAMETERS Dtos
// =============================================================================

/**
 * Query parameters for GET /api/trip-plans
 */
export interface GetTripPlansQueryDto {
  include_deleted?: boolean;
  sort_by?: "created_at" | "start_date" | "updated_at";
  sort_order?: "asc" | "desc";
}

// =============================================================================
// RESPONSE WRAPPER TYPES
// =============================================================================

/**
 * Standard success response wrapper
 * Used for all successful API responses
 */
export interface ApiSuccessResponse<T> {
  data: T;
}

/**
 * Standard error response structure
 * Used for all error responses
 */
export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

// =============================================================================
// INTERNAL DATABASE TYPES (for backend use only)
// =============================================================================

/**
 * Plan Generation database insert type
 * Derived from: TablesInsert<'plan_generations'>
 * Used internally by backend to log successful generations
 */
export type PlanGenerationInsert = TablesInsert<"plan_generations">;

/**
 * Plan Generation Error Log database insert type
 * Derived from: TablesInsert<'plan_generation_error_logs'>
 * Used internally by backend to log failed generations
 */
export type PlanGenerationErrorLogInsert = TablesInsert<"plan_generation_error_logs">;

/**
 * Trip Plan database insert type
 * Derived from: TablesInsert<'trip_plans'>
 * Used internally by backend to insert trip plans
 *
 * Explicitly picks all insertable fields to ensure control over database writes.
 * Replaces plan_details with typed PlanDetailsDto for type safety.
 */
export type TripPlanInsert = Pick<
  TablesInsert<"trip_plans">,
  | "budget_type"
  | "created_at"
  | "deleted_at"
  | "deleted_by"
  | "destination"
  | "end_date"
  | "id"
  | "people_count"
  | "source"
  | "start_date"
  | "updated_at"
  | "user_id"
> & {
  plan_details: PlanDetailsDto;
};

/**
 * Trip Plan database update type
 * Derived from: TablesUpdate<'trip_plans'>
 * Used internally by backend to update trip plans
 *
 * Explicitly picks all updatable fields to ensure control over database updates.
 * Replaces plan_details with typed PlanDetailsDto for type safety.
 */
export type TripPlanUpdate = Pick<
  TablesUpdate<"trip_plans">,
  | "budget_type"
  | "created_at"
  | "deleted_at"
  | "deleted_by"
  | "destination"
  | "end_date"
  | "id"
  | "people_count"
  | "source"
  | "start_date"
  | "updated_at"
  | "user_id"
> & {
  plan_details?: PlanDetailsDto;
};
