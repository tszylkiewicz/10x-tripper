/**
 * Astro Page Feature Flag Guard
 *
 * Helper for protecting Astro pages based on feature flags.
 */

import type { FeatureFlagName } from "../types";
import { isFeatureEnabled } from "../featureFlags";

/**
 * Checks if a feature is enabled for use in Astro page frontmatter.
 * Use with Astro.redirect() for disabled features.
 *
 * @param flagName - The feature flag to check
 * @param env - Optional environment object (from Astro.locals.runtime?.env)
 * @returns true if enabled, false if should redirect
 *
 * @example
 * ---
 * import { shouldRenderPage } from '@/features';
 *
 * const env = import.meta.env ?? Astro.locals.runtime?.env
 * if (!shouldRenderPage('preferences', env)) {
 *   return Astro.redirect('/404');
 * }
 * ---
 */
export function shouldRenderPage(flagName: FeatureFlagName, env?: { PUBLIC_ENV_NAME?: string }): boolean {
  return isFeatureEnabled(flagName, env);
}
