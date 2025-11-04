/**
 * GET /api/user/preferences/:id
 * Retrieves a single user preference template by ID.
 *
 * PUT /api/user/preferences/:id
 * Updates a single user preference template by ID.
 *
 * DELETE /api/user/preferences/:id
 * Deletes a single user preference template by ID.
 *
 * Requires authentication (to be added later).
 */

import type { APIRoute } from "astro";
import { UserPreferencesService } from "../../../../lib/services/userPreferences.service";
import { isValidUUID } from "../../../../lib/validators/uuid.validator";
import { updateUserPreferenceSchema } from "../../../../lib/validators/preferences.validator";
import { ValidationError } from "../../../../errors/validation.error";
import type {
  ApiSuccessResponse,
  ApiErrorResponse,
  UserPreferenceDto,
  DeletePreferenceCommand,
  UpdatePreferenceCommand,
} from "../../../../types";

export const prerender = false;

/**
 * GET handler - Retrieve a single user preference by ID
 */
export const GET: APIRoute = async ({ params, locals }) => {
  try {
    // 1. Extract and validate ID parameter
    const id = params.id;

    if (!id || !isValidUUID(id)) {
      const errorResponse: ApiErrorResponse = {
        error: {
          code: "INVALID_UUID",
          message: "The provided ID is not a valid UUID format",
          details: { field: "id", value: id },
        },
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 2. TODO: Get user_id from authenticated session
    // For now, using a placeholder - will be replaced with actual auth
    const userId = "20eaee6f-d503-41d9-8ce9-4219f2c06533";

    // 3. Fetch preference from database using service
    const preferencesService = new UserPreferencesService(locals.supabase);
    const preference = await preferencesService.getPreferenceById(id, userId);

    // 4. Handle not found case
    if (!preference) {
      const errorResponse: ApiErrorResponse = {
        error: {
          code: "PREFERENCE_NOT_FOUND",
          message: "Preference not found or doesn't belong to user",
        },
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 5. Return success response
    const successResponse: ApiSuccessResponse<UserPreferenceDto> = {
      data: preference,
    };

    return new Response(JSON.stringify(successResponse), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // 6. Log unexpected errors (without exposing sensitive data)
    console.error("Unexpected error in GET /api/user/preferences/:id:", {
      error: error instanceof Error ? { message: error.message, name: error.name } : error,
      timestamp: new Date().toISOString(),
    });

    // 7. Return generic server error
    const errorResponse: ApiErrorResponse = {
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "An unexpected error occurred while processing your request",
      },
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

/**
 * PUT handler - Update a single user preference by ID
 */
export const PUT: APIRoute = async ({ params, request, locals }) => {
  try {
    // 1. Extract and validate ID parameter
    const id = params.id;

    if (!id || !isValidUUID(id)) {
      const errorResponse: ApiErrorResponse = {
        error: {
          code: "INVALID_UUID",
          message: "The provided ID is not a valid UUID format",
          details: { field: "id", value: id },
        },
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 2. Parse and validate request body
    let body;
    try {
      body = await request.json();
    } catch {
      const errorResponse: ApiErrorResponse = {
        error: {
          code: "INVALID_JSON",
          message: "Request body must be valid JSON",
        },
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 3. Validate input with Zod schema
    const validationResult = updateUserPreferenceSchema.safeParse(body);

    if (!validationResult.success) {
      const errorResponse: ApiErrorResponse = {
        error: {
          code: "VALIDATION_ERROR",
          message: "Input validation failed",
          details: validationResult.error.flatten().fieldErrors,
        },
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 4. TODO: Get user_id from authenticated session
    // For now, using a placeholder - will be replaced with actual auth
    const userId = "20eaee6f-d503-41d9-8ce9-4219f2c06533";

    // 5. Build update command
    const command: UpdatePreferenceCommand = {
      id,
      user_id: userId,
      ...validationResult.data,
    };

    // 6. Update preference using service
    const preferencesService = new UserPreferencesService(locals.supabase);
    const updatedPreference = await preferencesService.updatePreference(command);

    // 7. Handle not found case
    if (!updatedPreference) {
      const errorResponse: ApiErrorResponse = {
        error: {
          code: "PREFERENCE_NOT_FOUND",
          message: "Preference not found",
        },
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 8. Return success response
    const successResponse: ApiSuccessResponse<UserPreferenceDto> = {
      data: updatedPreference,
    };

    return new Response(JSON.stringify(successResponse), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // 9. Handle validation errors
    if (error instanceof ValidationError) {
      const errorResponse: ApiErrorResponse = {
        error: {
          code: "VALIDATION_ERROR",
          message: error.message,
          details: { field: error.field },
        },
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 10. Handle database errors (e.g., unique constraint violation)
    if (error && typeof error === "object" && "code" in error) {
      const dbError = error as { code: string; message: string };

      // Handle unique constraint violation (duplicate name)
      if (dbError.code === "23505") {
        const errorResponse: ApiErrorResponse = {
          error: {
            code: "DUPLICATE_NAME",
            message: "Preferencja o tej nazwie już istnieje",
            details: { field: "name" },
          },
        };
        return new Response(JSON.stringify(errorResponse), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    // 11. Log unexpected errors (without exposing sensitive data)
    console.error("Unexpected error in PUT /api/user/preferences/:id:", {
      error: error instanceof Error ? { message: error.message, name: error.name } : error,
      timestamp: new Date().toISOString(),
    });

    // 12. Return generic server error
    const errorResponse: ApiErrorResponse = {
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "An unexpected error occurred while processing your request",
      },
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

/**
 * DELETE handler - Delete a single user preference by ID
 */
export const DELETE: APIRoute = async ({ params, locals }) => {
  try {
    // 1. Extract and validate ID parameter
    const id = params.id;

    if (!id || !isValidUUID(id)) {
      const errorResponse: ApiErrorResponse = {
        error: {
          code: "INVALID_UUID",
          message: "The provided ID is not a valid UUID format",
          details: { field: "id", value: id },
        },
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 2. TODO: Get user_id from authenticated session
    // For now, using a placeholder - will be replaced with actual auth
    const userId = "20eaee6f-d503-41d9-8ce9-4219f2c06533";

    // 3. Create command and execute deletion
    const command: DeletePreferenceCommand = {
      id,
      user_id: userId,
    };

    const preferencesService = new UserPreferencesService(locals.supabase);
    const deleted = await preferencesService.deletePreference(command);

    // 4. Handle not found case
    if (!deleted) {
      const errorResponse: ApiErrorResponse = {
        error: {
          code: "PREFERENCE_NOT_FOUND",
          message: "Preference not found",
        },
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 5. Return success response (204 No Content)
    return new Response(null, {
      status: 204,
    });
  } catch (error) {
    // 6. Log unexpected errors (without exposing sensitive data)
    console.error("Unexpected error in DELETE /api/user/preferences/:id:", {
      error: error instanceof Error ? { message: error.message, name: error.name } : error,
      timestamp: new Date().toISOString(),
    });

    // 7. Return generic server error
    const errorResponse: ApiErrorResponse = {
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "An unexpected error occurred while processing your request",
      },
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
