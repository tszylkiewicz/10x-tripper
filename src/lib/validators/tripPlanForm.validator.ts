/**
 * Zod Validation Schema for Trip Plan Creation Form (Frontend)
 *
 * Client-side validation with Polish error messages for the trip plan form.
 * This schema is used by react-hook-form for form validation before API submission.
 */

import { z } from "zod";

/**
 * Helper function to check if a date is not in the past
 */
const isNotPastDate = (dateString: string): boolean => {
  const date = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Reset time to start of day
  return date >= today;
};

/**
 * Schema for user preferences (optional fields)
 */
const preferencesSchema = z.object({
  transport: z.string().optional(),
  todo: z.string().optional(),
  avoid: z.string().optional(),
});

/**
 * Main form validation schema for trip plan creation
 * Matches GenerateTripPlanRequestDto requirements with Polish error messages
 */
export const tripPlanFormSchema = z
  .object({
    destination: z
      .string({
        required_error: "Cel podróży jest wymagany",
        invalid_type_error: "Cel podróży musi być tekstem",
      })
      .trim()
      .min(1, "Cel podróży jest wymagany")
      .max(256, "Cel podróży może mieć maksymalnie 256 znaków"),

    start_date: z
      .string({
        required_error: "Data rozpoczęcia jest wymagana",
        invalid_type_error: "Data musi być tekstem",
      })
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Data musi być w formacie RRRR-MM-DD")
      .refine(isNotPastDate, "Data rozpoczęcia nie może być w przeszłości"),

    end_date: z
      .string({
        required_error: "Data zakończenia jest wymagana",
        invalid_type_error: "Data musi być tekstem",
      })
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Data musi być w formacie RRRR-MM-DD"),

    people_count: z
      .number({
        required_error: "Liczba osób jest wymagana",
        invalid_type_error: "Liczba osób musi być liczbą",
      })
      .int("Liczba osób musi być liczbą całkowitą")
      .min(1, "Liczba osób musi wynosić co najmniej 1")
      .max(50, "Liczba osób nie może przekraczać 50"),

    budget_type: z.enum(["low", "medium", "high"], {
      required_error: "Rodzaj budżetu jest wymagany",
      invalid_type_error: "Wybierz rodzaj budżetu",
    }),

    preferences: preferencesSchema.optional(),
  })
  .refine(
    (data) => {
      const start = new Date(data.start_date);
      const end = new Date(data.end_date);
      return end >= start;
    },
    {
      message: "Data zakończenia musi być równa lub późniejsza niż data rozpoczęcia",
      path: ["end_date"],
    }
  );

/**
 * Type inference from the schema
 */
export type TripPlanFormSchema = z.infer<typeof tripPlanFormSchema>;

/**
 * Default form values
 */
export const defaultTripPlanFormValues: Partial<TripPlanFormSchema> = {
  destination: "",
  start_date: "",
  end_date: "",
  people_count: 1,
  budget_type: undefined,
  preferences: {
    transport: "",
    todo: "",
    avoid: "",
  },
};

/**
 * Schema for activity editing (used in plan editor)
 */
export const activityEditSchema = z.object({
  time: z
    .string({
      required_error: "Czas jest wymagany",
    })
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Czas musi być w formacie GG:MM"),
  title: z
    .string({
      required_error: "Tytuł jest wymagany",
    })
    .min(1, "Tytuł jest wymagany"),
  description: z
    .string({
      required_error: "Opis jest wymagany",
    })
    .min(1, "Opis jest wymagany"),
  location: z
    .string({
      required_error: "Lokalizacja jest wymagana",
    })
    .min(1, "Lokalizacja jest wymagana"),
  estimated_cost: z.number().nonnegative("Koszt musi być nieujemny").optional(),
  duration: z.string().optional(),
  category: z.string().optional(),
});

export type ActivityEditSchema = z.infer<typeof activityEditSchema>;

/**
 * Schema for accommodation editing (used in plan editor)
 */
export const accommodationEditSchema = z
  .object({
    name: z
      .string({
        required_error: "Nazwa zakwaterowania jest wymagana",
      })
      .min(1, "Nazwa zakwaterowania jest wymagana"),
    address: z
      .string({
        required_error: "Adres jest wymagany",
      })
      .min(1, "Adres jest wymagany"),
    check_in: z
      .string({
        required_error: "Data zameldowania jest wymagana",
      })
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Data musi być w formacie RRRR-MM-DD"),
    check_out: z
      .string({
        required_error: "Data wymeldowania jest wymagana",
      })
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Data musi być w formacie RRRR-MM-DD"),
    estimated_cost: z.number().nonnegative("Koszt musi być nieujemny").optional(),
    booking_url: z.string().url("URL musi być prawidłowym adresem").optional().or(z.literal("")),
  })
  .refine(
    (data) => {
      const checkIn = new Date(data.check_in);
      const checkOut = new Date(data.check_out);
      return checkOut >= checkIn;
    },
    {
      message: "Data wymeldowania musi być późniejsza lub równa dacie zameldowania",
      path: ["check_out"],
    }
  );

export type AccommodationEditSchema = z.infer<typeof accommodationEditSchema>;
