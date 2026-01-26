import { Calendar, Users, Trash2 } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@ui/card";
import { Button } from "@ui/button";
import { BudgetBadge } from "@ui/BudgetBadge";
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
 * PlanCard component
 * Displays a single trip plan card with key information and actions
 */
export function PlanCard({ plan, onClick, onDelete }: PlanCardProps) {
  const days = calculateDays(plan.start_date, plan.end_date);
  const activities = countActivities(plan.plan_details);

  return (
    <Card className="transition-shadow hover:shadow-lg">
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

        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Budżet:</span>
          <BudgetBadge budgetType={plan.budget_type} />
        </div>

        <p className="text-sm text-muted-foreground">
          {days} {days === 1 ? "dzień" : days < 5 ? "dni" : "dni"}, {activities}{" "}
          {activities === 1 ? "aktywność" : activities < 5 ? "aktywności" : "aktywności"}
        </p>
      </CardContent>

      <CardFooter className="flex flex-col gap-3">
        <Button
          onClick={onClick}
          variant="outline"
          size="sm"
          className="w-full cursor-pointer hover:bg-primary hover:text-primary-foreground"
        >
          Zobacz szczegóły
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onDelete}
          className="w-full cursor-pointer gap-2 text-destructive hover:bg-destructive hover:text-destructive-foreground"
          aria-label="Usuń plan"
        >
          <Trash2 className="size-4" />
          Usuń
        </Button>
      </CardFooter>
    </Card>
  );
}
