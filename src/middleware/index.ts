import { defineMiddleware } from "astro:middleware";

import { createSupabaseServerInstance } from "../db/supabase.client.ts";

/**
 * Merges environment variables from runtime context (Cloudflare) and import.meta.env.
 * Prefers runtime.env when available, but falls back to import.meta.env for missing properties.
 */
function getMergedEnv(
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

// Public paths - Auth pages and API endpoints that don't require authentication
const PUBLIC_PATHS = [
  // Landing page
  "/",
  // Auth pages
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  // Auth API endpoints
  "/api/auth/login",
  "/api/auth/signup",
  "/api/auth/signout",
  "/api/auth/reset-password",
  "/api/auth/update-password",
];

export const onRequest = defineMiddleware(async ({ locals, cookies, url, request, redirect }, next) => {
  // Get env vars from runtime context (Cloudflare) or import.meta.env (local dev/E2E)
  // Merges both sources to work in all environments
  const env = getMergedEnv(locals.runtime?.env, import.meta.env);

  // Create Supabase server instance with cookie support for all requests
  // These env vars are required and should always be present
  const supabaseUrl = env.SUPABASE_URL;
  const supabaseKey = env.SUPABASE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Missing required environment variables: SUPABASE_URL and SUPABASE_KEY must be set");
  }

  const supabase = createSupabaseServerInstance(
    {
      cookies,
      headers: request.headers,
    },
    {
      SUPABASE_URL: supabaseUrl,
      SUPABASE_KEY: supabaseKey,
    }
  );

  // Set Supabase client in locals for use in pages and API routes
  locals.supabase = supabase;

  // Skip auth verification for public paths
  if (PUBLIC_PATHS.includes(url.pathname)) {
    return next();
  }

  // IMPORTANT: Always get user before other operations
  // Use getUser() instead of getSession() for security
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    // Set user data in locals
    locals.user = {
      email: user.email ?? "",
      id: user.id,
    };
  } else {
    // Redirect to login for protected routes
    return redirect("/login");
  }

  return next();
});
