/**
 * TripPlanService
 *
 * Service layer for managing trip plans.
 * Handles business logic, validation, and database interactions for trip plans.
 */

import type { SupabaseClient } from "../../db/supabase.client";
import type {
  TripPlanDto,
  PlanDetailsDto,
  DeleteTripPlanCommand,
  AcceptPlanCommand,
  UpdatePlanCommand,
  TripPlanUpdate
} from "../../types";
import type { Tables, Json } from "../../db/database.types";
import { isValidUUID } from "../validators/uuid.validator";
import { ValidationError } from "../../errors/validation.error";

export class TripPlanService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Retrieves all active trip plans for a specific user
   * Plans are sorted by start_date ascending (nearest date first)
   * Soft-deleted plans are always excluded
   *
   * @param userId - The ID of the user whose trip plans to retrieve
   * @returns Array of trip plans as TripPlanDto[], sorted by start_date ASC
   * @throws Error if database operation fails
   */
  async getTripPlans(userId: string): Promise<TripPlanDto[]> {
    // Build query - always exclude soft-deleted plans
    const { data, error } = await this.supabase
      .from("trip_plans")
      .select("id, destination, start_date, end_date, people_count, budget_type, plan_details")
      .eq("user_id", userId)
      .is("deleted_at", null) // Always exclude soft-deleted plans
      .order("start_date", { ascending: true });

    if (error) {
      console.error("Database error in getTripPlans:", error);
      throw new Error("Failed to fetch trip plans");
    }

    return data.map(item => this.mapToDto(item));
  }

  /**
   * Retrieves a single trip plan by ID
   *
   * @param id - The trip plan ID (UUID)
   * @param userId - The ID of the user to verify ownership (used with RLS)
   * @returns Trip plan as TripPlanDto or null if not found
   * @throws Error if ID format is invalid or database operation fails
   */
  async getTripPlanById(id: string, userId: string): Promise<TripPlanDto | null> {
    // 1. Validate UUID format
    if (!isValidUUID(id)) {
      throw new Error("Invalid UUID format");
    }

    // 2. Query database with filters
    const { data, error } = await this.supabase
      .from("trip_plans")
      .select("id, destination, start_date, end_date, people_count, budget_type, plan_details")
      .eq("id", id)
      .is("deleted_at", null)
      .single();

    // 3. Handle "not found" case - PostgREST returns PGRST116 error code
    if (error) {
      if (error.code === "PGRST116") {
        return null;
      }
      // Any other error is unexpected and should be thrown
      console.error("Database error in getTripPlanById:", error);
      throw error;
    }

    // 4. Check if data exists
    if (!data) {
      return null;
    }

    // 5. Map database result to DTO
    return this.mapToDto(data);
  }

  /**
   * Soft deletes a trip plan by ID
   * Sets deleted_at timestamp, trigger automatically sets deleted_by
   *
   * @param command - Command containing trip plan ID and user ID
   * @returns true if deleted successfully, false if not found
   * @throws Error if database operation fails
   */
  async deleteTripPlan(command: DeleteTripPlanCommand): Promise<boolean> {
    const { data, error } = await this.supabase
      .from("trip_plans")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", command.id)
      .eq("user_id", command.user_id)
      .select("id");

    if (error) {
      console.error("Database error in deleteTripPlan:", error);
      throw error;
    }

    // Check if any row was updated (soft deleted)
    if (!data || data.length === 0) {
      return false;
    }

    return true;
  }

  /**
   * Accept and save a trip plan to the database
   *
   * @param command - AcceptPlanCommand with user_id
   * @returns TripPlanDto - The saved trip plan
   * @throws ValidationError - If business validation fails
   * @throws Error - If database operation fails
   *
   * TODO: Post-MVP database optimizations:
   * - Consider adding GIN index on plan_details->days for content search
   * - Consider caching frequently accessed plans (Redis)
   * - Consider webhook notifications after plan acceptance
   */
  async acceptPlan(command: AcceptPlanCommand): Promise<TripPlanDto> {
    // 1. Validate business rules
    this.validateAcceptPlanCommand(command);

    // 2. Verify generation_id exists if provided
    if (command.generation_id) {
      await this.verifyGenerationExists(command.generation_id, command.user_id);
    }

    // 3. Insert into trip_plans table
    const { data, error } = await this.supabase
      .from("trip_plans")
      .insert({
        user_id: command.user_id,
        generation_id: command.generation_id,
        destination: command.destination,
        start_date: command.start_date,
        end_date: command.end_date,
        people_count: command.people_count,
        budget_type: command.budget_type,
        plan_details: command.plan_details as unknown as Json,
        source: command.source,
      })
      .select("id, destination, start_date, end_date, people_count, budget_type, plan_details")
      .single();

    if (error) {
      throw error;
    }

    // 4. Return as TripPlanDto
    return this.mapToDto(data);
  }

  /**
   * Validates business rules for AcceptPlanCommand
   *
   * @param command - Command to validate
   * @throws ValidationError if validation fails
   * @private
   *
   * TODO: Post-MVP - Add validation for dates not in the past
   */
  private validateAcceptPlanCommand(command: AcceptPlanCommand): void {
    // Validate end_date >= start_date
    const startDate = new Date(command.start_date);
    const endDate = new Date(command.end_date);

    if (endDate < startDate) {
      throw new ValidationError(
        "End date must be on or after start date",
        "end_date"
      );
    }

    // Validate people_count >= 1
    if (command.people_count < 1) {
      throw new ValidationError(
        "People count must be at least 1",
        "people_count"
      );
    }

    // Validate plan_details is not empty
    if (!command.plan_details || Object.keys(command.plan_details).length === 0) {
      throw new ValidationError(
        "Plan details cannot be empty",
        "plan_details"
      );
    }

    // Validate plan_details.days exists and has items
    if (!command.plan_details.days || command.plan_details.days.length === 0) {
      throw new ValidationError(
        "Plan must contain at least one day",
        "plan_details"
      );
    }

    // Validate source is valid enum value
    if (command.source !== "ai" && command.source !== "ai-edited") {
      throw new ValidationError(
        "Source must be either 'ai' or 'ai-edited'",
        "source"
      );
    }
  }

  /**
   * Verify that generation_id exists in plan_generations table
   * and belongs to the user
   *
   * @param generationId - Generation ID to verify
   * @param userId - User ID to verify ownership
   * @throws ValidationError if generation_id doesn't exist
   * @private
   */
  private async verifyGenerationExists(
    generationId: string,
    userId: string
  ): Promise<void> {
    const { data, error } = await this.supabase
      .from("plan_generations")
      .select("id")
      .eq("id", generationId)
      .eq("user_id", userId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        // Not found
        throw new ValidationError(
          "The provided generation_id does not exist or does not belong to you",
          "generation_id"
        );
      }
      throw error;
    }

    if (!data) {
      throw new ValidationError(
        "The provided generation_id does not exist or does not belong to you",
        "generation_id"
      );
    }
  }

  /**
   * Updates an existing trip plan
   * Automatically changes source to "ai-edited" if plan_details is modified and source was "ai"
   *
   * @param command - UpdatePlanCommand containing fields to update
   * @returns Updated TripPlanDto or null if not found
   * @throws ValidationError if business validation fails
   * @throws Error if database operation fails
   */
  async updateTripPlan(command: UpdatePlanCommand): Promise<TripPlanDto | null> {
    // 1. Validate command
    this.validateUpdateCommand(command);

    // 2. Fetch current plan to check source
    const current = await this.getTripPlanForUpdate(command.id, command.user_id);
    if (!current) {
      return null; // Trip plan not found or doesn't belong to user
    }

    // 3. Build update object
    const updateData: TripPlanUpdate = {};

    if (command.destination !== undefined) {
      updateData.destination = command.destination;
    }
    if (command.start_date !== undefined) {
      updateData.start_date = command.start_date;
    }
    if (command.end_date !== undefined) {
      updateData.end_date = command.end_date;
    }
    if (command.people_count !== undefined) {
      updateData.people_count = command.people_count;
    }
    if (command.budget_type !== undefined) {
      updateData.budget_type = command.budget_type;
    }

    // 4. Handle plan_details and source change logic
    if (command.plan_details !== undefined) {
      updateData.plan_details = command.plan_details;

      // If source was "ai", change to "ai-edited"
      if (current.source === "ai") {
        updateData.source = "ai-edited";
      }
    }

    // 5. Execute UPDATE query
    const { data, error } = await this.supabase
      .from("trip_plans")
      .update(updateData)
      .eq("id", command.id)
      .eq("user_id", command.user_id)
      .select("id, destination, start_date, end_date, people_count, budget_type, plan_details")
      .single();

    // 6. Handle errors
    if (error) {
      if (error.code === "PGRST116") {
        return null; // Not found (shouldn't happen after step 2, but safety)
      }
      console.error("Database error in updateTripPlan:", error);
      throw error;
    }

    // 7. Map to TripPlanDto
    return this.mapToDto(data);
  }

  /**
   * Retrieves trip plan's source and plan_details for update logic
   * Internal helper method for updateTripPlan
   *
   * @param id - Trip plan ID
   * @param userId - User ID for ownership verification
   * @returns Object with source and plan_details, or null if not found
   * @private
   */
  private async getTripPlanForUpdate(
    id: string,
    userId: string
  ): Promise<{ source: string; plan_details: PlanDetailsDto } | null> {
    const { data, error } = await this.supabase
      .from("trip_plans")
      .select("source, plan_details")
      .eq("id", id)
      .eq("user_id", userId)
      .is("deleted_at", null)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return null; // Not found
      }
      console.error("Database error in getTripPlanForUpdate:", error);
      throw error;
    }

    if (!data) {
      return null;
    }

    return {
      source: data.source,
      plan_details: data.plan_details as unknown as PlanDetailsDto,
    };
  }

  /**
   * Validates UpdatePlanCommand business rules
   * Checks business rules that can't be validated by Zod alone
   *
   * @param command - Command to validate
   * @throws ValidationError if validation fails
   * @private
   */
  private validateUpdateCommand(command: UpdatePlanCommand): void {
    // At least one field must be provided (already checked by Zod, but double-check)
    const hasAnyField =
      command.destination !== undefined ||
      command.start_date !== undefined ||
      command.end_date !== undefined ||
      command.people_count !== undefined ||
      command.budget_type !== undefined ||
      command.plan_details !== undefined;

    if (!hasAnyField) {
      throw new ValidationError("At least one field must be provided for update", "general");
    }

    // Validate destination (if provided)
    if (command.destination !== undefined && command.destination.trim().length === 0) {
      throw new ValidationError("Destination cannot be empty", "destination");
    }

    // Validate dates relationship (if both provided)
    if (command.start_date && command.end_date) {
      const startDate = new Date(command.start_date);
      const endDate = new Date(command.end_date);

      if (endDate < startDate) {
        throw new ValidationError("End date must be on or after start date", "end_date");
      }
    }

    // Validate people_count (if provided)
    if (command.people_count !== undefined) {
      if (!Number.isInteger(command.people_count) || command.people_count < 1) {
        throw new ValidationError("People count must be a positive integer (>= 1)", "people_count");
      }
    }

    // Validate budget_type (if provided)
    if (command.budget_type !== undefined && command.budget_type.trim().length === 0) {
      throw new ValidationError("Budget type cannot be empty", "budget_type");
    }

    // Validate plan_details structure (if provided)
    if (command.plan_details !== undefined) {
      if (!command.plan_details.days || command.plan_details.days.length === 0) {
        throw new ValidationError("Plan details must contain at least one day", "plan_details");
      }

      // Validate each day has activities
      for (const day of command.plan_details.days) {
        if (!day.activities || day.activities.length === 0) {
          throw new ValidationError(
            `Day ${day.day} must have at least one activity`,
            "plan_details"
          );
        }
      }
    }
  }

  /**
   * Maps database result to TripPlanDto
   *
   * @param data - Raw data from database query
   * @returns Mapped TripPlanDto with typed plan_details
   * @private
   */
  private mapToDto(data: Pick<Tables<"trip_plans">, "id" | "destination" | "start_date" | "end_date" | "people_count" | "budget_type" | "plan_details">): TripPlanDto {
    return {
      id: data.id,
      destination: data.destination,
      start_date: data.start_date,
      end_date: data.end_date,
      people_count: data.people_count,
      budget_type: data.budget_type,
      plan_details: data.plan_details as unknown as PlanDetailsDto,
    };
  }
}
