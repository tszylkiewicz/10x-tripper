/**
 * Test data fixtures for preferences E2E tests
 */

/**
 * Generates unique test data with timestamp to avoid conflicts in parallel test runs
 * Each test should call this function to get fresh, unique test data
 */
export function generatePreferencesTestData() {
  const timestamp = Date.now();

  return {
    /**
     * Valid preference with all fields populated
     */
    valid: {
      name: `Wakacje rodzinne ${timestamp}`,
      people_count: "4",
      budget_type: "medium" as const,
    },
    /**
     * Minimal preference with only required name field
     */
    minimal: {
      name: `Samotna podróż ${timestamp}`,
      people_count: "",
      budget_type: "none" as const,
    },
  };
}

/**
 * Expected budget type labels in UI (Polish)
 */
export const EXPECTED_BUDGET_LABELS = {
  none: "Nie określono",
  low: "Niski",
  medium: "Średni",
  high: "Wysoki",
} as const;
