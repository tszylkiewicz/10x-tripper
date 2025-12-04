/**
 * Shared DayCard component
 *
 * Universal day container used in both create and details flows.
 * Manages activities with add/edit/delete operations.
 *
 * Usage:
 * - Create flow: <DayCard onUpdate={(day) => ...} onRemove={() => ...} />
 * - Details flow: <DayCard onUpdateActivity={(dayIdx, actIdx, act) => ...} ... />
 */

import { memo, useState, useCallback, useId } from "react";
import { Plus, Trash2, Calendar, X, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/utils/date-formatting";
import { validateActivity } from "@/lib/utils/activity-validation";
import { EMPTY_ACTIVITY, MIN_ACTIVITIES_PER_DAY } from "@/lib/utils/trip-plan-constants";
import { ActivityCard } from "./ActivityCard";
import type { ActivityDto } from "../../../types";
import type { DayCardProps, ValidationErrors } from "./types";

function DayCardComponent({
  day,
  dayIndex = 0,
  isEditMode = true,
  showDeleteButton,
  onUpdate,
  onUpdateActivity,
  onDeleteActivity,
  onAddActivity,
  onDeleteDay,
  className,
}: DayCardProps) {
  const [isAddingActivity, setIsAddingActivity] = useState(false);
  const [newActivity, setNewActivity] = useState<ActivityDto>(EMPTY_ACTIVITY);
  const [newActivityErrors, setNewActivityErrors] = useState<ValidationErrors>({});

  const timeId = useId();
  const titleId = useId();
  const descriptionId = useId();
  const locationId = useId();

  // Determine which callback pattern to use
  const isUnifiedMode = !!onUpdate; // Create flow uses single onUpdate callback
  const isGranularMode = !!onUpdateActivity; // Details flow uses granular callbacks

  // Adapter: Convert granular operation to unified update
  const handleActivityUpdate = useCallback(
    (activityIndex: number, activity: ActivityDto) => {
      if (isUnifiedMode && onUpdate) {
        // Create flow - update entire day
        const updatedActivities = [...day.activities];
        updatedActivities[activityIndex] = activity;
        onUpdate({ ...day, activities: updatedActivities });
      } else if (isGranularMode && onUpdateActivity) {
        // Details flow - granular callback
        onUpdateActivity(dayIndex, activityIndex, activity);
      }
    },
    [day, dayIndex, isUnifiedMode, isGranularMode, onUpdate, onUpdateActivity]
  );

  // Adapter: Convert granular delete to unified update
  const handleActivityDelete = useCallback(
    (activityIndex: number) => {
      // Business rule: prevent deleting last activity
      if (day.activities.length <= MIN_ACTIVITIES_PER_DAY) {
        return;
      }

      if (isUnifiedMode && onUpdate) {
        // Create flow - update entire day
        const updatedActivities = day.activities.filter((_, i) => i !== activityIndex);
        onUpdate({ ...day, activities: updatedActivities });
      } else if (isGranularMode && onDeleteActivity) {
        // Details flow - granular callback
        onDeleteActivity(dayIndex, activityIndex);
      }
    },
    [day, dayIndex, isUnifiedMode, isGranularMode, onUpdate, onDeleteActivity]
  );

  const handleStartAddActivity = useCallback(() => {
    setNewActivity({ ...EMPTY_ACTIVITY });
    setNewActivityErrors({});
    setIsAddingActivity(true);
  }, []);

  const handleCancelAddActivity = useCallback(() => {
    setIsAddingActivity(false);
    setNewActivity(EMPTY_ACTIVITY);
    setNewActivityErrors({});
  }, []);

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

    if (isUnifiedMode && onUpdate) {
      // Create flow - update entire day
      onUpdate({ ...day, activities: [...day.activities, newActivity] });
    } else if (isGranularMode && onAddActivity) {
      // Details flow - granular callback
      onAddActivity(dayIndex, newActivity);
    }

    setIsAddingActivity(false);
    setNewActivity(EMPTY_ACTIVITY);
    setNewActivityErrors({});
  }, [day, dayIndex, newActivity, isUnifiedMode, isGranularMode, onUpdate, onAddActivity]);

  const handleDeleteDay = useCallback(() => {
    if (onDeleteDay) {
      onDeleteDay(dayIndex);
    }
  }, [dayIndex, onDeleteDay]);

  // Determine if delete button should be shown
  const shouldShowDeleteButton = showDeleteButton ?? isEditMode;

  return (
    <Card className={cn("mb-6", className)}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Calendar className="size-5 text-primary" />
            <span>
              Dzień {day.day} - {formatDate(day.date)}
            </span>
          </CardTitle>
          {shouldShowDeleteButton && onDeleteDay && (
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
        {day.activities.map((activity, activityIndex) => (
          <ActivityCard
            key={`${day.day}-${activityIndex}-${activity.time}`}
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

export const DayCard = memo(DayCardComponent);
