/**
 * Page Object Model for Preferences Page
 *
 * Encapsulates all interactions with the preferences page for E2E tests.
 * Uses data-testid selectors for resilient element selection.
 */
import { type Page, type Locator, expect } from "@playwright/test";

export class PreferencesPage {
  readonly page: Page;

  // Main page elements
  readonly container: Locator;
  readonly pageTitle: Locator;
  readonly createButton: Locator;
  readonly preferencesGrid: Locator;
  readonly emptyState: Locator;
  readonly errorAlert: Locator;
  readonly loadingSpinner: Locator;

  // Form dialog elements
  readonly formDialog: Locator;
  readonly formTitle: Locator;
  readonly nameInput: Locator;
  readonly peopleCountInput: Locator;
  readonly budgetTypeSelect: Locator;
  readonly formCancelButton: Locator;
  readonly formSubmitButton: Locator;
  readonly nameError: Locator;
  readonly peopleCountError: Locator;
  readonly nameCharCount: Locator;

  // Delete dialog elements
  readonly deleteDialog: Locator;
  readonly deleteDialogTitle: Locator;
  readonly deleteDialogPreferenceName: Locator;
  readonly deleteCancelButton: Locator;
  readonly deleteConfirmButton: Locator;

  constructor(page: Page) {
    this.page = page;

    // Initialize main page locators
    this.container = page.getByTestId("preferences-view");
    this.pageTitle = page.getByTestId("preferences-page-title");
    this.createButton = page.getByTestId("create-preference-button");
    this.preferencesGrid = page.getByTestId("preferences-grid");
    this.emptyState = page.getByTestId("preferences-empty-state");
    this.errorAlert = page.getByTestId("error-alert");
    this.loadingSpinner = page.getByTestId("loading-spinner");

    // Initialize form dialog locators
    this.formDialog = page.getByTestId("preference-form-dialog");
    this.formTitle = page.getByTestId("preference-form-title");
    this.nameInput = page.getByTestId("preference-name-input");
    this.peopleCountInput = page.getByTestId("preference-people-count-input");
    this.budgetTypeSelect = page.getByTestId("preference-budget-type-select");
    this.formCancelButton = page.getByTestId("preference-form-cancel-button");
    this.formSubmitButton = page.getByTestId("preference-form-submit-button");
    this.nameError = page.getByTestId("preference-name-error");
    this.peopleCountError = page.getByTestId("preference-people-count-error");
    this.nameCharCount = page.getByTestId("preference-name-char-count");

    // Initialize delete dialog locators
    this.deleteDialog = page.getByTestId("delete-confirmation-dialog");
    this.deleteDialogTitle = page.getByTestId("delete-dialog-title");
    this.deleteDialogPreferenceName = page.getByTestId("delete-dialog-preference-name");
    this.deleteCancelButton = page.getByTestId("delete-dialog-cancel-button");
    this.deleteConfirmButton = page.getByTestId("delete-dialog-confirm-button");
  }

  /**
   * Navigate to preferences page
   */
  async goto() {
    await this.page.goto("/preferences");
    await this.container.waitFor({ state: "visible" });
  }

  /**
   * Wait for page to finish loading
   * Loading spinner should disappear when data is loaded
   */
  async waitForLoad() {
    await this.loadingSpinner.waitFor({ state: "hidden" });
  }

  /**
   * Open create dialog by clicking the create button
   */
  async openCreateDialog() {
    await this.createButton.click();
    await this.formDialog.waitFor({ state: "visible" });
  }

  /**
   * Fill and submit preference form
   *
   * @param data - Form data with name (required), people_count and budget_type (optional)
   */
  async fillAndSubmitForm(data: { name: string; people_count?: string; budget_type?: string }) {
    // Fill name (required field)
    await this.nameInput.fill(data.name);

    // Fill people count if provided
    if (data.people_count !== undefined && data.people_count !== "") {
      await this.peopleCountInput.fill(data.people_count);
    }

    // Select budget type if provided
    if (data.budget_type !== undefined && data.budget_type !== "none") {
      await this.budgetTypeSelect.click();
      const budgetLabel = this.getBudgetLabel(data.budget_type);
      await this.page.getByRole("option", { name: budgetLabel }).click();
    }

    // Submit form
    await this.formSubmitButton.click();
  }

  /**
   * Wait for form dialog to close
   * Indicates successful submission
   */
  async waitForFormClose() {
    await this.formDialog.waitFor({ state: "hidden" });
  }

  /**
   * Get preference card by name
   *
   * @param name - Preference name to find
   * @returns Locator for the preference card
   */
  getPreferenceCard(name: string): Locator {
    return this.page.getByTestId("preference-card").filter({
      has: this.page.getByTestId("preference-card-title").filter({ hasText: name }),
    });
  }

  /**
   * Get preference card by ID
   *
   * @param id - Preference UUID
   * @returns Locator for the preference card
   */
  getPreferenceCardById(id: string): Locator {
    return this.page.locator(`[data-testid="preference-card"][data-preference-id="${id}"]`);
  }

  /**
   * Get all preference cards
   *
   * @returns Locator for all preference cards
   */
  getAllPreferenceCards(): Locator {
    return this.page.getByTestId("preference-card");
  }

  /**
   * Assert preference exists in the list
   *
   * @param name - Preference name
   */
  async assertPreferenceExists(name: string) {
    const card = this.getPreferenceCard(name);
    await expect(card).toBeVisible();
  }

  /**
   * Assert preference doesn't exist in the list
   *
   * @param name - Preference name
   */
  async assertPreferenceNotExists(name: string) {
    const card = this.getPreferenceCard(name);
    await expect(card).not.toBeVisible();
  }

  /**
   * Helper to get budget label from value
   * Maps backend values to UI labels
   *
   * @param value - Budget type value
   * @returns UI label for the budget type
   */
  private getBudgetLabel(value: string): string {
    const labels: Record<string, string> = {
      none: "Nie określono",
      low: "Niski",
      medium: "Średni",
      high: "Wysoki",
    };
    return labels[value] || value;
  }
}
