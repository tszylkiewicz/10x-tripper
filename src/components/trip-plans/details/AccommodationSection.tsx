/**
 * AccommodationSection component
 * Displays and manages accommodation information for the trip plan
 */

import { memo, useState, useCallback, useId } from "react";
import { Hotel, MapPin, Calendar, DollarSign, ExternalLink, Plus, Trash2, Save, X, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AccommodationDto } from "../../../types";
import type { AccommodationSectionProps, ValidationErrors } from "./types";

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
 * Validates URL format
 */
function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
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

  if (accommodation.estimated_cost !== undefined && accommodation.estimated_cost < 0) {
    errors.estimated_cost = "Koszt musi być >= 0";
  }

  if (accommodation.booking_url && !isValidUrl(accommodation.booking_url)) {
    errors.booking_url = "Nieprawidłowy format URL";
  }

  return errors;
}

/**
 * Empty accommodation template
 */
const emptyAccommodation: AccommodationDto = {
  name: "",
  address: "",
  check_in: "",
  check_out: "",
};

function AccommodationSectionComponent({
  accommodation,
  isEditMode,
  onUpdate,
  onRemove,
  onAdd,
}: AccommodationSectionProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [editedAccommodation, setEditedAccommodation] = useState<AccommodationDto>(accommodation || emptyAccommodation);
  const [localErrors, setLocalErrors] = useState<ValidationErrors>({});

  const nameId = useId();
  const addressId = useId();
  const checkInId = useId();
  const checkOutId = useId();
  const costId = useId();
  const urlId = useId();

  const handleFieldChange = useCallback((field: keyof AccommodationDto, value: string | number | undefined) => {
    setEditedAccommodation((prev) => ({ ...prev, [field]: value }));
    setLocalErrors((prev) => Object.fromEntries(Object.entries(prev).filter(([key]) => key !== field)));
  }, []);

  const handleSave = useCallback(() => {
    const errors = validateAccommodation(editedAccommodation);
    if (Object.keys(errors).length > 0) {
      setLocalErrors(errors);
      return;
    }

    if (isAdding) {
      onAdd(editedAccommodation);
      setIsAdding(false);
    } else {
      onUpdate(editedAccommodation);
      setIsEditing(false);
    }
    setLocalErrors({});
  }, [editedAccommodation, isAdding, onAdd, onUpdate]);

  const handleCancel = useCallback(() => {
    setEditedAccommodation(accommodation || emptyAccommodation);
    setIsEditing(false);
    setIsAdding(false);
    setLocalErrors({});
  }, [accommodation]);

  const handleStartEdit = useCallback(() => {
    if (accommodation) {
      setEditedAccommodation(accommodation);
    }
    setIsEditing(true);
  }, [accommodation]);

  const handleStartAdd = useCallback(() => {
    setEditedAccommodation(emptyAccommodation);
    setIsAdding(true);
  }, []);

  const handleRemove = useCallback(() => {
    onRemove();
  }, [onRemove]);

  // No accommodation and not in edit mode - show nothing
  if (!accommodation && !isEditMode) {
    return null;
  }

  // No accommodation but in edit mode - show add button or add form
  if (!accommodation && isEditMode) {
    if (isAdding) {
      return (
        <Card className="mt-6 border-dashed border-primary">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Hotel className="size-5 text-primary" />
              Nowe zakwaterowanie
            </CardTitle>
          </CardHeader>
          <CardContent>
            <AccommodationForm
              accommodation={editedAccommodation}
              errors={localErrors}
              ids={{ nameId, addressId, checkInId, checkOutId, costId, urlId }}
              onFieldChange={handleFieldChange}
              onSave={handleSave}
              onCancel={handleCancel}
            />
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="mt-6">
        <Button variant="outline" onClick={handleStartAdd} className="w-full border-dashed">
          <Plus className="mr-1.5 size-4" />
          Dodaj zakwaterowanie
        </Button>
      </div>
    );
  }

  // Has accommodation - show view or edit
  if (isEditMode && isEditing) {
    return (
      <Card className="mt-6 border-primary">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Hotel className="size-5 text-primary" />
            Edycja zakwaterowania
          </CardTitle>
        </CardHeader>
        <CardContent>
          <AccommodationForm
            accommodation={editedAccommodation}
            errors={localErrors}
            ids={{ nameId, addressId, checkInId, checkOutId, costId, urlId }}
            onFieldChange={handleFieldChange}
            onSave={handleSave}
            onCancel={handleCancel}
            onRemove={handleRemove}
          />
        </CardContent>
      </Card>
    );
  }

  // View mode - accommodation is guaranteed to exist at this point
  const displayAccommodation = accommodation as AccommodationDto;

  return (
    <Card className="group mt-6">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Hotel className="size-5 text-primary" />
            Zakwaterowanie
          </CardTitle>
          {isEditMode && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleStartEdit}
              className="opacity-0 transition-opacity group-hover:opacity-100"
            >
              <Pencil className="mr-1 size-4" />
              Edytuj
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div>
            <h4 className="font-semibold">{displayAccommodation.name}</h4>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
              <MapPin className="size-4" />
              {displayAccommodation.address}
            </p>
          </div>

          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Calendar className="size-4" />
              <span>
                {formatDate(displayAccommodation.check_in)} - {formatDate(displayAccommodation.check_out)}
              </span>
            </div>

            {displayAccommodation.estimated_cost !== undefined && (
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <DollarSign className="size-4" />
                <span>{displayAccommodation.estimated_cost} PLN</span>
              </div>
            )}
          </div>

          {displayAccommodation.booking_url && (
            <a
              href={displayAccommodation.booking_url}
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

/**
 * Accommodation form sub-component
 */
interface AccommodationFormProps {
  accommodation: AccommodationDto;
  errors: ValidationErrors;
  ids: {
    nameId: string;
    addressId: string;
    checkInId: string;
    checkOutId: string;
    costId: string;
    urlId: string;
  };
  onFieldChange: (field: keyof AccommodationDto, value: string | number | undefined) => void;
  onSave: () => void;
  onCancel: () => void;
  onRemove?: () => void;
}

function AccommodationForm({
  accommodation,
  errors,
  ids,
  onFieldChange,
  onSave,
  onCancel,
  onRemove,
}: AccommodationFormProps) {
  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2">
        {/* Name */}
        <div className="sm:col-span-2">
          <Label htmlFor={ids.nameId} className="text-xs">
            Nazwa *
          </Label>
          <Input
            id={ids.nameId}
            value={accommodation.name}
            onChange={(e) => onFieldChange("name", e.target.value)}
            placeholder="np. Hotel Marriott"
            aria-invalid={!!errors.name}
            className="mt-1"
          />
          {errors.name && <p className="mt-0.5 text-xs text-destructive">{errors.name}</p>}
        </div>

        {/* Address */}
        <div className="sm:col-span-2">
          <Label htmlFor={ids.addressId} className="text-xs">
            Adres *
          </Label>
          <Input
            id={ids.addressId}
            value={accommodation.address}
            onChange={(e) => onFieldChange("address", e.target.value)}
            placeholder="ul. Przykładowa 1, 00-001 Warszawa"
            aria-invalid={!!errors.address}
            className="mt-1"
          />
          {errors.address && <p className="mt-0.5 text-xs text-destructive">{errors.address}</p>}
        </div>

        {/* Check-in */}
        <div>
          <Label htmlFor={ids.checkInId} className="text-xs">
            Data zameldowania *
          </Label>
          <Input
            id={ids.checkInId}
            type="date"
            value={accommodation.check_in}
            onChange={(e) => onFieldChange("check_in", e.target.value)}
            aria-invalid={!!errors.check_in}
            className="mt-1"
          />
          {errors.check_in && <p className="mt-0.5 text-xs text-destructive">{errors.check_in}</p>}
        </div>

        {/* Check-out */}
        <div>
          <Label htmlFor={ids.checkOutId} className="text-xs">
            Data wymeldowania *
          </Label>
          <Input
            id={ids.checkOutId}
            type="date"
            value={accommodation.check_out}
            onChange={(e) => onFieldChange("check_out", e.target.value)}
            min={accommodation.check_in}
            aria-invalid={!!errors.check_out}
            className="mt-1"
          />
          {errors.check_out && <p className="mt-0.5 text-xs text-destructive">{errors.check_out}</p>}
        </div>

        {/* Estimated cost */}
        <div>
          <Label htmlFor={ids.costId} className="text-xs">
            Szacunkowy koszt (PLN)
          </Label>
          <Input
            id={ids.costId}
            type="number"
            min={0}
            value={accommodation.estimated_cost ?? ""}
            onChange={(e) => onFieldChange("estimated_cost", e.target.value ? parseFloat(e.target.value) : undefined)}
            placeholder="0"
            aria-invalid={!!errors.estimated_cost}
            className="mt-1"
          />
          {errors.estimated_cost && <p className="mt-0.5 text-xs text-destructive">{errors.estimated_cost}</p>}
        </div>

        {/* Booking URL */}
        <div>
          <Label htmlFor={ids.urlId} className="text-xs">
            Link do rezerwacji
          </Label>
          <Input
            id={ids.urlId}
            type="url"
            value={accommodation.booking_url || ""}
            onChange={(e) => onFieldChange("booking_url", e.target.value || undefined)}
            placeholder="https://booking.com/..."
            aria-invalid={!!errors.booking_url}
            className="mt-1"
          />
          {errors.booking_url && <p className="mt-0.5 text-xs text-destructive">{errors.booking_url}</p>}
        </div>
      </div>

      {/* Action buttons */}
      <div className="mt-4 flex justify-between">
        {onRemove && (
          <Button variant="ghost" size="sm" onClick={onRemove} className="text-destructive hover:text-destructive">
            <Trash2 className="mr-1 size-4" />
            Usuń
          </Button>
        )}
        <div className={`flex gap-2 ${onRemove ? "" : "ml-auto"}`}>
          <Button variant="outline" size="sm" onClick={onCancel}>
            <X className="mr-1 size-4" />
            Anuluj
          </Button>
          <Button size="sm" onClick={onSave}>
            <Save className="mr-1 size-4" />
            Zapisz
          </Button>
        </div>
      </div>
    </>
  );
}

export const AccommodationSection = memo(AccommodationSectionComponent);
