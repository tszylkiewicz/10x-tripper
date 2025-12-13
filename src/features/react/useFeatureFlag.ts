/**
 * React Hook for Feature Flags
 *
 * Provides hooks for checking feature flags in React components.
 */

import type { FeatureFlagName } from "../types";
import { isFeatureEnabled } from "../featureFlags";

/**
 * Hook to check if a specific feature is enabled.
 *
 * @param flagName - The feature flag to check
 * @returns boolean indicating if the feature is enabled
 *
 * @example
 * function NavbarContent() {
 *   const preferencesEnabled = useFeatureFlag('preferences');
 *
 *   return (
 *     <nav>
 *       {preferencesEnabled && <a href="/preferences">Preferencje</a>}
 *     </nav>
 *   );
 * }
 */
export function useFeatureFlag(flagName: FeatureFlagName): boolean {
  return isFeatureEnabled(flagName);
}
