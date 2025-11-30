import { type Page } from "@playwright/test";

/**
 * Helper functions for authentication in E2E tests
 */

export interface TestUser {
  email: string;
  password: string;
}

export const TEST_USERS = {
  valid: {
    email: "test@example.com",
    password: "ValidPassword123",
  },
  new: {
    email: "newuser@example.com",
    password: "StrongPassword123",
  },
} as const;

/**
 * Login user via UI
 */
export async function login(page: Page, user: TestUser) {
  await page.goto("/login");
  await page.fill('input[type="email"]', user.email);
  await page.fill('input[type="password"]', user.password);
  await page.click('button[type="submit"]');
  await page.waitForURL("/");
}

/**
 * Register new user via UI
 */
export async function register(page: Page, user: TestUser) {
  await page.goto("/register");
  await page.fill('input[type="email"]', user.email);
  await page.fill('input[name="password"]', user.password);
  await page.fill('input[name="confirmPassword"]', user.password);
  await page.click('button[type="submit"]');
}

/**
 * Logout user via UI
 */
export async function logout(page: Page) {
  // Adjust selector based on your actual UI
  await page.click('[data-testid="user-menu"]');
  await page.click('[data-testid="logout-button"]');
  await page.waitForURL("/login");
}
