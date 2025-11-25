import { useId, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronDown, ChevronUp, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { tripPlanFormSchema, type TripPlanFormSchema } from "@/lib/validators/tripPlanForm.validator";
import { BUDGET_TYPE_OPTIONS, type TripPlanFormProps, type TripPlanFormData } from "./types";

/**
 * TripPlanForm component
 *
 * Form for collecting trip plan parameters before AI generation.
 * Uses react-hook-form with Zod validation for form management.
 */
export function TripPlanForm({ onSubmit, isSubmitting = false, initialData }: TripPlanFormProps) {
  const formId = useId();
  const [isPreferencesOpen, setIsPreferencesOpen] = useState(false);

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
        transport: initialData?.preferences?.transport ?? "",
        todo: initialData?.preferences?.todo ?? "",
        avoid: initialData?.preferences?.avoid ?? "",
      },
    },
  });

  const budgetType = watch("budget_type");

  const onFormSubmit = (data: TripPlanFormSchema) => {
    // Transform to TripPlanFormData and call parent handler
    const formData: TripPlanFormData = {
      ...data,
      preferences: data.preferences,
    };
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
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
            <Label htmlFor={`${formId}-transport`}>Preferencje transportu</Label>
            <Textarea
              id={`${formId}-transport`}
              placeholder="np. Preferuję podróżowanie pociągiem, nie mam samochodu"
              rows={2}
              {...register("preferences.transport")}
            />
          </div>

          {/* What to do */}
          <div className="space-y-2">
            <Label htmlFor={`${formId}-todo`}>Co chcesz robić?</Label>
            <Textarea
              id={`${formId}-todo`}
              placeholder="np. Zwiedzanie zabytków, lokalna kuchnia, muzea"
              rows={2}
              {...register("preferences.todo")}
            />
          </div>

          {/* What to avoid */}
          <div className="space-y-2">
            <Label htmlFor={`${formId}-avoid`}>Czego chcesz unikać?</Label>
            <Textarea
              id={`${formId}-avoid`}
              placeholder="np. Tłumy turystów, drogie restauracje"
              rows={2}
              {...register("preferences.avoid")}
            />
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Submit button */}
      <Button type="submit" className="w-full gap-2" disabled={isSubmitting || !isValid}>
        <Sparkles className="size-4" />
        {isSubmitting ? "Generowanie..." : "Generuj plan"}
      </Button>
    </form>
  );
}
