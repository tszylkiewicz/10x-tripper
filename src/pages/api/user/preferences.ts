/**
 * GET /api/user/preferences
 * Retrieves all user preference templates for the authenticated user.
 *
 * POST /api/user/preferences
 * Creates a new user preference template.
 *
 * Requires authentication.
 */

import type { APIRoute } from "astro";
import { ZodError } from "zod";
import { UserPreferencesService } from "@/lib/services/userPreferences.service.ts";
import { createUserPreferenceSchema } from "@/lib/validators/preferences.validator.ts";
import { ValidationError } from "@/errors/validation.error.ts";
import { createUnauthorizedResponse, requireAuth } from "@/lib/auth.utils.ts";
import { guardFeature } from "@/features";
import { logger } from "@/lib/utils/logger.ts";
import type { ApiErrorResponse, ApiSuccessResponse, UserPreferenceDto } from "@/types.ts";

export const prerender = false;

/**
 * GET handler - Retrieve all user preferences
 */
export const GET: APIRoute = async ({ locals }) => {
  // Check feature flag
  const guardResponse = guardFeature("preferences");
  if (guardResponse) return guardResponse;

  try {
    // Get user_id from authenticated session
    const userId = await requireAuth(locals.supabase);

    // Fetch preferences using service
    const preferencesService = new UserPreferencesService(locals.supabase);
    const preferences = await preferencesService.getPreferences(userId);

    // Return success response
    const successResponse: ApiSuccessResponse<UserPreferenceDto[]> = {
      data: preferences,
    };

    return new Response(JSON.stringify(successResponse), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Handle authentication errors
    if (error instanceof Error && error.name === "AuthenticationError") {
      return createUnauthorizedResponse();
    }

    // Log unexpected errors (without exposing sensitive data)
    logger.error("Unexpected error in GET /api/user/preferences:", {
      error: error instanceof Error ? { message: error.message, name: error.name } : error,
      timestamp: new Date().toISOString(),
    });

    // Return generic server error
    const errorResponse: ApiErrorResponse = {
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "An unexpected error occurred. Please try again later.",
        details: { timestamp: new Date().toISOString() },
      },
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

export const POST: APIRoute = async ({ request, locals }) => {
  // Check feature flag
  const guardResponse = guardFeature("preferences");
  if (guardResponse) return guardResponse;

  try {
    // 1. Parse request body
    let body: unknown;

    try {
      body = await request.json();
    } catch {
      const errorResponse: ApiErrorResponse = {
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid JSON in request body",
        },
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 2. Validate request body with Zod
    let validatedData;

    try {
      validatedData = createUserPreferenceSchema.parse(body);
    } catch (e) {
      if (e instanceof ZodError) {
        const errorResponse: ApiErrorResponse = {
          error: {
            code: "VALIDATION_ERROR",
            message: "Validation failed",
            details: e.errors.reduce(
              (acc, err) => {
                const field = err.path.join(".");
                acc[field] = err.message;
                return acc;
              },
              {} as Record<string, string>,
            ),
          },
        };
        return new Response(JSON.stringify(errorResponse), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }
      throw e;
    }

    // 3. Get user_id from authenticated session
    const userId = await requireAuth(locals.supabase);

    // 4. Create command object
    const command = {
      user_id: userId,
      name: validatedData.name,
      people_count: validatedData.people_count ?? null,
      budget_type: validatedData.budget_type ?? null,
    };

    // 5. Call service to create preference
    const preferencesService = new UserPreferencesService(locals.supabase);
    const preference = await preferencesService.createPreference(command);

    // 6. Return success response
    const successResponse: ApiSuccessResponse<UserPreferenceDto> = {
      data: preference,
    };

    return new Response(JSON.stringify(successResponse), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // 7. Handle authentication errors
    if (error instanceof Error && error.name === "AuthenticationError") {
      return createUnauthorizedResponse();
    }

    // 8. Handle service-level ValidationError
    if (error instanceof ValidationError) {
      const errorResponse: ApiErrorResponse = {
        error: {
          code: "VALIDATION_ERROR",
          message: error.message,
          details: error.field ? { [error.field]: error.message } : undefined,
        },
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 9. Handle UNIQUE constraint violation (PostgreSQL error code 23505)
    if (typeof error === "object" && error !== null && "code" in error && error.code === "23505") {
      const errorResponse: ApiErrorResponse = {
        error: {
          code: "DUPLICATE_NAME",
          message: "A preference with this name already exists",
        },
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 10. Log unexpected errors (without exposing sensitive data)
    logger.error("Unexpected error in POST /api/user/preferences:", {
      error: error instanceof Error ? { message: error.message, name: error.name } : error,
      timestamp: new Date().toISOString(),
    });

    // 11. Return generic server error
    const errorResponse: ApiErrorResponse = {
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "An unexpected error occurred",
      },
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
