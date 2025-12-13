/**
 * Feature Flags Core Logic
 *
 * Provides the main API for checking feature flag status.
 */

import type { EnvironmentName, FeatureFlagName } from "./types";
import { DEFAULT_ENVIRONMENT, featureFlagsConfig } from "./config";

const VALID_ENVIRONMENTS: EnvironmentName[] = ["local", "integration", "prod"];

/**
 * Type guard to validate environment name.
 */
function isValidEnvironment(value: string): value is EnvironmentName {
  return VALID_ENVIRONMENTS.includes(value as EnvironmentName);
}

/**
 * Gets the current environment from ENV_NAME variable.
 * Works in both server (process.env) and client (import.meta.env) contexts.
 *
 * @returns The current environment name
 */
export function getCurrentEnvironment(): EnvironmentName {
  // Server-side (Node.js)
  if (typeof process !== "undefined" && process.env?.ENV_NAME) {
    const envName = process.env.ENV_NAME;
    if (isValidEnvironment(envName)) {
      return envName;
    }
  }

  // Client-side (Vite/Astro) - using PUBLIC_ prefix for client exposure
  if (typeof import.meta !== "undefined" && import.meta.env?.PUBLIC_ENV_NAME) {
    const envName = import.meta.env.PUBLIC_ENV_NAME;
    if (isValidEnvironment(envName)) {
      return envName;
    }
  }

  return DEFAULT_ENVIRONMENT;
}

/**
 * Checks if a feature flag is enabled for the current environment.
 *
 * @param flagName - The name of the feature flag to check
 * @returns true if the feature is enabled, false otherwise
 *
 * @example
 * if (!isFeatureEnabled('preferences')) {
 *   return new Response(null, { status: 404 });
 * }
 */
export function isFeatureEnabled(flagName: FeatureFlagName): boolean {
  const env = getCurrentEnvironment();
  const envConfig = featureFlagsConfig[env];
  const flagConfig = envConfig?.[flagName];

  return flagConfig?.enabled ?? false;
}
