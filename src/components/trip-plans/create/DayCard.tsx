/**
 * DayCard component for Create Trip Plan view
 * Simplified version always in edit mode
 */

import { memo, useState, useCallback, useId } from "react";
import { Plus, Trash2, Calendar, X, Save, Clock, MapPin, Timer, DollarSign, Tag, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ActivityDto } from "../../../types";
import type { DayCardProps, CreateActivityCardProps } from "./types";

/**
 * Formats date to Polish locale display
 */
function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return date.toLocaleDateString("pl-PL", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
  } catch {
    return dateString;
  }
}

/**
 * Empty activity template
 */
const emptyActivity: ActivityDto = {
  time: "09:00",
  title: "",
  description: "",
  location: "",
};

/**
 * Validation errors type
 */
type ValidationErrors = Record<string, string>;

/**
 * Validates activity fields
 */
function validateActivity(activity: ActivityDto): ValidationErrors {
  const errors: ValidationErrors = {};

  if (!activity.time?.trim()) {
    errors.time = "Godzina jest wymagana";
  }
  if (!activity.title?.trim()) {
    errors.title = "Tytuł jest wymagany";
  }
  if (!activity.description?.trim()) {
    errors.description = "Opis jest wymagany";
  }
  if (!activity.location?.trim()) {
    errors.location = "Lokalizacja jest wymagana";
  }

  return errors;
}

/**
 * ActivityItem - displays a single activity with edit capability
 */
