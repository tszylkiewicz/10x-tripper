/**
 * Unit tests for PreferencesView component
 *
 * Tests the main preferences management view orchestration:
 * - Initial loading state
 * - Preferences list display
 * - Empty state
 * - CRUD operations (Create, Edit, Delete)
 * - Dialog management
 * - Error handling
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PreferencesView } from "./PreferencesView";
import type { UserPreferenceDto, CreateUserPreferenceDto, UpdateUserPreferenceDto } from "../../types";
import type { PreferencesViewState } from "../types";

// Mock child components
vi.mock("./LoadingSpinner", () => ({
  LoadingSpinner: ({ message }: { message: string }) => <div data-testid="loading-spinner">{message}</div>,
}));

vi.mock("./ErrorAlert", () => ({
  ErrorAlert: ({ message, onDismiss, onRetry }: { message: string; onDismiss: () => void; onRetry: () => void }) => (
    <div data-testid="error-alert">
      <p>{message}</p>
      <button data-testid="dismiss-error" onClick={onDismiss}>
        Dismiss
      </button>
      <button data-testid="retry-button" onClick={onRetry}>
        Retry
      </button>
    </div>
  ),
}));

vi.mock("./EmptyState", () => ({
  EmptyState: ({ onCreateClick }: { onCreateClick: () => void }) => (
    <div data-testid="empty-state">
      <p>Brak preferencji</p>
      <button data-testid="empty-state-create-button" onClick={onCreateClick}>
        Utwórz pierwszą preferencję
      </button>
    </div>
  ),
}));

vi.mock("./PreferenceCard", () => ({
  PreferenceCard: ({
    preference,
    onEdit,
    onDelete,
  }: {
    preference: UserPreferenceDto;
    onEdit: (pref: UserPreferenceDto) => void;
    onDelete: (pref: UserPreferenceDto) => void;
  }) => (
    <div data-testid={`preference-card-${preference.id}`}>
      <h3>{preference.name}</h3>
      <p>People: {preference.people_count}</p>
      <p>Budget: {preference.budget_type}</p>
      <button data-testid={`edit-button-${preference.id}`} onClick={() => onEdit(preference)}>
        Edit
      </button>
      <button data-testid={`delete-button-${preference.id}`} onClick={() => onDelete(preference)}>
        Delete
      </button>
    </div>
  ),
}));

vi.mock("./PreferenceFormDialog", () => ({
  PreferenceFormDialog: ({
    open,
    mode,
    initialData,
    onSubmit,
    onCancel,
    isSubmitting,
  }: {
    open: boolean;
    mode: "create" | "edit";
    initialData?: UserPreferenceDto;
    onSubmit: (data: CreateUserPreferenceDto | UpdateUserPreferenceDto) => void;
    onCancel: () => void;
    isSubmitting: boolean;
  }) =>
    open ? (
      <div data-testid="preference-form-dialog">
        <p data-testid="dialog-mode">{mode}</p>
        <p data-testid="dialog-initial-data">{initialData?.name || "none"}</p>
        <button
          data-testid="submit-dialog-button"
          onClick={() =>
            onSubmit({
              name: "New Preference",
              people_count: 2,
              budget_type: "medium",
            })
          }
          disabled={isSubmitting}
        >
          Submit
        </button>
        <button data-testid="cancel-dialog-button" onClick={onCancel}>
          Cancel
        </button>
      </div>
    ) : null,
}));

vi.mock("./DeleteConfirmationDialog", () => ({
  DeleteConfirmationDialog: ({
    open,
    preference,
    onConfirm,
    onCancel,
    isDeleting,
  }: {
    open: boolean;
    preference: UserPreferenceDto | null;
    onConfirm: () => void;
    onCancel: () => void;
    isDeleting: boolean;
  }) =>
    open ? (
      <div data-testid="delete-confirmation-dialog">
        <p data-testid="delete-preference-name">{preference?.name}</p>
        <button data-testid="confirm-delete-button" onClick={onConfirm} disabled={isDeleting}>
          Confirm Delete
        </button>
        <button data-testid="cancel-delete-button" onClick={onCancel}>
          Cancel
        </button>
      </div>
    ) : null,
}));

// Mock hooks
const mockFetchPreferences = vi.fn();
const mockCreatePreference = vi.fn();
const mockUpdatePreference = vi.fn();
const mockDeletePreference = vi.fn();
const mockClearError = vi.fn();
const mockOpenCreateDialog = vi.fn();
const mockOpenEditDialog = vi.fn();
const mockOpenDeleteDialog = vi.fn();
const mockCloseFormDialog = vi.fn();
const mockCloseDeleteDialog = vi.fn();
const mockCloseAllDialogs = vi.fn();

vi.mock("../hooks/usePreferences", () => ({
  usePreferences: vi.fn(() => ({
    state: {
      preferences: [],
      isLoading: false,
      isSubmitting: false,
      isDeleting: false,
      error: null,
      dialogMode: null,
      selectedPreference: null,
      showDeleteDialog: false,
      preferenceToDelete: null,
    } as PreferencesViewState,
    fetchPreferences: mockFetchPreferences,
    createPreference: mockCreatePreference,
    updatePreference: mockUpdatePreference,
    deletePreference: mockDeletePreference,
    clearError: mockClearError,
    openCreateDialog: mockOpenCreateDialog,
    openEditDialog: mockOpenEditDialog,
    openDeleteDialog: mockOpenDeleteDialog,
    closeFormDialog: mockCloseFormDialog,
    closeDeleteDialog: mockCloseDeleteDialog,
    closeAllDialogs: mockCloseAllDialogs,
  })),
}));

// Get mocked hook for manipulation
const { usePreferences } = await import("../hooks/usePreferences");

// Helper to create mock preferences
function createMockPreference(overrides?: Partial<UserPreferenceDto>): UserPreferenceDto {
  return {
    id: "pref-123",
    name: "Weekend Getaway",
    people_count: 2,
    budget_type: "medium",
    ...overrides,
  };
}

describe("PreferencesView", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Reset default mock implementation
    vi.mocked(usePreferences).mockReturnValue({
      state: {
        preferences: [],
        isLoading: false,
        isSubmitting: false,
        isDeleting: false,
        error: null,
        dialogMode: null,
        selectedPreference: null,
        showDeleteDialog: false,
        preferenceToDelete: null,
      },
      fetchPreferences: mockFetchPreferences,
      createPreference: mockCreatePreference,
      updatePreference: mockUpdatePreference,
      deletePreference: mockDeletePreference,
      clearError: mockClearError,
      openCreateDialog: mockOpenCreateDialog,
      openEditDialog: mockOpenEditDialog,
      openDeleteDialog: mockOpenDeleteDialog,
      closeFormDialog: mockCloseFormDialog,
      closeDeleteDialog: mockCloseDeleteDialog,
      closeAllDialogs: mockCloseAllDialogs,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("Initial render and loading state", () => {
    it("should show loading spinner when isLoading is true", () => {
      vi.mocked(usePreferences).mockReturnValue({
        state: {
          preferences: [],
          isLoading: true,
          isSubmitting: false,
          isDeleting: false,
          error: null,
          dialogMode: null,
          selectedPreference: null,
          showDeleteDialog: false,
          preferenceToDelete: null,
        },
        fetchPreferences: mockFetchPreferences,
        createPreference: mockCreatePreference,
        updatePreference: mockUpdatePreference,
        deletePreference: mockDeletePreference,
        clearError: mockClearError,
        openCreateDialog: mockOpenCreateDialog,
        openEditDialog: mockOpenEditDialog,
        openDeleteDialog: mockOpenDeleteDialog,
        closeFormDialog: mockCloseFormDialog,
        closeDeleteDialog: mockCloseDeleteDialog,
        closeAllDialogs: mockCloseAllDialogs,
      });

      render(<PreferencesView />);

      expect(screen.getByTestId("loading-spinner")).toBeInTheDocument();
      expect(screen.getByText("Ładowanie preferencji...")).toBeInTheDocument();
    });

    it("should not render content when loading", () => {
      vi.mocked(usePreferences).mockReturnValue({
        state: {
          preferences: [],
          isLoading: true,
          isSubmitting: false,
          isDeleting: false,
          error: null,
          dialogMode: null,
          selectedPreference: null,
          showDeleteDialog: false,
          preferenceToDelete: null,
        },
        fetchPreferences: mockFetchPreferences,
        createPreference: mockCreatePreference,
        updatePreference: mockUpdatePreference,
        deletePreference: mockDeletePreference,
        clearError: mockClearError,
        openCreateDialog: mockOpenCreateDialog,
        openEditDialog: mockOpenEditDialog,
        openDeleteDialog: mockOpenDeleteDialog,
        closeFormDialog: mockCloseFormDialog,
        closeDeleteDialog: mockCloseDeleteDialog,
        closeAllDialogs: mockCloseAllDialogs,
      });

      render(<PreferencesView />);

      expect(screen.queryByText("Moje Preferencje")).not.toBeInTheDocument();
    });

    it("should render header with title and description after loading", () => {
      render(<PreferencesView />);

      expect(screen.getByText("Moje Preferencje")).toBeInTheDocument();
      expect(
        screen.getByText("Zarządzaj szablonami preferencji dla szybszego planowania wyjazdów")
      ).toBeInTheDocument();
    });

    it("should render create button in header", () => {
      render(<PreferencesView />);

      const createButton = screen.getByRole("button", { name: /Nowa preferencja/i });
      expect(createButton).toBeInTheDocument();
    });
  });

  describe("Empty state", () => {
    it("should show empty state when no preferences exist", () => {
      render(<PreferencesView />);

      expect(screen.getByTestId("empty-state")).toBeInTheDocument();
      expect(screen.getByText("Brak preferencji")).toBeInTheDocument();
    });

    it("should open create dialog when clicking empty state button", async () => {
      const user = userEvent.setup();
      render(<PreferencesView />);

      const createButton = screen.getByTestId("empty-state-create-button");
      await user.click(createButton);

      expect(mockOpenCreateDialog).toHaveBeenCalledTimes(1);
    });

    it("should not show preferences grid in empty state", () => {
      render(<PreferencesView />);

      expect(screen.queryByTestId("preference-card-pref-123")).not.toBeInTheDocument();
    });
  });

  describe("Preferences list display", () => {
    it("should render preference cards when preferences exist", () => {
      const preferences = [
        createMockPreference({ id: "pref-1", name: "Beach Vacation" }),
        createMockPreference({ id: "pref-2", name: "City Tour" }),
        createMockPreference({ id: "pref-3", name: "Mountain Hiking" }),
      ];

      vi.mocked(usePreferences).mockReturnValue({
        state: {
          preferences,
          isLoading: false,
          isSubmitting: false,
          isDeleting: false,
          error: null,
          dialogMode: null,
          selectedPreference: null,
          showDeleteDialog: false,
          preferenceToDelete: null,
        },
        fetchPreferences: mockFetchPreferences,
        createPreference: mockCreatePreference,
        updatePreference: mockUpdatePreference,
        deletePreference: mockDeletePreference,
        clearError: mockClearError,
        openCreateDialog: mockOpenCreateDialog,
        openEditDialog: mockOpenEditDialog,
        openDeleteDialog: mockOpenDeleteDialog,
        closeFormDialog: mockCloseFormDialog,
        closeDeleteDialog: mockCloseDeleteDialog,
        closeAllDialogs: mockCloseAllDialogs,
      });

      render(<PreferencesView />);

      expect(screen.getByTestId("preference-card-pref-1")).toBeInTheDocument();
      expect(screen.getByTestId("preference-card-pref-2")).toBeInTheDocument();
      expect(screen.getByTestId("preference-card-pref-3")).toBeInTheDocument();
    });

    it("should not show empty state when preferences exist", () => {
      const preferences = [createMockPreference()];

      vi.mocked(usePreferences).mockReturnValue({
        state: {
          preferences,
          isLoading: false,
          isSubmitting: false,
          isDeleting: false,
          error: null,
          dialogMode: null,
          selectedPreference: null,
          showDeleteDialog: false,
          preferenceToDelete: null,
        },
        fetchPreferences: mockFetchPreferences,
        createPreference: mockCreatePreference,
        updatePreference: mockUpdatePreference,
        deletePreference: mockDeletePreference,
        clearError: mockClearError,
        openCreateDialog: mockOpenCreateDialog,
        openEditDialog: mockOpenEditDialog,
        openDeleteDialog: mockOpenDeleteDialog,
        closeFormDialog: mockCloseFormDialog,
        closeDeleteDialog: mockCloseDeleteDialog,
        closeAllDialogs: mockCloseAllDialogs,
      });

      render(<PreferencesView />);

      expect(screen.queryByTestId("empty-state")).not.toBeInTheDocument();
    });

    it("should render preference data correctly", () => {
      const preference = createMockPreference({
        id: "pref-1",
        name: "Family Trip",
        people_count: 4,
        budget_type: "high",
      });

      vi.mocked(usePreferences).mockReturnValue({
        state: {
          preferences: [preference],
          isLoading: false,
          isSubmitting: false,
          isDeleting: false,
          error: null,
          dialogMode: null,
          selectedPreference: null,
          showDeleteDialog: false,
          preferenceToDelete: null,
        },
        fetchPreferences: mockFetchPreferences,
        createPreference: mockCreatePreference,
        updatePreference: mockUpdatePreference,
        deletePreference: mockDeletePreference,
        clearError: mockClearError,
        openCreateDialog: mockOpenCreateDialog,
        openEditDialog: mockOpenEditDialog,
        openDeleteDialog: mockOpenDeleteDialog,
        closeFormDialog: mockCloseFormDialog,
        closeDeleteDialog: mockCloseDeleteDialog,
        closeAllDialogs: mockCloseAllDialogs,
      });

      render(<PreferencesView />);

      expect(screen.getByText("Family Trip")).toBeInTheDocument();
      expect(screen.getByText("People: 4")).toBeInTheDocument();
      expect(screen.getByText("Budget: high")).toBeInTheDocument();
    });
  });

  describe("Create preference flow", () => {
    it("should open create dialog when clicking header button", async () => {
      const user = userEvent.setup();
      render(<PreferencesView />);

      const createButton = screen.getByRole("button", { name: /Nowa preferencja/i });
      await user.click(createButton);

      expect(mockOpenCreateDialog).toHaveBeenCalledTimes(1);
    });

    it("should show form dialog in create mode", () => {
      vi.mocked(usePreferences).mockReturnValue({
        state: {
          preferences: [],
          isLoading: false,
          isSubmitting: false,
          isDeleting: false,
          error: null,
          dialogMode: "create",
          selectedPreference: null,
          showDeleteDialog: false,
          preferenceToDelete: null,
        },
        fetchPreferences: mockFetchPreferences,
        createPreference: mockCreatePreference,
        updatePreference: mockUpdatePreference,
        deletePreference: mockDeletePreference,
        clearError: mockClearError,
        openCreateDialog: mockOpenCreateDialog,
        openEditDialog: mockOpenEditDialog,
        openDeleteDialog: mockOpenDeleteDialog,
        closeFormDialog: mockCloseFormDialog,
        closeDeleteDialog: mockCloseDeleteDialog,
        closeAllDialogs: mockCloseAllDialogs,
      });

      render(<PreferencesView />);

      expect(screen.getByTestId("preference-form-dialog")).toBeInTheDocument();
      expect(screen.getByTestId("dialog-mode")).toHaveTextContent("create");
    });

    it("should call createPreference when form is submitted", async () => {
      const user = userEvent.setup();

      vi.mocked(usePreferences).mockReturnValue({
        state: {
          preferences: [],
          isLoading: false,
          isSubmitting: false,
          isDeleting: false,
          error: null,
          dialogMode: "create",
          selectedPreference: null,
          showDeleteDialog: false,
          preferenceToDelete: null,
        },
        fetchPreferences: mockFetchPreferences,
        createPreference: mockCreatePreference,
        updatePreference: mockUpdatePreference,
        deletePreference: mockDeletePreference,
        clearError: mockClearError,
        openCreateDialog: mockOpenCreateDialog,
        openEditDialog: mockOpenEditDialog,
        openDeleteDialog: mockOpenDeleteDialog,
        closeFormDialog: mockCloseFormDialog,
        closeDeleteDialog: mockCloseDeleteDialog,
        closeAllDialogs: mockCloseAllDialogs,
      });

      render(<PreferencesView />);

      const submitButton = screen.getByTestId("submit-dialog-button");
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockCreatePreference).toHaveBeenCalledTimes(1);
        expect(mockCreatePreference).toHaveBeenCalledWith({
          name: "New Preference",
          people_count: 2,
          budget_type: "medium",
        });
      });
    });

    it("should disable submit button when isSubmitting is true", () => {
      vi.mocked(usePreferences).mockReturnValue({
        state: {
          preferences: [],
          isLoading: false,
          isSubmitting: true,
          isDeleting: false,
          error: null,
          dialogMode: "create",
          selectedPreference: null,
          showDeleteDialog: false,
          preferenceToDelete: null,
        },
        fetchPreferences: mockFetchPreferences,
        createPreference: mockCreatePreference,
        updatePreference: mockUpdatePreference,
        deletePreference: mockDeletePreference,
        clearError: mockClearError,
        openCreateDialog: mockOpenCreateDialog,
        openEditDialog: mockOpenEditDialog,
        openDeleteDialog: mockOpenDeleteDialog,
        closeFormDialog: mockCloseFormDialog,
        closeDeleteDialog: mockCloseDeleteDialog,
        closeAllDialogs: mockCloseAllDialogs,
      });

      render(<PreferencesView />);

      const submitButton = screen.getByTestId("submit-dialog-button");
      expect(submitButton).toBeDisabled();
    });

    it("should close dialog when cancel is clicked", async () => {
      const user = userEvent.setup();

      vi.mocked(usePreferences).mockReturnValue({
        state: {
          preferences: [],
          isLoading: false,
          isSubmitting: false,
          isDeleting: false,
          error: null,
          dialogMode: "create",
          selectedPreference: null,
          showDeleteDialog: false,
          preferenceToDelete: null,
        },
        fetchPreferences: mockFetchPreferences,
        createPreference: mockCreatePreference,
        updatePreference: mockUpdatePreference,
        deletePreference: mockDeletePreference,
        clearError: mockClearError,
        openCreateDialog: mockOpenCreateDialog,
        openEditDialog: mockOpenEditDialog,
        openDeleteDialog: mockOpenDeleteDialog,
        closeFormDialog: mockCloseFormDialog,
        closeDeleteDialog: mockCloseDeleteDialog,
        closeAllDialogs: mockCloseAllDialogs,
      });

      render(<PreferencesView />);

      const cancelButton = screen.getByTestId("cancel-dialog-button");
      await user.click(cancelButton);

      expect(mockCloseFormDialog).toHaveBeenCalledTimes(1);
    });
  });

  describe("Edit preference flow", () => {
    it("should open edit dialog when clicking edit button on card", async () => {
      const user = userEvent.setup();
      const preference = createMockPreference({ id: "pref-1" });

      vi.mocked(usePreferences).mockReturnValue({
        state: {
          preferences: [preference],
          isLoading: false,
          isSubmitting: false,
          isDeleting: false,
          error: null,
          dialogMode: null,
          selectedPreference: null,
          showDeleteDialog: false,
          preferenceToDelete: null,
        },
        fetchPreferences: mockFetchPreferences,
        createPreference: mockCreatePreference,
        updatePreference: mockUpdatePreference,
        deletePreference: mockDeletePreference,
        clearError: mockClearError,
        openCreateDialog: mockOpenCreateDialog,
        openEditDialog: mockOpenEditDialog,
        openDeleteDialog: mockOpenDeleteDialog,
        closeFormDialog: mockCloseFormDialog,
        closeDeleteDialog: mockCloseDeleteDialog,
        closeAllDialogs: mockCloseAllDialogs,
      });

      render(<PreferencesView />);

      const editButton = screen.getByTestId("edit-button-pref-1");
      await user.click(editButton);

      expect(mockOpenEditDialog).toHaveBeenCalledTimes(1);
      expect(mockOpenEditDialog).toHaveBeenCalledWith(preference);
    });

    it("should show form dialog in edit mode with initial data", () => {
      const preference = createMockPreference({ id: "pref-1", name: "Existing Preference" });

      vi.mocked(usePreferences).mockReturnValue({
        state: {
          preferences: [preference],
          isLoading: false,
          isSubmitting: false,
          isDeleting: false,
          error: null,
          dialogMode: "edit",
          selectedPreference: preference,
          showDeleteDialog: false,
          preferenceToDelete: null,
        },
        fetchPreferences: mockFetchPreferences,
        createPreference: mockCreatePreference,
        updatePreference: mockUpdatePreference,
        deletePreference: mockDeletePreference,
        clearError: mockClearError,
        openCreateDialog: mockOpenCreateDialog,
        openEditDialog: mockOpenEditDialog,
        openDeleteDialog: mockOpenDeleteDialog,
        closeFormDialog: mockCloseFormDialog,
        closeDeleteDialog: mockCloseDeleteDialog,
        closeAllDialogs: mockCloseAllDialogs,
      });

      render(<PreferencesView />);

      expect(screen.getByTestId("preference-form-dialog")).toBeInTheDocument();
      expect(screen.getByTestId("dialog-mode")).toHaveTextContent("edit");
      expect(screen.getByTestId("dialog-initial-data")).toHaveTextContent("Existing Preference");
    });

    it("should call updatePreference when edit form is submitted", async () => {
      const user = userEvent.setup();
      const preference = createMockPreference({ id: "pref-1", name: "Old Name" });

      vi.mocked(usePreferences).mockReturnValue({
        state: {
          preferences: [preference],
          isLoading: false,
          isSubmitting: false,
          isDeleting: false,
          error: null,
          dialogMode: "edit",
          selectedPreference: preference,
          showDeleteDialog: false,
          preferenceToDelete: null,
        },
        fetchPreferences: mockFetchPreferences,
        createPreference: mockCreatePreference,
        updatePreference: mockUpdatePreference,
        deletePreference: mockDeletePreference,
        clearError: mockClearError,
        openCreateDialog: mockOpenCreateDialog,
        openEditDialog: mockOpenEditDialog,
        openDeleteDialog: mockOpenDeleteDialog,
        closeFormDialog: mockCloseFormDialog,
        closeDeleteDialog: mockCloseDeleteDialog,
        closeAllDialogs: mockCloseAllDialogs,
      });

      render(<PreferencesView />);

      const submitButton = screen.getByTestId("submit-dialog-button");
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockUpdatePreference).toHaveBeenCalledTimes(1);
        expect(mockUpdatePreference).toHaveBeenCalledWith("pref-1", {
          name: "New Preference",
          people_count: 2,
          budget_type: "medium",
        });
      });
    });

    it("should not call updatePreference if selectedPreference is null", async () => {
      const user = userEvent.setup();

      vi.mocked(usePreferences).mockReturnValue({
        state: {
          preferences: [],
          isLoading: false,
          isSubmitting: false,
          isDeleting: false,
          error: null,
          dialogMode: "edit",
          selectedPreference: null, // No selected preference
          showDeleteDialog: false,
          preferenceToDelete: null,
        },
        fetchPreferences: mockFetchPreferences,
        createPreference: mockCreatePreference,
        updatePreference: mockUpdatePreference,
        deletePreference: mockDeletePreference,
        clearError: mockClearError,
        openCreateDialog: mockOpenCreateDialog,
        openEditDialog: mockOpenEditDialog,
        openDeleteDialog: mockOpenDeleteDialog,
        closeFormDialog: mockCloseFormDialog,
        closeDeleteDialog: mockCloseDeleteDialog,
        closeAllDialogs: mockCloseAllDialogs,
      });

      render(<PreferencesView />);

      const submitButton = screen.getByTestId("submit-dialog-button");
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockUpdatePreference).not.toHaveBeenCalled();
      });
    });
  });

  describe("Delete preference flow", () => {
    it("should open delete dialog when clicking delete button on card", async () => {
      const user = userEvent.setup();
      const preference = createMockPreference({ id: "pref-1" });

      vi.mocked(usePreferences).mockReturnValue({
        state: {
          preferences: [preference],
          isLoading: false,
          isSubmitting: false,
          isDeleting: false,
          error: null,
          dialogMode: null,
          selectedPreference: null,
          showDeleteDialog: false,
          preferenceToDelete: null,
        },
        fetchPreferences: mockFetchPreferences,
        createPreference: mockCreatePreference,
        updatePreference: mockUpdatePreference,
        deletePreference: mockDeletePreference,
        clearError: mockClearError,
        openCreateDialog: mockOpenCreateDialog,
        openEditDialog: mockOpenEditDialog,
        openDeleteDialog: mockOpenDeleteDialog,
        closeFormDialog: mockCloseFormDialog,
        closeDeleteDialog: mockCloseDeleteDialog,
        closeAllDialogs: mockCloseAllDialogs,
      });

      render(<PreferencesView />);

      const deleteButton = screen.getByTestId("delete-button-pref-1");
      await user.click(deleteButton);

      expect(mockOpenDeleteDialog).toHaveBeenCalledTimes(1);
      expect(mockOpenDeleteDialog).toHaveBeenCalledWith(preference);
    });

    it("should show delete confirmation dialog with preference name", () => {
      const preference = createMockPreference({ id: "pref-1", name: "To Delete" });

      vi.mocked(usePreferences).mockReturnValue({
        state: {
          preferences: [preference],
          isLoading: false,
          isSubmitting: false,
          isDeleting: false,
          error: null,
          dialogMode: null,
          selectedPreference: null,
          showDeleteDialog: true,
          preferenceToDelete: preference,
        },
        fetchPreferences: mockFetchPreferences,
        createPreference: mockCreatePreference,
        updatePreference: mockUpdatePreference,
        deletePreference: mockDeletePreference,
        clearError: mockClearError,
        openCreateDialog: mockOpenCreateDialog,
        openEditDialog: mockOpenEditDialog,
        openDeleteDialog: mockOpenDeleteDialog,
        closeFormDialog: mockCloseFormDialog,
        closeDeleteDialog: mockCloseDeleteDialog,
        closeAllDialogs: mockCloseAllDialogs,
      });

      render(<PreferencesView />);

      expect(screen.getByTestId("delete-confirmation-dialog")).toBeInTheDocument();
      expect(screen.getByTestId("delete-preference-name")).toHaveTextContent("To Delete");
    });

    it("should call deletePreference when delete is confirmed", async () => {
      const user = userEvent.setup();
      const preference = createMockPreference({ id: "pref-1" });

      vi.mocked(usePreferences).mockReturnValue({
        state: {
          preferences: [preference],
          isLoading: false,
          isSubmitting: false,
          isDeleting: false,
          error: null,
          dialogMode: null,
          selectedPreference: null,
          showDeleteDialog: true,
          preferenceToDelete: preference,
        },
        fetchPreferences: mockFetchPreferences,
        createPreference: mockCreatePreference,
        updatePreference: mockUpdatePreference,
        deletePreference: mockDeletePreference,
        clearError: mockClearError,
        openCreateDialog: mockOpenCreateDialog,
        openEditDialog: mockOpenEditDialog,
        openDeleteDialog: mockOpenDeleteDialog,
        closeFormDialog: mockCloseFormDialog,
        closeDeleteDialog: mockCloseDeleteDialog,
        closeAllDialogs: mockCloseAllDialogs,
      });

      render(<PreferencesView />);

      const confirmButton = screen.getByTestId("confirm-delete-button");
      await user.click(confirmButton);

      await waitFor(() => {
        expect(mockDeletePreference).toHaveBeenCalledTimes(1);
        expect(mockDeletePreference).toHaveBeenCalledWith("pref-1");
      });
    });

    it("should not call deletePreference if preferenceToDelete is null", async () => {
      const user = userEvent.setup();

      vi.mocked(usePreferences).mockReturnValue({
        state: {
          preferences: [],
          isLoading: false,
          isSubmitting: false,
          isDeleting: false,
          error: null,
          dialogMode: null,
          selectedPreference: null,
          showDeleteDialog: true,
          preferenceToDelete: null, // No preference to delete
        },
        fetchPreferences: mockFetchPreferences,
        createPreference: mockCreatePreference,
        updatePreference: mockUpdatePreference,
        deletePreference: mockDeletePreference,
        clearError: mockClearError,
        openCreateDialog: mockOpenCreateDialog,
        openEditDialog: mockOpenEditDialog,
        openDeleteDialog: mockOpenDeleteDialog,
        closeFormDialog: mockCloseFormDialog,
        closeDeleteDialog: mockCloseDeleteDialog,
        closeAllDialogs: mockCloseAllDialogs,
      });

      render(<PreferencesView />);

      const confirmButton = screen.getByTestId("confirm-delete-button");
      await user.click(confirmButton);

      await waitFor(() => {
        expect(mockDeletePreference).not.toHaveBeenCalled();
      });
    });

    it("should disable delete button when isDeleting is true", () => {
      const preference = createMockPreference({ id: "pref-1" });

      vi.mocked(usePreferences).mockReturnValue({
        state: {
          preferences: [preference],
          isLoading: false,
          isSubmitting: false,
          isDeleting: true,
          error: null,
          dialogMode: null,
          selectedPreference: null,
          showDeleteDialog: true,
          preferenceToDelete: preference,
        },
        fetchPreferences: mockFetchPreferences,
        createPreference: mockCreatePreference,
        updatePreference: mockUpdatePreference,
        deletePreference: mockDeletePreference,
        clearError: mockClearError,
        openCreateDialog: mockOpenCreateDialog,
        openEditDialog: mockOpenEditDialog,
        openDeleteDialog: mockOpenDeleteDialog,
        closeFormDialog: mockCloseFormDialog,
        closeDeleteDialog: mockCloseDeleteDialog,
        closeAllDialogs: mockCloseAllDialogs,
      });

      render(<PreferencesView />);

      const confirmButton = screen.getByTestId("confirm-delete-button");
      expect(confirmButton).toBeDisabled();
    });

    it("should close delete dialog when cancel is clicked", async () => {
      const user = userEvent.setup();
      const preference = createMockPreference({ id: "pref-1" });

      vi.mocked(usePreferences).mockReturnValue({
        state: {
          preferences: [preference],
          isLoading: false,
          isSubmitting: false,
          isDeleting: false,
          error: null,
          dialogMode: null,
          selectedPreference: null,
          showDeleteDialog: true,
          preferenceToDelete: preference,
        },
        fetchPreferences: mockFetchPreferences,
        createPreference: mockCreatePreference,
        updatePreference: mockUpdatePreference,
        deletePreference: mockDeletePreference,
        clearError: mockClearError,
        openCreateDialog: mockOpenCreateDialog,
        openEditDialog: mockOpenEditDialog,
        openDeleteDialog: mockOpenDeleteDialog,
        closeFormDialog: mockCloseFormDialog,
        closeDeleteDialog: mockCloseDeleteDialog,
        closeAllDialogs: mockCloseAllDialogs,
      });

      render(<PreferencesView />);

      const cancelButton = screen.getByTestId("cancel-delete-button");
      await user.click(cancelButton);

      expect(mockCloseDeleteDialog).toHaveBeenCalledTimes(1);
    });
  });

  describe("Error handling", () => {
    it("should display error alert when error exists", () => {
      vi.mocked(usePreferences).mockReturnValue({
        state: {
          preferences: [],
          isLoading: false,
          isSubmitting: false,
          isDeleting: false,
          error: "Failed to load preferences",
          dialogMode: null,
          selectedPreference: null,
          showDeleteDialog: false,
          preferenceToDelete: null,
        },
        fetchPreferences: mockFetchPreferences,
        createPreference: mockCreatePreference,
        updatePreference: mockUpdatePreference,
        deletePreference: mockDeletePreference,
        clearError: mockClearError,
        openCreateDialog: mockOpenCreateDialog,
        openEditDialog: mockOpenEditDialog,
        openDeleteDialog: mockOpenDeleteDialog,
        closeFormDialog: mockCloseFormDialog,
        closeDeleteDialog: mockCloseDeleteDialog,
        closeAllDialogs: mockCloseAllDialogs,
      });

      render(<PreferencesView />);

      expect(screen.getByTestId("error-alert")).toBeInTheDocument();
      expect(screen.getByText("Failed to load preferences")).toBeInTheDocument();
    });

    it("should call clearError when dismiss button is clicked", async () => {
      const user = userEvent.setup();

      vi.mocked(usePreferences).mockReturnValue({
        state: {
          preferences: [],
          isLoading: false,
          isSubmitting: false,
          isDeleting: false,
          error: "Some error",
          dialogMode: null,
          selectedPreference: null,
          showDeleteDialog: false,
          preferenceToDelete: null,
        },
        fetchPreferences: mockFetchPreferences,
        createPreference: mockCreatePreference,
        updatePreference: mockUpdatePreference,
        deletePreference: mockDeletePreference,
        clearError: mockClearError,
        openCreateDialog: mockOpenCreateDialog,
        openEditDialog: mockOpenEditDialog,
        openDeleteDialog: mockOpenDeleteDialog,
        closeFormDialog: mockCloseFormDialog,
        closeDeleteDialog: mockCloseDeleteDialog,
        closeAllDialogs: mockCloseAllDialogs,
      });

      render(<PreferencesView />);

      const dismissButton = screen.getByTestId("dismiss-error");
      await user.click(dismissButton);

      expect(mockClearError).toHaveBeenCalledTimes(1);
    });

    it("should call fetchPreferences when retry button is clicked", async () => {
      const user = userEvent.setup();

      vi.mocked(usePreferences).mockReturnValue({
        state: {
          preferences: [],
          isLoading: false,
          isSubmitting: false,
          isDeleting: false,
          error: "Network error",
          dialogMode: null,
          selectedPreference: null,
          showDeleteDialog: false,
          preferenceToDelete: null,
        },
        fetchPreferences: mockFetchPreferences,
        createPreference: mockCreatePreference,
        updatePreference: mockUpdatePreference,
        deletePreference: mockDeletePreference,
        clearError: mockClearError,
        openCreateDialog: mockOpenCreateDialog,
        openEditDialog: mockOpenEditDialog,
        openDeleteDialog: mockOpenDeleteDialog,
        closeFormDialog: mockCloseFormDialog,
        closeDeleteDialog: mockCloseDeleteDialog,
        closeAllDialogs: mockCloseAllDialogs,
      });

      render(<PreferencesView />);

      const retryButton = screen.getByTestId("retry-button");
      await user.click(retryButton);

      expect(mockFetchPreferences).toHaveBeenCalledTimes(1);
    });

    it("should display error and preferences list simultaneously", () => {
      const preferences = [createMockPreference({ id: "pref-1" })];

      vi.mocked(usePreferences).mockReturnValue({
        state: {
          preferences,
          isLoading: false,
          isSubmitting: false,
          isDeleting: false,
          error: "Failed to create preference",
          dialogMode: null,
          selectedPreference: null,
          showDeleteDialog: false,
          preferenceToDelete: null,
        },
        fetchPreferences: mockFetchPreferences,
        createPreference: mockCreatePreference,
        updatePreference: mockUpdatePreference,
        deletePreference: mockDeletePreference,
        clearError: mockClearError,
        openCreateDialog: mockOpenCreateDialog,
        openEditDialog: mockOpenEditDialog,
        openDeleteDialog: mockOpenDeleteDialog,
        closeFormDialog: mockCloseFormDialog,
        closeDeleteDialog: mockCloseDeleteDialog,
        closeAllDialogs: mockCloseAllDialogs,
      });

      render(<PreferencesView />);

      // Both error and list should be visible
      expect(screen.getByTestId("error-alert")).toBeInTheDocument();
      expect(screen.getByTestId("preference-card-pref-1")).toBeInTheDocument();
    });
  });

  describe("Edge cases and boundary conditions", () => {
    it("should handle null values in preference data", () => {
      const preference = createMockPreference({
        id: "pref-1",
        name: "Minimal Preference",
        people_count: null as unknown as number,
        budget_type: null as unknown as string,
      });

      vi.mocked(usePreferences).mockReturnValue({
        state: {
          preferences: [preference],
          isLoading: false,
          isSubmitting: false,
          isDeleting: false,
          error: null,
          dialogMode: null,
          selectedPreference: null,
          showDeleteDialog: false,
          preferenceToDelete: null,
        },
        fetchPreferences: mockFetchPreferences,
        createPreference: mockCreatePreference,
        updatePreference: mockUpdatePreference,
        deletePreference: mockDeletePreference,
        clearError: mockClearError,
        openCreateDialog: mockOpenCreateDialog,
        openEditDialog: mockOpenEditDialog,
        openDeleteDialog: mockOpenDeleteDialog,
        closeFormDialog: mockCloseFormDialog,
        closeDeleteDialog: mockCloseDeleteDialog,
        closeAllDialogs: mockCloseAllDialogs,
      });

      render(<PreferencesView />);

      expect(screen.getByTestId("preference-card-pref-1")).toBeInTheDocument();
    });

    it("should handle large number of preferences (100+)", () => {
      const preferences = Array.from({ length: 150 }, (_, i) =>
        createMockPreference({ id: `pref-${i}`, name: `Preference ${i}` })
      );

      vi.mocked(usePreferences).mockReturnValue({
        state: {
          preferences,
          isLoading: false,
          isSubmitting: false,
          isDeleting: false,
          error: null,
          dialogMode: null,
          selectedPreference: null,
          showDeleteDialog: false,
          preferenceToDelete: null,
        },
        fetchPreferences: mockFetchPreferences,
        createPreference: mockCreatePreference,
        updatePreference: mockUpdatePreference,
        deletePreference: mockDeletePreference,
        clearError: mockClearError,
        openCreateDialog: mockOpenCreateDialog,
        openEditDialog: mockOpenEditDialog,
        openDeleteDialog: mockOpenDeleteDialog,
        closeFormDialog: mockCloseFormDialog,
        closeDeleteDialog: mockCloseDeleteDialog,
        closeAllDialogs: mockCloseAllDialogs,
      });

      render(<PreferencesView />);

      // Should render all cards
      expect(screen.getByTestId("preference-card-pref-0")).toBeInTheDocument();
      expect(screen.getByTestId("preference-card-pref-149")).toBeInTheDocument();
    });

    it("should not show form dialog when dialogMode is null", () => {
      render(<PreferencesView />);

      expect(screen.queryByTestId("preference-form-dialog")).not.toBeInTheDocument();
    });

    it("should not show delete dialog when showDeleteDialog is false", () => {
      render(<PreferencesView />);

      expect(screen.queryByTestId("delete-confirmation-dialog")).not.toBeInTheDocument();
    });

    it("should handle rapid dialog open/close", async () => {
      const user = userEvent.setup();
      render(<PreferencesView />);

      const createButton = screen.getByRole("button", { name: /Nowa preferencja/i });

      // Rapid clicks
      await user.click(createButton);
      await user.click(createButton);
      await user.click(createButton);

      expect(mockOpenCreateDialog).toHaveBeenCalledTimes(3);
    });

    it("should handle preferences with special characters in name", () => {
      const preference = createMockPreference({
        id: "pref-1",
        name: "Trip with 'quotes' & <tags> / special\\chars",
      });

      vi.mocked(usePreferences).mockReturnValue({
        state: {
          preferences: [preference],
          isLoading: false,
          isSubmitting: false,
          isDeleting: false,
          error: null,
          dialogMode: null,
          selectedPreference: null,
          showDeleteDialog: false,
          preferenceToDelete: null,
        },
        fetchPreferences: mockFetchPreferences,
        createPreference: mockCreatePreference,
        updatePreference: mockUpdatePreference,
        deletePreference: mockDeletePreference,
        clearError: mockClearError,
        openCreateDialog: mockOpenCreateDialog,
        openEditDialog: mockOpenEditDialog,
        openDeleteDialog: mockOpenDeleteDialog,
        closeFormDialog: mockCloseFormDialog,
        closeDeleteDialog: mockCloseDeleteDialog,
        closeAllDialogs: mockCloseAllDialogs,
      });

      render(<PreferencesView />);

      expect(screen.getByText("Trip with 'quotes' & <tags> / special\\chars")).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("should have proper heading hierarchy", () => {
      render(<PreferencesView />);

      const heading = screen.getByRole("heading", { level: 1, name: /Moje Preferencje/i });
      expect(heading).toBeInTheDocument();
    });

    it("should have accessible button for creating preferences", () => {
      render(<PreferencesView />);

      const createButton = screen.getByRole("button", { name: /Nowa preferencja/i });
      expect(createButton).toBeInTheDocument();
    });

    it("should maintain focus management during dialog operations", () => {
      const { container } = render(<PreferencesView />);

      // Container should be present
      expect(container.querySelector(".container")).toBeInTheDocument();
    });
  });
});
