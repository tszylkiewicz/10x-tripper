import { type Page } from "@playwright/test";

/**
 * Helper functions for authentication in E2E tests
 */

export interface TestUser {
  email: string;
  password: string;
}

/**
 * Login user via UI
 */
export async function login(page: Page, user: TestUser) {
  await page.goto("/login");

  // Wait for page to be fully loaded and hydrated
  await page.waitForLoadState("domcontentloaded");
  await page.waitForLoadState("networkidle");

  // Wait for form to be ready
  const emailInput = page.getByTestId("login-email-input");
  const passwordInput = page.getByTestId("login-password-input");
  const submitButton = page.getByTestId("login-submit-button");

  // Click to focus and clear any existing values
  await emailInput.click();
  await emailInput.clear();
  await emailInput.fill(user.email);

  await passwordInput.click();
  await passwordInput.clear();
  await passwordInput.fill(user.password);

  await submitButton.click();
  await page.waitForURL("/", { timeout: 3000 });
}
