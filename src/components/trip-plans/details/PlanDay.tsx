/**
 * PlanDay component
 * Displays a single day with its activities
 */

import { memo, useState, useCallback, useId } from "react";
import { Plus, Trash2, Calendar, X, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ActivityCard } from "./ActivityCard";
import type { ActivityDto } from "../../../types";
import type { PlanDayProps, ValidationErrors } from "./types";

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
 * Validates new activity
 */
function validateNewActivity(activity: ActivityDto): ValidationErrors {
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

function PlanDayComponent({
  day,
  date,
  activities,
  dayIndex,
  isEditMode,
  onUpdateActivity,
  onDeleteActivity,
  onAddActivity,
  onDeleteDay,
}: PlanDayProps) {
  const [isAddingActivity, setIsAddingActivity] = useState(false);
  const [newActivity, setNewActivity] = useState<ActivityDto>(emptyActivity);
  const [newActivityErrors, setNewActivityErrors] = useState<ValidationErrors>({});

  const timeId = useId();
  const titleId = useId();
  const descriptionId = useId();
  const locationId = useId();

  const handleActivityUpdate = useCallback(
    (activityIndex: number, activity: ActivityDto) => {
      onUpdateActivity(dayIndex, activityIndex, activity);
    },
    [dayIndex, onUpdateActivity]
  );

  const handleActivityDelete = useCallback(
    (activityIndex: number) => {
      // Prevent deleting last activity
      if (activities.length <= 1) {
        return;
      }
      onDeleteActivity(dayIndex, activityIndex);
    },
    [dayIndex, activities.length, onDeleteActivity]
  );

  const handleStartAddActivity = useCallback(() => {
    setNewActivity({ ...emptyActivity });
    setNewActivityErrors({});
    setIsAddingActivity(true);
  }, []);

  const handleCancelAddActivity = useCallback(() => {
    setIsAddingActivity(false);
    setNewActivity(emptyActivity);
    setNewActivityErrors({});
  }, []);

  const handleNewActivityChange = useCallback((field: keyof ActivityDto, value: string) => {
    setNewActivity((prev) => ({ ...prev, [field]: value }));
    setNewActivityErrors((prev) => Object.fromEntries(Object.entries(prev).filter(([key]) => key !== field)));
  }, []);

  const handleSaveNewActivity = useCallback(() => {
    const errors = validateNewActivity(newActivity);
    if (Object.keys(errors).length > 0) {
      setNewActivityErrors(errors);
      return;
    }
    onAddActivity(dayIndex, newActivity);
    setIsAddingActivity(false);
    setNewActivity(emptyActivity);
    setNewActivityErrors({});
  }, [dayIndex, newActivity, onAddActivity]);

  const handleDeleteDay = useCallback(() => {
    onDeleteDay(dayIndex);
  }, [dayIndex, onDeleteDay]);

  return (
    <Card className="mb-6">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Calendar className="size-5 text-primary" />
            <span>
              Dzień {day} - {formatDate(date)}
            </span>
          </CardTitle>
          {isEditMode && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDeleteDay}
              className="text-destructive hover:text-destructive"
              title="Usuń dzień"
            >
              <Trash2 className="size-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Activities list */}
        {activities.map((activity, activityIndex) => (
          <ActivityCard
            key={`${dayIndex}-${activityIndex}-${activity.time}`}
            activity={activity}
            isEditMode={isEditMode}
            onUpdate={(updated) => handleActivityUpdate(activityIndex, updated)}
            onDelete={() => handleActivityDelete(activityIndex)}
          />
        ))}

        {/* Add activity form */}
        {isEditMode && isAddingActivity && (
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

        {/* Add activity button */}
        {isEditMode && !isAddingActivity && (
          <Button variant="outline" size="sm" onClick={handleStartAddActivity} className="w-full border-dashed">
            <Plus className="mr-1.5 size-4" />
            Dodaj aktywność
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export const PlanDay = memo(PlanDayComponent);
