/**
 * Shared ActivityCard component
 *
 * Universal activity card used in both create and details flows.
 * Supports view and edit modes with validation.
 *
 * Usage:
 * - Create flow: <ActivityCard isEditMode={true} showEditButton={true} ... />
 * - Details flow: <ActivityCard isEditMode={globalEditMode} ... />
 */

import { memo, useState, useCallback, useId } from "react";
import { Clock, MapPin, Timer, DollarSign, Tag, Trash2, Save, X, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { validateActivity } from "@/lib/utils/activity-validation";
import type { ActivityDto } from "../../../types";
import type { ActivityCardProps, ValidationErrors } from "./types";

function ActivityCardComponent({
  activity,
  isEditMode = true,
  showEditButton = true,
  onUpdate,
  onDelete,
  className,
}: ActivityCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedActivity, setEditedActivity] = useState<ActivityDto>(activity);
  const [localErrors, setLocalErrors] = useState<ValidationErrors>({});

  const timeId = useId();
  const titleId = useId();
  const descriptionId = useId();
  const locationId = useId();
  const durationId = useId();
  const costId = useId();
  const categoryId = useId();

  const handleFieldChange = useCallback((field: keyof ActivityDto, value: string | number | undefined) => {
    setEditedActivity((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field
    setLocalErrors((prev) => Object.fromEntries(Object.entries(prev).filter(([key]) => key !== field)));
  }, []);

  const handleSave = useCallback(() => {
    const errors = validateActivity(editedActivity);
    if (Object.keys(errors).length > 0) {
      setLocalErrors(errors);
      return;
    }
    onUpdate(editedActivity);
    setIsEditing(false);
    setLocalErrors({});
  }, [editedActivity, onUpdate]);

  const handleCancel = useCallback(() => {
    setEditedActivity(activity);
    setIsEditing(false);
    setLocalErrors({});
  }, [activity]);

  const handleStartEdit = useCallback(() => {
    setEditedActivity(activity);
    setIsEditing(true);
  }, [activity]);

  // View mode - when not in global edit mode OR not editing this specific card
  if (!isEditMode || !isEditing) {
    return (
      <Card className={cn("group relative", className)}>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            {/* Time badge */}
            <div className="flex shrink-0 items-center gap-1 rounded-md bg-primary/10 px-2 py-1 text-sm font-medium text-primary">
              <Clock className="size-3.5" />
              {activity.time}
            </div>

            {/* Content */}
            <div className="min-w-0 flex-1">
              <h4 className="font-semibold">{activity.title}</h4>
              <p className="mt-1 text-sm text-muted-foreground">{activity.description}</p>

              <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <MapPin className="size-3" />
                  {activity.location}
                </span>
                {activity.duration && (
                  <span className="flex items-center gap-1">
                    <Timer className="size-3" />
                    {activity.duration}
                  </span>
                )}
                {activity.estimated_cost !== undefined && (
                  <span className="flex items-center gap-1">
                    <DollarSign className="size-3" />
                    {activity.estimated_cost} PLN
                  </span>
                )}
                {activity.category && (
                  <span className="flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5">
                    <Tag className="size-3" />
                    {activity.category}
                  </span>
                )}
              </div>
            </div>

            {/* Edit button - only visible when in edit mode and showEditButton is true */}
            {isEditMode && showEditButton && (
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
        </CardContent>
      </Card>
    );
  }

  // Edit mode - editing this specific activity
  return (
    <Card className={cn("border-primary", className)}>
      <CardContent className="p-4">
        <div className="grid gap-3 sm:grid-cols-2">
          {/* Time */}
          <div>
            <Label htmlFor={timeId} className="text-xs">
              Godzina *
            </Label>
            <Input
              id={timeId}
              type="time"
              value={editedActivity.time}
              onChange={(e) => handleFieldChange("time", e.target.value)}
              aria-invalid={!!localErrors.time}
              className="mt-1"
            />
            {localErrors.time && <p className="mt-0.5 text-xs text-destructive">{localErrors.time}</p>}
          </div>

          {/* Title */}
          <div>
            <Label htmlFor={titleId} className="text-xs">
              Tytuł *
            </Label>
            <Input
              id={titleId}
              value={editedActivity.title}
              onChange={(e) => handleFieldChange("title", e.target.value)}
              placeholder="Nazwa aktywności"
              aria-invalid={!!localErrors.title}
              className="mt-1"
            />
            {localErrors.title && <p className="mt-0.5 text-xs text-destructive">{localErrors.title}</p>}
          </div>

          {/* Description */}
          <div className="sm:col-span-2">
            <Label htmlFor={descriptionId} className="text-xs">
              Opis *
            </Label>
            <Input
              id={descriptionId}
              value={editedActivity.description}
              onChange={(e) => handleFieldChange("description", e.target.value)}
              placeholder="Opis aktywności"
              aria-invalid={!!localErrors.description}
              className="mt-1"
            />
            {localErrors.description && <p className="mt-0.5 text-xs text-destructive">{localErrors.description}</p>}
          </div>

          {/* Location */}
          <div className="sm:col-span-2">
            <Label htmlFor={locationId} className="text-xs">
              Lokalizacja *
            </Label>
            <Input
              id={locationId}
              value={editedActivity.location}
              onChange={(e) => handleFieldChange("location", e.target.value)}
              placeholder="Adres lub nazwa miejsca"
              aria-invalid={!!localErrors.location}
              className="mt-1"
            />
            {localErrors.location && <p className="mt-0.5 text-xs text-destructive">{localErrors.location}</p>}
          </div>

          {/* Duration */}
          <div>
            <Label htmlFor={durationId} className="text-xs">
              Czas trwania
            </Label>
            <Input
              id={durationId}
              value={editedActivity.duration || ""}
              onChange={(e) => handleFieldChange("duration", e.target.value || undefined)}
              placeholder="np. 2 godziny"
              className="mt-1"
            />
          </div>

          {/* Estimated cost */}
          <div>
            <Label htmlFor={costId} className="text-xs">
              Szacunkowy koszt (PLN)
            </Label>
            <Input
              id={costId}
              type="number"
              min={0}
              value={editedActivity.estimated_cost ?? ""}
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

          {/* Category */}
          <div className="sm:col-span-2">
            <Label htmlFor={categoryId} className="text-xs">
              Kategoria
            </Label>
            <Input
              id={categoryId}
              value={editedActivity.category || ""}
              onChange={(e) => handleFieldChange("category", e.target.value || undefined)}
              placeholder="np. Zwiedzanie, Jedzenie, Transport"
              className="mt-1"
            />
          </div>
        </div>

        {/* Action buttons */}
        <div className="mt-4 flex justify-between">
          <Button variant="ghost" size="sm" onClick={onDelete} className="text-destructive hover:text-destructive">
            <Trash2 className="mr-1 size-4" />
            Usuń
          </Button>
          <div className="flex gap-2">
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

export const ActivityCard = memo(ActivityCardComponent);
