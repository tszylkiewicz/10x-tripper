import type { APIRoute } from "astro";
import type { ApiSuccessResponse, ApiErrorResponse } from "@types";
import { logger } from "@lib/utils/logger";

export const prerender = false;

/**
 * POST /api/auth/signout
 *
 * Signs out the current user and removes authentication cookies.
 *
 * Success response (200):
 * - data: { success: true }
 *
 * Error responses:
 * - 500: Internal server error
 */
export const POST: APIRoute = async ({ locals }) => {
  try {
    // Use Supabase client from middleware
    const supabase = locals.supabase;

    // Call Supabase signOut (automatically removes cookies)
    const { error } = await supabase.auth.signOut();

    if (error) {
      logger.error("Signout error:", error);
      const errorResponse: ApiErrorResponse = {
        error: {
          code: "SIGNOUT_ERROR",
          message: "Wystąpił błąd podczas wylogowywania",
        },
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const successResponse: ApiSuccessResponse<{ success: boolean }> = {
      data: { success: true },
    };

    return new Response(JSON.stringify(successResponse), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    logger.error("Signout error:", error);
    const errorResponse: ApiErrorResponse = {
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Wystąpił błąd podczas wylogowywania",
      },
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
