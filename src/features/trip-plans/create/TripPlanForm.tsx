import { useCallback, useEffect, useId, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronDown, ChevronUp, Save, Sparkles } from "lucide-react";
import { Button } from "@ui/button";
import { Input } from "@ui/input";
import { Label } from "@ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@ui/collapsible";
import { MultiSelectWithCustom } from "@ui/multi-select-with-custom";
import { tripPlanFormSchema, type TripPlanFormSchema } from "@lib/validators/tripPlanForm.validator";
import { ACTIVITY_OPTIONS, TRANSPORT_OPTIONS } from "@lib/constants/preferences.constants";
import { BUDGET_TYPE_OPTIONS, type TripPlanFormData, type TripPlanFormProps } from "./types";
import { useLoadPreference } from "./hooks/useLoadPreference";
import { SavePreferenceDialog } from "./SavePreferenceDialog";
import type { CreateUserPreferenceDto } from "@types";

/**
 * TripPlanForm component
 *
 * Form for collecting trip plan parameters before AI generation.
 * Uses react-hook-form with Zod validation for form management.
 * Supports loading preferences from templates and saving form data as preferences.
 */
export function TripPlanForm({ onSubmit, isSubmitting = false, initialData }: TripPlanFormProps) {
  const formId = useId();
  const [isPreferencesOpen, setIsPreferencesOpen] = useState(false);
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [isSavingPreference, setIsSavingPreference] = useState(false);
  const [selectedPreferenceId, setSelectedPreferenceId] = useState<string | null>(null);

  const { preferences, isLoading: isLoadingPreferences } = useLoadPreference();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isValid },
  } = useForm<TripPlanFormSchema>({
    resolver: zodResolver(tripPlanFormSchema),
    mode: "onChange",
    defaultValues: {
      destination: initialData?.destination ?? "",
      start_date: initialData?.start_date ?? "",
      end_date: initialData?.end_date ?? "",
      people_count: initialData?.people_count ?? 1,
      budget_type: initialData?.budget_type as "low" | "medium" | "high" | undefined,
      preferences: {
        transport: initialData?.preferences?.transport ?? [],
        todo: initialData?.preferences?.todo ?? [],
        avoid: initialData?.preferences?.avoid ?? [],
      },
    },
  });

  const budgetType = watch("budget_type");
  const transportValues = watch("preferences.transport") ?? [];
  const todoValues = watch("preferences.todo") ?? [];
  const avoidValues = watch("preferences.avoid") ?? [];

  const onFormSubmit = (data: TripPlanFormSchema) => {
    // Transform to TripPlanFormData and call parent handler
    const formData: TripPlanFormData = {
      ...data,
      preferences: {
        transport:
          data.preferences?.transport && data.preferences.transport.length > 0 ? data.preferences.transport : [],
        todo: data.preferences?.todo && data.preferences.todo.length > 0 ? data.preferences.todo : [],
        avoid: data.preferences?.avoid && data.preferences.avoid.length > 0 ? data.preferences.avoid : [],
      },
    };
    onSubmit(formData);
  };

  /**
   * Handle loading a preference template
   */
  const handleLoadPreference = useCallback(
    (preferenceId: string) => {
      if (!preferenceId || preferenceId === "none") {
        setSelectedPreferenceId(null);
        return;
      }

      const preference = preferences.find((p) => p.id === preferenceId);
      if (!preference) {
        return;
      }

      // Load preference data into form fields
      if (preference.people_count) {
        setValue("people_count", preference.people_count, { shouldValidate: true });
      }
      if (preference.budget_type) {
        setValue("budget_type", preference.budget_type as "low" | "medium" | "high", { shouldValidate: true });
      }
      if (preference.transport) {
        setValue("preferences.transport", preference.transport, { shouldValidate: true });
      }
      if (preference.activities_todo) {
        setValue("preferences.todo", preference.activities_todo, { shouldValidate: true });
      }
      if (preference.activities_avoid) {
        setValue("preferences.avoid", preference.activities_avoid, { shouldValidate: true });
      }

      // Expand preferences section to show loaded data
      setIsPreferencesOpen(true);
      setSelectedPreferenceId(preferenceId);
    },
    [preferences, setValue]
  );

  /**
   * Auto-load preference from URL parameter
   */
  useEffect(() => {
    // Only run once when preferences are loaded
    if (isLoadingPreferences || preferences.length === 0) {
      return;
    }

    // Check if there's a preferenceId in the URL
    const urlParams = new URLSearchParams(window.location.search);
    const preferenceId = urlParams.get("preferenceId");

    if (preferenceId && !selectedPreferenceId) {
      handleLoadPreference(preferenceId);
    }
  }, [preferences, isLoadingPreferences, selectedPreferenceId, handleLoadPreference]);

  /**
   * Handle saving form data as preference
   */
  const handleSavePreference = async (name: string) => {
    setIsSavingPreference(true);

    const formData = watch();

    const preferenceDto: CreateUserPreferenceDto = {
      name,
      people_count: formData.people_count || null,
      budget_type: formData.budget_type || null,
      transport:
        formData.preferences?.transport && formData.preferences.transport.length > 0
          ? formData.preferences.transport
          : null,
      activities_todo:
        formData.preferences?.todo && formData.preferences.todo.length > 0 ? formData.preferences.todo : null,
      activities_avoid:
        formData.preferences?.avoid && formData.preferences.avoid.length > 0 ? formData.preferences.avoid : null,
    };

    const response = await fetch("/api/user/preferences", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(preferenceDto),
    });

    if (!response.ok) {
      const error = await response.json();
      setIsSavingPreference(false);
      throw new Error(error.message || "Nie udało się zapisać preferencji");
    }

    // Success - close dialog
    setIsSavingPreference(false);
    setIsSaveDialogOpen(false);
  };

  return (
    <>
      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
        {/* Load from preferences */}
        <div className="space-y-2">
          <Label htmlFor={`${formId}-load-preference`}>Załaduj z preferencji</Label>
          <Select
            value={selectedPreferenceId || "none"}
            onValueChange={handleLoadPreference}
            disabled={isLoadingPreferences || isSubmitting}
          >
            <SelectTrigger id={`${formId}-load-preference`}>
              <SelectValue placeholder={isLoadingPreferences ? "Ładowanie..." : "Wybierz szablon"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Nie ładuj szablonu</SelectItem>
              {preferences.map((pref) => (
                <SelectItem key={pref.id} value={pref.id}>
                  {pref.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-sm text-muted-foreground">Załaduj zapisane preferencje, aby szybciej wypełnić formularz</p>
        </div>

        {/* Destination */}
        <div className="space-y-2">
          <Label htmlFor={`${formId}-destination`}>
            Cel podróży <span className="text-destructive">*</span>
          </Label>
          <Input
            id={`${formId}-destination`}
            placeholder="np. Kraków, Polska"
            {...register("destination")}
            aria-invalid={!!errors.destination}
            aria-describedby={errors.destination ? `${formId}-destination-error` : undefined}
          />
          {errors.destination && (
            <p id={`${formId}-destination-error`} className="text-sm text-destructive">
              {errors.destination.message}
            </p>
          )}
        </div>

        {/* Date range */}
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Start date */}
          <div className="space-y-2">
            <Label htmlFor={`${formId}-start-date`}>
              Data rozpoczęcia <span className="text-destructive">*</span>
            </Label>
            <Input
              id={`${formId}-start-date`}
              type="date"
              {...register("start_date")}
              aria-invalid={!!errors.start_date}
              aria-describedby={errors.start_date ? `${formId}-start-date-error` : undefined}
            />
            {errors.start_date && (
              <p id={`${formId}-start-date-error`} className="text-sm text-destructive">
                {errors.start_date.message}
              </p>
            )}
          </div>

          {/* End date */}
          <div className="space-y-2">
            <Label htmlFor={`${formId}-end-date`}>
              Data zakończenia <span className="text-destructive">*</span>
            </Label>
            <Input
              id={`${formId}-end-date`}
              type="date"
              {...register("end_date")}
              aria-invalid={!!errors.end_date}
              aria-describedby={errors.end_date ? `${formId}-end-date-error` : undefined}
            />
            {errors.end_date && (
              <p id={`${formId}-end-date-error`} className="text-sm text-destructive">
                {errors.end_date.message}
              </p>
            )}
          </div>
        </div>

        {/* People count and budget type */}
        <div className="grid gap-4 sm:grid-cols-2">
          {/* People count */}
          <div className="space-y-2">
            <Label htmlFor={`${formId}-people-count`}>
              Liczba osób <span className="text-destructive">*</span>
            </Label>
            <Input
              id={`${formId}-people-count`}
              type="number"
              min={1}
              max={50}
              {...register("people_count", { valueAsNumber: true })}
              aria-invalid={!!errors.people_count}
              aria-describedby={errors.people_count ? `${formId}-people-count-error` : undefined}
            />
            {errors.people_count && (
              <p id={`${formId}-people-count-error`} className="text-sm text-destructive">
                {errors.people_count.message}
              </p>
            )}
          </div>

          {/* Budget type */}
          <div className="space-y-2">
            <Label htmlFor={`${formId}-budget-type`}>
              Rodzaj budżetu <span className="text-destructive">*</span>
            </Label>
            <Select
              value={budgetType}
              onValueChange={(value) =>
                setValue("budget_type", value as "low" | "medium" | "high", { shouldValidate: true })
              }
            >
              <SelectTrigger
                id={`${formId}-budget-type`}
                className="w-full"
                aria-invalid={!!errors.budget_type}
                aria-describedby={errors.budget_type ? `${formId}-budget-type-error` : undefined}
              >
                <SelectValue placeholder="Wybierz budżet" />
              </SelectTrigger>
              <SelectContent>
                {BUDGET_TYPE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.budget_type && (
              <p id={`${formId}-budget-type-error`} className="text-sm text-destructive">
                {errors.budget_type.message}
              </p>
            )}
          </div>
        </div>

        {/* Preferences (collapsible) */}
        <Collapsible open={isPreferencesOpen} onOpenChange={setIsPreferencesOpen}>
          <CollapsibleTrigger asChild>
            <Button type="button" variant="ghost" className="w-full justify-between px-0 hover:bg-transparent">
              <span className="text-sm font-medium">Preferencje (opcjonalnie)</span>
              {isPreferencesOpen ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4 pt-4">
            {/* Transport preferences */}
            <div className="space-y-2">
              <MultiSelectWithCustom
                label="Preferencje transportu"
                options={TRANSPORT_OPTIONS}
                selectedValues={transportValues}
                onSelectionChange={(values) => setValue("preferences.transport", values, { shouldValidate: true })}
                customInputPlaceholder="Dodaj własny środek transportu..."
                disabled={isSubmitting}
              />
            </div>

            {/* What to do */}
            <div className="space-y-2">
              <MultiSelectWithCustom
                label="Co chcesz robić?"
                options={ACTIVITY_OPTIONS}
                selectedValues={todoValues}
                onSelectionChange={(values) => setValue("preferences.todo", values, { shouldValidate: true })}
                customInputPlaceholder="Dodaj własną aktywność..."
                disabled={isSubmitting}
              />
            </div>

            {/* What to avoid */}
            <div className="space-y-2">
              <MultiSelectWithCustom
                label="Czego chcesz unikać?"
                options={ACTIVITY_OPTIONS}
                selectedValues={avoidValues}
                onSelectionChange={(values) => setValue("preferences.avoid", values, { shouldValidate: true })}
                customInputPlaceholder="Dodaj aktywność do unikania..."
                disabled={isSubmitting}
              />
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Action buttons */}
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            type="button"
            variant="outline"
            className="gap-2"
            onClick={() => setIsSaveDialogOpen(true)}
            disabled={isSubmitting}
          >
            <Save className="size-4" />
            Zapisz jako preferencję
          </Button>

          <Button type="submit" className="flex-1 gap-2" disabled={isSubmitting || !isValid}>
            <Sparkles className="size-4" />
            {isSubmitting ? "Generowanie..." : "Generuj plan"}
          </Button>
        </div>
      </form>

      {/* Save preference dialog */}
      <SavePreferenceDialog
        open={isSaveDialogOpen}
        onClose={() => setIsSaveDialogOpen(false)}
        onSave={handleSavePreference}
        isSaving={isSavingPreference}
        currentFormData={watch() as unknown as TripPlanFormData}
      />
    </>
  );
}
