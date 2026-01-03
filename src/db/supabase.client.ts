import { createClient } from "@supabase/supabase-js";
import { type CookieOptionsWithName, createServerClient } from "@supabase/ssr";
import type { AstroCookies } from "astro";

import type { Database } from "../db/database.types.ts";

/**
 * Fallback Supabase client for client-side usage only.
 * For server-side/SSR, use createSupabaseServerInstance() with runtime env vars.
 */
export const supabaseClient = createClient<Database>(
  import.meta.env.SUPABASE_URL || "",
  import.meta.env.SUPABASE_KEY || ""
);

export type SupabaseClient = typeof supabaseClient;

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
 * @param context - Object containing headers and cookies from Astro request
 * @param env - Environment variables (from Astro.locals.runtime?.env or import.meta.env)
 * @returns Supabase server client with auth session support
 */
export const createSupabaseServerInstance = (
  context: { headers: Headers; cookies: AstroCookies },
  env: { SUPABASE_URL: string; SUPABASE_KEY: string }
) => {
  return createServerClient<Database>(env.SUPABASE_URL, env.SUPABASE_KEY, {
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
};
