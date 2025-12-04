/**
 * Date formatting utilities
 *
 * Shared date formatting functions used across trip plan components.
 * Provides consistent Polish locale formatting.
 */

/**
 * Formats ISO date string to Polish locale display
 *
 * @param dateString - ISO date string (e.g., "2025-06-01")
 * @param options - Intl.DateTimeFormatOptions for customization
 * @returns Formatted date string in Polish locale
 *
 * @example
 * formatDate("2025-06-01")
 * // Returns: "sobota, 1 czerwca"
 *
 * formatDate("2025-06-01", { year: "numeric" })
 * // Returns: "sobota, 1 czerwca 2025"
 */
export function formatDate(
  dateString: string,
  options?: Intl.DateTimeFormatOptions
): string {
  try {
    const date = new Date(dateString);

    // Check if date is valid
    if (isNaN(date.getTime())) {
      return dateString;
    }

    // Default options: weekday, day, month
    const defaultOptions: Intl.DateTimeFormatOptions = {
      weekday: "long",
      day: "numeric",
      month: "long",
      ...options,
    };

    return date.toLocaleDateString("pl-PL", defaultOptions);
  } catch {
    // Return original string if formatting fails
    return dateString;
  }
}

/**
 * Formats ISO date string for accommodation display (without weekday)
 *
 * @param dateString - ISO date string (e.g., "2025-06-01")
 * @returns Formatted date string: "1 czerwca 2025"
 *
 * @example
 * formatAccommodationDate("2025-06-01")
 * // Returns: "1 czerwca 2025"
 */
export function formatAccommodationDate(dateString: string): string {
  return formatDate(dateString, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/**
 * Formats date range for display
 *
 * @param startDate - ISO start date string
 * @param endDate - ISO end date string
 * @returns Formatted date range string
 *
 * @example
 * formatDateRange("2025-06-01", "2025-06-03")
 * // Returns: "1 czerwca 2025 - 3 czerwca 2025"
 */
export function formatDateRange(startDate: string, endDate: string): string {
  const start = formatAccommodationDate(startDate);
  const end = formatAccommodationDate(endDate);
  return `${start} - ${end}`;
}
