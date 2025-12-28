import { defineMiddleware } from "astro:middleware";

import { createSupabaseServerInstance } from "../db/supabase.client.ts";

// Public paths - Auth pages and API endpoints that don't require authentication
const PUBLIC_PATHS = [
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
  // Validate runtime environment is available (provided by @astrojs/cloudflare adapter)
  if (!locals.runtime?.env) {
    // eslint-disable-next-line no-console
    console.error("[Middleware] CRITICAL: locals.runtime.env is not available", {
      hasRuntime: !!locals.runtime,
      url: url.pathname,
    });
    throw new Error("Runtime environment not available. Ensure @astrojs/cloudflare adapter is properly configured.");
  }

  const { env } = locals.runtime;

  // Validate required environment variables
  const requiredVars = ["SUPABASE_URL", "SUPABASE_KEY"] as const;
  const missingVars = requiredVars.filter((varName) => !env[varName]);

  if (missingVars.length > 0) {
    // eslint-disable-next-line no-console
    console.error("[Middleware] Missing required environment variables:", {
      missing: missingVars,
      availableKeys: Object.keys(env),
      url: url.pathname,
    });

    throw new Error(
      `Missing required environment variables: ${missingVars.join(", ")}. ` +
        `Set these in Cloudflare Pages: Settings → Environment variables (both Production and Preview)`
    );
  }

  try {
    // Create Supabase server instance with cookie support for all requests
    const supabase = createSupabaseServerInstance({
      cookies,
      headers: request.headers,
      env: {
        SUPABASE_URL: env.SUPABASE_URL,
        SUPABASE_KEY: env.SUPABASE_KEY,
      },
    });

    // Set Supabase client in locals for use in pages and API routes
    locals.supabase = supabase;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("[Middleware] Failed to create Supabase client:", error);
    throw error;
  }

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
