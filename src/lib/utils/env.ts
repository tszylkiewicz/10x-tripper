/**
 * Environment Variable Utilities
 *
 * Provides utilities for accessing environment variables that work
 * in both Cloudflare (runtime.env) and local/E2E test environments (import.meta.env).
 */

/**
 * Merges environment variables from runtime context (Cloudflare) and import.meta.env.
 * Prefers runtime.env when available, but falls back to import.meta.env for missing properties.
 *
 * This ensures compatibility with:
 * - Cloudflare Pages: Uses locals.runtime.env
 * - Local dev/E2E tests: Uses import.meta.env
 *
 * @param runtimeEnv - Environment variables from Astro.locals.runtime?.env (Cloudflare)
 * @param metaEnv - Environment variables from import.meta.env (local dev/E2E)
 * @returns Merged environment object with all available variables
 *
 * @example
 * // In Astro page or API route
 * const env = getMergedEnv(Astro.locals.runtime?.env, import.meta.env);
 * const supabaseUrl = env.SUPABASE_URL;
 */
export function getMergedEnv(
  runtimeEnv?: Record<string, string | undefined> | null,
  metaEnv: Record<string, string | undefined> = import.meta.env as Record<string, string | undefined>
): Record<string, string | undefined> {
  // If runtime.env doesn't exist or is null, use metaEnv directly
  if (!runtimeEnv) {
    return metaEnv;
  }

  // Merge both sources, preferring runtimeEnv but falling back to metaEnv
  // This handles cases where runtimeEnv exists but is missing some properties
  return {
    ...metaEnv,
    ...runtimeEnv,
  };
}
