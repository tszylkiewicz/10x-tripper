/**
 * Utility functions for OpenRouter service
 */

import type { JSONSchemaObject } from "./openrouter.types";

/**
 * Removes markdown code blocks and extracts JSON from content
 * Handles cases where model adds text before/after JSON
 */
export function cleanMarkdownCodeBlocks(content: string): string {
  // First, try to remove markdown code blocks
  let cleaned = content
    .replace(/```json\n?/g, "")
    .replace(/```\n?/g, "")
    .trim();

  // If content doesn't start with { or [, try to extract JSON
  if (!cleaned.startsWith("{") && !cleaned.startsWith("[")) {
    // Find the first { or [ and last } or ]
    const firstBrace = cleaned.indexOf("{");
    const firstBracket = cleaned.indexOf("[");
    const lastBrace = cleaned.lastIndexOf("}");
    const lastBracket = cleaned.lastIndexOf("]");

    // Determine which comes first: { or [
    let startIndex = -1;
    let endIndex = -1;

    if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
      // Object starts first
      startIndex = firstBrace;
      endIndex = lastBrace;
    } else if (firstBracket !== -1) {
      // Array starts first
      startIndex = firstBracket;
      endIndex = lastBracket;
    }

    if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
      cleaned = cleaned.substring(startIndex, endIndex + 1);
    }
  }

  return cleaned.trim();
}

/**
 * Checks if an error is retry-able based on status code or error type
 */
export function isRetryableError(error: unknown): boolean {
  // HTTP status codes that should be retried
  if (typeof error === "object" && error !== null && "status" in error && typeof error.status === "number") {
    const retryableStatuses = [429, 500, 502, 503, 504];
    return retryableStatuses.includes(error.status);
  }

  // Network errors that should be retried
  if (typeof error === "object" && error !== null && "code" in error && typeof error.code === "string") {
    const retryableCodes = ["ECONNRESET", "ETIMEDOUT", "ENOTFOUND"];
    return retryableCodes.includes(error.code);
  }

  return false;
}

/**
 * Calculates retry delay with exponential backoff
 */
export function calculateRetryDelay(baseDelay: number, attemptNumber: number): number {
  return baseDelay * Math.pow(2, attemptNumber);
}

/**
 * Validates OpenRouter configuration
 */
export function validateConfig(config: Record<string, unknown>): void {
  if (typeof config.timeout === "number" && (config.timeout < 1000 || config.timeout > 600000)) {
    throw new Error("Timeout must be between 1000ms and 600000ms");
  }

  if (typeof config.maxRetries === "number" && (config.maxRetries < 0 || config.maxRetries > 10)) {
    throw new Error("maxRetries must be between 0 and 10");
  }

  if (typeof config.temperature === "number" && (config.temperature < 0 || config.temperature > 2)) {
    throw new Error("temperature must be between 0 and 2");
  }
}

/**
 * Converts Zod schema to JSON Schema (simplified version)
 * Note: For production, consider using @sodaru/zod-to-json-schema
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function zodToJsonSchema(_: unknown): JSONSchemaObject {
  // This is a placeholder implementation
  // Use a proper library like @sodaru/zod-to-json-schema in production
  throw new Error("zodToJsonSchema not implemented. Use @sodaru/zod-to-json-schema library.");
}
