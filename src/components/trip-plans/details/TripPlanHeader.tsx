/**
 * TripPlanHeader component
 * Displays trip plan metadata with edit/view modes and action buttons
 */

import { memo, useId } from "react";
import { Pencil, Trash2, Save, X, MapPin, Calendar, Users, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { TripPlanHeaderProps } from "./types";

const BUDGET_TYPES = [
  { value: "low", label: "Niski" },
  { value: "medium", label: "Średni" },
  { value: "high", label: "Wysoki" },
];

/**
 * Formats date string to Polish locale display format
 */
function formatDateDisplay(dateString: string): string {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return date.toLocaleDateString("pl-PL", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return dateString;
  }
}

/**
 * Gets budget type label from value
 */
function getBudgetLabel(value: string): string {
  const budget = BUDGET_TYPES.find((b) => b.value === value);
  return budget?.label || value;
}

function TripPlanHeaderComponent({
  destination,
  startDate,
  endDate,
  peopleCount,
  budgetType,
  isEditMode,
  isSaving,
  validationErrors = {},
  onEdit,
  onDelete,
  onSave,
  onCancel,
  onFieldChange,
}: TripPlanHeaderProps) {
  const destinationId = useId();
  const startDateId = useId();
  const endDateId = useId();
  const peopleCountId = useId();
  const budgetTypeId = useId();

  // View mode
  if (!isEditMode) {
    return (
      <div className="mb-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold sm:text-3xl">{destination}</h1>
            <div className="mt-3 flex flex-wrap gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Calendar className="size-4" />
                <span>
                  {formatDateDisplay(startDate)} - {formatDateDisplay(endDate)}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Users className="size-4" />
                <span>
                  {peopleCount} {peopleCount === 1 ? "osoba" : peopleCount < 5 ? "osoby" : "osób"}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Wallet className="size-4" />
                <span>Budżet: {getBudgetLabel(budgetType)}</span>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onEdit}>
              <Pencil className="mr-1.5 size-4" />
              Edytuj
            </Button>
            <Button variant="outline" size="sm" onClick={onDelete} className="text-destructive hover:text-destructive">
              <Trash2 className="mr-1.5 size-4" />
              Usuń
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Edit mode
  return (
    <div className="mb-8 rounded-lg border bg-card p-4 sm:p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Destination */}
        <div className="sm:col-span-2">
          <Label htmlFor={destinationId} className="mb-1.5 block text-sm font-medium">
            Cel podróży
          </Label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id={destinationId}
              value={destination}
              onChange={(e) => onFieldChange("destination", e.target.value)}
              placeholder="np. Kraków, Polska"
              className="pl-9"
              aria-invalid={!!validationErrors.destination}
            />
          </div>
          {validationErrors.destination && (
            <p className="mt-1 text-xs text-destructive">{validationErrors.destination}</p>
          )}
        </div>

        {/* Start date */}
        <div>
          <Label htmlFor={startDateId} className="mb-1.5 block text-sm font-medium">
            Data rozpoczęcia
          </Label>
          <Input
            id={startDateId}
            type="date"
            value={startDate}
            onChange={(e) => onFieldChange("start_date", e.target.value)}
            aria-invalid={!!validationErrors.start_date}
          />
          {validationErrors.start_date && (
            <p className="mt-1 text-xs text-destructive">{validationErrors.start_date}</p>
          )}
        </div>

        {/* End date */}
        <div>
          <Label htmlFor={endDateId} className="mb-1.5 block text-sm font-medium">
            Data zakończenia
          </Label>
          <Input
            id={endDateId}
            type="date"
            value={endDate}
            onChange={(e) => onFieldChange("end_date", e.target.value)}
            min={startDate}
            aria-invalid={!!validationErrors.end_date}
          />
          {validationErrors.end_date && <p className="mt-1 text-xs text-destructive">{validationErrors.end_date}</p>}
        </div>

        {/* People count */}
        <div>
          <Label htmlFor={peopleCountId} className="mb-1.5 block text-sm font-medium">
            Liczba osób
          </Label>
          <Input
            id={peopleCountId}
            type="number"
            min={1}
            value={peopleCount}
            onChange={(e) => onFieldChange("people_count", parseInt(e.target.value, 10) || 1)}
            aria-invalid={!!validationErrors.people_count}
          />
          {validationErrors.people_count && (
            <p className="mt-1 text-xs text-destructive">{validationErrors.people_count}</p>
          )}
        </div>

        {/* Budget type */}
        <div>
          <Label htmlFor={budgetTypeId} className="mb-1.5 block text-sm font-medium">
            Typ budżetu
          </Label>
          <Select value={budgetType} onValueChange={(value) => onFieldChange("budget_type", value)}>
            <SelectTrigger id={budgetTypeId} className="w-full" aria-invalid={!!validationErrors.budget_type}>
              <SelectValue placeholder="Wybierz budżet" />
            </SelectTrigger>
            <SelectContent>
              {BUDGET_TYPES.map((budget) => (
                <SelectItem key={budget.value} value={budget.value}>
                  {budget.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {validationErrors.budget_type && (
            <p className="mt-1 text-xs text-destructive">{validationErrors.budget_type}</p>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div className="mt-6 flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={onCancel} disabled={isSaving}>
          <X className="mr-1.5 size-4" />
          Anuluj
        </Button>
        <Button size="sm" onClick={onSave} disabled={isSaving}>
          <Save className="mr-1.5 size-4" />
          {isSaving ? "Zapisywanie..." : "Zapisz"}
        </Button>
      </div>
    </div>
  );
}

export const TripPlanHeader = memo(TripPlanHeaderComponent);
