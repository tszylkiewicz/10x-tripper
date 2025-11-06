/**
 * Plan Generation Logger Service
 *
 * Service for logging AI generation attempts (both successful and failed) to the database.
 * Used for analytics, debugging, and tracking AI usage.
 */

import type { SupabaseClient } from "../../db/supabase.client";
import type { PlanGenerationInsert, PlanGenerationErrorLogInsert } from "../../types";

/**
 * Calculates SHA-256 hash of the prompt text
 * Used for deduplication and analytics purposes
 *
 * @param prompt - The prompt text to hash
 * @returns Hexadecimal string representation of the SHA-256 hash
 */
export async function calculatePromptHash(prompt: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(prompt);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Logs a successful trip plan generation to the database
 *
 * @param supabase - Supabase client instance
 * @param params - Generation metadata
 * @returns The generated plan_generations record ID (UUID)
 * @throws Error if database insert fails
 */
export async function logGenerationSuccess(
  supabase: SupabaseClient,
  params: {
    user_id: string;
    model: string;
    prompt: string;
    duration_ms: number;
  }
): Promise<string> {
  const source_text_hash = await calculatePromptHash(params.prompt);
  const source_text_length = params.prompt.length;

  const insert: PlanGenerationInsert = {
    user_id: params.user_id,
    model: params.model,
    source_text_hash,
    source_text_length,
    duration_ms: params.duration_ms,
  };

  const { data, error } = await supabase.from("plan_generations").insert(insert).select("id").single();

  if (error) {
    console.error("Failed to log generation success:", error);
    throw new Error("Failed to log generation");
  }

  return data.id;
}

/**
 * Logs a failed trip plan generation to the database
 * Used for debugging and monitoring error rates
 *
 * @param supabase - Supabase client instance
 * @param params - Error metadata
 * @throws Does not throw - errors are logged to console only to avoid cascading failures
 */
export async function logGenerationError(
  supabase: SupabaseClient,
  params: {
    user_id: string;
    model: string;
    prompt: string;
    duration_ms: number;
    error_message: string;
    error_code?: string;
  }
): Promise<void> {
  const source_text_hash = await calculatePromptHash(params.prompt);
  const source_text_length = params.prompt.length;

  const insert: PlanGenerationErrorLogInsert = {
    user_id: params.user_id,
    model: params.model,
    source_text_hash,
    source_text_length,
    duration_ms: params.duration_ms,
    error_message: params.error_message,
    error_code: params.error_code || null,
  };

  const { error } = await supabase.from("plan_generation_error_logs").insert(insert);

  if (error) {
    console.error("Failed to log generation error:", error);
    // Don't throw - this is already error handling
  }
}
