import { defineMiddleware } from "astro:middleware";
import { getSecret } from "astro:env/server";

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
  // Access environment variables via astro:env/server
  // With Cloudflare adapter, these are automatically read from context.locals.runtime.env
  // The env schema in astro.config.mjs validates these variables
  const supabaseUrl = getSecret("SUPABASE_URL");
  const supabaseKey = getSecret("SUPABASE_KEY");

  // Validate that environment variables are available
  if (!supabaseUrl || !supabaseKey) {
    // eslint-disable-next-line no-console
    console.error("[Middleware] Missing required environment variables", {
      hasSupabaseUrl: !!supabaseUrl,
      hasSupabaseKey: !!supabaseKey,
      url: url.pathname,
    });
    throw new Error(
      "Missing required environment variables. Set SUPABASE_URL and SUPABASE_KEY in Cloudflare Pages dashboard."
    );
  }

  // Create Supabase server instance with cookie support for all requests
  const supabase = createSupabaseServerInstance({
    cookies,
    headers: request.headers,
    env: {
      SUPABASE_URL: supabaseUrl,
      SUPABASE_KEY: supabaseKey,
    },
  });

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
