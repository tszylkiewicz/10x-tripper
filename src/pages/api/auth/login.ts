import type { APIRoute } from "astro";
import { ZodError } from "zod";
import { createSupabaseServerInstance } from "@/db/supabase.client";
import { loginSchema } from "@/lib/validators/auth.validator";
import type { ApiSuccessResponse, ApiErrorResponse } from "@/types";
import { logger } from "@/lib/utils/logger";

export const prerender = false;

/**
 * POST /api/auth/login
 *
 * Authenticates a user with email and password.
 * Sets authentication cookies on success.
 *
 * Request body:
 * - email: string
 * - password: string
 *
 * Success response (200):
 * - data: { user_id: string, email: string }
 *
 * Error responses:
 * - 400: Validation error
 * - 401: Invalid credentials or email not confirmed
 * - 500: Internal server error
 */
export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // 1. Parse request body
    const body = await request.json();

    // 2. Validate with Zod
    const validatedData = loginSchema.parse(body);

    // 3. Create Supabase client with cookie support
    const supabase = createSupabaseServerInstance({
      cookies,
      headers: request.headers,
    });

    // 4. Call Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email: validatedData.email,
      password: validatedData.password,
    });

    if (error) {
      const errorResponse: ApiErrorResponse = {
        error: {
          code: mapAuthErrorCode(error.message),
          message: mapAuthErrorMessage(error.message),
        },
      };

      return new Response(JSON.stringify(errorResponse), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 5. Cookies are automatically set by @supabase/ssr

    // 6. Success response
    const successResponse: ApiSuccessResponse<{
      user_id: string;
      email: string;
    }> = {
      data: {
        user_id: data.user.id,
        email: data.user.email || "",
      },
    };

    return new Response(JSON.stringify(successResponse), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Handle Zod validation errors
    if (error instanceof ZodError) {
      const errorResponse: ApiErrorResponse = {
        error: {
          code: "VALIDATION_ERROR",
          message: error.errors[0].message,
        },
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Generic error
    logger.error("Login error:", error);
    const errorResponse: ApiErrorResponse = {
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Wystąpił błąd podczas logowania",
      },
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

/**
 * Maps Supabase error messages to error codes
 */
function mapAuthErrorCode(supabaseError: string): string {
  if (supabaseError.includes("Invalid login credentials")) return "INVALID_CREDENTIALS";
  if (supabaseError.includes("Email not confirmed")) return "EMAIL_NOT_CONFIRMED";
  return "AUTH_ERROR";
}

/**
 * Maps Supabase error messages to user-friendly Polish messages
 */
function mapAuthErrorMessage(supabaseError: string): string {
  const errorMap: Record<string, string> = {
    "Invalid login credentials": "Nieprawidłowy email lub hasło",
    "Email not confirmed": "Potwierdź swój adres email, klikając w link wysłany na skrzynkę",
  };

  for (const [key, value] of Object.entries(errorMap)) {
    if (supabaseError.includes(key)) return value;
  }

  return "Wystąpił błąd podczas logowania";
}
