/**
 * PreferenceCard Component
 *
 * Karta wyświetlająca pojedynczą preferencję użytkownika.
 * Prezentuje nazwę, liczbę osób i typ budżetu w czytelnej formie.
 * Zawiera akcje edycji i usuwania.
 */

import { Pencil, Plus, Trash2, Users } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@ui/card";
import { Button } from "@ui/button";
import { BudgetBadge } from "@ui/BudgetBadge";
import type { UserPreferenceDto } from "@types";

interface PreferenceCardProps {
  preference: UserPreferenceDto;
  onEdit: (preference: UserPreferenceDto) => void;
  onDelete: (preference: UserPreferenceDto) => void;
}

export function PreferenceCard({ preference, onEdit, onDelete }: PreferenceCardProps) {
  return (
    <Card
      className="transition-shadow hover:shadow-md"
      data-testid="preference-card"
      data-preference-id={preference.id}
    >
      <CardHeader>
        <CardTitle className="text-xl" data-testid="preference-card-title">
          {preference.name}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Liczba osób */}
        <div className="flex items-center gap-2 text-sm">
          <Users className="size-4 text-muted-foreground" />
          <span className="text-muted-foreground">Liczba osób:</span>
          <span className="font-medium" data-testid="preference-card-people-count">
            {preference.people_count ?? "Nie określono"}
          </span>
        </div>

        {/* Typ budżetu */}
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Budżet:</span>
          <BudgetBadge budgetType={preference.budget_type} testId="preference-card-budget-badge" />
        </div>
      </CardContent>

      <CardFooter className="flex flex-col gap-3 border-t pt-4">
        {/* Create trip with this preference */}
        <Button
          asChild
          size="sm"
          className="cursor-pointer gap-2 w-full hover:bg-primary-dark"
          data-testid="preference-card-create-trip-button"
        >
          <a href={`/trip-plans/new?preferenceId=${preference.id}`}>
            <Plus className="size-4" />
            Utwórz plan z tej preferencji
          </a>
        </Button>

        {/* Edit and Delete actions */}
        <div className="flex gap-2 w-full">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(preference)}
            className="cursor-pointer gap-2 flex-1 hover:bg-primary hover:text-primary-foreground"
            data-testid="preference-card-edit-button"
          >
            <Pencil className="size-4" />
            Edytuj
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDelete(preference)}
            className="cursor-pointer gap-2 text-destructive hover:bg-destructive hover:text-destructive-foreground flex-1"
            data-testid="preference-card-delete-button"
          >
            <Trash2 className="size-4" />
            Usuń
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
