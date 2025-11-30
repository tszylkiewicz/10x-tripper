import { type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

/**
 * Run accessibility checks on the current page
 */
export async function checkAccessibility(
  page: Page,
  options?: {
    disabledRules?: string[];
    includedImpacts?: ("critical" | "serious" | "moderate" | "minor")[];
  }
) {
  const axeBuilder = new AxeBuilder({ page });

  // Disable specific rules if provided
  if (options?.disabledRules) {
    axeBuilder.disableRules(options.disabledRules);
  }

  // Filter by impact levels if provided
  if (options?.includedImpacts) {
    axeBuilder.withTags(options.includedImpacts.map((impact) => `wcag2a`));
  }

  const accessibilityScanResults = await axeBuilder.analyze();
  return accessibilityScanResults;
}
