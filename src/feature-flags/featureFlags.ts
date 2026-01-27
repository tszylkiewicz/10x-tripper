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
 * Gets the current environment from PUBLIC_ENV_NAME variable.
 * Accepts env parameter for server-side usage (from runtime.env).
 *
 * @param env - Optional environment object (from Astro.locals.runtime?.env)
 * @returns The current environment name
 */
export function getCurrentEnvironment(env?: { PUBLIC_ENV_NAME?: string }): EnvironmentName {
  const envName = env?.PUBLIC_ENV_NAME ?? import.meta.env.PUBLIC_ENV_NAME;

  if (envName && isValidEnvironment(envName)) {
    return envName;
  }

  return DEFAULT_ENVIRONMENT;
}

/**
 * Checks if a feature flag is enabled for the current environment.
 * Accepts env parameter for server-side usage (from runtime.env).
 *
 * @param flagName - The name of the feature flag to check
 * @param env - Optional environment object (from Astro.locals.runtime?.env)
 * @returns true if the feature is enabled, false otherwise
 *
 * @example
 * // Server-side (SSR)
 * import { getMergedEnv } from '@lib/utils/env';
 * const env = getMergedEnv(Astro.locals.runtime?.env, import.meta.env);
 * if (!isFeatureEnabled('preferences', env)) {
 *   return new Response(null, { status: 404 });
 * }
 *
 * @example
 * // Client-side
 * if (!isFeatureEnabled('preferences')) {
 *   return null;
 * }
 */
export function isFeatureEnabled(flagName: FeatureFlagName, env?: { PUBLIC_ENV_NAME?: string }): boolean {
  const currentEnv = getCurrentEnvironment(env);
  const envConfig = featureFlagsConfig[currentEnv];
  const flagConfig = envConfig?.[flagName];

  return flagConfig?.enabled ?? false;
}
