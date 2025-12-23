/**
 * POST /api/trip-plans/generate
 * Generates a trip plan using AI based on user inputs.
 * Does NOT save to database - returns generated plan with generation_id for later acceptance.
 *
 * Requires authentication.
 * Timeout: 180 seconds
 *
 * TODO: Post-MVP improvements:
 * - Implement rate limiting (10 generations per hour per user)
 * - Add caching for similar requests (24h TTL)
 * - Implement streaming response for better UX
 * - Add A/B testing for different models/prompts
 */

import type { APIRoute } from "astro";
import { ZodError } from "zod";
import type {
  ApiErrorResponse,
  ApiSuccessResponse,
  GeneratedTripPlanDto,
  GenerateTripPlanRequestDto,
} from "@/types.ts";
import { createGeneratePlanCommand, validateGenerateTripPlanRequest } from "@/lib/validators/tripPlans.validator.ts";
import { buildMessages, generateTripPlan, messagesToPrompt, MODEL } from "@/lib/services/aiGeneration.service.ts";
import { logGenerationError, logGenerationSuccess } from "@/lib/services/planGenerationLogger.service.ts";
import { createUnauthorizedResponse, requireAuth } from "@/lib/auth.utils.ts";
import { logger } from "@/lib/utils/logger.ts";

export const prerender = false;

/**
 * POST handler - Generate trip plan using AI
 */
export const POST: APIRoute = async ({ request, locals }) => {
  const startTime = Date.now();

  try {
    // 1. Validate Content-Type
    const contentType = request.headers.get("content-type");
    if (!contentType?.includes("application/json")) {
      const errorResponse: ApiErrorResponse = {
        error: {
          code: "INVALID_CONTENT_TYPE",
          message: "Content-Type must be application/json",
        },
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 2. Parse request body
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

    // 3. Validate with Zod schema
    let validatedData: GenerateTripPlanRequestDto;
    try {
      validatedData = validateGenerateTripPlanRequest(body);
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

    // 4. Get user_id from authenticated session
    const userId = await requireAuth(locals.supabase);

    // 5. Create command object
    const command = createGeneratePlanCommand(validatedData, userId);

    // 6. Generate trip plan using AI
    let generatedPlan: GeneratedTripPlanDto;
    try {
      generatedPlan = await generateTripPlan(command);
    } catch (error: unknown) {
      const duration = Date.now() - startTime;

      // Handle timeout specifically
      if (error instanceof Error && error.name === "AbortError") {
        // Log timeout error
        if (typeof error === "object" && error !== null && "prompt" in error && typeof error.prompt === "string") {
          await logGenerationError(locals.supabase, {
            user_id: userId,
            model: MODEL,
            prompt: error.prompt,
            duration_ms: duration,
            error_message: "Generation timeout after 180 seconds",
            error_code: "GENERATION_TIMEOUT",
          });
        }

        const errorResponse: ApiErrorResponse = {
          error: {
            code: "GENERATION_TIMEOUT",
            message: "AI generation exceeded 180 second timeout",
          },
        };
        return new Response(JSON.stringify(errorResponse), {
          status: 408,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Log general AI generation error
      logger.error("AI generation failed:", {
        error: error instanceof Error ? { message: error.message, name: error.name } : error,
        userId,
        timestamp: new Date().toISOString(),
      });

      if (typeof error === "object" && error !== null && "prompt" in error && typeof error.prompt === "string") {
        const errorDuration =
          typeof error === "object" && error !== null && "duration_ms" in error && typeof error.duration_ms === "number"
            ? error.duration_ms
            : duration;
        const errorMessage = error instanceof Error ? error.message : "Unknown error";

        await logGenerationError(locals.supabase, {
          user_id: userId,
          model: MODEL,
          prompt: error.prompt,
          duration_ms: errorDuration,
          error_message: errorMessage,
          error_code: "AI_GENERATION_FAILED",
        });
      }

      const errorResponse: ApiErrorResponse = {
        error: {
          code: "AI_GENERATION_FAILED",
          message: "Failed to generate trip plan",
        },
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 7. Log success to plan_generations table and get database ID
    const duration = Date.now() - startTime;
    const messages = buildMessages(command);
    const prompt = messagesToPrompt(messages);

    let generationId: string;
    try {
      generationId = await logGenerationSuccess(locals.supabase, {
        user_id: userId,
        model: MODEL,
        prompt,
        duration_ms: duration,
      });
      logger.log("Generation logged successfully:", generationId);
    } catch (error) {
      logger.error("Failed to log generation success:", error);
      // Continue with the response even if logging fails
      // Use a fallback UUID so the user can still accept the plan
      generationId = crypto.randomUUID();
    }

    // 8. Set the database-generated ID on the plan
    generatedPlan.generation_id = generationId;

    // 9. Return success response (200 OK)
    const successResponse: ApiSuccessResponse<GeneratedTripPlanDto> = {
      data: generatedPlan,
    };

    return new Response(JSON.stringify(successResponse), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // 10. Handle authentication errors
    if (error instanceof Error && error.name === "AuthenticationError") {
      return createUnauthorizedResponse();
    }

    // 11. Handle unexpected errors
    logger.error("Unexpected error in POST /api/trip-plans/generate:", {
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
