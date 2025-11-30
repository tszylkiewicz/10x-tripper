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
 * Verifies that a valid session exists and returns the user ID
 * Throws AuthenticationError if session is missing or invalid
 *
 * @param supabase - Supabase client instance
 * @returns User ID from the authenticated session
 * @throws AuthenticationError if no valid session exists
 */
export async function requireAuth(supabase: SupabaseClient<Database>): Promise<string> {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error || !session) {
    throw new AuthenticationError();
  }

  return session.user.id;
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
