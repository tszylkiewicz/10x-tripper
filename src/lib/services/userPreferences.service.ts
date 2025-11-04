/**
 * UserPreferencesService
 *
 * Service layer for managing user preferences (templates for trip planning).
 * Handles business logic, validation, and database interactions.
 */

import type { SupabaseClient } from "../../db/supabase.client";
import type { CreatePreferenceCommand, DeletePreferenceCommand, UpdatePreferenceCommand, UserPreferenceDto } from "../../types";
import { ValidationError } from "../../errors/validation.error";

export class UserPreferencesService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Retrieves all user preference templates for a specific user
   *
   * @param userId - The ID of the user whose preferences to retrieve
   * @returns Array of user preferences as UserPreferenceDto[]
   * @throws Error if database operation fails
   */
  async getPreferences(userId: string): Promise<UserPreferenceDto[]> {
    const { data, error } = await this.supabase
      .from("user_preferences")
      .select("id, name, people_count, budget_type")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Database error in getPreferences:", error);
      throw new Error("Failed to fetch preferences");
    }

    return data as UserPreferenceDto[];
  }

  /**
   * Creates a new user preference template
   *
   * @param command - Command object containing preference data and user_id
   * @returns Created preference as UserPreferenceDto
   * @throws ValidationError if command data is invalid
   * @throws Error if database operation fails (including UNIQUE constraint violations)
   */
  async createPreference(command: CreatePreferenceCommand): Promise<UserPreferenceDto> {
    // Validate command before database operation
    this.validateCreateCommand(command);

    // Insert into database
    const { data, error } = await this.supabase
      .from("user_preferences")
      .insert({
        user_id: command.user_id,
        name: command.name,
        people_count: command.people_count,
        budget_type: command.budget_type,
      })
      .select("id, name, people_count, budget_type")
      .single();

    if (error) {
      throw error;
    }

    return data as UserPreferenceDto;
  }

  /**
   * Retrieves a single user preference by ID
   *
   * @param id - The preference ID (UUID)
   * @param userId - The ID of the user to verify ownership
   * @returns User preference as UserPreferenceDto or null if not found
   * @throws Error if database operation fails
   */
  async getPreferenceById(id: string, userId: string): Promise<UserPreferenceDto | null> {
    const { data, error } = await this.supabase
      .from("user_preferences")
      .select("id, name, people_count, budget_type")
      .eq("id", id)
      .eq("user_id", userId)
      .single();

    // Handle "not found" case - PostgREST returns PGRST116 error code
    if (error) {
      if (error.code === "PGRST116") {
        return null;
      }
      // Any other error is unexpected and should be thrown
      console.error("Database error in getPreferenceById:", error);
      throw error;
    }

    return data as UserPreferenceDto;
  }

  /**
   * Updates an existing user preference
   *
   * @param command - Command object containing preference ID, user_id, and fields to update
   * @returns Updated preference as UserPreferenceDto or null if not found
   * @throws ValidationError if command data is invalid
   * @throws Error if database operation fails
   */
  async updatePreference(command: UpdatePreferenceCommand): Promise<UserPreferenceDto | null> {
    // Validate command before database operation
    this.validateUpdateCommand(command);

    // Build update object with only provided fields
    const updateData: Record<string, unknown> = {};
    if (command.name !== undefined) {
      updateData.name = command.name;
    }
    if (command.people_count !== undefined) {
      updateData.people_count = command.people_count;
    }
    if (command.budget_type !== undefined) {
      updateData.budget_type = command.budget_type;
    }

    // Update in database
    const { data, error } = await this.supabase
      .from("user_preferences")
      .update(updateData)
      .eq("id", command.id)
      .eq("user_id", command.user_id)
      .select("id, name, people_count, budget_type")
      .single();

    // Handle "not found" case
    if (error) {
      if (error.code === "PGRST116") {
        return null;
      }
      console.error("Database error in updatePreference:", error);
      throw error;
    }

    return data as UserPreferenceDto;
  }

  /**
   * Deletes a user preference by ID
   *
   * @param command - Command containing preference ID and user ID
   * @returns true if deleted successfully
   * @throws Error if preference not found or doesn't belong to user (returns null)
   * @throws Error if database operation fails
   */
  async deletePreference(command: DeletePreferenceCommand): Promise<boolean> {
    const { data, error } = await this.supabase
      .from("user_preferences")
      .delete()
      .eq("id", command.id)
      .eq("user_id", command.user_id)
      .select("id");

    if (error) {
      console.error("Database error in deletePreference:", error);
      throw new Error("Failed to delete preference");
    }

    // Check if any row was deleted
    if (!data || data.length === 0) {
      return false;
    }

    return true;
  }

  /**
   * Validates CreatePreferenceCommand
   *
   * @param command - Command to validate
   * @throws ValidationError if validation fails
   */
  private validateCreateCommand(command: CreatePreferenceCommand): void {
    // Validate name
    if (!command.name || command.name.trim().length === 0) {
      throw new ValidationError("Name is required", "name");
    }

    if (command.name.length > 256) {
      throw new ValidationError("Name must not exceed 256 characters", "name");
    }

    // Validate people_count (if provided)
    if (command.people_count !== undefined && command.people_count !== null) {
      if (!Number.isInteger(command.people_count) || command.people_count < 1) {
        throw new ValidationError("People count must be a positive integer (>= 1)", "people_count");
      }
    }

    // Note: budget_type is optional and can be any string, so no validation needed
  }

  /**
   * Validates UpdatePreferenceCommand
   *
   * @param command - Command to validate
   * @throws ValidationError if validation fails
   */
  private validateUpdateCommand(command: UpdatePreferenceCommand): void {
    // At least one field must be provided
    const hasName = command.name !== undefined;
    const hasPeopleCount = command.people_count !== undefined;
    const hasBudgetType = command.budget_type !== undefined;

    if (!hasName && !hasPeopleCount && !hasBudgetType) {
      throw new ValidationError("At least one field must be provided for update", "general");
    }

    // Validate name (if provided)
    if (hasName) {
      if (!command.name || command.name.trim().length === 0) {
        throw new ValidationError("Name cannot be empty", "name");
      }

      if (command.name.length > 256) {
        throw new ValidationError("Name must not exceed 256 characters", "name");
      }
    }

    // Validate people_count (if provided and not null)
    if (command.people_count !== undefined && command.people_count !== null) {
      if (!Number.isInteger(command.people_count) || command.people_count < 1) {
        throw new ValidationError("People count must be a positive integer (>= 1)", "people_count");
      }
    }

    // Note: budget_type is optional and can be any string, so no validation needed
  }
}
