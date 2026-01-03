/**
 * Authentication Utility Functions
 *
 * Helper functions for authentication-related operations.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/db/database.types";
import type { ApiErrorResponse } from "@/types";
import { AuthenticationError } from "@/errors/auth.error";

/**
 * Verifies that a valid user exists and returns the user ID
 * Throws AuthenticationError if user is missing or invalid
 *
 * Uses getUser() instead of getSession() for security.
 * getUser() authenticates the data by contacting the Supabase Auth server,
 * while getSession() only reads from cookies which could be tampered with.
 *
 * @param supabase - Supabase client instance
 * @returns User ID from the authenticated user
 * @throws AuthenticationError if no valid user exists
 */
export async function requireAuth(supabase: SupabaseClient<Database>): Promise<string> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new AuthenticationError();
  }

  return user.id;
}

/**
 * Creates a standardized 401 Unauthorized response
 *
 * @returns Response object with 401 status and error details
 */
export function createUnauthorizedResponse(): Response {
  const errorResponse: ApiErrorResponse = {
    error: {
      code: "UNAUTHORIZED",
      message: "Authentication required",
    },
  };

  return new Response(JSON.stringify(errorResponse), {
    status: 401,
    headers: { "Content-Type": "application/json" },
  });
}
