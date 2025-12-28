import { createClient } from "@supabase/supabase-js";
import { createServerClient, type CookieOptionsWithName } from "@supabase/ssr";
import type { AstroCookies } from "astro";

import type { Database } from "../db/database.types.ts";

// Helper to get env vars with fallback to build-time values
const getEnvVar = (runtimeValue: string | undefined, buildTimeValue: string, varName: string): string => {
  const value = runtimeValue || buildTimeValue;
  if (!value) {
    throw new Error(
      `${varName} is not set. Please ensure it's configured in Cloudflare Pages environment variables or build-time environment.`
    );
  }
  return value;
};

// Default Supabase client for client-side usage (uses build-time env vars)
const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseAnonKey = import.meta.env.SUPABASE_KEY;

// Validate build-time env vars
if (!supabaseUrl || !supabaseAnonKey) {
  // eslint-disable-next-line no-console
  console.error("Missing Supabase environment variables at build time");
}

export const supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey);

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
 * @param context - Object containing headers, cookies, and optional runtime env vars from Astro request
 * @returns Supabase server client with auth session support
 */
export const createSupabaseServerInstance = (context: {
  headers: Headers;
  cookies: AstroCookies;
  env?: {
    SUPABASE_URL?: string;
    SUPABASE_KEY?: string;
  };
}) => {
  // Use runtime env vars if available, fallback to build-time env vars
  const url = getEnvVar(context.env?.SUPABASE_URL, supabaseUrl, "SUPABASE_URL");
  const key = getEnvVar(context.env?.SUPABASE_KEY, supabaseAnonKey, "SUPABASE_KEY");

  const supabase = createServerClient<Database>(url, key, {
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
