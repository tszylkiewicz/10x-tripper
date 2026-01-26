/**
 * Date formatting utilities
 *
 * Simple utility functions for formatting dates in trip plan components.
 */

/**
 * Formats a date string to a localized format
 * @param dateString - Date in YYYY-MM-DD format
 * @returns Formatted date string (e.g., "1 czerwca 2025")
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("pl-PL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
