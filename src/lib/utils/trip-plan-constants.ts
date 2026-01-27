/**
 * Trip plan constants
 *
 * Shared constants and default values used across trip plan components.
 * Provides consistent defaults for new activities, etc.
 */

import type { ActivityDto } from "../../types";

/**
 * Empty activity template
 * Used as default when creating new activities
 */
export const EMPTY_ACTIVITY: ActivityDto = {
  time: "09:00",
  title: "",
  description: "",
  location: "",
};

/**
 * Default activity time for new activities
 */
export const DEFAULT_ACTIVITY_TIME = "09:00";

/**
 * Maximum title length for activities
 */
export const MAX_ACTIVITY_TITLE_LENGTH = 200;

/**
 * Minimum number of activities per day
 * Business rule: cannot delete the last activity
 */
export const MIN_ACTIVITIES_PER_DAY = 1;

/**
 * Maximum number of days per trip plan
 * Business rule: trip plans cannot exceed 30 days
 */
export const MAX_DAYS_PER_PLAN = 30;

/**
 * Common activity categories
 * Used for suggestions/autocomplete in UI
 */
export const ACTIVITY_CATEGORIES = [
  "Zwiedzanie",
  "Jedzenie",
  "Transport",
  "Zakupy",
  "Rozrywka",
  "Sport i rekreacja",
  "Kultura",
  "Przyroda",
  "Relaks",
] as const;

/**
 * Time format regex for validation
 */
export const TIME_FORMAT_REGEX = /^\d{2}:\d{2}$/;

/**
 * Placeholder texts for form fields
 */
export const PLACEHOLDERS = {
  activity: {
    title: "Nazwa aktywności",
    description: "Opis aktywności",
    location: "Adres lub nazwa miejsca",
    duration: "np. 2 godziny",
    category: "np. Zwiedzanie, Jedzenie, Transport",
  },
} as const;

/**
 * Error messages for validation
 */
export const ERROR_MESSAGES = {
  activity: {
    timeRequired: "Godzina jest wymagana",
    timeInvalidFormat: "Nieprawidłowy format (HH:MM)",
    titleRequired: "Tytuł jest wymagany",
    titleTooLong: "Tytuł może mieć max 200 znaków",
    descriptionRequired: "Opis jest wymagany",
    locationRequired: "Lokalizacja jest wymagana",
    costNegative: "Koszt musi być >= 0",
  },
  day: {
    cannotDeleteLastActivity: "Nie można usunąć ostatniej aktywności",
  },
} as const;
