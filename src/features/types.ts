/**
 * Feature Flag Type Definitions
 *
 * Provides type safety for feature flag names and configurations.
 */

/**
 * All available feature flags in the application.
 * Add new flags here to maintain type safety.
 */
export type FeatureFlagName = "preferences";

/**
 * Environment names supported by the application.
 * Maps to ENV_NAME environment variable.
 */
export type EnvironmentName = "local" | "integration" | "prod";

/**
 * Configuration for a single feature flag.
 */
export interface FeatureFlagConfig {
  enabled: boolean;
  description?: string;
}

/**
 * Feature flag configuration per environment.
 */
export type EnvironmentConfig = Partial<Record<FeatureFlagName, FeatureFlagConfig>>;

/**
 * Complete feature flags configuration across all environments.
 */
export type FeatureFlagsConfig = Record<EnvironmentName, EnvironmentConfig>;
