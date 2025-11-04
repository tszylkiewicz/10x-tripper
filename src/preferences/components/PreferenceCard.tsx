/**
 * PreferenceCard Component
 *
 * Karta wyświetlająca pojedynczą preferencję użytkownika.
 * Prezentuje nazwę, liczbę osób i typ budżetu w czytelnej formie.
 * Zawiera akcje edycji i usuwania.
 */

import { Pencil, Trash2, Users } from "lucide-react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { UserPreferenceDto } from "../../types";

interface PreferenceCardProps {
  preference: UserPreferenceDto;
  onEdit: (preference: UserPreferenceDto) => void;
  onDelete: (preference: UserPreferenceDto) => void;
}

/**
 * Pomocnicza funkcja do mapowania typu budżetu na label
 */
function getBudgetTypeLabel(budgetType: string | null): string {
  if (!budgetType) return "Nie określono";

  const labels: Record<string, string> = {
    low: "Niski",
    medium: "Średni",
    high: "Wysoki",
  };

  return labels[budgetType] || budgetType;
}

/**
 * Pomocnicza funkcja do mapowania typu budżetu na kolor badge
 */
function getBudgetTypeColor(budgetType: string | null): string {
  if (!budgetType) return "bg-muted text-muted-foreground";

  const colors: Record<string, string> = {
    low: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    medium: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    high: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  };

  return colors[budgetType] || "bg-muted text-muted-foreground";
}

export function PreferenceCard({ preference, onEdit, onDelete }: PreferenceCardProps) {
  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardHeader>
        <CardTitle className="text-xl">{preference.name}</CardTitle>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Liczba osób */}
        <div className="flex items-center gap-2 text-sm">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">Liczba osób:</span>
          <span className="font-medium">
            {preference.people_count ?? "Nie określono"}
          </span>
        </div>

        {/* Typ budżetu */}
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Budżet:</span>
          <span
            className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${getBudgetTypeColor(
              preference.budget_type
            )}`}
          >
            {getBudgetTypeLabel(preference.budget_type)}
          </span>
        </div>
      </CardContent>

      <CardFooter className="flex justify-end gap-2 border-t pt-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onEdit(preference)}
          className="gap-2"
        >
          <Pencil className="h-4 w-4" />
          Edytuj
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onDelete(preference)}
          className="gap-2 text-destructive hover:bg-destructive hover:text-destructive-foreground"
        >
          <Trash2 className="h-4 w-4" />
          Usuń
        </Button>
      </CardFooter>
    </Card>
  );
}
