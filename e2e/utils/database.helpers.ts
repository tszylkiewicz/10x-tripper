/**
 * Database helpers for E2E test cleanup
 */
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/db/database.types";

// Get test user ID from environment
export const TEST_USER_ID = process.env.E2E_USERNAME_ID;

// Validate test user ID on module load
if (!TEST_USER_ID) {
  console.error(
    "⚠️  E2E_USERNAME_ID is not defined in .env.test\n" +
      "   Global teardown will be skipped.\n" +
      "   Please add E2E_USERNAME_ID to your .env.test file."
  );
}

/**
 * Create Supabase client for test operations
 * Uses SUPABASE_URL and SUPABASE_KEY from .env.test
 */
export function createTestSupabaseClient() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Missing Supabase credentials in environment");
  }

  return createClient<Database>(supabaseUrl, supabaseKey);
}

/**
 * Clean up all preferences for test user
 * Used in global teardown to ensure test isolation
 *
 * @param userId - User ID to clean up (defaults to TEST_USER_ID)
 */
export async function cleanupUserPreferences(userId: string = TEST_USER_ID ?? "") {
  if (!userId) {
    console.warn("⚠️  No user ID provided for cleanup, skipping...");
    return;
  }

  const supabase = createTestSupabaseClient();

  const { error } = await supabase.from("user_preferences").delete().eq("user_id", userId);

  if (error) {
    console.error("Failed to cleanup preferences:", error);
    throw error;
  }

  console.log("✅ Cleanup completed");
}
