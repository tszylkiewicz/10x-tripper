/**
 * Zod Validation Schemas for User Preferences
 *
 * These schemas validate incoming request data for user preferences endpoints.
 */

import { z } from "zod";

/**
 * Schema for creating a user preference
 * Used in: POST /api/user/preferences
 */
export const createUserPreferenceSchema = z.object({
  name: z
    .string({
      required_error: "Name is required",
      invalid_type_error: "Name must be a string",
    })
    .trim()
    .min(1, "Name cannot be empty")
    .max(256, "Name must not exceed 256 characters"),

  people_count: z
    .number({
      invalid_type_error: "People count must be a number",
    })
    .int("People count must be an integer")
    .positive("People count must be a positive integer (>= 1)")
    .optional()
    .nullable(),

  budget_type: z
    .string({
      invalid_type_error: "Budget type must be a string",
    })
    .optional()
    .nullable(),
});

export type CreateUserPreferenceInput = z.infer<typeof createUserPreferenceSchema>;

/**
 * Schema for updating a user preference
 * Used in: PUT /api/user/preferences/:id
 *
 * All fields are optional, but at least one must be provided
 */
export const updateUserPreferenceSchema = z
  .object({
    name: z
      .string({
        invalid_type_error: "Name must be a string",
      })
      .trim()
      .min(1, "Name cannot be empty")
      .max(256, "Name must not exceed 256 characters")
      .optional(),

    people_count: z
      .number({
        invalid_type_error: "People count must be a number",
      })
      .int("People count must be an integer")
      .positive("People count must be a positive integer (>= 1)")
      .optional()
      .nullable(),

    budget_type: z
      .string({
        invalid_type_error: "Budget type must be a string",
      })
      .optional()
      .nullable(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided for update",
  });

export type UpdateUserPreferenceInput = z.infer<typeof updateUserPreferenceSchema>;
