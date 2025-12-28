import { createClient } from "@supabase/supabase-js";
import { createServerClient, type CookieOptionsWithName } from "@supabase/ssr";
import type { AstroCookies } from "astro";

import type { Database } from "../db/database.types.ts";

/**
 * Type for Supabase client with database types
 * Used throughout the application for type safety
 */
export type SupabaseClient = ReturnType<typeof createClient<Database>>;

/**
 * Creates a client-side Supabase client for browser usage
 * Note: In Cloudflare Pages SSR, PUBLIC_ prefixed env vars are available on client
 * For server-side requests, use createSupabaseServerInstance instead
 */
export function createSupabaseClient(): SupabaseClient {
  const url = import.meta.env.PUBLIC_SUPABASE_URL;
  const key = import.meta.env.PUBLIC_SUPABASE_KEY;

  if (!url || !key) {
    throw new Error(
      "Missing PUBLIC_SUPABASE_URL or PUBLIC_SUPABASE_KEY. These must be set as PUBLIC_ prefixed environment variables for client-side usage."
    );
  }

  return createClient<Database>(url, key);
}

// Cookie options for Supabase SSR
export const cookieOptions: CookieOptionsWithName = {
  path: "/",
  secure: true,
  httpOnly: true,
  sameSite: "lax",
};

// Helper function to parse cookie header
function parseCookieHeader(cookieHeader: string): { name: string; value: string }[] {
  return cookieHeader.split(";").map((cookie) => {
    const [name, ...rest] = cookie.trim().split("=");
    return { name, value: rest.join("=") };
  });
}

/**
 * Creates a Supabase server instance with SSR support for authentication
 * Uses @supabase/ssr for proper cookie management in Astro
 *
 * IMPORTANT: In Cloudflare Pages, environment variables must be:
 * 1. Set in Cloudflare Pages dashboard (Settings → Environment variables)
 * 2. Passed from context.locals.runtime.env (available in middleware and API routes)
 *
 * @param context - Object containing headers, cookies, and runtime env vars from Astro request
 * @returns Supabase server client with auth session support
 * @throws Error if SUPABASE_URL or SUPABASE_KEY are not provided in env
 */
export const createSupabaseServerInstance = (context: {
  headers: Headers;
  cookies: AstroCookies;
  env: {
    SUPABASE_URL: string;
    SUPABASE_KEY: string;
  };
}): SupabaseClient => {
  const { SUPABASE_URL, SUPABASE_KEY } = context.env;

  // Validate required environment variables
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    const missing = [];
    if (!SUPABASE_URL) missing.push("SUPABASE_URL");
    if (!SUPABASE_KEY) missing.push("SUPABASE_KEY");

    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}. ` +
        `These must be set in Cloudflare Pages dashboard and passed via context.locals.runtime.env`
    );
  }

  const supabase = createServerClient<Database>(SUPABASE_URL, SUPABASE_KEY, {
    cookieOptions,
    cookies: {
      getAll() {
        return parseCookieHeader(context.headers.get("Cookie") ?? "");
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => context.cookies.set(name, value, options));
      },
    },
  });

  return supabase;
};
