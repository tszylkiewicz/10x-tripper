import type { FullConfig } from "@playwright/test";
import { cleanupUserPreferences, TEST_USER_ID } from "./utils/database.helpers";

async function globalTeardown(config: FullConfig) {
  try {
    await cleanupUserPreferences(TEST_USER_ID);
  } catch (error) {
    console.error("❌ Failed to cleanup test data:", error);
    throw error;
  }
}

export default globalTeardown;
