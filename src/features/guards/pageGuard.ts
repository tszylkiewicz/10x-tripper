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
 * @returns true if enabled, false if should redirect
 *
 * @example
 * ---
 * import { shouldRenderPage } from '@/features';
 *
 * if (!shouldRenderPage('preferences')) {
 *   return Astro.redirect('/404');
 * }
 * ---
 */
export function shouldRenderPage(flagName: FeatureFlagName): boolean {
  return isFeatureEnabled(flagName);
}
