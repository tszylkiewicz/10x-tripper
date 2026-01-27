/**
 * API Route Feature Flag Guard
 *
 * Helper functions for protecting API routes based on feature flags.
 */

import type { ApiErrorResponse } from "@types";
import type { FeatureFlagName } from "../types";
import { isFeatureEnabled } from "../featureFlags";

/**
 * Response to return when a feature is disabled.
 * Returns 404 to hide the existence of disabled features.
 */
export function createFeatureDisabledResponse(): Response {
  const errorResponse: ApiErrorResponse = {
    error: {
      code: "NOT_FOUND",
      message: "The requested resource was not found",
    },
  };

  return new Response(JSON.stringify(errorResponse), {
    status: 404,
    headers: { "Content-Type": "application/json" },
  });
}

/**
 * Guard function for API routes.
 * Returns a Response if the feature is disabled, null if enabled.
 *
 * @param flagName - The feature flag to check
 * @param env - Optional environment object (from Astro.locals.runtime?.env)
 * @returns Response if disabled, null if enabled
 *
 * @example
 * export const GET: APIRoute = async ({ locals }) => {
 *   const env = locals.runtime?.env ?? import.meta.env;
 *   const guardResponse = guardFeature('preferences', env);
 *   if (guardResponse) return guardResponse;
 *   // ... rest of handler
 * };
 */
export function guardFeature(flagName: FeatureFlagName, env?: Record<string, string | undefined>): Response | null {
  if (!isFeatureEnabled(flagName, env)) {
    return createFeatureDisabledResponse();
  }
  return null;
}
