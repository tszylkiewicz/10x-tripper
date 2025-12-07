/**
 * E2E Tests for Preferences - Create Flow
 *
 * Tests the user flow for creating a new preference and verifying it appears in the list.
 * Follows AAA (Arrange, Act, Assert) pattern for clear test structure.
 */
import { test, expect } from "@playwright/test";
import { PreferencesPage } from "../../pages/PreferencesPage";
import { login } from "../../utils/auth.helpers";
import { generatePreferencesTestData, EXPECTED_BUDGET_LABELS } from "../../fixtures/preferences.fixtures";

test.describe("Preferences - Create Flow", () => {
  let preferencesPage: PreferencesPage;

  // Generate unique test data for this test run
  const PREFERENCES_TEST_DATA = generatePreferencesTestData();

  /**
   * Setup: Login and navigate to preferences page before each test
   */
  test.beforeEach(async ({ page }) => {
    // Verify environment variables are set
    const email = process.env.E2E_USERNAME;
    const password = process.env.E2E_PASSWORD;

    if (!email || !password) {
      throw new Error(
        `Missing test credentials in .env.test:\n` +
          `E2E_USERNAME: ${email ? "✓" : "✗ MISSING"}\n` +
          `E2E_PASSWORD: ${password ? "✓" : "✗ MISSING"}\n` +
          `Please check your .env.test file.`
      );
    }

    // ARRANGE: Login with test user from .env.test
    await login(page, { email, password });

    // Initialize page object and navigate
    preferencesPage = new PreferencesPage(page);
    await preferencesPage.goto();
    await preferencesPage.waitForLoad();
  });

  /**
   * Test: Create a new preference with valid data
   *
   * Scenario:
   * 1. User clicks "Nowa preferencja" button
   * 2. User fills in all form fields (name, people count, budget type)
   * 3. User clicks "Zapisz"
   * 4. System creates preference and displays it in the list
   */
  test("should create preference with full data and verify it appears in list", async () => {
    // ARRANGE
    const testData = PREFERENCES_TEST_DATA.valid;

    // ACT
    // Step 1: Open create dialog
    await preferencesPage.openCreateDialog();

    // Verify dialog is open with correct title
    await expect(preferencesPage.formDialog).toBeVisible();
    await expect(preferencesPage.formTitle).toHaveText("Nowa preferencja");

    // Step 2: Fill form with test data
    await preferencesPage.fillAndSubmitForm({
      name: testData.name,
      people_count: testData.people_count,
      budget_type: testData.budget_type,
    });

    // Step 3: Wait for dialog to close (indicates success)
    await preferencesPage.waitForFormClose();

    // ASSERT
    // Step 4: Verify new preference appears in the list
    await preferencesPage.assertPreferenceExists(testData.name);

    // Verify preference details are correct
    const card = preferencesPage.getPreferenceCard(testData.name);

    // Check card title matches
    await expect(card.getByTestId("preference-card-title")).toHaveText(testData.name);

    // Check people count displays correctly
    await expect(card.getByTestId("preference-card-people-count")).toHaveText(testData.people_count);

    // Check budget type displays with correct label
    await expect(card.getByTestId("preference-card-budget-badge")).toHaveText(
      EXPECTED_BUDGET_LABELS[testData.budget_type]
    );
  });

  /**
   * Test: Create a preference with only required name field
   *
   * Scenario:
   * 1. User clicks "Nowa preferencja" button
   * 2. User fills in only the name field (leaving people_count and budget_type empty)
   * 3. User clicks "Zapisz"
   * 4. System creates preference with default values and displays it in the list
   */
  test("should create preference with only required name field", async () => {
    // ARRANGE
    const testData = PREFERENCES_TEST_DATA.minimal;

    // ACT
    // Step 1: Open create dialog
    await preferencesPage.openCreateDialog();

    // Verify dialog is open with correct title
    await expect(preferencesPage.formDialog).toBeVisible();
    await expect(preferencesPage.formTitle).toHaveText("Nowa preferencja");

    // Step 2: Fill form with only name (minimal data)
    await preferencesPage.fillAndSubmitForm({
      name: testData.name,
    });

    // Step 3: Wait for dialog to close (indicates success)
    await preferencesPage.waitForFormClose();

    // ASSERT
    // Step 4: Verify new preference appears in the list
    await preferencesPage.assertPreferenceExists(testData.name);

    // Verify preference details show default values
    const card = preferencesPage.getPreferenceCard(testData.name);

    // Check card title matches
    await expect(card.getByTestId("preference-card-title")).toHaveText(testData.name);

    // Check people count shows "Nie określono" (not specified)
    await expect(card.getByTestId("preference-card-people-count")).toHaveText("Nie określono");

    // Check budget type shows "Nie określono" (not specified)
    await expect(card.getByTestId("preference-card-budget-badge")).toHaveText("Nie określono");
  });
});
