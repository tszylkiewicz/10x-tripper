/**
 * GET /api/user/preferences
 * Retrieves all user preference templates for the authenticated user.
 *
 * POST /api/user/preferences
 * Creates a new user preference template.
 *
 * Requires authentication (to be added later).
 */

import type { APIRoute } from "astro";
import { ZodError } from "zod";
import { UserPreferencesService } from "../../../lib/services/userPreferences.service";
import { createUserPreferenceSchema } from "../../../lib/validators/preferences.validator";
import { ValidationError } from "../../../errors/validation.error";
import type { ApiSuccessResponse, ApiErrorResponse, UserPreferenceDto } from "../../../types";

export const prerender = false;

/**
 * GET handler - Retrieve all user preferences
 */
export const GET: APIRoute = async ({ locals }) => {
  try {
    // TODO: Get user_id from authenticated session
    // For now, using a placeholder - will be replaced with actual auth
    const userId = "20eaee6f-d503-41d9-8ce9-4219f2c06533";

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
    // Log unexpected errors (without exposing sensitive data)
    console.error("Unexpected error in GET /api/user/preferences:", {
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
  try {
    // 1. Parse request body
    let body: unknown;

    try {
      body = await request.json();
    } catch (e) {
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
              {} as Record<string, string>
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

    // 3. TODO: Get user_id from authenticated session
    // For now, using a placeholder - will be replaced with actual auth
    const userId = "20eaee6f-d503-41d9-8ce9-4219f2c06533";

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
    // 7. Handle service-level ValidationError
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

    // 8. Handle UNIQUE constraint violation (PostgreSQL error code 23505)
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

    // 9. Log unexpected errors (without exposing sensitive data)
    console.error("Unexpected error in POST /api/user/preferences:", {
      error: error instanceof Error ? { message: error.message, name: error.name } : error,
      timestamp: new Date().toISOString(),
    });

    // 10. Return generic server error
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
