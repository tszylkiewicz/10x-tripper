/**
 * Feature Flags Module
 *
 * Centralized feature flag management for the Tripper application.
 *
 * @example
 * // In API routes
 * import { guardFeature } from '@/features';
 *
 * @example
 * // In Astro pages
 * import { shouldRenderPage } from '@/features';
 *
 * @example
 * // In React components
 * import { useFeatureFlag } from '@/features';
 */

// Types
export type { EnvironmentName, FeatureFlagName } from "./types";

// Core functions
export { getCurrentEnvironment, isFeatureEnabled } from "./featureFlags";

// Guards
export { createFeatureDisabledResponse, guardFeature } from "./guards/apiGuard";
export { shouldRenderPage } from "./guards/pageGuard";

// React hooks
export { useFeatureFlag } from "./react/useFeatureFlag";
