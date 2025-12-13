/**
 * Feature Flags Configuration
 *
 * Centralized configuration for all feature flags across environments.
 * Default behavior: flags not defined are treated as disabled (false).
 */

import type { EnvironmentName, FeatureFlagsConfig } from "./types";

/**
 * Feature flag configuration per environment.
 *
 * Rules:
 * - If a flag is not defined for an environment, it defaults to disabled (false)
 * - Each flag controls the entire feature (API + page + navigation)
 * - Add new flags to the FeatureFlagName type first, then configure here
 */
export const featureFlagsConfig: FeatureFlagsConfig = {
  local: {
    preferences: {
      enabled: false,
      description: "User preferences management feature",
    },
  },
  integration: {
    preferences: {
      enabled: true,
      description: "User preferences management feature",
    },
  },
  prod: {
    preferences: {
      enabled: true,
      description: "User preferences management feature",
    },
  },
};

/**
 * Default environment when ENV_NAME is not set.
 * Using 'local' as default for development safety.
 */
export const DEFAULT_ENVIRONMENT: EnvironmentName = "local";
