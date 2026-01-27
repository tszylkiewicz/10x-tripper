/**
 * Date calculation utilities for trip planning
 *
 * These functions handle date arithmetic and range calculations
 * for trip plans, ensuring consistent date handling across the application.
 *
 * All dates are expected in YYYY-MM-DD format (ISO 8601 date format).
 */

/**
 * Calculates the number of days in a date range (inclusive)
 *
 * @param startDate - Start date in YYYY-MM-DD format
 * @param endDate - End date in YYYY-MM-DD format
 * @returns Number of days between start and end (inclusive), e.g., 2025-02-01 to 2025-02-03 = 3 days
 *
 * @example
 * calculateDateRange("2025-02-01", "2025-02-03") // Returns 3
 * calculateDateRange("2025-02-01", "2025-02-01") // Returns 1 (same day)
 */
export function calculateDateRange(startDate: string, endDate: string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);

  // Calculate difference in milliseconds
  const diffMs = end.getTime() - start.getTime();

  // Convert to days and add 1 to make it inclusive (both start and end day count)
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  return diffDays + 1;
}

/**
 * Adds a specified number of days to a date
 *
 * @param dateString - Date in YYYY-MM-DD format
 * @param days - Number of days to add (can be negative to subtract)
 * @returns New date in YYYY-MM-DD format
 *
 * @example
 * addDays("2025-02-01", 5) // Returns "2025-02-06"
 * addDays("2025-02-01", -1) // Returns "2025-01-31"
 * addDays("2025-02-28", 1) // Returns "2025-03-01" (handles month boundaries)
 */
export function addDays(dateString: string, days: number): string {
  const date = new Date(dateString);

  // Add days to the date
  date.setDate(date.getDate() + days);

  // Format back to YYYY-MM-DD
  return formatToISODate(date);
}

/**
 * Calculates the date for a specific day number in a trip
 *
 * @param startDate - Trip start date in YYYY-MM-DD format
 * @param dayNumber - Day number (1-based, where 1 = first day)
 * @returns Date in YYYY-MM-DD format for the specified day
 *
 * @example
 * calculateDayDate("2025-02-01", 1) // Returns "2025-02-01" (first day)
 * calculateDayDate("2025-02-01", 3) // Returns "2025-02-03" (third day)
 * calculateDayDate("2025-02-01", 5) // Returns "2025-02-05"
 */
export function calculateDayDate(startDate: string, dayNumber: number): string {
  // Day number is 1-based, so subtract 1 to get days to add
  const daysToAdd = dayNumber - 1;

  return addDays(startDate, daysToAdd);
}

/**
 * Formats a Date object to YYYY-MM-DD string
 *
 * @param date - Date object to format
 * @returns Date string in YYYY-MM-DD format
 *
 * @internal
 */
function formatToISODate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

/**
 * Checks if a date range exceeds the maximum allowed days
 *
 * @param startDate - Start date in YYYY-MM-DD format
 * @param endDate - End date in YYYY-MM-DD format
 * @param maxDays - Maximum allowed days (default: 30)
 * @returns True if the range is within the limit, false otherwise
 *
 * @example
 * isWithinMaxDays("2025-02-01", "2025-02-15", 30) // Returns true (15 days)
 * isWithinMaxDays("2025-02-01", "2025-03-15", 30) // Returns false (43 days)
 */
export function isWithinMaxDays(startDate: string, endDate: string, maxDays = 30): boolean {
  const range = calculateDateRange(startDate, endDate);
  return range <= maxDays;
}

/**
 * Gets the date of the last day in a trip plan
 *
 * @param startDate - Trip start date in YYYY-MM-DD format
 * @param totalDays - Total number of days in the plan
 * @returns Date of the last day in YYYY-MM-DD format
 *
 * @example
 * getLastDayDate("2025-02-01", 5) // Returns "2025-02-05"
 * getLastDayDate("2025-02-28", 3) // Returns "2025-03-02"
 */
export function getLastDayDate(startDate: string, totalDays: number): string {
  return calculateDayDate(startDate, totalDays);
}

/**
 * Validates that end date is not before start date
 *
 * @param startDate - Start date in YYYY-MM-DD format
 * @param endDate - End date in YYYY-MM-DD format
 * @returns True if end date is on or after start date
 *
 * @example
 * isValidDateRange("2025-02-01", "2025-02-05") // Returns true
 * isValidDateRange("2025-02-05", "2025-02-01") // Returns false
 */
export function isValidDateRange(startDate: string, endDate: string): boolean {
  const start = new Date(startDate);
  const end = new Date(endDate);

  return end >= start;
}
