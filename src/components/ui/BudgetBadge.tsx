/**
 * BudgetBadge Component
 *
 * Displays budget type as a colored badge with consistent styling.
 * Supports low/medium/high budget types with appropriate color schemes.
 */

export type BudgetType = "low" | "medium" | "high" | string | null;

interface BudgetBadgeProps {
  budgetType: BudgetType;
  testId?: string;
}

/**
 * Maps budget type to display label
 */
function getBudgetTypeLabel(budgetType: BudgetType): string {
  if (!budgetType?.trim()) return "Nie określono";

  const trimmed = budgetType.trim();
  const labels: Record<string, string> = {
    low: "Niski",
    medium: "Średni",
    high: "Wysoki",
  };

  return labels[trimmed] || trimmed;
}

/**
 * Maps budget type to Tailwind color classes
 */
function getBudgetTypeColor(budgetType: BudgetType): string {
  if (!budgetType?.trim()) return "bg-muted text-muted-foreground";

  const trimmed = budgetType.trim();
  const colors: Record<string, string> = {
    low: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    medium: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    high: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  };

  return colors[trimmed] || "bg-muted text-muted-foreground";
}

export function BudgetBadge({ budgetType, testId }: BudgetBadgeProps) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${getBudgetTypeColor(budgetType)}`}
      data-testid={testId}
    >
      {getBudgetTypeLabel(budgetType)}
    </span>
  );
}