const ActivityItem = memo(function ActivityItem({ activity, onUpdate, onRemove }: CreateActivityCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedActivity, setEditedActivity] = useState<ActivityDto>(activity);
  const [errors, setErrors] = useState<ValidationErrors>({});

  const timeId = useId();
  const titleId = useId();
  const descriptionId = useId();
  const locationId = useId();

  const handleFieldChange = useCallback((field: keyof ActivityDto, value: string | number | undefined) => {
    setEditedActivity((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => Object.fromEntries(Object.entries(prev).filter(([key]) => key !== field)));
  }, []);

  const handleSave = useCallback(() => {
    const validationErrors = validateActivity(editedActivity);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    onUpdate(editedActivity);
    setIsEditing(false);
    setErrors({});
  }, [editedActivity, onUpdate]);

  const handleCancel = useCallback(() => {
    setEditedActivity(activity);
    setIsEditing(false);
    setErrors({});
  }, [activity]);

  if (isEditing) {
    return (
      <Card className="border-primary">
        <CardContent className="p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor={timeId} className="text-xs">
                Godzina *
              </Label>
              <Input
                id={timeId}
                type="time"
                value={editedActivity.time}
                onChange={(e) => handleFieldChange("time", e.target.value)}
                aria-invalid={!!errors.time}
                className="mt-1"
              />
              {errors.time && <p className="mt-0.5 text-xs text-destructive">{errors.time}</p>}
            </div>
            <div>
              <Label htmlFor={titleId} className="text-xs">
                Tytuł *
              </Label>
              <Input
                id={titleId}
                value={editedActivity.title}
                onChange={(e) => handleFieldChange("title", e.target.value)}
                placeholder="Nazwa aktywności"
                aria-invalid={!!errors.title}
                className="mt-1"
              />
              {errors.title && <p className="mt-0.5 text-xs text-destructive">{errors.title}</p>}
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor={descriptionId} className="text-xs">
                Opis *
              </Label>
              <Input
                id={descriptionId}
                value={editedActivity.description}
                onChange={(e) => handleFieldChange("description", e.target.value)}
                placeholder="Opis aktywności"
                aria-invalid={!!errors.description}
                className="mt-1"
              />
              {errors.description && <p className="mt-0.5 text-xs text-destructive">{errors.description}</p>}
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor={locationId} className="text-xs">
                Lokalizacja *
              </Label>
              <Input
                id={locationId}
                value={editedActivity.location}
                onChange={(e) => handleFieldChange("location", e.target.value)}
                placeholder="Adres lub nazwa miejsca"
                aria-invalid={!!errors.location}
                className="mt-1"
              />
              {errors.location && <p className="mt-0.5 text-xs text-destructive">{errors.location}</p>}
            </div>
          </div>
          <div className="mt-4 flex justify-between">
            <Button variant="ghost" size="sm" onClick={onRemove} className="text-destructive hover:text-destructive">
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

  return (
    <Card className="group relative">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex shrink-0 items-center gap-1 rounded-md bg-primary/10 px-2 py-1 text-sm font-medium text-primary">
            <Clock className="size-3.5" />
            {activity.time}
          </div>
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
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsEditing(true)}
            className="opacity-0 transition-opacity group-hover:opacity-100"
          >
            <Pencil className="size-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
});

/**
 * DayCard component
 */
function DayCardComponent({ day, onUpdate, onRemove }: DayCardProps) {
  const [isAddingActivity, setIsAddingActivity] = useState(false);
  const [newActivity, setNewActivity] = useState<ActivityDto>(emptyActivity);
  const [newActivityErrors, setNewActivityErrors] = useState<ValidationErrors>({});

  const timeId = useId();
  const titleId = useId();
  const descriptionId = useId();
  const locationId = useId();

  const handleActivityUpdate = useCallback(
    (activityIndex: number, activity: ActivityDto) => {
      const updatedActivities = [...day.activities];
      updatedActivities[activityIndex] = activity;
      onUpdate({ ...day, activities: updatedActivities });
    },
    [day, onUpdate]
  );

  const handleActivityRemove = useCallback(
    (activityIndex: number) => {
      if (day.activities.length <= 1) return;
      const updatedActivities = day.activities.filter((_, i) => i !== activityIndex);
      onUpdate({ ...day, activities: updatedActivities });
    },
    [day, onUpdate]
  );

  const handleNewActivityChange = useCallback((field: keyof ActivityDto, value: string) => {
    setNewActivity((prev) => ({ ...prev, [field]: value }));
    setNewActivityErrors((prev) => Object.fromEntries(Object.entries(prev).filter(([key]) => key !== field)));
  }, []);

  const handleSaveNewActivity = useCallback(() => {
    const errors = validateActivity(newActivity);
    if (Object.keys(errors).length > 0) {
      setNewActivityErrors(errors);
      return;
    }
    onUpdate({ ...day, activities: [...day.activities, newActivity] });
    setIsAddingActivity(false);
    setNewActivity(emptyActivity);
    setNewActivityErrors({});
  }, [day, newActivity, onUpdate]);

  const handleCancelAddActivity = useCallback(() => {
    setIsAddingActivity(false);
    setNewActivity(emptyActivity);
    setNewActivityErrors({});
  }, []);

  return (
    <Card className="mb-6">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Calendar className="size-5 text-primary" />
            <span>
              Dzień {day.day} - {formatDate(day.date)}
            </span>
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onRemove}
            className="text-destructive hover:text-destructive"
            title="Usuń dzień"
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {day.activities.map((activity, index) => (
          <ActivityItem
            key={`${day.day}-${index}-${activity.time}`}
            activity={activity}
            onUpdate={(updated) => handleActivityUpdate(index, updated)}
            onRemove={() => handleActivityRemove(index)}
          />
        ))}

        {isAddingActivity && (
          <Card className="border-dashed border-primary">
            <CardContent className="p-4">
              <h5 className="mb-3 text-sm font-medium">Nowa aktywność</h5>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label htmlFor={timeId} className="text-xs">
                    Godzina *
                  </Label>
                  <Input
                    id={timeId}
                    type="time"
                    value={newActivity.time}
                    onChange={(e) => handleNewActivityChange("time", e.target.value)}
                    aria-invalid={!!newActivityErrors.time}
                    className="mt-1"
                  />
                  {newActivityErrors.time && (
                    <p className="mt-0.5 text-xs text-destructive">{newActivityErrors.time}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor={titleId} className="text-xs">
                    Tytuł *
                  </Label>
                  <Input
                    id={titleId}
                    value={newActivity.title}
                    onChange={(e) => handleNewActivityChange("title", e.target.value)}
                    placeholder="Nazwa aktywności"
                    aria-invalid={!!newActivityErrors.title}
                    className="mt-1"
                  />
                  {newActivityErrors.title && (
                    <p className="mt-0.5 text-xs text-destructive">{newActivityErrors.title}</p>
                  )}
                </div>
                <div className="sm:col-span-2">
                  <Label htmlFor={descriptionId} className="text-xs">
                    Opis *
                  </Label>
                  <Input
                    id={descriptionId}
                    value={newActivity.description}
                    onChange={(e) => handleNewActivityChange("description", e.target.value)}
                    placeholder="Opis aktywności"
                    aria-invalid={!!newActivityErrors.description}
                    className="mt-1"
                  />
                  {newActivityErrors.description && (
                    <p className="mt-0.5 text-xs text-destructive">{newActivityErrors.description}</p>
                  )}
                </div>
                <div className="sm:col-span-2">
                  <Label htmlFor={locationId} className="text-xs">
                    Lokalizacja *
                  </Label>
                  <Input
                    id={locationId}
                    value={newActivity.location}
                    onChange={(e) => handleNewActivityChange("location", e.target.value)}
                    placeholder="Adres lub nazwa miejsca"
                    aria-invalid={!!newActivityErrors.location}
                    className="mt-1"
                  />
                  {newActivityErrors.location && (
                    <p className="mt-0.5 text-xs text-destructive">{newActivityErrors.location}</p>
                  )}
                </div>
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={handleCancelAddActivity}>
                  <X className="mr-1 size-4" />
                  Anuluj
                </Button>
                <Button size="sm" onClick={handleSaveNewActivity}>
                  <Save className="mr-1 size-4" />
                  Dodaj
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {!isAddingActivity && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsAddingActivity(true)}
            className="w-full border-dashed"
          >
            <Plus className="mr-1.5 size-4" />
            Dodaj aktywność
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export const DayCard = memo(DayCardComponent);
