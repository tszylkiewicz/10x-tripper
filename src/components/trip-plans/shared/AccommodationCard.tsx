/**
 * Shared AccommodationCard component
 *
 * Universal accommodation card used in both create and details flows.
 * Supports view/edit modes and optional add/remove operations.
 *
 * Usage:
 * - Create flow: <AccommodationCard accommodation={acc} isEditMode={true} onUpdate={...} />
 * - Details flow: <AccommodationCard accommodation={acc} isEditMode={mode} onAdd={...} onRemove={...} />
 */

import { memo, useState, useCallback, useId } from "react";
import { Home, Calendar, DollarSign, ExternalLink, Save, X, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { validateAccommodation } from "@/lib/utils/accommodation-validation";
import { formatAccommodationDate, formatDateRange } from "@/lib/utils/date-formatting";
import { EMPTY_ACCOMMODATION } from "@/lib/utils/trip-plan-constants";
import type { AccommodationDto } from "../../../types";
import type { AccommodationCardProps, ValidationErrors } from "./types";

function AccommodationCardComponent({
  accommodation,
  isEditMode = true,
  showAddButton = true,
  showRemoveButton = true,
  onUpdate,
  onAdd,
  onRemove,
  className,
}: AccommodationCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [editedAccommodation, setEditedAccommodation] = useState<AccommodationDto>(
    accommodation || EMPTY_ACCOMMODATION
  );
  const [localErrors, setLocalErrors] = useState<ValidationErrors>({});

  const nameId = useId();
  const addressId = useId();
  const checkInId = useId();
  const checkOutId = useId();
  const costId = useId();
  const urlId = useId();

  const handleFieldChange = useCallback((field: keyof AccommodationDto, value: string | number | undefined) => {
    setEditedAccommodation((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field
    setLocalErrors((prev) => Object.fromEntries(Object.entries(prev).filter(([key]) => key !== field)));
  }, []);

  const handleSave = useCallback(() => {
    const errors = validateAccommodation(editedAccommodation);
    if (Object.keys(errors).length > 0) {
      setLocalErrors(errors);
      return;
    }
    onUpdate(editedAccommodation);
    setIsEditing(false);
    setIsAdding(false);
    setLocalErrors({});
  }, [editedAccommodation, onUpdate]);

  const handleCancel = useCallback(() => {
    setEditedAccommodation(accommodation || EMPTY_ACCOMMODATION);
    setIsEditing(false);
    setIsAdding(false);
    setLocalErrors({});
  }, [accommodation]);

  const handleStartEdit = useCallback(() => {
    setEditedAccommodation(accommodation || EMPTY_ACCOMMODATION);
    setIsEditing(true);
  }, [accommodation]);

  const handleStartAdd = useCallback(() => {
    setEditedAccommodation({ ...EMPTY_ACCOMMODATION });
    setIsAdding(true);
    setLocalErrors({});
  }, []);

  const handleAdd = useCallback(() => {
    const errors = validateAccommodation(editedAccommodation);
    if (Object.keys(errors).length > 0) {
      setLocalErrors(errors);
      return;
    }
    if (onAdd) {
      onAdd(editedAccommodation);
    }
    setIsAdding(false);
    setEditedAccommodation({ ...EMPTY_ACCOMMODATION });
    setLocalErrors({});
  }, [editedAccommodation, onAdd]);

  const handleRemove = useCallback(() => {
    if (onRemove) {
      onRemove();
    }
  }, [onRemove]);

  // No accommodation + not adding = show add button
  if (!accommodation && !isAdding) {
    return (
      <Card className={cn("mb-6 border-dashed", className)}>
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center gap-3 text-center">
            <Home className="size-12 text-muted-foreground/50" />
            <div>
              <h4 className="font-medium">Brak zakwaterowania</h4>
              <p className="text-sm text-muted-foreground">Nie dodano jeszcze informacji o zakwaterowaniu</p>
            </div>
            {isEditMode && showAddButton && (
              <Button variant="outline" size="sm" onClick={handleStartAdd} className="mt-2">
                <Plus className="mr-1.5 size-4" />
                Dodaj zakwaterowanie
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Adding new accommodation
  if (isAdding) {
    return (
      <Card className={cn("mb-6 border-primary", className)}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Home className="size-5 text-primary" />
            Nowe zakwaterowanie
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2">
            {/* Name */}
            <div className="sm:col-span-2">
              <Label htmlFor={nameId} className="text-xs">
                Nazwa *
              </Label>
              <Input
                id={nameId}
                value={editedAccommodation.name}
                onChange={(e) => handleFieldChange("name", e.target.value)}
                placeholder="Nazwa hotelu/apartamentu"
                aria-invalid={!!localErrors.name}
                className="mt-1"
              />
              {localErrors.name && <p className="mt-0.5 text-xs text-destructive">{localErrors.name}</p>}
            </div>

            {/* Address */}
            <div className="sm:col-span-2">
              <Label htmlFor={addressId} className="text-xs">
                Adres *
              </Label>
              <Input
                id={addressId}
                value={editedAccommodation.address}
                onChange={(e) => handleFieldChange("address", e.target.value)}
                placeholder="Pełny adres"
                aria-invalid={!!localErrors.address}
                className="mt-1"
              />
              {localErrors.address && <p className="mt-0.5 text-xs text-destructive">{localErrors.address}</p>}
            </div>

            {/* Check-in */}
            <div>
              <Label htmlFor={checkInId} className="text-xs">
                Zameldowanie *
              </Label>
              <Input
                id={checkInId}
                type="date"
                value={editedAccommodation.check_in}
                onChange={(e) => handleFieldChange("check_in", e.target.value)}
                aria-invalid={!!localErrors.check_in}
                className="mt-1"
              />
              {localErrors.check_in && <p className="mt-0.5 text-xs text-destructive">{localErrors.check_in}</p>}
            </div>

            {/* Check-out */}
            <div>
              <Label htmlFor={checkOutId} className="text-xs">
                Wymeldowanie *
              </Label>
              <Input
                id={checkOutId}
                type="date"
                value={editedAccommodation.check_out}
                onChange={(e) => handleFieldChange("check_out", e.target.value)}
                aria-invalid={!!localErrors.check_out}
                className="mt-1"
              />
              {localErrors.check_out && <p className="mt-0.5 text-xs text-destructive">{localErrors.check_out}</p>}
            </div>

            {/* Cost */}
            <div>
              <Label htmlFor={costId} className="text-xs">
                Szacunkowy koszt (PLN)
              </Label>
              <Input
                id={costId}
                type="number"
                min={0}
                value={editedAccommodation.estimated_cost ?? ""}
                onChange={(e) =>
                  handleFieldChange("estimated_cost", e.target.value ? parseFloat(e.target.value) : undefined)
                }
                placeholder="0"
                aria-invalid={!!localErrors.estimated_cost}
                className="mt-1"
              />
              {localErrors.estimated_cost && (
                <p className="mt-0.5 text-xs text-destructive">{localErrors.estimated_cost}</p>
              )}
            </div>

            {/* Booking URL */}
            <div>
              <Label htmlFor={urlId} className="text-xs">
                Link do rezerwacji
              </Label>
              <Input
                id={urlId}
                type="url"
                value={editedAccommodation.booking_url || ""}
                onChange={(e) => handleFieldChange("booking_url", e.target.value || undefined)}
                placeholder="https://..."
                aria-invalid={!!localErrors.booking_url}
                className="mt-1"
              />
              {localErrors.booking_url && <p className="mt-0.5 text-xs text-destructive">{localErrors.booking_url}</p>}
            </div>
          </div>

          {/* Action buttons */}
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={handleCancel}>
              <X className="mr-1 size-4" />
              Anuluj
            </Button>
            <Button size="sm" onClick={handleAdd}>
              <Save className="mr-1 size-4" />
              Dodaj
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // View mode - when not in global edit mode OR not editing this card
  if (!isEditMode || !isEditing) {
    return (
      <Card className={cn("group mb-6", className)}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Home className="size-5 text-primary" />
              Zakwaterowanie
            </CardTitle>
            {isEditMode && accommodation && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleStartEdit}
                className="opacity-0 transition-opacity group-hover:opacity-100"
              >
                <Pencil className="size-4" />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {/* Name & Address */}
            <div>
              <h4 className="font-semibold">{accommodation?.name}</h4>
              <p className="text-sm text-muted-foreground">{accommodation?.address}</p>
            </div>

            {/* Dates */}
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Calendar className="size-4" />
                <span>
                  {accommodation?.check_in && accommodation?.check_out
                    ? formatDateRange(accommodation.check_in, accommodation.check_out)
                    : "Brak dat"}
                </span>
              </div>

              {accommodation?.estimated_cost !== undefined && (
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <DollarSign className="size-4" />
                  <span>{accommodation.estimated_cost} PLN</span>
                </div>
              )}
            </div>

            {/* Booking URL */}
            {accommodation?.booking_url && (
              <a
                href={accommodation.booking_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
              >
                <ExternalLink className="size-3.5" />
                Link do rezerwacji
              </a>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Edit mode - editing existing accommodation
  return (
    <Card className={cn("mb-6 border-primary", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Home className="size-5 text-primary" />
          Edycja zakwaterowania
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2">
          {/* Name */}
          <div className="sm:col-span-2">
            <Label htmlFor={nameId} className="text-xs">
              Nazwa *
            </Label>
            <Input
              id={nameId}
              value={editedAccommodation.name}
              onChange={(e) => handleFieldChange("name", e.target.value)}
              placeholder="Nazwa hotelu/apartamentu"
              aria-invalid={!!localErrors.name}
              className="mt-1"
            />
            {localErrors.name && <p className="mt-0.5 text-xs text-destructive">{localErrors.name}</p>}
          </div>

          {/* Address */}
          <div className="sm:col-span-2">
            <Label htmlFor={addressId} className="text-xs">
              Adres *
            </Label>
            <Input
              id={addressId}
              value={editedAccommodation.address}
              onChange={(e) => handleFieldChange("address", e.target.value)}
              placeholder="Pełny adres"
              aria-invalid={!!localErrors.address}
              className="mt-1"
            />
            {localErrors.address && <p className="mt-0.5 text-xs text-destructive">{localErrors.address}</p>}
          </div>

          {/* Check-in */}
          <div>
            <Label htmlFor={checkInId} className="text-xs">
              Zameldowanie *
            </Label>
            <Input
              id={checkInId}
              type="date"
              value={editedAccommodation.check_in}
              onChange={(e) => handleFieldChange("check_in", e.target.value)}
              aria-invalid={!!localErrors.check_in}
              className="mt-1"
            />
            {localErrors.check_in && <p className="mt-0.5 text-xs text-destructive">{localErrors.check_in}</p>}
          </div>

          {/* Check-out */}
          <div>
            <Label htmlFor={checkOutId} className="text-xs">
              Wymeldowanie *
            </Label>
            <Input
              id={checkOutId}
              type="date"
              value={editedAccommodation.check_out}
              onChange={(e) => handleFieldChange("check_out", e.target.value)}
              aria-invalid={!!localErrors.check_out}
              className="mt-1"
            />
            {localErrors.check_out && <p className="mt-0.5 text-xs text-destructive">{localErrors.check_out}</p>}
          </div>

          {/* Cost */}
          <div>
            <Label htmlFor={costId} className="text-xs">
              Szacunkowy koszt (PLN)
            </Label>
            <Input
              id={costId}
              type="number"
              min={0}
              value={editedAccommodation.estimated_cost ?? ""}
              onChange={(e) =>
                handleFieldChange("estimated_cost", e.target.value ? parseFloat(e.target.value) : undefined)
              }
              placeholder="0"
              aria-invalid={!!localErrors.estimated_cost}
              className="mt-1"
            />
            {localErrors.estimated_cost && (
              <p className="mt-0.5 text-xs text-destructive">{localErrors.estimated_cost}</p>
            )}
          </div>

          {/* Booking URL */}
          <div>
            <Label htmlFor={urlId} className="text-xs">
              Link do rezerwacji
            </Label>
            <Input
              id={urlId}
              type="url"
              value={editedAccommodation.booking_url || ""}
              onChange={(e) => handleFieldChange("booking_url", e.target.value || undefined)}
              placeholder="https://..."
              aria-invalid={!!localErrors.booking_url}
              className="mt-1"
            />
            {localErrors.booking_url && <p className="mt-0.5 text-xs text-destructive">{localErrors.booking_url}</p>}
          </div>
        </div>

        {/* Action buttons */}
        <div className="mt-4 flex justify-between">
          {showRemoveButton && onRemove && (
            <Button variant="ghost" size="sm" onClick={handleRemove} className="text-destructive hover:text-destructive">
              <Trash2 className="mr-1 size-4" />
              Usuń
            </Button>
          )}
          <div className="flex gap-2 ml-auto">
            <Button variant="outline" size="sm" onClick={handleCancel}>
              <X className="mr-1 size-4" />
              Anuluj
            </Button>
            <Button size="sm" onClick={handleSave}>
              <Save className="mr-1 size-4" />
              Zapisz
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export const AccommodationCard = memo(AccommodationCardComponent);
