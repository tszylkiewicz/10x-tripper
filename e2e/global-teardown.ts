/* eslint-disable no-console, @typescript-eslint/no-unused-vars */
import type { FullConfig } from "@playwright/test";
import { cleanupUserPreferences, TEST_USER_ID } from "./utils/database.helpers";

async function globalTeardown(_config: FullConfig) {
  try {
    await cleanupUserPreferences(TEST_USER_ID);
  } catch (error) {
    console.error("❌ Failed to cleanup test data:", error);
    throw error;
  }
}

export default globalTeardown;
