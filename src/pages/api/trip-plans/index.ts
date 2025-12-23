/**
 * GET /api/trip-plans
 * Retrieves all active trip plans for the authenticated user.
 * Plans are sorted by start_date ascending (nearest date first).
 * Soft-deleted plans are excluded.
 *
 * POST /api/trip-plans
 * Accept and save a generated trip plan to the database
 *
 * Requires authentication.
 *
 * TODO: Post-MVP improvements:
 * - Add rate limiting (100 requests/minute per user)
 * - Add monitoring/analytics integration (e.g., Sentry)
 * - Add business limit (10 trip plans created per day per user)
 * - Add payload size validation (max 512KB for plan_details)
 * - Add pagination for GET endpoint
 */

import type { APIRoute } from "astro";
import { ZodError } from "zod";
import { acceptTripPlanSchema } from "@/lib/validators/tripPlans.validator.ts";
import { TripPlanService } from "@/lib/services/tripPlan.service.ts";
import { ValidationError } from "@/errors/validation.error.ts";
import { createUnauthorizedResponse, requireAuth } from "@/lib/auth.utils.ts";
import { logger } from "@/lib/utils/logger.ts";
import type {
  AcceptPlanCommand,
  AcceptTripPlanDto,
  ApiErrorResponse,
  ApiSuccessResponse,
  TripPlanDto,
} from "../../../types";

export const prerender = false;

/**
 * GET handler - Retrieve all active trip plans for authenticated user
 * Returns plans sorted by start_date ASC (nearest date first)
 */
export const GET: APIRoute = async ({ locals }) => {
  try {
    // 1. Verify authentication
    const userId = await requireAuth(locals.supabase);

    // 2. Fetch trip plans using service
    const tripPlanService = new TripPlanService(locals.supabase);
    const tripPlans = await tripPlanService.getTripPlans(userId);

    // 3. Return success response
    const successResponse: ApiSuccessResponse<TripPlanDto[]> = {
      data: tripPlans,
    };

    return new Response(JSON.stringify(successResponse), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // 4. Handle authentication errors
    if (error instanceof Error && error.name === "AuthenticationError") {
      return createUnauthorizedResponse();
    }

    // 5. Handle unexpected errors
    logger.error("Unexpected error in GET /api/trip-plans:", {
      error: error instanceof Error ? { message: error.message, name: error.name } : error,
      timestamp: new Date().toISOString(),
    });

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

/**
 * POST handler - Accept and save a trip plan
 */
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // 1. Parse request body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      const errorResponse: ApiErrorResponse = {
        error: {
          code: "INVALID_JSON",
          message: "Invalid JSON in request body",
        },
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 2. Validate with Zod schema
    let validatedData: AcceptTripPlanDto;
    try {
      validatedData = acceptTripPlanSchema.parse(body);
    } catch (e) {
      if (e instanceof ZodError) {
        const fieldErrors: Record<string, string> = {};
        e.errors.forEach((err) => {
          const path = err.path.join(".");
          fieldErrors[path] = err.message;
        });

        const errorResponse: ApiErrorResponse = {
          error: {
            code: "VALIDATION_ERROR",
            message: "Validation failed",
            details: fieldErrors,
          },
        };
        return new Response(JSON.stringify(errorResponse), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }
      throw e;
    }

    // 3. Get user_id from session
    const userId = await requireAuth(locals.supabase);

    // 4. Create command object
    const command: AcceptPlanCommand = {
      ...validatedData,
      user_id: userId,
    };

    // 5. Call service to save trip plan
    const service = new TripPlanService(locals.supabase);
    const result: TripPlanDto = await service.acceptPlan(command);

    // 6. Return success response (201 Created)
    const successResponse: ApiSuccessResponse<TripPlanDto> = {
      data: result,
    };

    return new Response(JSON.stringify(successResponse), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Handle authentication errors
    if (error instanceof Error && error.name === "AuthenticationError") {
      return createUnauthorizedResponse();
    }

    // Handle ValidationError from service
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

    // Handle database foreign key violations (generation_id)
    if (error && typeof error === "object" && "code" in error) {
      if (error.code === "23503") {
        // Foreign key violation
        const errorResponse: ApiErrorResponse = {
          error: {
            code: "INVALID_GENERATION_ID",
            message: "The provided generation_id does not exist",
          },
        };
        return new Response(JSON.stringify(errorResponse), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    // Log unexpected errors
    logger.error("Unexpected error in POST /api/trip-plans:", {
      error,
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
    });

    // Return generic error response
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
