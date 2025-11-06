/**
 * Zod Validation Schemas for Trip Plans
 *
 * These schemas validate incoming request data for trip plans endpoints.
 */

import { z } from "zod";
import type { GenerateTripPlanRequestDto, GeneratePlanCommand } from "../../types";

// UUID v4 regex for optional generation_id
const UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Schema for a single activity within a day's itinerary
 */
const activitySchema = z.object({
  time: z.string().min(1, "Activity time is required"),
  title: z.string().min(1, "Activity title is required"),
  description: z.string().min(1, "Activity description is required"),
  location: z.string().min(1, "Activity location is required"),
  estimated_cost: z.number().nonnegative("Estimated cost must be non-negative").optional(),
  duration: z.string().optional(),
  category: z.string().optional(),
});

/**
 * Schema for a single day in the trip plan
 */
const daySchema = z.object({
  day: z.number().int().positive("Day number must be positive"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  activities: z.array(activitySchema).min(1, "Each day must have at least one activity"),
});

/**
 * Schema for accommodation details
 */
const accommodationSchema = z.object({
  name: z.string().min(1, "Accommodation name is required"),
  address: z.string().min(1, "Accommodation address is required"),
  check_in: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Check-in must be in YYYY-MM-DD format"),
  check_out: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Check-out must be in YYYY-MM-DD format"),
  estimated_cost: z.number().nonnegative("Estimated cost must be non-negative").optional(),
  booking_url: z.string().url("Booking URL must be a valid URL").optional(),
});

/**
 * Schema for plan_details JSONB structure
 *
 * TODO: Post-MVP - Add size limits for performance:
 * - Max 30 days per plan
 * - Max 20 activities per day
 */
const planDetailsSchema = z.object({
  days: z.array(daySchema).min(1, "Plan must contain at least one day"),
  accommodation: accommodationSchema.optional(),
  notes: z.string().optional(),
  total_estimated_cost: z.number().nonnegative("Total estimated cost must be non-negative").optional(),
  accepted_at: z.string().optional(),
});

/**
 * Schema for accepting a trip plan (POST /api/trip-plans)
 * Used when the user accepts a generated plan (with or without edits)
 */
export const acceptTripPlanSchema = z
  .object({
    generation_id: z.string().regex(UUID_V4_REGEX, "Invalid UUID format for generation_id").optional().nullable(),

    destination: z
      .string({
        required_error: "Destination is required",
        invalid_type_error: "Destination must be a string",
      })
      .trim()
      .min(1, "Destination cannot be empty"),

    start_date: z
      .string({
        required_error: "Start date is required",
        invalid_type_error: "Start date must be a string",
      })
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Start date must be in YYYY-MM-DD format"),

    end_date: z
      .string({
        required_error: "End date is required",
        invalid_type_error: "End date must be a string",
      })
      .regex(/^\d{4}-\d{2}-\d{2}$/, "End date must be in YYYY-MM-DD format"),

    people_count: z
      .number({
        required_error: "People count is required",
        invalid_type_error: "People count must be a number",
      })
      .int("People count must be an integer")
      .positive("People count must be at least 1"),

    budget_type: z
      .string({
        required_error: "Budget type is required",
        invalid_type_error: "Budget type must be a string",
      })
      .trim()
      .min(1, "Budget type cannot be empty"),

    plan_details: planDetailsSchema,

    source: z.enum(["ai", "ai-edited"], {
      errorMap: () => ({ message: "Source must be either 'ai' or 'ai-edited'" }),
    }),
  })
  .refine(
    (data) => {
      // Validate: end_date >= start_date
      const start = new Date(data.start_date);
      const end = new Date(data.end_date);
      return end >= start;
    },
    {
      message: "End date must be on or after start date",
      path: ["end_date"],
    }
  );

export type AcceptTripPlanInput = z.infer<typeof acceptTripPlanSchema>;

/**
 * Schema for updating a trip plan (PATCH /api/trip-plans/:id)
 * All fields are optional - partial updates supported
 */
export const updateTripPlanSchema = z
  .object({
    destination: z
      .string({
        invalid_type_error: "Destination must be a string",
      })
      .trim()
      .min(1, "Destination cannot be empty")
      .optional(),

    start_date: z
      .string({
        invalid_type_error: "Start date must be a string",
      })
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Start date must be in YYYY-MM-DD format")
      .optional(),

    end_date: z
      .string({
        invalid_type_error: "End date must be a string",
      })
      .regex(/^\d{4}-\d{2}-\d{2}$/, "End date must be in YYYY-MM-DD format")
      .optional(),

    people_count: z
      .number({
        invalid_type_error: "People count must be a number",
      })
      .int("People count must be an integer")
      .positive("People count must be at least 1")
      .optional(),

    budget_type: z
      .string({
        invalid_type_error: "Budget type must be a string",
      })
      .trim()
      .min(1, "Budget type cannot be empty")
      .optional(),

    plan_details: planDetailsSchema.optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided for update",
  })
  .refine(
    (data) => {
      // If both dates provided, validate end_date >= start_date
      if (data.start_date && data.end_date) {
        const start = new Date(data.start_date);
        const end = new Date(data.end_date);
        return end >= start;
      }
      return true;
    },
    {
      message: "End date must be on or after start date",
      path: ["end_date"],
    }
  );

export type UpdateTripPlanInput = z.infer<typeof updateTripPlanSchema>;

/**
 * Schema for trip plan notes/preferences (used in generation)
 */
const tripPlanNotesSchema = z
  .object({
    transport: z.string().optional(),
    todo: z.string().max(1000, "Todo description is too long").optional(),
    avoid: z.string().max(1000, "Avoid description is too long").optional(),
  })
  .catchall(z.string());

/**
 * Schema for generating a trip plan (POST /api/trip-plans/generate)
 * Used when requesting AI to generate a new trip plan
 */
export const generateTripPlanSchema = z
  .object({
    destination: z
      .string({
        required_error: "Destination is required",
        invalid_type_error: "Destination must be a string",
      })
      .trim()
      .min(1, "Destination cannot be empty"),

    start_date: z
      .string({
        required_error: "Start date is required",
        invalid_type_error: "Start date must be a string",
      })
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Start date must be in YYYY-MM-DD format")
      .refine((date) => {
        const startDate = new Date(date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return startDate >= today;
      }, "Start date cannot be in the past"),

    end_date: z
      .string({
        required_error: "End date is required",
        invalid_type_error: "End date must be a string",
      })
      .regex(/^\d{4}-\d{2}-\d{2}$/, "End date must be in YYYY-MM-DD format"),

    people_count: z
      .number({
        required_error: "People count is required",
        invalid_type_error: "People count must be a number",
      })
      .int("People count must be an integer")
      .positive("People count must be at least 1"),

    budget_type: z
      .string({
        required_error: "Budget type is required",
        invalid_type_error: "Budget type must be a string",
      })
      .trim()
      .min(1, "Budget type cannot be empty"),

    notes: tripPlanNotesSchema.optional(),
  })
  .refine(
    (data) => {
      // Validate: end_date >= start_date
      const start = new Date(data.start_date);
      const end = new Date(data.end_date);
      return end >= start;
    },
    {
      message: "End date must be on or after start date",
      path: ["end_date"],
    }
  );

export type GenerateTripPlanInput = z.infer<typeof generateTripPlanSchema>;

/**
 * Validates the request body for generating a trip plan
 * @param body - The request body to validate
 * @returns Validated GenerateTripPlanRequestDto
 * @throws ZodError if validation fails
 */
export function validateGenerateTripPlanRequest(body: unknown): GenerateTripPlanRequestDto {
  return generateTripPlanSchema.parse(body);
}

/**
 * Creates a GeneratePlanCommand from validated DTO and user ID
 * @param dto - Validated GenerateTripPlanRequestDto
 * @param userId - Authenticated user's ID
 * @returns GeneratePlanCommand ready for service layer
 */
export function createGeneratePlanCommand(dto: GenerateTripPlanRequestDto, userId: string): GeneratePlanCommand {
  return {
    ...dto,
    user_id: userId,
  };
}
