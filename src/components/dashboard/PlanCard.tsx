import { Calendar, Users, Wallet, Trash2 } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { TripPlanDto } from "../../types";

interface PlanCardProps {
  plan: TripPlanDto;
  onClick: () => void;
  onDelete: () => void;
}

/**
 * Formats a date range for display
 */
function formatDateRange(startDate: string, endDate: string): string {
  try {
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return `${startDate} - ${endDate}`;
    }

    const options: Intl.DateTimeFormatOptions = {
      day: "numeric",
      month: "short",
      year: "numeric",
    };

    return `${start.toLocaleDateString("pl-PL", options)} - ${end.toLocaleDateString("pl-PL", options)}`;
  } catch {
    return `${startDate} - ${endDate}`;
  }
}

/**
 * Calculates the number of days in the trip
 */
function calculateDays(startDate: string, endDate: string): number {
  try {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays + 1; // Include both start and end day
  } catch {
    return 0;
  }
}

/**
 * Counts total activities across all days
 */
function countActivities(planDetails: TripPlanDto["plan_details"]): number {
  if (!planDetails?.days) return 0;
  return planDetails.days.reduce((total, day) => total + (day.activities?.length || 0), 0);
}

/**
 * Formats budget type for display
 */
function formatBudgetType(budgetType: string): string {
  const budgetLabels: Record<string, string> = {
    low: "Niski",
    medium: "Średni",
    high: "Wysoki",
  };
  return budgetLabels[budgetType] || budgetType;
}

/**
 * PlanCard component
 * Displays a single trip plan card with key information and actions
 */
export function PlanCard({ plan, onClick, onDelete }: PlanCardProps) {
  const days = calculateDays(plan.start_date, plan.end_date);
  const activities = countActivities(plan.plan_details);

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete();
  };

  return (
    <Card
      className="cursor-pointer transition-shadow hover:shadow-lg"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
    >
      <CardHeader>
        <CardTitle className="text-lg">{plan.destination}</CardTitle>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="size-4" />
          <span>{formatDateRange(plan.start_date, plan.end_date)}</span>
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Users className="size-4" />
          <span>
            {plan.people_count} {plan.people_count === 1 ? "osoba" : plan.people_count < 5 ? "osoby" : "osób"}
          </span>
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Wallet className="size-4" />
          <span>Budżet: {formatBudgetType(plan.budget_type)}</span>
        </div>

        <p className="text-sm text-muted-foreground">
          {days} {days === 1 ? "dzień" : days < 5 ? "dni" : "dni"}, {activities}{" "}
          {activities === 1 ? "aktywność" : activities < 5 ? "aktywności" : "aktywności"}
        </p>
      </CardContent>

      <CardFooter className="flex justify-between gap-2">
        <Button variant="outline" size="sm" className="flex-1">
          Zobacz szczegóły
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleDeleteClick}
          aria-label="Usuń plan"
          className="text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="size-4" />
        </Button>
      </CardFooter>
    </Card>
  );
}
