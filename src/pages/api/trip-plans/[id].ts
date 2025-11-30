/**
 * /api/trip-plans/:id
 *
 * GET - Retrieves a single trip plan by ID
 * PATCH - Updates an existing trip plan (manual edits)
 * DELETE - Soft deletes a trip plan by ID
 *
 * Requires authentication.
 * Returns 404 for both non-existent plans and plans belonging to other users (security).
 */

import type { APIRoute } from "astro";
import { TripPlanService } from "../../../lib/services/tripPlan.service";
import { isValidUUID } from "../../../lib/validators/uuid.validator";
import { updateTripPlanSchema } from "../../../lib/validators/tripPlans.validator";
import { ValidationError } from "../../../errors/validation.error";
import { requireAuth, createUnauthorizedResponse } from "../../../lib/auth.utils";
import type {
  ApiSuccessResponse,
  ApiErrorResponse,
  TripPlanDto,
  DeleteTripPlanCommand,
  UpdatePlanCommand,
} from "../../../types";

export const prerender = false;

/**
 * GET handler - Retrieve a single trip plan by ID
 */
export const GET: APIRoute = async ({ params, locals }) => {
  try {
    // 1. Get user_id from authenticated session
    const userId = await requireAuth(locals.supabase);

    // 2. Extract and validate ID parameter
    const id = params.id;

    if (!id) {
      const errorResponse: ApiErrorResponse = {
        error: {
          code: "INVALID_PARAMETER",
          message: "Trip plan ID is required",
          details: {
            parameter: "id",
          },
        },
      };

      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 3. Call service to fetch trip plan
    try {
      const tripPlanService = new TripPlanService(locals.supabase);
      const tripPlan = await tripPlanService.getTripPlanById(id, userId);

      // 4. Handle not found case
      if (!tripPlan) {
        const errorResponse: ApiErrorResponse = {
          error: {
            code: "NOT_FOUND",
            message: "Trip plan not found",
          },
        };

        return new Response(JSON.stringify(errorResponse), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }

      // 5. Return success response
      const successResponse: ApiSuccessResponse<TripPlanDto> = {
        data: tripPlan,
      };

      return new Response(JSON.stringify(successResponse), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      // 6. Handle UUID validation error
      if (error instanceof Error && error.message === "Invalid UUID format") {
        const errorResponse: ApiErrorResponse = {
          error: {
            code: "INVALID_PARAMETER",
            message: "Invalid trip plan ID format",
            details: {
              parameter: "id",
              expected: "uuid",
            },
          },
        };

        return new Response(JSON.stringify(errorResponse), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Re-throw to be caught by outer catch block
      throw error;
    }
  } catch (error) {
    // 7. Handle authentication errors
    if (error instanceof Error && error.name === "AuthenticationError") {
      return createUnauthorizedResponse();
    }

    // 8. Log unexpected errors (without exposing sensitive data)
    console.error("Unexpected error in GET /api/trip-plans/:id:", {
      error: error instanceof Error ? { message: error.message, name: error.name } : error,
      timestamp: new Date().toISOString(),
    });

    // 9. Return generic server error
    const errorResponse: ApiErrorResponse = {
      error: {
        code: "INTERNAL_ERROR",
        message: "An unexpected error occurred",
      },
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

/**
 * PATCH handler - Update a trip plan by ID
 * Automatically changes source to "ai-edited" if plan_details is modified and source was "ai"
 */
export const PATCH: APIRoute = async ({ params, request, locals }) => {
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
    const validationResult = updateTripPlanSchema.safeParse(body);

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

    // 4. Get user_id from authenticated session
    const userId = await requireAuth(locals.supabase);

    // 5. Build update command
    const command: UpdatePlanCommand = {
      id,
      user_id: userId,
      ...validationResult.data,
    };

    // 6. Update trip plan using service
    const tripPlanService = new TripPlanService(locals.supabase);
    const updatedPlan = await tripPlanService.updateTripPlan(command);

    // 7. Handle not found case
    if (!updatedPlan) {
      const errorResponse: ApiErrorResponse = {
        error: {
          code: "TRIP_PLAN_NOT_FOUND",
          message: "Trip plan not found or doesn't belong to user",
        },
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 8. Return success response
    const successResponse: ApiSuccessResponse<TripPlanDto> = {
      data: updatedPlan,
    };

    return new Response(JSON.stringify(successResponse), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // 9. Handle authentication errors
    if (error instanceof Error && error.name === "AuthenticationError") {
      return createUnauthorizedResponse();
    }

    // 10. Handle validation errors
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

    // 11. Log unexpected errors (without exposing sensitive data)
    console.error("Unexpected error in PATCH /api/trip-plans/:id:", {
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
 * DELETE handler - Soft delete a trip plan by ID
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

    // 2. Get user_id from authenticated session
    const userId = await requireAuth(locals.supabase);

    // 3. Create command and execute soft deletion
    const command: DeleteTripPlanCommand = {
      id,
      user_id: userId,
    };

    const tripPlanService = new TripPlanService(locals.supabase);
    const deleted = await tripPlanService.deleteTripPlan(command);

    // 4. Handle not found case
    if (!deleted) {
      const errorResponse: ApiErrorResponse = {
        error: {
          code: "TRIP_PLAN_NOT_FOUND",
          message: "Trip plan not found",
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
    // 6. Handle authentication errors
    if (error instanceof Error && error.name === "AuthenticationError") {
      return createUnauthorizedResponse();
    }

    // 7. Log unexpected errors (without exposing sensitive data)
    console.error("Unexpected error in DELETE /api/trip-plans/:id:", {
      error: error instanceof Error ? { message: error.message, name: error.name } : error,
      timestamp: new Date().toISOString(),
    });

    // 8. Return generic server error
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
