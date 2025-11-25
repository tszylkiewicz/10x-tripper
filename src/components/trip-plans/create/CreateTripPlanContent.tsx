/**
 * CreateTripPlanContent component
 *
 * Main orchestrator for the create trip plan view.
 * Manages the flow: Form -> Generation -> Preview/Edit -> Accept
 */

import { useState, useCallback } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TripPlanForm } from "./TripPlanForm";
import { LoadingOverlay } from "./LoadingOverlay";
import { ErrorDisplay } from "./ErrorDisplay";
import { GeneratedPlanSection } from "./GeneratedPlanSection";
import { useTripPlanGeneration, usePlanEditor, useAcceptPlan } from "./hooks";
import type { TripPlanFormData, EditableGeneratedPlan } from "./types";

/**
 * CreateTripPlanContent component
 */
export function CreateTripPlanContent() {
  // Form data stored for regeneration
  const [formData, setFormData] = useState<TripPlanFormData | null>(null);

  // Generation hook
  const {
    generatePlan,
    isGenerating,
    generatedPlan,
    error: generationError,
    reset: resetGeneration,
  } = useTripPlanGeneration();

  // Plan editor hook
  const { editablePlan, setEditablePlan } = usePlanEditor(generatedPlan);

  // Accept plan hook
  const { acceptPlan, isAccepting, error: acceptError } = useAcceptPlan();

  // Determine current view state
  const showForm = !generatedPlan && !isGenerating;
  const showGeneratedPlan = !!editablePlan && !isGenerating;

  // Handler for form submission
  const handleFormSubmit = useCallback(
    async (data: TripPlanFormData) => {
      setFormData(data);
      await generatePlan(data);
    },
    [generatePlan]
  );

  // Handler for regenerating plan
  const handleRegenerate = useCallback(async () => {
    if (formData) {
      resetGeneration();
      await generatePlan(formData);
    }
  }, [formData, generatePlan, resetGeneration]);

  // Handler for plan changes (edits)
  const handlePlanChange = useCallback(
    (updatedPlan: EditableGeneratedPlan) => {
      setEditablePlan(updatedPlan);
    },
    [setEditablePlan]
  );

  // Handler for accepting plan
  const handleAcceptPlan = useCallback(
    async (plan: EditableGeneratedPlan) => {
      const savedPlan = await acceptPlan(plan);
      if (savedPlan) {
        // Redirect to the saved plan details or dashboard
        window.location.href = `/trip-plans/${savedPlan.id}`;
      }
    },
    [acceptPlan]
  );

  // Handler for returning to form
  const handleReturnToForm = useCallback(() => {
    resetGeneration();
  }, [resetGeneration]);

  // Handler for retry after error
  const handleRetry = useCallback(() => {
    if (formData) {
      resetGeneration();
      generatePlan(formData);
    }
  }, [formData, generatePlan, resetGeneration]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* Header */}
      <header className="mb-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild className="gap-2">
            <a href="/trip-plans">
              <ArrowLeft className="size-4" />
              Powrót do planów
            </a>
          </Button>
        </div>
        <h1 className="mt-4 text-2xl font-bold sm:text-3xl">
          {showGeneratedPlan ? "Wygenerowany plan" : "Nowy plan wycieczki"}
        </h1>
        <p className="mt-2 text-muted-foreground">
          {showGeneratedPlan
            ? "Przejrzyj i edytuj plan przed zapisaniem"
            : "Podaj szczegóły wycieczki, a AI wygeneruje dla Ciebie spersonalizowany plan"}
        </p>
      </header>

      {/* Loading overlay */}
      <LoadingOverlay isVisible={isGenerating} />

      {/* Error display */}
      {(generationError || acceptError) && (
        <ErrorDisplay error={generationError || acceptError} onRetry={handleRetry} onEditForm={handleReturnToForm} />
      )}

      {/* Form section */}
      {showForm && !generationError && (
        <div className="mx-auto max-w-xl">
          <TripPlanForm onSubmit={handleFormSubmit} isSubmitting={isGenerating} initialData={formData ?? undefined} />
        </div>
      )}

      {/* Generated plan section */}
      {showGeneratedPlan && editablePlan && (
        <GeneratedPlanSection
          plan={editablePlan}
          onRegeneratePlan={handleRegenerate}
          onAcceptPlan={handleAcceptPlan}
          onPlanChange={handlePlanChange}
          isAccepting={isAccepting}
        />
      )}
    </div>
  );
}
