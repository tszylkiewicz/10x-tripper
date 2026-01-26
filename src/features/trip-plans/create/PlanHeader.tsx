import { Calendar, Users, Wallet } from "lucide-react";
import type { PlanHeaderProps } from "./types";
import { BUDGET_TYPE_OPTIONS } from "./types";

/**
 * Formats a date range for display
 */
function formatDateRange(startDate: string, endDate: string): string {
  const start = new Date(startDate);
  const end = new Date(endDate);

  const formatOptions: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "long",
    year: "numeric",
  };

  const startFormatted = start.toLocaleDateString("pl-PL", formatOptions);
  const endFormatted = end.toLocaleDateString("pl-PL", formatOptions);

  // If same month and year, format more concisely
  if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) {
    return `${start.getDate()} - ${endFormatted}`;
  }

  return `${startFormatted} - ${endFormatted}`;
}

/**
 * Gets the Polish label for a budget type
 */
function getBudgetLabel(budgetType: string): string {
  const option = BUDGET_TYPE_OPTIONS.find((opt) => opt.value === budgetType);
  return option?.label ?? budgetType;
}

/**
 * Calculates the number of days in the trip
 */
function calculateDays(startDate: string, endDate: string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays + 1; // Include both start and end day
}

/**
 * PlanHeader component
 *
 * Displays the header section of a generated trip plan with
 * destination, date range, people count, and budget information.
 */
export function PlanHeader({ destination, startDate, endDate, peopleCount, budgetType }: PlanHeaderProps) {
  const dateRange = formatDateRange(startDate, endDate);
  const budgetLabel = getBudgetLabel(budgetType);
  const totalDays = calculateDays(startDate, endDate);

  return (
    <header className="mb-6 space-y-4">
      {/* Destination title */}
      <h1 className="text-2xl font-bold text-foreground sm:text-3xl">{destination}</h1>

      {/* Metadata grid */}
      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
        {/* Date range */}
        <div className="flex items-center gap-2">
          <Calendar className="size-4" />
          <span>
            {dateRange} ({totalDays} {totalDays === 1 ? "dzień" : totalDays < 5 ? "dni" : "dni"})
          </span>
        </div>

        {/* People count */}
        <div className="flex items-center gap-2">
          <Users className="size-4" />
          <span>
            {peopleCount} {peopleCount === 1 ? "osoba" : peopleCount < 5 ? "osoby" : "osób"}
          </span>
        </div>

        {/* Budget type */}
        <div className="flex items-center gap-2">
          <Wallet className="size-4" />
          <span>Budżet: {budgetLabel}</span>
        </div>
      </div>
    </header>
  );
}
