/**
 * UUID Validation Utilities
 *
 * Provides validation for UUID v4 format
 */

/**
 * Regular expression for UUID v4 format validation
 * Format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
 * where x is any hexadecimal digit and y is one of 8, 9, A, or B
 */
const UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Validates if a string is a valid UUID v4
 *
 * @param uuid - String to validate
 * @returns true if valid UUID v4, false otherwise
 */
export function isValidUUID(uuid: string): boolean {
  return UUID_V4_REGEX.test(uuid);
}
