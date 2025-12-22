/**
 * Unit tests for CreateTripPlanContent component
 *
 * Tests the main orchestration flow: Form -> Generation -> Preview/Edit -> Accept
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CreateTripPlanContent } from "./CreateTripPlanContent";
import type { TripPlanFormData, EditableGeneratedPlan } from "./types";
import type { GeneratedTripPlanDto, TripPlanDto, ApiErrorResponse } from "../../../types";
import type { UsePlanEditorReturn } from "./hooks/usePlanEditor";
import type { UseTripPlanGenerationReturn } from "./hooks/useTripPlanGeneration";
import type { UseAcceptPlanReturn } from "./hooks/useAcceptPlan";

// Create a mock function to control TripPlanForm behavior
const mockTripPlanFormSubmit = vi.fn();

// Mock child components
vi.mock("./TripPlanForm", () => ({
  TripPlanForm: ({
    onSubmit,
    isSubmitting,
  }: {
    onSubmit: (data: TripPlanFormData) => void;
    isSubmitting?: boolean;
  }) => {
    // Store the onSubmit handler for test access
    mockTripPlanFormSubmit.mockImplementation(onSubmit);

    return (
      <div data-testid="trip-plan-form">
        <button
          data-testid="submit-form-button"
          onClick={() =>
            onSubmit({
              destination: "Paris",
              start_date: "2025-06-01",
              end_date: "2025-06-03",
              people_count: 2,
              budget_type: "medium",
            })
          }
          disabled={isSubmitting}
        >
          Submit Form
        </button>
        <button
          data-testid="submit-with-preferences"
          onClick={() =>
            onSubmit({
              destination: "Tokyo",
              start_date: "2025-07-01",
              end_date: "2025-07-05",
              people_count: 3,
              budget_type: "high",
              preferences: {
                transport: "trains",
                todo: "temples, ramen",
                avoid: "crowded areas",
              },
            })
          }
        >
          Submit With Preferences
        </button>
      </div>
    );
  },
}));

vi.mock("./LoadingOverlay", () => ({
  LoadingOverlay: ({ isVisible }: { isVisible: boolean }) =>
    isVisible ? <div data-testid="loading-overlay">Loading...</div> : null,
}));

vi.mock("./ErrorDisplay", () => ({
  ErrorDisplay: ({
    error,
    onRetry,
    onEditForm,
  }: {
    error: ApiErrorResponse | null;
    onRetry: () => void;
    onEditForm?: () => void;
  }) => (
    <div data-testid="error-display">
      <p>{error?.error.message}</p>
      <button data-testid="retry-button" onClick={onRetry}>
        Retry
      </button>
      {onEditForm && (
        <button data-testid="edit-form-button" onClick={onEditForm}>
          Edit Form
        </button>
      )}
    </div>
  ),
}));

vi.mock("./GeneratedPlanSection", () => ({
  GeneratedPlanSection: ({
    plan,
    onRegeneratePlan,
    onAcceptPlan,
    onPlanChange,
    isAccepting,
  }: {
    plan: EditableGeneratedPlan;
    onRegeneratePlan: () => void;
    onAcceptPlan: (plan: EditableGeneratedPlan) => void;
    onPlanChange: (plan: EditableGeneratedPlan) => void;
    isAccepting?: boolean;
  }) => (
    <div data-testid="generated-plan-section">
      <p data-testid="plan-destination">{plan.destination}</p>
      <p data-testid="plan-edited">{plan.isEdited ? "Edited" : "Not Edited"}</p>
      <button data-testid="regenerate-button" onClick={onRegeneratePlan} disabled={isAccepting}>
        Regenerate
      </button>
      <button data-testid="accept-button" onClick={() => onAcceptPlan(plan)} disabled={isAccepting}>
        Accept Plan
      </button>
      <button data-testid="edit-plan-button" onClick={() => onPlanChange({ ...plan, isEdited: true })}>
        Edit Plan
      </button>
    </div>
  ),
}));

// Mock hooks
const mockGeneratePlan = vi.fn();
const mockReset = vi.fn();
const mockSetEditablePlan = vi.fn();
const mockAcceptPlan = vi.fn();
const mockAcceptReset = vi.fn();

vi.mock("./hooks", () => ({
  useTripPlanGeneration: vi.fn(() => ({
    generatePlan: mockGeneratePlan,
    isGenerating: false,
    generatedPlan: null,
    error: null,
    reset: mockReset,
  })),
  usePlanEditor: vi.fn(() => ({
    editablePlan: null,
    setEditablePlan: mockSetEditablePlan,
  })),
  useAcceptPlan: vi.fn(() => ({
    acceptPlan: mockAcceptPlan,
    isAccepting: false,
    error: null,
    reset: mockAcceptReset,
  })),
}));

// Get mocked hooks for manipulation
const { useTripPlanGeneration, usePlanEditor, useAcceptPlan } = await import("./hooks");

// Helper to create mock generated plan
function createMockGeneratedPlan(overrides?: Partial<GeneratedTripPlanDto>): GeneratedTripPlanDto {
  return {
    generation_id: "gen-123",
    destination: "Paris",
    start_date: "2025-06-01",
    end_date: "2025-06-03",
    people_count: 2,
    budget_type: "medium",
    plan_details: {
      days: [
        {
          day: 1,
          date: "2025-06-01",
          activities: [
            {
              time: "10:00",
              title: "Louvre Museum",
              description: "Visit the world-famous art museum",
              location: "Paris, France",
            },
          ],
        },
      ],
      total_estimated_cost: 500,
    },
    ...overrides,
  };
}

// Helper to create editable plan
function createMockEditablePlan(overrides?: Partial<EditableGeneratedPlan>): EditableGeneratedPlan {
  return {
    ...createMockGeneratedPlan(),
    isEdited: false,
    ...overrides,
  };
}

// Helper to create API error
function createApiError(message: string, code = "UNKNOWN_ERROR"): ApiErrorResponse {
  return {
    error: {
      code,
      message,
    },
  };
}

describe("CreateTripPlanContent", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Reset default mock implementations
    vi.mocked(useTripPlanGeneration).mockReturnValue({
      generatePlan: mockGeneratePlan,
      isGenerating: false,
      generatedPlan: null,
      error: null,
      reset: mockReset,
    });

    vi.mocked(usePlanEditor).mockReturnValue({
      editablePlan: null,
      setEditablePlan: mockSetEditablePlan,
    } as Partial<UsePlanEditorReturn> as UsePlanEditorReturn);

    vi.mocked(useAcceptPlan).mockReturnValue({
      acceptPlan: mockAcceptPlan,
      isAccepting: false,
      error: null,
      reset: mockAcceptReset,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("Initial render", () => {
    it("should render form on initial load", () => {
      render(<CreateTripPlanContent />);

      expect(screen.getByTestId("trip-plan-form")).toBeInTheDocument();
      expect(screen.getByText("Nowy plan wycieczki")).toBeInTheDocument();
      expect(
        screen.getByText("Podaj szczegóły wycieczki, a AI wygeneruje dla Ciebie spersonalizowany plan")
      ).toBeInTheDocument();
    });

    it("should not show loading overlay initially", () => {
      render(<CreateTripPlanContent />);

      expect(screen.queryByTestId("loading-overlay")).not.toBeInTheDocument();
    });

    it("should not show generated plan section initially", () => {
      render(<CreateTripPlanContent />);

      expect(screen.queryByTestId("generated-plan-section")).not.toBeInTheDocument();
    });

    it("should not show error display initially", () => {
      render(<CreateTripPlanContent />);

      expect(screen.queryByTestId("error-display")).not.toBeInTheDocument();
    });
  });

  describe("Form submission and generation", () => {
    it("should call generatePlan when form is submitted", async () => {
      const user = userEvent.setup();
      render(<CreateTripPlanContent />);

      const submitButton = screen.getByTestId("submit-form-button");
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockGeneratePlan).toHaveBeenCalledTimes(1);
        expect(mockGeneratePlan).toHaveBeenCalledWith({
          destination: "Paris",
          start_date: "2025-06-01",
          end_date: "2025-06-03",
          people_count: 2,
          budget_type: "medium",
        });
      });
    });

    it("should show loading overlay during generation", () => {
      vi.mocked(useTripPlanGeneration).mockReturnValue({
        generatePlan: mockGeneratePlan,
        isGenerating: true,
        generatedPlan: null,
        error: null,
        reset: mockReset,
      });

      render(<CreateTripPlanContent />);

      expect(screen.getByTestId("loading-overlay")).toBeInTheDocument();
    });

    it("should hide form during generation", () => {
      vi.mocked(useTripPlanGeneration).mockReturnValue({
        generatePlan: mockGeneratePlan,
        isGenerating: true,
        generatedPlan: null,
        error: null,
        reset: mockReset,
      });

      render(<CreateTripPlanContent />);

      // Form should still be rendered but not visible due to loading state
      expect(screen.queryByTestId("trip-plan-form")).not.toBeInTheDocument();
    });

    it("should store form data for regeneration", async () => {
      const user = userEvent.setup();
      render(<CreateTripPlanContent />);

      const submitButton = screen.getByTestId("submit-form-button");
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockGeneratePlan).toHaveBeenCalled();
      });

      // Form data is stored internally for regeneration
      expect(mockGeneratePlan).toHaveBeenCalledWith(
        expect.objectContaining({
          destination: "Paris",
        })
      );
    });
  });

  describe("Generated plan display", () => {
    it("should show generated plan section after successful generation", () => {
      const mockPlan = createMockGeneratedPlan();

      vi.mocked(useTripPlanGeneration).mockReturnValue({
        generatePlan: mockGeneratePlan,
        isGenerating: false,
        generatedPlan: mockPlan,
        error: null,
        reset: mockReset,
      });

      vi.mocked(usePlanEditor).mockReturnValue({
        editablePlan: { ...mockPlan, isEdited: false },
        setEditablePlan: mockSetEditablePlan,
      } as Partial<UsePlanEditorReturn> as UsePlanEditorReturn);

      render(<CreateTripPlanContent />);

      expect(screen.getByTestId("generated-plan-section")).toBeInTheDocument();
      expect(screen.getByTestId("plan-destination")).toHaveTextContent("Paris");
    });

    it("should hide form when plan is displayed", () => {
      const mockPlan = createMockGeneratedPlan();

      vi.mocked(useTripPlanGeneration).mockReturnValue({
        generatePlan: mockGeneratePlan,
        isGenerating: false,
        generatedPlan: mockPlan,
        error: null,
        reset: mockReset,
      });

      vi.mocked(usePlanEditor).mockReturnValue({
        editablePlan: { ...mockPlan, isEdited: false },
        setEditablePlan: mockSetEditablePlan,
      } as Partial<UsePlanEditorReturn> as UsePlanEditorReturn);

      render(<CreateTripPlanContent />);

      expect(screen.queryByTestId("trip-plan-form")).not.toBeInTheDocument();
    });

    it("should update header text when plan is displayed", () => {
      const mockPlan = createMockGeneratedPlan();

      vi.mocked(useTripPlanGeneration).mockReturnValue({
        generatePlan: mockGeneratePlan,
        isGenerating: false,
        generatedPlan: mockPlan,
        error: null,
        reset: mockReset,
      });

      vi.mocked(usePlanEditor).mockReturnValue({
        editablePlan: { ...mockPlan, isEdited: false },
        setEditablePlan: mockSetEditablePlan,
      } as Partial<UsePlanEditorReturn> as UsePlanEditorReturn);

      render(<CreateTripPlanContent />);

      expect(screen.getByText("Wygenerowany plan")).toBeInTheDocument();
      expect(screen.getByText("Przejrzyj i edytuj plan przed zapisaniem")).toBeInTheDocument();
    });
  });

  describe("Plan editing", () => {
    it("should update editable plan when user makes changes", async () => {
      const user = userEvent.setup();
      const mockPlan = createMockEditablePlan();

      vi.mocked(useTripPlanGeneration).mockReturnValue({
        generatePlan: mockGeneratePlan,
        isGenerating: false,
        generatedPlan: mockPlan,
        error: null,
        reset: mockReset,
      });

      vi.mocked(usePlanEditor).mockReturnValue({
        editablePlan: mockPlan,
        setEditablePlan: mockSetEditablePlan,
      } as Partial<UsePlanEditorReturn> as UsePlanEditorReturn);

      render(<CreateTripPlanContent />);

      const editButton = screen.getByTestId("edit-plan-button");
      await user.click(editButton);

      await waitFor(() => {
        expect(mockSetEditablePlan).toHaveBeenCalledTimes(1);
        expect(mockSetEditablePlan).toHaveBeenCalledWith(
          expect.objectContaining({
            isEdited: true,
          })
        );
      });
    });

    it("should track isEdited flag when plan is modified", () => {
      const mockPlan = createMockEditablePlan({ isEdited: true });

      vi.mocked(useTripPlanGeneration).mockReturnValue({
        generatePlan: mockGeneratePlan,
        isGenerating: false,
        generatedPlan: mockPlan,
        error: null,
        reset: mockReset,
      });

      vi.mocked(usePlanEditor).mockReturnValue({
        editablePlan: mockPlan,
        setEditablePlan: mockSetEditablePlan,
      } as Partial<UsePlanEditorReturn> as UsePlanEditorReturn);

      render(<CreateTripPlanContent />);

      expect(screen.getByTestId("plan-edited")).toHaveTextContent("Edited");
    });
  });

  describe("Regenerate plan", () => {
    it("should regenerate plan with stored form data", async () => {
      const user = userEvent.setup();
      const mockPlan = createMockEditablePlan();

      const { rerender } = render(<CreateTripPlanContent />);

      // First, submit the form to store formData
      const submitButton = screen.getByTestId("submit-form-button");
      await user.click(submitButton);

      // Now update hooks to show the generated plan
      vi.mocked(useTripPlanGeneration).mockReturnValue({
        generatePlan: mockGeneratePlan,
        isGenerating: false,
        generatedPlan: mockPlan,
        error: null,
        reset: mockReset,
      });

      vi.mocked(usePlanEditor).mockReturnValue({
        editablePlan: mockPlan,
        setEditablePlan: mockSetEditablePlan,
      } as Partial<UsePlanEditorReturn> as UsePlanEditorReturn);

      // Rerender with updated hooks
      rerender(<CreateTripPlanContent />);

      const regenerateButton = screen.getByTestId("regenerate-button");
      await user.click(regenerateButton);

      await waitFor(() => {
        expect(mockReset).toHaveBeenCalled();
        expect(mockGeneratePlan).toHaveBeenCalledWith(
          expect.objectContaining({
            destination: "Paris",
          })
        );
      });
    });

    it("should not regenerate if form data is missing", async () => {
      const user = userEvent.setup();
      const mockPlan = createMockEditablePlan();

      vi.mocked(useTripPlanGeneration).mockReturnValue({
        generatePlan: mockGeneratePlan,
        isGenerating: false,
        generatedPlan: mockPlan,
        error: null,
        reset: mockReset,
      });

      vi.mocked(usePlanEditor).mockReturnValue({
        editablePlan: mockPlan,
        setEditablePlan: mockSetEditablePlan,
      } as Partial<UsePlanEditorReturn> as UsePlanEditorReturn);

      // Render without submitting form first (no formData stored)
      render(<CreateTripPlanContent />);

      const regenerateButton = screen.getByTestId("regenerate-button");
      await user.click(regenerateButton);

      // Should not call generatePlan without form data
      expect(mockGeneratePlan).not.toHaveBeenCalled();
    });
  });

  describe("Accept plan", () => {
    it("should call acceptPlan when accept button is clicked", async () => {
      const user = userEvent.setup();
      const mockPlan = createMockEditablePlan();
      const savedPlan: TripPlanDto = {
        id: "plan-123",
        destination: "Paris",
        start_date: "2025-06-01",
        end_date: "2025-06-03",
        people_count: 2,
        budget_type: "medium",
        plan_details: mockPlan.plan_details,
      };

      mockAcceptPlan.mockResolvedValueOnce(savedPlan);

      vi.mocked(useTripPlanGeneration).mockReturnValue({
        generatePlan: mockGeneratePlan,
        isGenerating: false,
        generatedPlan: mockPlan,
        error: null,
        reset: mockReset,
      });

      vi.mocked(usePlanEditor).mockReturnValue({
        editablePlan: mockPlan,
        setEditablePlan: mockSetEditablePlan,
      } as Partial<UsePlanEditorReturn> as UsePlanEditorReturn);

      render(<CreateTripPlanContent />);

      const acceptButton = screen.getByTestId("accept-button");
      await user.click(acceptButton);

      await waitFor(() => {
        expect(mockAcceptPlan).toHaveBeenCalledTimes(1);
        expect(mockAcceptPlan).toHaveBeenCalledWith(mockPlan);
      });
    });

    it("should redirect to plan details after successful accept", async () => {
      const user = userEvent.setup();
      const mockPlan = createMockEditablePlan();
      const savedPlan: TripPlanDto = {
        id: "plan-456",
        destination: "Paris",
        start_date: "2025-06-01",
        end_date: "2025-06-03",
        people_count: 2,
        budget_type: "medium",
        plan_details: mockPlan.plan_details,
      };

      // Mock window.location.href
      delete (window as unknown as { location: unknown }).location;
      (window as unknown as { location: { href: string } }).location = { href: "" };

      mockAcceptPlan.mockResolvedValueOnce(savedPlan);

      vi.mocked(useTripPlanGeneration).mockReturnValue({
        generatePlan: mockGeneratePlan,
        isGenerating: false,
        generatedPlan: mockPlan,
        error: null,
        reset: mockReset,
      });

      vi.mocked(usePlanEditor).mockReturnValue({
        editablePlan: mockPlan,
        setEditablePlan: mockSetEditablePlan,
      } as Partial<UsePlanEditorReturn> as UsePlanEditorReturn);

      render(<CreateTripPlanContent />);

      const acceptButton = screen.getByTestId("accept-button");
      await user.click(acceptButton);

      await waitFor(() => {
        expect(window.location.href).toBe("/trip-plans/plan-456");
      });
    });

    it("should not redirect if accept fails", async () => {
      const user = userEvent.setup();
      const mockPlan = createMockEditablePlan();

      // Mock window.location.href
      delete (window as unknown as { location: unknown }).location;
      (window as unknown as { location: { href: string } }).location = { href: "" };

      mockAcceptPlan.mockResolvedValueOnce(null);

      vi.mocked(useTripPlanGeneration).mockReturnValue({
        generatePlan: mockGeneratePlan,
        isGenerating: false,
        generatedPlan: mockPlan,
        error: null,
        reset: mockReset,
      });

      vi.mocked(usePlanEditor).mockReturnValue({
        editablePlan: mockPlan,
        setEditablePlan: mockSetEditablePlan,
      } as Partial<UsePlanEditorReturn> as UsePlanEditorReturn);

      render(<CreateTripPlanContent />);

      const acceptButton = screen.getByTestId("accept-button");
      await user.click(acceptButton);

      await waitFor(() => {
        expect(mockAcceptPlan).toHaveBeenCalledTimes(1);
      });

      expect(window.location.href).toBe("");
    });

    it("should show isAccepting state during save", () => {
      const mockPlan = createMockEditablePlan();

      vi.mocked(useTripPlanGeneration).mockReturnValue({
        generatePlan: mockGeneratePlan,
        isGenerating: false,
        generatedPlan: mockPlan,
        error: null,
        reset: mockReset,
      });

      vi.mocked(usePlanEditor).mockReturnValue({
        editablePlan: mockPlan,
        setEditablePlan: mockSetEditablePlan,
      } as Partial<UsePlanEditorReturn> as UsePlanEditorReturn);

      vi.mocked(useAcceptPlan).mockReturnValue({
        acceptPlan: mockAcceptPlan,
        isAccepting: true,
        error: null,
        reset: mockAcceptReset,
      });

      render(<CreateTripPlanContent />);

      const acceptButton = screen.getByTestId("accept-button");
      expect(acceptButton).toBeDisabled();
    });
  });

  describe("Error handling", () => {
    it("should display generation error", () => {
      const error = createApiError("Generation failed", "GENERATION_ERROR");

      vi.mocked(useTripPlanGeneration).mockReturnValue({
        generatePlan: mockGeneratePlan,
        isGenerating: false,
        generatedPlan: null,
        error,
        reset: mockReset,
      });

      render(<CreateTripPlanContent />);

      expect(screen.getByTestId("error-display")).toBeInTheDocument();
      expect(screen.getByText("Generation failed")).toBeInTheDocument();
    });

    it("should display accept error", () => {
      const mockPlan = createMockEditablePlan();
      const error = createApiError("Failed to save plan", "SAVE_ERROR");

      vi.mocked(useTripPlanGeneration).mockReturnValue({
        generatePlan: mockGeneratePlan,
        isGenerating: false,
        generatedPlan: mockPlan,
        error: null,
        reset: mockReset,
      });

      vi.mocked(usePlanEditor).mockReturnValue({
        editablePlan: mockPlan,
        setEditablePlan: mockSetEditablePlan,
      } as Partial<UsePlanEditorReturn> as UsePlanEditorReturn);

      vi.mocked(useAcceptPlan).mockReturnValue({
        acceptPlan: mockAcceptPlan,
        isAccepting: false,
        error,
        reset: mockAcceptReset,
      });

      render(<CreateTripPlanContent />);

      expect(screen.getByTestId("error-display")).toBeInTheDocument();
      expect(screen.getByText("Failed to save plan")).toBeInTheDocument();
    });

    it("should hide form when generation error is displayed", () => {
      const error = createApiError("Generation failed", "GENERATION_ERROR");

      vi.mocked(useTripPlanGeneration).mockReturnValue({
        generatePlan: mockGeneratePlan,
        isGenerating: false,
        generatedPlan: null,
        error,
        reset: mockReset,
      });

      render(<CreateTripPlanContent />);

      expect(screen.queryByTestId("trip-plan-form")).not.toBeInTheDocument();
    });

    it("should retry generation on error retry", async () => {
      const user = userEvent.setup();
      const error = createApiError("Generation failed", "GENERATION_ERROR");

      const { rerender } = render(<CreateTripPlanContent />);

      // First submit the form to store formData
      const submitButton = screen.getByTestId("submit-form-button");
      await user.click(submitButton);

      // Then show error
      vi.mocked(useTripPlanGeneration).mockReturnValue({
        generatePlan: mockGeneratePlan,
        isGenerating: false,
        generatedPlan: null,
        error,
        reset: mockReset,
      });

      // Rerender to show error
      rerender(<CreateTripPlanContent />);

      const retryButton = screen.getByTestId("retry-button");
      await user.click(retryButton);

      await waitFor(() => {
        expect(mockReset).toHaveBeenCalled();
        expect(mockGeneratePlan).toHaveBeenCalled();
      });
    });

    it("should return to form when edit form button is clicked", async () => {
      const user = userEvent.setup();
      const error = createApiError("Generation failed", "GENERATION_ERROR");

      vi.mocked(useTripPlanGeneration).mockReturnValue({
        generatePlan: mockGeneratePlan,
        isGenerating: false,
        generatedPlan: null,
        error,
        reset: mockReset,
      });

      render(<CreateTripPlanContent />);

      const editFormButton = screen.getByTestId("edit-form-button");
      await user.click(editFormButton);

      await waitFor(() => {
        expect(mockReset).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe("Edge cases", () => {
    it("should handle null editable plan gracefully", () => {
      const mockPlan = createMockGeneratedPlan();

      vi.mocked(useTripPlanGeneration).mockReturnValue({
        generatePlan: mockGeneratePlan,
        isGenerating: false,
        generatedPlan: mockPlan,
        error: null,
        reset: mockReset,
      });

      vi.mocked(usePlanEditor).mockReturnValue({
        editablePlan: null,
        setEditablePlan: mockSetEditablePlan,
      } as Partial<UsePlanEditorReturn> as UsePlanEditorReturn);

      render(<CreateTripPlanContent />);

      // Should not show plan section if editablePlan is null
      expect(screen.queryByTestId("generated-plan-section")).not.toBeInTheDocument();
    });

    it("should handle simultaneous generation and accept errors", () => {
      const generationError = createApiError("Generation failed", "GENERATION_ERROR");
      const acceptError = createApiError("Save failed", "SAVE_ERROR");

      vi.mocked(useTripPlanGeneration).mockReturnValue({
        generatePlan: mockGeneratePlan,
        isGenerating: false,
        generatedPlan: null,
        error: generationError,
        reset: mockReset,
      });

      vi.mocked(useAcceptPlan).mockReturnValue({
        acceptPlan: mockAcceptPlan,
        isAccepting: false,
        error: acceptError,
        reset: mockAcceptReset,
      });

      render(<CreateTripPlanContent />);

      // Should display first error (generation error takes precedence)
      expect(screen.getByTestId("error-display")).toBeInTheDocument();
      expect(screen.getByText("Generation failed")).toBeInTheDocument();
    });

    it("should handle form data with all optional fields", async () => {
      const user = userEvent.setup();
      render(<CreateTripPlanContent />);

      const submitButton = screen.getByTestId("submit-with-preferences");
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockGeneratePlan).toHaveBeenCalledWith(
          expect.objectContaining({
            preferences: expect.objectContaining({
              transport: "trains",
              todo: "temples, ramen",
              avoid: "crowded areas",
            }),
          })
        );
      });
    });

    it("should handle rapid form submissions", async () => {
      const user = userEvent.setup();
      render(<CreateTripPlanContent />);

      const submitButton = screen.getByTestId("submit-form-button");

      // Click multiple times rapidly
      await user.click(submitButton);
      await user.click(submitButton);
      await user.click(submitButton);

      // Should still only call once per click
      await waitFor(() => {
        expect(mockGeneratePlan).toHaveBeenCalledTimes(3);
      });
    });
  });

  describe("Accessibility", () => {
    it("should have proper heading structure", () => {
      render(<CreateTripPlanContent />);

      const heading = screen.getByRole("heading", { level: 1 });
      expect(heading).toBeInTheDocument();
      expect(heading).toHaveTextContent("Nowy plan wycieczki");
    });

    it("should update heading when plan is generated", () => {
      const mockPlan = createMockEditablePlan();

      vi.mocked(useTripPlanGeneration).mockReturnValue({
        generatePlan: mockGeneratePlan,
        isGenerating: false,
        generatedPlan: mockPlan,
        error: null,
        reset: mockReset,
      });

      vi.mocked(usePlanEditor).mockReturnValue({
        editablePlan: mockPlan,
        setEditablePlan: mockSetEditablePlan,
      } as Partial<UsePlanEditorReturn> as UsePlanEditorReturn);

      render(<CreateTripPlanContent />);

      const heading = screen.getByRole("heading", { level: 1 });
      expect(heading).toHaveTextContent("Wygenerowany plan");
    });

    it("should use semantic HTML5 elements", () => {
      const { container } = render(<CreateTripPlanContent />);

      expect(container.querySelector("main")).toBeInTheDocument();
      expect(container.querySelector("header")).toBeInTheDocument();
    });
  });
});
