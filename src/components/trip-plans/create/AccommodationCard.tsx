/**
 * AccommodationCard component for Create Trip Plan view
 * Simplified version for viewing/editing accommodation in generated plan
 */

import { memo, useState, useCallback, useId } from "react";
import { Hotel, MapPin, Calendar, DollarSign, ExternalLink, Pencil, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AccommodationDto } from "../../../types";
import type { AccommodationCardProps } from "./types";

type ValidationErrors = Record<string, string>;

/**
 * Formats date to Polish locale display
 */
function formatDate(dateString: string): string {
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
 * Validates accommodation fields
 */
function validateAccommodation(accommodation: AccommodationDto): ValidationErrors {
  const errors: ValidationErrors = {};

  if (!accommodation.name?.trim()) {
    errors.name = "Nazwa zakwaterowania jest wymagana";
  }
  if (!accommodation.address?.trim()) {
    errors.address = "Adres jest wymagany";
  }
  if (!accommodation.check_in?.trim()) {
    errors.check_in = "Data zameldowania jest wymagana";
  }
  if (!accommodation.check_out?.trim()) {
    errors.check_out = "Data wymeldowania jest wymagana";
  } else if (accommodation.check_in && accommodation.check_out < accommodation.check_in) {
    errors.check_out = "Data wymeldowania musi być >= data zameldowania";
  }

  return errors;
}

function AccommodationCardComponent({ accommodation, onUpdate }: AccommodationCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedAccommodation, setEditedAccommodation] = useState<AccommodationDto>(accommodation);
  const [errors, setErrors] = useState<ValidationErrors>({});

  const nameId = useId();
  const addressId = useId();
  const checkInId = useId();
  const checkOutId = useId();
  const costId = useId();
  const urlId = useId();

  const handleFieldChange = useCallback((field: keyof AccommodationDto, value: string | number | undefined) => {
    setEditedAccommodation((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => Object.fromEntries(Object.entries(prev).filter(([key]) => key !== field)));
  }, []);

  const handleSave = useCallback(() => {
    const validationErrors = validateAccommodation(editedAccommodation);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    onUpdate(editedAccommodation);
    setIsEditing(false);
    setErrors({});
  }, [editedAccommodation, onUpdate]);

  const handleCancel = useCallback(() => {
    setEditedAccommodation(accommodation);
    setIsEditing(false);
    setErrors({});
  }, [accommodation]);

  if (isEditing) {
    return (
      <Card className="border-primary">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Hotel className="size-5 text-primary" />
            Edycja zakwaterowania
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label htmlFor={nameId} className="text-xs">
                Nazwa *
              </Label>
              <Input
                id={nameId}
                value={editedAccommodation.name}
                onChange={(e) => handleFieldChange("name", e.target.value)}
                placeholder="np. Hotel Marriott"
                aria-invalid={!!errors.name}
                className="mt-1"
              />
              {errors.name && <p className="mt-0.5 text-xs text-destructive">{errors.name}</p>}
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor={addressId} className="text-xs">
                Adres *
              </Label>
              <Input
                id={addressId}
                value={editedAccommodation.address}
                onChange={(e) => handleFieldChange("address", e.target.value)}
                placeholder="ul. Przykładowa 1, 00-001 Warszawa"
                aria-invalid={!!errors.address}
                className="mt-1"
              />
              {errors.address && <p className="mt-0.5 text-xs text-destructive">{errors.address}</p>}
            </div>
            <div>
              <Label htmlFor={checkInId} className="text-xs">
                Data zameldowania *
              </Label>
              <Input
                id={checkInId}
                type="date"
                value={editedAccommodation.check_in}
                onChange={(e) => handleFieldChange("check_in", e.target.value)}
                aria-invalid={!!errors.check_in}
                className="mt-1"
              />
              {errors.check_in && <p className="mt-0.5 text-xs text-destructive">{errors.check_in}</p>}
            </div>
            <div>
              <Label htmlFor={checkOutId} className="text-xs">
                Data wymeldowania *
              </Label>
              <Input
                id={checkOutId}
                type="date"
                value={editedAccommodation.check_out}
                onChange={(e) => handleFieldChange("check_out", e.target.value)}
                min={editedAccommodation.check_in}
                aria-invalid={!!errors.check_out}
                className="mt-1"
              />
              {errors.check_out && <p className="mt-0.5 text-xs text-destructive">{errors.check_out}</p>}
            </div>
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
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor={urlId} className="text-xs">
                Link do rezerwacji
              </Label>
              <Input
                id={urlId}
                type="url"
                value={editedAccommodation.booking_url || ""}
                onChange={(e) => handleFieldChange("booking_url", e.target.value || undefined)}
                placeholder="https://booking.com/..."
                className="mt-1"
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={handleCancel}>
              <X className="mr-1 size-4" />
              Anuluj
            </Button>
            <Button size="sm" onClick={handleSave}>
              <Save className="mr-1 size-4" />
              Zapisz
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="group">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Hotel className="size-5 text-primary" />
            Zakwaterowanie
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsEditing(true)}
            className="opacity-0 transition-opacity group-hover:opacity-100"
          >
            <Pencil className="mr-1 size-4" />
            Edytuj
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div>
            <h4 className="font-semibold">{accommodation.name}</h4>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
              <MapPin className="size-4" />
              {accommodation.address}
            </p>
          </div>
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Calendar className="size-4" />
              <span>
                {formatDate(accommodation.check_in)} - {formatDate(accommodation.check_out)}
              </span>
            </div>
            {accommodation.estimated_cost !== undefined && (
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <DollarSign className="size-4" />
                <span>{accommodation.estimated_cost} PLN</span>
              </div>
            )}
          </div>
          {accommodation.booking_url && (
            <a
              href={accommodation.booking_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
            >
              <ExternalLink className="size-4" />
              Link do rezerwacji
            </a>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export const AccommodationCard = memo(AccommodationCardComponent);
