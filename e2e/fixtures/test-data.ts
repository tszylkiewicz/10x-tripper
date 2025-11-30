/**
 * Test data fixtures for E2E tests
 */

export const TRIP_PLAN_DATA = {
  valid: {
    destination: "Paryż, Francja",
    startDate: "2026-06-10",
    endDate: "2026-06-12",
    peopleCount: 2,
    budget: "medium" as const,
    preferences: "Zwiedzanie zabytków, lokalna kuchnia",
  },
  shortTrip: {
    destination: "Kraków, Polska",
    startDate: "2026-07-15",
    endDate: "2026-07-17",
    peopleCount: 1,
    budget: "low" as const,
    preferences: "Historia, muzea",
  },
} as const;

export const USER_PREFERENCE_DATA = {
  cultural: {
    name: "Wycieczki kulturalne",
    preferences: {
      activityTypes: ["museums", "historical-sites", "architecture"],
      budgetPreference: "medium",
      pacePreference: "relaxed",
    },
  },
  adventure: {
    name: "Przygodowe",
    preferences: {
      activityTypes: ["hiking", "water-sports", "outdoor"],
      budgetPreference: "high",
      pacePreference: "active",
    },
  },
} as const;
