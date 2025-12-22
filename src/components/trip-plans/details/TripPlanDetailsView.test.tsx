/**
 * Unit tests for TripPlanDetailsView component
 *
 * Tests the main orchestration flow: Fetch -> Display -> Edit -> Save/Delete
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TripPlanDetailsView } from "./TripPlanDetailsView";
import type { ViewError } from "./types";
import type { TripPlanDto } from "@/types";

// Mock child components
vi.mock("./LoadingState", () => ({
  LoadingState: ({ message }: { message?: string }) => <div data-testid="loading-state">{message || "Loading..."}</div>,
}));

vi.mock("./ErrorState", () => ({
  ErrorState: ({
    errorType,
    errorMessage,
    onRetry,
  }: {
    errorType: string;
    errorMessage?: string;
    onRetry?: () => void;
  }) => (
    <div data-testid="error-state">
      <p data-testid="error-type">{errorType}</p>
      <p data-testid="error-message">{errorMessage}</p>
      {onRetry && (
        <button data-testid="retry-button" onClick={onRetry}>
          Retry
        </button>
      )}
    </div>
  ),
}));

vi.mock("./TripPlanHeader", () => ({
  TripPlanHeader: ({
    destination,
    isEditMode,
    isSaving,
    validationErrors,
    onEdit,
    onDelete,
    onSave,
    onCancel,
  }: {
    destination: string;
    isEditMode: boolean;
    isSaving: boolean;
    validationErrors?: Record<string, string>;
    onEdit: () => void;
    onDelete: () => void;
    onSave: () => void;
    onCancel: () => void;
  }) => (
    <div data-testid="trip-plan-header">
      <h1 data-testid="destination">{destination}</h1>
      <p data-testid="edit-mode">{isEditMode ? "Edit Mode" : "View Mode"}</p>
      <p data-testid="is-saving">{isSaving ? "Saving..." : "Not Saving"}</p>
      {validationErrors && Object.keys(validationErrors).length > 0 && (
        <div data-testid="validation-errors">
          {Object.entries(validationErrors).map(([key, value]) => (
            <p key={key} data-testid={`validation-error-${key}`}>
              {value}
            </p>
          ))}
        </div>
      )}
      <button data-testid="edit-button" onClick={onEdit}>
        Edit
      </button>
      <button data-testid="delete-button" onClick={onDelete}>
        Delete
      </button>
      <button data-testid="save-button" onClick={onSave} disabled={isSaving}>
        Save
      </button>
      <button data-testid="cancel-button" onClick={onCancel}>
        Cancel
      </button>
    </div>
  ),
}));

vi.mock("../shared/DayCard", () => ({
  DayCard: ({
    day,
    dayIndex,
    isEditMode,
    onDeleteDay,
  }: {
    day: { day: number; activities: unknown[] };
    dayIndex: number;
    isEditMode: boolean;
    onDeleteDay: (index: number) => void;
  }) => (
    <div data-testid={`plan-day-${dayIndex}`}>
      <p data-testid={`day-number-${dayIndex}`}>Day {day.day}</p>
      <p data-testid={`activities-count-${dayIndex}`}>{day.activities.length} activities</p>
      <p data-testid={`day-edit-mode-${dayIndex}`}>{isEditMode ? "Editable" : "Read-only"}</p>
      {isEditMode && (
        <button data-testid={`delete-day-${dayIndex}`} onClick={() => onDeleteDay(dayIndex)}>
          Delete Day
        </button>
      )}
    </div>
  ),
}));

vi.mock("../shared/AccommodationCard", () => ({
  AccommodationCard: ({
    accommodation,
    isEditMode,
  }: {
    accommodation?: { name: string } | null;
    isEditMode: boolean;
  }) => (
    <div data-testid="accommodation-section">
      {accommodation ? (
        <p data-testid="accommodation-name">{accommodation.name}</p>
      ) : (
        <p data-testid="no-accommodation">No accommodation</p>
      )}
      <p data-testid="accommodation-edit-mode">{isEditMode ? "Editable" : "Read-only"}</p>
    </div>
  ),
}));

vi.mock("./DeleteConfirmDialog", () => ({
  DeleteConfirmDialog: ({
    isOpen,
    planName,
    isDeleting,
    onConfirm,
    onCancel,
  }: {
    isOpen: boolean;
    planName: string;
    isDeleting: boolean;
    onConfirm: () => void;
    onCancel: () => void;
  }) =>
    isOpen ? (
      <div data-testid="delete-confirm-dialog">
        <p data-testid="dialog-plan-name">{planName}</p>
        <p data-testid="dialog-is-deleting">{isDeleting ? "Deleting..." : "Ready"}</p>
        <button data-testid="confirm-delete-button" onClick={onConfirm} disabled={isDeleting}>
          Confirm Delete
        </button>
        <button data-testid="cancel-delete-button" onClick={onCancel}>
          Cancel
        </button>
      </div>
    ) : null,
}));

// Mock useTripPlanDetails hook
const mockEnterEditMode = vi.fn();
const mockExitEditMode = vi.fn();
const mockUpdateMetadata = vi.fn();
const mockUpdateActivity = vi.fn();
const mockDeleteActivity = vi.fn();
const mockAddActivity = vi.fn();
const mockDeleteDay = vi.fn();
const mockAddDay = vi.fn();
const mockUpdateAccommodation = vi.fn();
const mockRemoveAccommodation = vi.fn();
const mockAddAccommodation = vi.fn();
const mockSavePlan = vi.fn();
const mockDeletePlan = vi.fn();
const mockRefetch = vi.fn();
const mockShowDeleteDialog = vi.fn();
const mockHideDeleteDialog = vi.fn();

vi.mock("./useTripPlanDetails", () => ({
  useTripPlanDetails: vi.fn(() => ({
    state: {
      originalPlan: null,
      editedPlan: null,
      isLoading: false,
      isSaving: false,
      isDeleting: false,
      isEditMode: false,
      showDeleteDialog: false,
      error: null,
    },
    enterEditMode: mockEnterEditMode,
    exitEditMode: mockExitEditMode,
    updateMetadata: mockUpdateMetadata,
    updateActivity: mockUpdateActivity,
    deleteActivity: mockDeleteActivity,
    addActivity: mockAddActivity,
    deleteDay: mockDeleteDay,
    addDay: mockAddDay,
    updateAccommodation: mockUpdateAccommodation,
    removeAccommodation: mockRemoveAccommodation,
    addAccommodation: mockAddAccommodation,
    savePlan: mockSavePlan,
    deletePlan: mockDeletePlan,
    refetch: mockRefetch,
    showDeleteDialog: mockShowDeleteDialog,
    hideDeleteDialog: mockHideDeleteDialog,
  })),
}));

const { useTripPlanDetails } = await import("./useTripPlanDetails");

// Helper to create mock trip plan
function createMockTripPlan(overrides?: Partial<TripPlanDto>): TripPlanDto {
  return {
    id: "plan-123",
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
        {
          day: 2,
          date: "2025-06-02",
          activities: [
            {
              time: "14:00",
              title: "Eiffel Tower",
              description: "Iconic landmark",
              location: "Paris, France",
            },
          ],
        },
      ],
      accommodation: {
        name: "Hotel Paris",
        address: "123 Rue de Rivoli",
        check_in: "2025-06-01",
        check_out: "2025-06-03",
        estimated_cost: 200,
      },
      total_estimated_cost: 500,
      notes: "Great trip!",
    },
    ...overrides,
  };
}

// Helper to create view error
function createViewError(type: ViewError["type"], message: string): ViewError {
  return { type, message };
}

describe("TripPlanDetailsView", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Reset default mock implementation
    vi.mocked(useTripPlanDetails).mockReturnValue({
      state: {
        originalPlan: null,
        editedPlan: null,
        isLoading: false,
        isSaving: false,
        isDeleting: false,
        isEditMode: false,
        showDeleteDialog: false,
        error: null,
      },
      enterEditMode: mockEnterEditMode,
      exitEditMode: mockExitEditMode,
      updateMetadata: mockUpdateMetadata,
      updateActivity: mockUpdateActivity,
      deleteActivity: mockDeleteActivity,
      addActivity: mockAddActivity,
      deleteDay: mockDeleteDay,
      addDay: mockAddDay,
      updateAccommodation: mockUpdateAccommodation,
      removeAccommodation: mockRemoveAccommodation,
      addAccommodation: mockAddAccommodation,
      savePlan: mockSavePlan,
      deletePlan: mockDeletePlan,
      refetch: mockRefetch,
      showDeleteDialog: mockShowDeleteDialog,
      hideDeleteDialog: mockHideDeleteDialog,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("Loading state", () => {
    it("should display loading state when data is being fetched", () => {
      vi.mocked(useTripPlanDetails).mockReturnValue({
        state: {
          originalPlan: null,
          editedPlan: null,
          isLoading: true,
          isSaving: false,
          isDeleting: false,
          isEditMode: false,
          showDeleteDialog: false,
          error: null,
        },
        enterEditMode: mockEnterEditMode,
        exitEditMode: mockExitEditMode,
        updateMetadata: mockUpdateMetadata,
        updateActivity: mockUpdateActivity,
        deleteActivity: mockDeleteActivity,
        addActivity: mockAddActivity,
        deleteDay: mockDeleteDay,
        addDay: mockAddDay,
        updateAccommodation: mockUpdateAccommodation,
        removeAccommodation: mockRemoveAccommodation,
        addAccommodation: mockAddAccommodation,
        savePlan: mockSavePlan,
        deletePlan: mockDeletePlan,
        refetch: mockRefetch,
        showDeleteDialog: mockShowDeleteDialog,
        hideDeleteDialog: mockHideDeleteDialog,
      });

      render(<TripPlanDetailsView planId="plan-123" />);

      expect(screen.getByTestId("loading-state")).toBeInTheDocument();
      expect(screen.getByText("Ładowanie planu wycieczki...")).toBeInTheDocument();
    });

    it("should not display plan content when loading", () => {
      vi.mocked(useTripPlanDetails).mockReturnValue({
        state: {
          originalPlan: null,
          editedPlan: null,
          isLoading: true,
          isSaving: false,
          isDeleting: false,
          isEditMode: false,
          showDeleteDialog: false,
          error: null,
        },
        enterEditMode: mockEnterEditMode,
        exitEditMode: mockExitEditMode,
        updateMetadata: mockUpdateMetadata,
        updateActivity: mockUpdateActivity,
        deleteActivity: mockDeleteActivity,
        addActivity: mockAddActivity,
        deleteDay: mockDeleteDay,
        addDay: mockAddDay,
        updateAccommodation: mockUpdateAccommodation,
        removeAccommodation: mockRemoveAccommodation,
        addAccommodation: mockAddAccommodation,
        savePlan: mockSavePlan,
        deletePlan: mockDeletePlan,
        refetch: mockRefetch,
        showDeleteDialog: mockShowDeleteDialog,
        hideDeleteDialog: mockHideDeleteDialog,
      });

      render(<TripPlanDetailsView planId="plan-123" />);

      expect(screen.queryByTestId("trip-plan-header")).not.toBeInTheDocument();
    });
  });

  describe("Error states", () => {
    it("should display not-found error when plan does not exist", () => {
      const error = createViewError("not-found", "Plan wycieczki nie został znaleziony");

      vi.mocked(useTripPlanDetails).mockReturnValue({
        state: {
          originalPlan: null,
          editedPlan: null,
          isLoading: false,
          isSaving: false,
          isDeleting: false,
          isEditMode: false,
          showDeleteDialog: false,
          error,
        },
        enterEditMode: mockEnterEditMode,
        exitEditMode: mockExitEditMode,
        updateMetadata: mockUpdateMetadata,
        updateActivity: mockUpdateActivity,
        deleteActivity: mockDeleteActivity,
        addActivity: mockAddActivity,
        deleteDay: mockDeleteDay,
        addDay: mockAddDay,
        updateAccommodation: mockUpdateAccommodation,
        removeAccommodation: mockRemoveAccommodation,
        addAccommodation: mockAddAccommodation,
        savePlan: mockSavePlan,
        deletePlan: mockDeletePlan,
        refetch: mockRefetch,
        showDeleteDialog: mockShowDeleteDialog,
        hideDeleteDialog: mockHideDeleteDialog,
      });

      render(<TripPlanDetailsView planId="plan-123" />);

      expect(screen.getByTestId("error-state")).toBeInTheDocument();
      expect(screen.getByTestId("error-type")).toHaveTextContent("not-found");
      expect(screen.getByTestId("error-message")).toHaveTextContent("Plan wycieczki nie został znaleziony");
    });

    it("should display unauthorized error with retry button", async () => {
      const user = userEvent.setup();
      const error = createViewError("unauthorized", "Brak autoryzacji. Zaloguj się ponownie.");

      vi.mocked(useTripPlanDetails).mockReturnValue({
        state: {
          originalPlan: null,
          editedPlan: null,
          isLoading: false,
          isSaving: false,
          isDeleting: false,
          isEditMode: false,
          showDeleteDialog: false,
          error,
        },
        enterEditMode: mockEnterEditMode,
        exitEditMode: mockExitEditMode,
        updateMetadata: mockUpdateMetadata,
        updateActivity: mockUpdateActivity,
        deleteActivity: mockDeleteActivity,
        addActivity: mockAddActivity,
        deleteDay: mockDeleteDay,
        addDay: mockAddDay,
        updateAccommodation: mockUpdateAccommodation,
        removeAccommodation: mockRemoveAccommodation,
        addAccommodation: mockAddAccommodation,
        savePlan: mockSavePlan,
        deletePlan: mockDeletePlan,
        refetch: mockRefetch,
        showDeleteDialog: mockShowDeleteDialog,
        hideDeleteDialog: mockHideDeleteDialog,
      });

      render(<TripPlanDetailsView planId="plan-123" />);

      expect(screen.getByTestId("error-type")).toHaveTextContent("unauthorized");

      const retryButton = screen.getByTestId("retry-button");
      await user.click(retryButton);

      expect(mockRefetch).toHaveBeenCalledTimes(1);
    });

    it("should display network error", () => {
      const error = createViewError("network-error", "Brak połączenia z internetem.");

      vi.mocked(useTripPlanDetails).mockReturnValue({
        state: {
          originalPlan: null,
          editedPlan: null,
          isLoading: false,
          isSaving: false,
          isDeleting: false,
          isEditMode: false,
          showDeleteDialog: false,
          error,
        },
        enterEditMode: mockEnterEditMode,
        exitEditMode: mockExitEditMode,
        updateMetadata: mockUpdateMetadata,
        updateActivity: mockUpdateActivity,
        deleteActivity: mockDeleteActivity,
        addActivity: mockAddActivity,
        deleteDay: mockDeleteDay,
        addDay: mockAddDay,
        updateAccommodation: mockUpdateAccommodation,
        removeAccommodation: mockRemoveAccommodation,
        addAccommodation: mockAddAccommodation,
        savePlan: mockSavePlan,
        deletePlan: mockDeletePlan,
        refetch: mockRefetch,
        showDeleteDialog: mockShowDeleteDialog,
        hideDeleteDialog: mockHideDeleteDialog,
      });

      render(<TripPlanDetailsView planId="plan-123" />);

      expect(screen.getByTestId("error-type")).toHaveTextContent("network-error");
    });

    it("should display error when plan is null without explicit error", () => {
      vi.mocked(useTripPlanDetails).mockReturnValue({
        state: {
          originalPlan: null,
          editedPlan: null,
          isLoading: false,
          isSaving: false,
          isDeleting: false,
          isEditMode: false,
          showDeleteDialog: false,
          error: null,
        },
        enterEditMode: mockEnterEditMode,
        exitEditMode: mockExitEditMode,
        updateMetadata: mockUpdateMetadata,
        updateActivity: mockUpdateActivity,
        deleteActivity: mockDeleteActivity,
        addActivity: mockAddActivity,
        deleteDay: mockDeleteDay,
        addDay: mockAddDay,
        updateAccommodation: mockUpdateAccommodation,
        removeAccommodation: mockRemoveAccommodation,
        addAccommodation: mockAddAccommodation,
        savePlan: mockSavePlan,
        deletePlan: mockDeletePlan,
        refetch: mockRefetch,
        showDeleteDialog: mockShowDeleteDialog,
        hideDeleteDialog: mockHideDeleteDialog,
      });

      render(<TripPlanDetailsView planId="plan-123" />);

      expect(screen.getByTestId("error-state")).toBeInTheDocument();
      expect(screen.getByTestId("error-type")).toHaveTextContent("not-found");
    });
  });

  describe("Display plan in view mode", () => {
    it("should display plan details in view mode", () => {
      const mockPlan = createMockTripPlan();

      vi.mocked(useTripPlanDetails).mockReturnValue({
        state: {
          originalPlan: mockPlan,
          editedPlan: mockPlan,
          isLoading: false,
          isSaving: false,
          isDeleting: false,
          isEditMode: false,
          showDeleteDialog: false,
          error: null,
        },
        enterEditMode: mockEnterEditMode,
        exitEditMode: mockExitEditMode,
        updateMetadata: mockUpdateMetadata,
        updateActivity: mockUpdateActivity,
        deleteActivity: mockDeleteActivity,
        addActivity: mockAddActivity,
        deleteDay: mockDeleteDay,
        addDay: mockAddDay,
        updateAccommodation: mockUpdateAccommodation,
        removeAccommodation: mockRemoveAccommodation,
        addAccommodation: mockAddAccommodation,
        savePlan: mockSavePlan,
        deletePlan: mockDeletePlan,
        refetch: mockRefetch,
        showDeleteDialog: mockShowDeleteDialog,
        hideDeleteDialog: mockHideDeleteDialog,
      });

      render(<TripPlanDetailsView planId="plan-123" />);

      expect(screen.getByTestId("trip-plan-header")).toBeInTheDocument();
      expect(screen.getByTestId("destination")).toHaveTextContent("Paris");
      expect(screen.getByTestId("edit-mode")).toHaveTextContent("View Mode");
    });

    it("should display all days", () => {
      const mockPlan = createMockTripPlan();

      vi.mocked(useTripPlanDetails).mockReturnValue({
        state: {
          originalPlan: mockPlan,
          editedPlan: mockPlan,
          isLoading: false,
          isSaving: false,
          isDeleting: false,
          isEditMode: false,
          showDeleteDialog: false,
          error: null,
        },
        enterEditMode: mockEnterEditMode,
        exitEditMode: mockExitEditMode,
        updateMetadata: mockUpdateMetadata,
        updateActivity: mockUpdateActivity,
        deleteActivity: mockDeleteActivity,
        addActivity: mockAddActivity,
        deleteDay: mockDeleteDay,
        addDay: mockAddDay,
        updateAccommodation: mockUpdateAccommodation,
        removeAccommodation: mockRemoveAccommodation,
        addAccommodation: mockAddAccommodation,
        savePlan: mockSavePlan,
        deletePlan: mockDeletePlan,
        refetch: mockRefetch,
        showDeleteDialog: mockShowDeleteDialog,
        hideDeleteDialog: mockHideDeleteDialog,
      });

      render(<TripPlanDetailsView planId="plan-123" />);

      expect(screen.getByTestId("plan-day-0")).toBeInTheDocument();
      expect(screen.getByTestId("plan-day-1")).toBeInTheDocument();
      expect(screen.getByTestId("day-number-0")).toHaveTextContent("Day 1");
      expect(screen.getByTestId("day-number-1")).toHaveTextContent("Day 2");
    });

    it("should display accommodation section", () => {
      const mockPlan = createMockTripPlan();

      vi.mocked(useTripPlanDetails).mockReturnValue({
        state: {
          originalPlan: mockPlan,
          editedPlan: mockPlan,
          isLoading: false,
          isSaving: false,
          isDeleting: false,
          isEditMode: false,
          showDeleteDialog: false,
          error: null,
        },
        enterEditMode: mockEnterEditMode,
        exitEditMode: mockExitEditMode,
        updateMetadata: mockUpdateMetadata,
        updateActivity: mockUpdateActivity,
        deleteActivity: mockDeleteActivity,
        addActivity: mockAddActivity,
        deleteDay: mockDeleteDay,
        addDay: mockAddDay,
        updateAccommodation: mockUpdateAccommodation,
        removeAccommodation: mockRemoveAccommodation,
        addAccommodation: mockAddAccommodation,
        savePlan: mockSavePlan,
        deletePlan: mockDeletePlan,
        refetch: mockRefetch,
        showDeleteDialog: mockShowDeleteDialog,
        hideDeleteDialog: mockHideDeleteDialog,
      });

      render(<TripPlanDetailsView planId="plan-123" />);

      expect(screen.getByTestId("accommodation-section")).toBeInTheDocument();
      expect(screen.getByTestId("accommodation-name")).toHaveTextContent("Hotel Paris");
    });

    it("should display notes section when notes exist", () => {
      const mockPlan = createMockTripPlan();

      vi.mocked(useTripPlanDetails).mockReturnValue({
        state: {
          originalPlan: mockPlan,
          editedPlan: mockPlan,
          isLoading: false,
          isSaving: false,
          isDeleting: false,
          isEditMode: false,
          showDeleteDialog: false,
          error: null,
        },
        enterEditMode: mockEnterEditMode,
        exitEditMode: mockExitEditMode,
        updateMetadata: mockUpdateMetadata,
        updateActivity: mockUpdateActivity,
        deleteActivity: mockDeleteActivity,
        addActivity: mockAddActivity,
        deleteDay: mockDeleteDay,
        addDay: mockAddDay,
        updateAccommodation: mockUpdateAccommodation,
        removeAccommodation: mockRemoveAccommodation,
        addAccommodation: mockAddAccommodation,
        savePlan: mockSavePlan,
        deletePlan: mockDeletePlan,
        refetch: mockRefetch,
        showDeleteDialog: mockShowDeleteDialog,
        hideDeleteDialog: mockHideDeleteDialog,
      });

      render(<TripPlanDetailsView planId="plan-123" />);

      expect(screen.getByText("Notatki")).toBeInTheDocument();
      expect(screen.getByText("Great trip!")).toBeInTheDocument();
    });

    it("should not display notes section when notes are absent", () => {
      const mockPlan = createMockTripPlan({
        plan_details: {
          days: [
            {
              day: 1,
              date: "2025-06-01",
              activities: [
                {
                  time: "10:00",
                  title: "Activity",
                  description: "Description",
                  location: "Location",
                },
              ],
            },
          ],
        },
      });

      vi.mocked(useTripPlanDetails).mockReturnValue({
        state: {
          originalPlan: mockPlan,
          editedPlan: mockPlan,
          isLoading: false,
          isSaving: false,
          isDeleting: false,
          isEditMode: false,
          showDeleteDialog: false,
          error: null,
        },
        enterEditMode: mockEnterEditMode,
        exitEditMode: mockExitEditMode,
        updateMetadata: mockUpdateMetadata,
        updateActivity: mockUpdateActivity,
        deleteActivity: mockDeleteActivity,
        addActivity: mockAddActivity,
        deleteDay: mockDeleteDay,
        addDay: mockAddDay,
        updateAccommodation: mockUpdateAccommodation,
        removeAccommodation: mockRemoveAccommodation,
        addAccommodation: mockAddAccommodation,
        savePlan: mockSavePlan,
        deletePlan: mockDeletePlan,
        refetch: mockRefetch,
        showDeleteDialog: mockShowDeleteDialog,
        hideDeleteDialog: mockHideDeleteDialog,
      });

      render(<TripPlanDetailsView planId="plan-123" />);

      expect(screen.queryByText("Notatki")).not.toBeInTheDocument();
    });

    it("should display total estimated cost when available", () => {
      const mockPlan = createMockTripPlan();

      vi.mocked(useTripPlanDetails).mockReturnValue({
        state: {
          originalPlan: mockPlan,
          editedPlan: mockPlan,
          isLoading: false,
          isSaving: false,
          isDeleting: false,
          isEditMode: false,
          showDeleteDialog: false,
          error: null,
        },
        enterEditMode: mockEnterEditMode,
        exitEditMode: mockExitEditMode,
        updateMetadata: mockUpdateMetadata,
        updateActivity: mockUpdateActivity,
        deleteActivity: mockDeleteActivity,
        addActivity: mockAddActivity,
        deleteDay: mockDeleteDay,
        addDay: mockAddDay,
        updateAccommodation: mockUpdateAccommodation,
        removeAccommodation: mockRemoveAccommodation,
        addAccommodation: mockAddAccommodation,
        savePlan: mockSavePlan,
        deletePlan: mockDeletePlan,
        refetch: mockRefetch,
        showDeleteDialog: mockShowDeleteDialog,
        hideDeleteDialog: mockHideDeleteDialog,
      });

      render(<TripPlanDetailsView planId="plan-123" />);

      expect(screen.getByText("Szacunkowy całkowity koszt:")).toBeInTheDocument();
      expect(screen.getByText("500 PLN")).toBeInTheDocument();
    });
  });

  describe("Edit mode", () => {
    it("should enter edit mode when edit button is clicked", async () => {
      const user = userEvent.setup();
      const mockPlan = createMockTripPlan();

      vi.mocked(useTripPlanDetails).mockReturnValue({
        state: {
          originalPlan: mockPlan,
          editedPlan: mockPlan,
          isLoading: false,
          isSaving: false,
          isDeleting: false,
          isEditMode: false,
          showDeleteDialog: false,
          error: null,
        },
        enterEditMode: mockEnterEditMode,
        exitEditMode: mockExitEditMode,
        updateMetadata: mockUpdateMetadata,
        updateActivity: mockUpdateActivity,
        deleteActivity: mockDeleteActivity,
        addActivity: mockAddActivity,
        deleteDay: mockDeleteDay,
        addDay: mockAddDay,
        updateAccommodation: mockUpdateAccommodation,
        removeAccommodation: mockRemoveAccommodation,
        addAccommodation: mockAddAccommodation,
        savePlan: mockSavePlan,
        deletePlan: mockDeletePlan,
        refetch: mockRefetch,
        showDeleteDialog: mockShowDeleteDialog,
        hideDeleteDialog: mockHideDeleteDialog,
      });

      render(<TripPlanDetailsView planId="plan-123" />);

      const editButton = screen.getByTestId("edit-button");
      await user.click(editButton);

      expect(mockEnterEditMode).toHaveBeenCalledTimes(1);
    });

    it("should display plan in edit mode", () => {
      const mockPlan = createMockTripPlan();

      vi.mocked(useTripPlanDetails).mockReturnValue({
        state: {
          originalPlan: mockPlan,
          editedPlan: mockPlan,
          isLoading: false,
          isSaving: false,
          isDeleting: false,
          isEditMode: true,
          showDeleteDialog: false,
          error: null,
        },
        enterEditMode: mockEnterEditMode,
        exitEditMode: mockExitEditMode,
        updateMetadata: mockUpdateMetadata,
        updateActivity: mockUpdateActivity,
        deleteActivity: mockDeleteActivity,
        addActivity: mockAddActivity,
        deleteDay: mockDeleteDay,
        addDay: mockAddDay,
        updateAccommodation: mockUpdateAccommodation,
        removeAccommodation: mockRemoveAccommodation,
        addAccommodation: mockAddAccommodation,
        savePlan: mockSavePlan,
        deletePlan: mockDeletePlan,
        refetch: mockRefetch,
        showDeleteDialog: mockShowDeleteDialog,
        hideDeleteDialog: mockHideDeleteDialog,
      });

      render(<TripPlanDetailsView planId="plan-123" />);

      expect(screen.getByTestId("edit-mode")).toHaveTextContent("Edit Mode");
      expect(screen.getByTestId("day-edit-mode-0")).toHaveTextContent("Editable");
      expect(screen.getByTestId("accommodation-edit-mode")).toHaveTextContent("Editable");
    });

    it("should exit edit mode when cancel button is clicked", async () => {
      const user = userEvent.setup();
      const mockPlan = createMockTripPlan();

      vi.mocked(useTripPlanDetails).mockReturnValue({
        state: {
          originalPlan: mockPlan,
          editedPlan: mockPlan,
          isLoading: false,
          isSaving: false,
          isDeleting: false,
          isEditMode: true,
          showDeleteDialog: false,
          error: null,
        },
        enterEditMode: mockEnterEditMode,
        exitEditMode: mockExitEditMode,
        updateMetadata: mockUpdateMetadata,
        updateActivity: mockUpdateActivity,
        deleteActivity: mockDeleteActivity,
        addActivity: mockAddActivity,
        deleteDay: mockDeleteDay,
        addDay: mockAddDay,
        updateAccommodation: mockUpdateAccommodation,
        removeAccommodation: mockRemoveAccommodation,
        addAccommodation: mockAddAccommodation,
        savePlan: mockSavePlan,
        deletePlan: mockDeletePlan,
        refetch: mockRefetch,
        showDeleteDialog: mockShowDeleteDialog,
        hideDeleteDialog: mockHideDeleteDialog,
      });

      render(<TripPlanDetailsView planId="plan-123" />);

      const cancelButton = screen.getByTestId("cancel-button");
      await user.click(cancelButton);

      expect(mockExitEditMode).toHaveBeenCalledTimes(1);
    });

    it("should use editedPlan in edit mode", () => {
      const originalPlan = createMockTripPlan({ destination: "Paris" });
      const editedPlan = createMockTripPlan({ destination: "London" });

      vi.mocked(useTripPlanDetails).mockReturnValue({
        state: {
          originalPlan,
          editedPlan,
          isLoading: false,
          isSaving: false,
          isDeleting: false,
          isEditMode: true,
          showDeleteDialog: false,
          error: null,
        },
        enterEditMode: mockEnterEditMode,
        exitEditMode: mockExitEditMode,
        updateMetadata: mockUpdateMetadata,
        updateActivity: mockUpdateActivity,
        deleteActivity: mockDeleteActivity,
        addActivity: mockAddActivity,
        deleteDay: mockDeleteDay,
        addDay: mockAddDay,
        updateAccommodation: mockUpdateAccommodation,
        removeAccommodation: mockRemoveAccommodation,
        addAccommodation: mockAddAccommodation,
        savePlan: mockSavePlan,
        deletePlan: mockDeletePlan,
        refetch: mockRefetch,
        showDeleteDialog: mockShowDeleteDialog,
        hideDeleteDialog: mockHideDeleteDialog,
      });

      render(<TripPlanDetailsView planId="plan-123" />);

      // Should display edited plan, not original
      expect(screen.getByTestId("destination")).toHaveTextContent("London");
    });
  });

  describe("Save plan", () => {
    it("should call savePlan when save button is clicked", async () => {
      const user = userEvent.setup();
      const mockPlan = createMockTripPlan();

      mockSavePlan.mockResolvedValueOnce(true);

      vi.mocked(useTripPlanDetails).mockReturnValue({
        state: {
          originalPlan: mockPlan,
          editedPlan: mockPlan,
          isLoading: false,
          isSaving: false,
          isDeleting: false,
          isEditMode: true,
          showDeleteDialog: false,
          error: null,
        },
        enterEditMode: mockEnterEditMode,
        exitEditMode: mockExitEditMode,
        updateMetadata: mockUpdateMetadata,
        updateActivity: mockUpdateActivity,
        deleteActivity: mockDeleteActivity,
        addActivity: mockAddActivity,
        deleteDay: mockDeleteDay,
        addDay: mockAddDay,
        updateAccommodation: mockUpdateAccommodation,
        removeAccommodation: mockRemoveAccommodation,
        addAccommodation: mockAddAccommodation,
        savePlan: mockSavePlan,
        deletePlan: mockDeletePlan,
        refetch: mockRefetch,
        showDeleteDialog: mockShowDeleteDialog,
        hideDeleteDialog: mockHideDeleteDialog,
      });

      render(<TripPlanDetailsView planId="plan-123" />);

      const saveButton = screen.getByTestId("save-button");
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockSavePlan).toHaveBeenCalledTimes(1);
      });
    });

    it("should display saving state", () => {
      const mockPlan = createMockTripPlan();

      vi.mocked(useTripPlanDetails).mockReturnValue({
        state: {
          originalPlan: mockPlan,
          editedPlan: mockPlan,
          isLoading: false,
          isSaving: true,
          isDeleting: false,
          isEditMode: true,
          showDeleteDialog: false,
          error: null,
        },
        enterEditMode: mockEnterEditMode,
        exitEditMode: mockExitEditMode,
        updateMetadata: mockUpdateMetadata,
        updateActivity: mockUpdateActivity,
        deleteActivity: mockDeleteActivity,
        addActivity: mockAddActivity,
        deleteDay: mockDeleteDay,
        addDay: mockAddDay,
        updateAccommodation: mockUpdateAccommodation,
        removeAccommodation: mockRemoveAccommodation,
        addAccommodation: mockAddAccommodation,
        savePlan: mockSavePlan,
        deletePlan: mockDeletePlan,
        refetch: mockRefetch,
        showDeleteDialog: mockShowDeleteDialog,
        hideDeleteDialog: mockHideDeleteDialog,
      });

      render(<TripPlanDetailsView planId="plan-123" />);

      expect(screen.getByTestId("is-saving")).toHaveTextContent("Saving...");
      expect(screen.getByTestId("save-button")).toBeDisabled();
    });
  });

  describe("Validation", () => {
    it("should not save when destination is empty", async () => {
      const user = userEvent.setup();
      const mockPlan = createMockTripPlan({ destination: "" });

      vi.mocked(useTripPlanDetails).mockReturnValue({
        state: {
          originalPlan: mockPlan,
          editedPlan: mockPlan,
          isLoading: false,
          isSaving: false,
          isDeleting: false,
          isEditMode: true,
          showDeleteDialog: false,
          error: null,
        },
        enterEditMode: mockEnterEditMode,
        exitEditMode: mockExitEditMode,
        updateMetadata: mockUpdateMetadata,
        updateActivity: mockUpdateActivity,
        deleteActivity: mockDeleteActivity,
        addActivity: mockAddActivity,
        deleteDay: mockDeleteDay,
        addDay: mockAddDay,
        updateAccommodation: mockUpdateAccommodation,
        removeAccommodation: mockRemoveAccommodation,
        addAccommodation: mockAddAccommodation,
        savePlan: mockSavePlan,
        deletePlan: mockDeletePlan,
        refetch: mockRefetch,
        showDeleteDialog: mockShowDeleteDialog,
        hideDeleteDialog: mockHideDeleteDialog,
      });

      render(<TripPlanDetailsView planId="plan-123" />);

      const saveButton = screen.getByTestId("save-button");
      await user.click(saveButton);

      // Should not call savePlan due to validation error
      expect(mockSavePlan).not.toHaveBeenCalled();
      expect(screen.getByTestId("validation-error-destination")).toHaveTextContent("Cel podróży jest wymagany");
    });

    it("should not save when end_date is before start_date", async () => {
      const user = userEvent.setup();
      const mockPlan = createMockTripPlan({
        start_date: "2025-06-05",
        end_date: "2025-06-01",
      });

      vi.mocked(useTripPlanDetails).mockReturnValue({
        state: {
          originalPlan: mockPlan,
          editedPlan: mockPlan,
          isLoading: false,
          isSaving: false,
          isDeleting: false,
          isEditMode: true,
          showDeleteDialog: false,
          error: null,
        },
        enterEditMode: mockEnterEditMode,
        exitEditMode: mockExitEditMode,
        updateMetadata: mockUpdateMetadata,
        updateActivity: mockUpdateActivity,
        deleteActivity: mockDeleteActivity,
        addActivity: mockAddActivity,
        deleteDay: mockDeleteDay,
        addDay: mockAddDay,
        updateAccommodation: mockUpdateAccommodation,
        removeAccommodation: mockRemoveAccommodation,
        addAccommodation: mockAddAccommodation,
        savePlan: mockSavePlan,
        deletePlan: mockDeletePlan,
        refetch: mockRefetch,
        showDeleteDialog: mockShowDeleteDialog,
        hideDeleteDialog: mockHideDeleteDialog,
      });

      render(<TripPlanDetailsView planId="plan-123" />);

      const saveButton = screen.getByTestId("save-button");
      await user.click(saveButton);

      expect(mockSavePlan).not.toHaveBeenCalled();
      expect(screen.getByTestId("validation-error-end_date")).toHaveTextContent(
        "Data zakończenia musi być >= data rozpoczęcia"
      );
    });

    it("should not save when people_count is less than 1", async () => {
      const user = userEvent.setup();
      const mockPlan = createMockTripPlan({ people_count: 0 });

      vi.mocked(useTripPlanDetails).mockReturnValue({
        state: {
          originalPlan: mockPlan,
          editedPlan: mockPlan,
          isLoading: false,
          isSaving: false,
          isDeleting: false,
          isEditMode: true,
          showDeleteDialog: false,
          error: null,
        },
        enterEditMode: mockEnterEditMode,
        exitEditMode: mockExitEditMode,
        updateMetadata: mockUpdateMetadata,
        updateActivity: mockUpdateActivity,
        deleteActivity: mockDeleteActivity,
        addActivity: mockAddActivity,
        deleteDay: mockDeleteDay,
        addDay: mockAddDay,
        updateAccommodation: mockUpdateAccommodation,
        removeAccommodation: mockRemoveAccommodation,
        addAccommodation: mockAddAccommodation,
        savePlan: mockSavePlan,
        deletePlan: mockDeletePlan,
        refetch: mockRefetch,
        showDeleteDialog: mockShowDeleteDialog,
        hideDeleteDialog: mockHideDeleteDialog,
      });

      render(<TripPlanDetailsView planId="plan-123" />);

      const saveButton = screen.getByTestId("save-button");
      await user.click(saveButton);

      expect(mockSavePlan).not.toHaveBeenCalled();
      expect(screen.getByTestId("validation-error-people_count")).toHaveTextContent("Liczba osób musi być >= 1");
    });

    it("should not save when plan has no days", async () => {
      const user = userEvent.setup();
      const mockPlan = createMockTripPlan({
        plan_details: {
          days: [],
        },
      });

      vi.mocked(useTripPlanDetails).mockReturnValue({
        state: {
          originalPlan: mockPlan,
          editedPlan: mockPlan,
          isLoading: false,
          isSaving: false,
          isDeleting: false,
          isEditMode: true,
          showDeleteDialog: false,
          error: null,
        },
        enterEditMode: mockEnterEditMode,
        exitEditMode: mockExitEditMode,
        updateMetadata: mockUpdateMetadata,
        updateActivity: mockUpdateActivity,
        deleteActivity: mockDeleteActivity,
        addActivity: mockAddActivity,
        deleteDay: mockDeleteDay,
        addDay: mockAddDay,
        updateAccommodation: mockUpdateAccommodation,
        removeAccommodation: mockRemoveAccommodation,
        addAccommodation: mockAddAccommodation,
        savePlan: mockSavePlan,
        deletePlan: mockDeletePlan,
        refetch: mockRefetch,
        showDeleteDialog: mockShowDeleteDialog,
        hideDeleteDialog: mockHideDeleteDialog,
      });

      render(<TripPlanDetailsView planId="plan-123" />);

      const saveButton = screen.getByTestId("save-button");
      await user.click(saveButton);

      expect(mockSavePlan).not.toHaveBeenCalled();
      const errorMessages = screen.getAllByText("Plan musi zawierać co najmniej jeden dzień");
      expect(errorMessages.length).toBeGreaterThan(0);
    });

    it("should not save when a day has no activities", async () => {
      const user = userEvent.setup();
      const mockPlan = createMockTripPlan({
        plan_details: {
          days: [
            {
              day: 1,
              date: "2025-06-01",
              activities: [],
            },
          ],
        },
      });

      vi.mocked(useTripPlanDetails).mockReturnValue({
        state: {
          originalPlan: mockPlan,
          editedPlan: mockPlan,
          isLoading: false,
          isSaving: false,
          isDeleting: false,
          isEditMode: true,
          showDeleteDialog: false,
          error: null,
        },
        enterEditMode: mockEnterEditMode,
        exitEditMode: mockExitEditMode,
        updateMetadata: mockUpdateMetadata,
        updateActivity: mockUpdateActivity,
        deleteActivity: mockDeleteActivity,
        addActivity: mockAddActivity,
        deleteDay: mockDeleteDay,
        addDay: mockAddDay,
        updateAccommodation: mockUpdateAccommodation,
        removeAccommodation: mockRemoveAccommodation,
        addAccommodation: mockAddAccommodation,
        savePlan: mockSavePlan,
        deletePlan: mockDeletePlan,
        refetch: mockRefetch,
        showDeleteDialog: mockShowDeleteDialog,
        hideDeleteDialog: mockHideDeleteDialog,
      });

      render(<TripPlanDetailsView planId="plan-123" />);

      const saveButton = screen.getByTestId("save-button");
      await user.click(saveButton);

      expect(mockSavePlan).not.toHaveBeenCalled();
      const errorMessages = screen.getAllByText("Każdy dzień musi zawierać co najmniej jedną aktywność");
      expect(errorMessages.length).toBeGreaterThan(0);
    });

    it("should display validation errors only in edit mode", () => {
      const mockPlan = createMockTripPlan({ destination: "" });

      // First, render in view mode
      vi.mocked(useTripPlanDetails).mockReturnValue({
        state: {
          originalPlan: mockPlan,
          editedPlan: mockPlan,
          isLoading: false,
          isSaving: false,
          isDeleting: false,
          isEditMode: false,
          showDeleteDialog: false,
          error: null,
        },
        enterEditMode: mockEnterEditMode,
        exitEditMode: mockExitEditMode,
        updateMetadata: mockUpdateMetadata,
        updateActivity: mockUpdateActivity,
        deleteActivity: mockDeleteActivity,
        addActivity: mockAddActivity,
        deleteDay: mockDeleteDay,
        addDay: mockAddDay,
        updateAccommodation: mockUpdateAccommodation,
        removeAccommodation: mockRemoveAccommodation,
        addAccommodation: mockAddAccommodation,
        savePlan: mockSavePlan,
        deletePlan: mockDeletePlan,
        refetch: mockRefetch,
        showDeleteDialog: mockShowDeleteDialog,
        hideDeleteDialog: mockHideDeleteDialog,
      });

      const { rerender } = render(<TripPlanDetailsView planId="plan-123" />);

      // Should not display validation errors in view mode
      expect(screen.queryByTestId("validation-errors")).not.toBeInTheDocument();

      // Now render in edit mode
      vi.mocked(useTripPlanDetails).mockReturnValue({
        state: {
          originalPlan: mockPlan,
          editedPlan: mockPlan,
          isLoading: false,
          isSaving: false,
          isDeleting: false,
          isEditMode: true,
          showDeleteDialog: false,
          error: null,
        },
        enterEditMode: mockEnterEditMode,
        exitEditMode: mockExitEditMode,
        updateMetadata: mockUpdateMetadata,
        updateActivity: mockUpdateActivity,
        deleteActivity: mockDeleteActivity,
        addActivity: mockAddActivity,
        deleteDay: mockDeleteDay,
        addDay: mockAddDay,
        updateAccommodation: mockUpdateAccommodation,
        removeAccommodation: mockRemoveAccommodation,
        addAccommodation: mockAddAccommodation,
        savePlan: mockSavePlan,
        deletePlan: mockDeletePlan,
        refetch: mockRefetch,
        showDeleteDialog: mockShowDeleteDialog,
        hideDeleteDialog: mockHideDeleteDialog,
      });

      rerender(<TripPlanDetailsView planId="plan-123" />);

      // Should display validation errors in edit mode
      expect(screen.getByTestId("validation-errors")).toBeInTheDocument();
    });
  });

  describe("Delete plan", () => {
    it("should show delete dialog when delete button is clicked", async () => {
      const user = userEvent.setup();
      const mockPlan = createMockTripPlan();

      const { rerender } = render(<TripPlanDetailsView planId="plan-123" />);

      vi.mocked(useTripPlanDetails).mockReturnValue({
        state: {
          originalPlan: mockPlan,
          editedPlan: mockPlan,
          isLoading: false,
          isSaving: false,
          isDeleting: false,
          isEditMode: false,
          showDeleteDialog: false,
          error: null,
        },
        enterEditMode: mockEnterEditMode,
        exitEditMode: mockExitEditMode,
        updateMetadata: mockUpdateMetadata,
        updateActivity: mockUpdateActivity,
        deleteActivity: mockDeleteActivity,
        addActivity: mockAddActivity,
        deleteDay: mockDeleteDay,
        addDay: mockAddDay,
        updateAccommodation: mockUpdateAccommodation,
        removeAccommodation: mockRemoveAccommodation,
        addAccommodation: mockAddAccommodation,
        savePlan: mockSavePlan,
        deletePlan: mockDeletePlan,
        refetch: mockRefetch,
        showDeleteDialog: mockShowDeleteDialog,
        hideDeleteDialog: mockHideDeleteDialog,
      });

      rerender(<TripPlanDetailsView planId="plan-123" />);

      const deleteButton = screen.getByTestId("delete-button");
      await user.click(deleteButton);

      expect(mockShowDeleteDialog).toHaveBeenCalledTimes(1);
    });

    it("should display delete dialog when showDeleteDialog is true", () => {
      const mockPlan = createMockTripPlan();

      vi.mocked(useTripPlanDetails).mockReturnValue({
        state: {
          originalPlan: mockPlan,
          editedPlan: mockPlan,
          isLoading: false,
          isSaving: false,
          isDeleting: false,
          isEditMode: false,
          showDeleteDialog: true,
          error: null,
        },
        enterEditMode: mockEnterEditMode,
        exitEditMode: mockExitEditMode,
        updateMetadata: mockUpdateMetadata,
        updateActivity: mockUpdateActivity,
        deleteActivity: mockDeleteActivity,
        addActivity: mockAddActivity,
        deleteDay: mockDeleteDay,
        addDay: mockAddDay,
        updateAccommodation: mockUpdateAccommodation,
        removeAccommodation: mockRemoveAccommodation,
        addAccommodation: mockAddAccommodation,
        savePlan: mockSavePlan,
        deletePlan: mockDeletePlan,
        refetch: mockRefetch,
        showDeleteDialog: mockShowDeleteDialog,
        hideDeleteDialog: mockHideDeleteDialog,
      });

      render(<TripPlanDetailsView planId="plan-123" />);

      expect(screen.getByTestId("delete-confirm-dialog")).toBeInTheDocument();
      expect(screen.getByTestId("dialog-plan-name")).toHaveTextContent("Paris");
    });

    it("should call deletePlan when confirm button is clicked", async () => {
      const user = userEvent.setup();
      const mockPlan = createMockTripPlan();

      mockDeletePlan.mockResolvedValueOnce(true);

      vi.mocked(useTripPlanDetails).mockReturnValue({
        state: {
          originalPlan: mockPlan,
          editedPlan: mockPlan,
          isLoading: false,
          isSaving: false,
          isDeleting: false,
          isEditMode: false,
          showDeleteDialog: true,
          error: null,
        },
        enterEditMode: mockEnterEditMode,
        exitEditMode: mockExitEditMode,
        updateMetadata: mockUpdateMetadata,
        updateActivity: mockUpdateActivity,
        deleteActivity: mockDeleteActivity,
        addActivity: mockAddActivity,
        deleteDay: mockDeleteDay,
        addDay: mockAddDay,
        updateAccommodation: mockUpdateAccommodation,
        removeAccommodation: mockRemoveAccommodation,
        addAccommodation: mockAddAccommodation,
        savePlan: mockSavePlan,
        deletePlan: mockDeletePlan,
        refetch: mockRefetch,
        showDeleteDialog: mockShowDeleteDialog,
        hideDeleteDialog: mockHideDeleteDialog,
      });

      render(<TripPlanDetailsView planId="plan-123" />);

      const confirmButton = screen.getByTestId("confirm-delete-button");
      await user.click(confirmButton);

      await waitFor(() => {
        expect(mockDeletePlan).toHaveBeenCalledTimes(1);
      });
    });

    it("should hide delete dialog when cancel button is clicked", async () => {
      const user = userEvent.setup();
      const mockPlan = createMockTripPlan();

      vi.mocked(useTripPlanDetails).mockReturnValue({
        state: {
          originalPlan: mockPlan,
          editedPlan: mockPlan,
          isLoading: false,
          isSaving: false,
          isDeleting: false,
          isEditMode: false,
          showDeleteDialog: true,
          error: null,
        },
        enterEditMode: mockEnterEditMode,
        exitEditMode: mockExitEditMode,
        updateMetadata: mockUpdateMetadata,
        updateActivity: mockUpdateActivity,
        deleteActivity: mockDeleteActivity,
        addActivity: mockAddActivity,
        deleteDay: mockDeleteDay,
        addDay: mockAddDay,
        updateAccommodation: mockUpdateAccommodation,
        removeAccommodation: mockRemoveAccommodation,
        addAccommodation: mockAddAccommodation,
        savePlan: mockSavePlan,
        deletePlan: mockDeletePlan,
        refetch: mockRefetch,
        showDeleteDialog: mockShowDeleteDialog,
        hideDeleteDialog: mockHideDeleteDialog,
      });

      render(<TripPlanDetailsView planId="plan-123" />);

      const cancelButton = screen.getByTestId("cancel-delete-button");
      await user.click(cancelButton);

      expect(mockHideDeleteDialog).toHaveBeenCalledTimes(1);
    });

    it("should display deleting state", () => {
      const mockPlan = createMockTripPlan();

      vi.mocked(useTripPlanDetails).mockReturnValue({
        state: {
          originalPlan: mockPlan,
          editedPlan: mockPlan,
          isLoading: false,
          isSaving: false,
          isDeleting: true,
          isEditMode: false,
          showDeleteDialog: true,
          error: null,
        },
        enterEditMode: mockEnterEditMode,
        exitEditMode: mockExitEditMode,
        updateMetadata: mockUpdateMetadata,
        updateActivity: mockUpdateActivity,
        deleteActivity: mockDeleteActivity,
        addActivity: mockAddActivity,
        deleteDay: mockDeleteDay,
        addDay: mockAddDay,
        updateAccommodation: mockUpdateAccommodation,
        removeAccommodation: mockRemoveAccommodation,
        addAccommodation: mockAddAccommodation,
        savePlan: mockSavePlan,
        deletePlan: mockDeletePlan,
        refetch: mockRefetch,
        showDeleteDialog: mockShowDeleteDialog,
        hideDeleteDialog: mockHideDeleteDialog,
      });

      render(<TripPlanDetailsView planId="plan-123" />);

      expect(screen.getByTestId("dialog-is-deleting")).toHaveTextContent("Deleting...");
      expect(screen.getByTestId("confirm-delete-button")).toBeDisabled();
    });
  });

  describe("Edge cases", () => {
    it("should handle plan without accommodation", () => {
      const mockPlan = createMockTripPlan({
        plan_details: {
          days: [
            {
              day: 1,
              date: "2025-06-01",
              activities: [
                {
                  time: "10:00",
                  title: "Activity",
                  description: "Description",
                  location: "Location",
                },
              ],
            },
          ],
        },
      });

      vi.mocked(useTripPlanDetails).mockReturnValue({
        state: {
          originalPlan: mockPlan,
          editedPlan: mockPlan,
          isLoading: false,
          isSaving: false,
          isDeleting: false,
          isEditMode: false,
          showDeleteDialog: false,
          error: null,
        },
        enterEditMode: mockEnterEditMode,
        exitEditMode: mockExitEditMode,
        updateMetadata: mockUpdateMetadata,
        updateActivity: mockUpdateActivity,
        deleteActivity: mockDeleteActivity,
        addActivity: mockAddActivity,
        deleteDay: mockDeleteDay,
        addDay: mockAddDay,
        updateAccommodation: mockUpdateAccommodation,
        removeAccommodation: mockRemoveAccommodation,
        addAccommodation: mockAddAccommodation,
        savePlan: mockSavePlan,
        deletePlan: mockDeletePlan,
        refetch: mockRefetch,
        showDeleteDialog: mockShowDeleteDialog,
        hideDeleteDialog: mockHideDeleteDialog,
      });

      render(<TripPlanDetailsView planId="plan-123" />);

      expect(screen.getByTestId("accommodation-section")).toBeInTheDocument();
      expect(screen.getByTestId("no-accommodation")).toBeInTheDocument();
    });

    it("should handle plan with single day", () => {
      const mockPlan = createMockTripPlan({
        plan_details: {
          days: [
            {
              day: 1,
              date: "2025-06-01",
              activities: [
                {
                  time: "10:00",
                  title: "Activity",
                  description: "Description",
                  location: "Location",
                },
              ],
            },
          ],
        },
      });

      vi.mocked(useTripPlanDetails).mockReturnValue({
        state: {
          originalPlan: mockPlan,
          editedPlan: mockPlan,
          isLoading: false,
          isSaving: false,
          isDeleting: false,
          isEditMode: false,
          showDeleteDialog: false,
          error: null,
        },
        enterEditMode: mockEnterEditMode,
        exitEditMode: mockExitEditMode,
        updateMetadata: mockUpdateMetadata,
        updateActivity: mockUpdateActivity,
        deleteActivity: mockDeleteActivity,
        addActivity: mockAddActivity,
        deleteDay: mockDeleteDay,
        addDay: mockAddDay,
        updateAccommodation: mockUpdateAccommodation,
        removeAccommodation: mockRemoveAccommodation,
        addAccommodation: mockAddAccommodation,
        savePlan: mockSavePlan,
        deletePlan: mockDeletePlan,
        refetch: mockRefetch,
        showDeleteDialog: mockShowDeleteDialog,
        hideDeleteDialog: mockHideDeleteDialog,
      });

      render(<TripPlanDetailsView planId="plan-123" />);

      expect(screen.getByTestId("plan-day-0")).toBeInTheDocument();
      expect(screen.queryByTestId("plan-day-1")).not.toBeInTheDocument();
    });

    it("should pass planId to useTripPlanDetails", () => {
      const mockPlan = createMockTripPlan();

      vi.mocked(useTripPlanDetails).mockReturnValue({
        state: {
          originalPlan: mockPlan,
          editedPlan: mockPlan,
          isLoading: false,
          isSaving: false,
          isDeleting: false,
          isEditMode: false,
          showDeleteDialog: false,
          error: null,
        },
        enterEditMode: mockEnterEditMode,
        exitEditMode: mockExitEditMode,
        updateMetadata: mockUpdateMetadata,
        updateActivity: mockUpdateActivity,
        deleteActivity: mockDeleteActivity,
        addActivity: mockAddActivity,
        deleteDay: mockDeleteDay,
        addDay: mockAddDay,
        updateAccommodation: mockUpdateAccommodation,
        removeAccommodation: mockRemoveAccommodation,
        addAccommodation: mockAddAccommodation,
        savePlan: mockSavePlan,
        deletePlan: mockDeletePlan,
        refetch: mockRefetch,
        showDeleteDialog: mockShowDeleteDialog,
        hideDeleteDialog: mockHideDeleteDialog,
      });

      render(<TripPlanDetailsView planId="test-plan-456" />);

      expect(useTripPlanDetails).toHaveBeenCalledWith("test-plan-456");
    });
  });
});
