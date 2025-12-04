/**
 * Unit tests for ActivityCard component
 *
 * Tests the activity card display and editing logic:
 * - View mode rendering
 * - Edit mode rendering
 * - Field validation
 * - Save/cancel/delete operations
 * - State management
 * - Edge cases (empty values, invalid data)
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ActivityCard } from "./ActivityCard";
import type { ActivityDto } from "../../../types";

// Helper to create mock activity
function createMockActivity(overrides?: Partial<ActivityDto>): ActivityDto {
  return {
    time: "10:00",
    title: "Louvre Museum",
    description: "Visit the world-famous art museum",
    location: "Paris, France",
    estimated_cost: 50,
    duration: "2 hours",
    category: "Culture",
    ...overrides,
  };
}

describe("ActivityCard", () => {
  const mockOnUpdate = vi.fn();
  const mockOnDelete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("View mode rendering (isEditMode=false)", () => {
    it("should render activity data in view mode", () => {
      const activity = createMockActivity({
        time: "14:30",
        title: "Eiffel Tower",
        description: "Climb to the top",
        location: "Champ de Mars, Paris",
      });

      render(
        <ActivityCard
          activity={activity}
          isEditMode={false}
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
        />
      );

      expect(screen.getByText("14:30")).toBeInTheDocument();
      expect(screen.getByText("Eiffel Tower")).toBeInTheDocument();
      expect(screen.getByText("Climb to the top")).toBeInTheDocument();
      expect(screen.getByText("Champ de Mars, Paris")).toBeInTheDocument();
    });

    it("should display duration when provided", () => {
      const activity = createMockActivity({ duration: "3 hours" });

      render(
        <ActivityCard
          activity={activity}
          isEditMode={false}
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
        />
      );

      expect(screen.getByText("3 hours")).toBeInTheDocument();
    });

    it("should not display duration when not provided", () => {
      const activity = createMockActivity({ duration: undefined });

      render(
        <ActivityCard
          activity={activity}
          isEditMode={false}
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
        />
      );

      // Duration section should not exist
      const container = screen.getByText("Louvre Museum").closest("div");
      expect(container).not.toHaveTextContent("hours");
    });

    it("should display estimated cost when provided", () => {
      const activity = createMockActivity({ estimated_cost: 75 });

      render(
        <ActivityCard
          activity={activity}
          isEditMode={false}
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
        />
      );

      expect(screen.getByText("75 PLN")).toBeInTheDocument();
    });

    it("should display cost as 0 PLN when cost is 0", () => {
      const activity = createMockActivity({ estimated_cost: 0 });

      render(
        <ActivityCard
          activity={activity}
          isEditMode={false}
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
        />
      );

      expect(screen.getByText("0 PLN")).toBeInTheDocument();
    });

    it("should not display cost when undefined", () => {
      const activity = createMockActivity({ estimated_cost: undefined });

      render(
        <ActivityCard
          activity={activity}
          isEditMode={false}
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
        />
      );

      expect(screen.queryByText(/PLN/)).not.toBeInTheDocument();
    });

    it("should display category when provided", () => {
      const activity = createMockActivity({ category: "Food & Dining" });

      render(
        <ActivityCard
          activity={activity}
          isEditMode={false}
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
        />
      );

      expect(screen.getByText("Food & Dining")).toBeInTheDocument();
    });

    it("should not display category when not provided", () => {
      const activity = createMockActivity({ category: undefined });

      const { container } = render(
        <ActivityCard
          activity={activity}
          isEditMode={false}
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
        />
      );

      // Category badge should not exist
      expect(container.querySelector(".rounded-full.bg-secondary")).not.toBeInTheDocument();
    });

    it("should not show edit button when isEditMode is false", () => {
      const activity = createMockActivity();

      render(
        <ActivityCard
          activity={activity}
          isEditMode={false}
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
        />
      );

      expect(screen.queryByRole("button", { name: /Edytuj/i })).not.toBeInTheDocument();
    });
  });

  describe("View mode with edit mode enabled (isEditMode=true, not editing)", () => {
    it("should show edit button when isEditMode is true", () => {
      const activity = createMockActivity();

      render(
        <ActivityCard
          activity={activity}
          isEditMode={true}
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
        />
      );

      expect(screen.getByRole("button", { name: /Edytuj/i })).toBeInTheDocument();
    });

    it("should switch to edit mode when edit button is clicked", async () => {
      const user = userEvent.setup();
      const activity = createMockActivity();

      render(
        <ActivityCard
          activity={activity}
          isEditMode={true}
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
        />
      );

      const editButton = screen.getByRole("button", { name: /Edytuj/i });
      await user.click(editButton);

      // Should show form fields
      expect(screen.getByLabelText(/Godzina \*/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Tytuł \*/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Opis \*/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Lokalizacja \*/)).toBeInTheDocument();
    });
  });

  describe("Edit mode rendering", () => {
    async function enterEditMode(activity: ActivityDto) {
      const user = userEvent.setup();
      render(
        <ActivityCard
          activity={activity}
          isEditMode={true}
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
        />
      );

      const editButton = screen.getByRole("button", { name: /Edytuj/i });
      await user.click(editButton);
    }

    it("should render all required fields in edit mode", async () => {
      const activity = createMockActivity();
      await enterEditMode(activity);

      expect(screen.getByLabelText(/Godzina \*/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Tytuł \*/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Opis \*/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Lokalizacja \*/)).toBeInTheDocument();
    });

    it("should render optional fields in edit mode", async () => {
      const activity = createMockActivity();
      await enterEditMode(activity);

      expect(screen.getByLabelText(/Czas trwania/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Szacunkowy koszt/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Kategoria/)).toBeInTheDocument();
    });

    it("should populate fields with current activity data", async () => {
      const activity = createMockActivity({
        time: "15:30",
        title: "Notre-Dame",
        description: "Cathedral visit",
        location: "Paris",
        duration: "1.5 hours",
        estimated_cost: 10,
        category: "Religion",
      });

      await enterEditMode(activity);

      expect(screen.getByLabelText(/Godzina \*/)).toHaveValue("15:30");
      expect(screen.getByLabelText(/Tytuł \*/)).toHaveValue("Notre-Dame");
      expect(screen.getByLabelText(/Opis \*/)).toHaveValue("Cathedral visit");
      expect(screen.getByLabelText(/Lokalizacja \*/)).toHaveValue("Paris");
      expect(screen.getByLabelText(/Czas trwania/)).toHaveValue("1.5 hours");
      expect(screen.getByLabelText(/Szacunkowy koszt/)).toHaveValue(10);
      expect(screen.getByLabelText(/Kategoria/)).toHaveValue("Religion");
    });

    it("should render save, cancel, and delete buttons", async () => {
      const activity = createMockActivity();
      await enterEditMode(activity);

      expect(screen.getByRole("button", { name: /Zapisz/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Anuluj/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Usuń/i })).toBeInTheDocument();
    });
  });

  describe("Field editing", () => {
    async function enterEditMode(activity: ActivityDto) {
      const user = userEvent.setup();
      render(
        <ActivityCard
          activity={activity}
          isEditMode={true}
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
        />
      );

      const editButton = screen.getByRole("button", { name: /Edytuj/i });
      await user.click(editButton);
      return user;
    }

    it("should update time field", async () => {
      const activity = createMockActivity({ time: "10:00" });
      const user = await enterEditMode(activity);

      const timeInput = screen.getByLabelText(/Godzina \*/);
      await user.clear(timeInput);
      await user.type(timeInput, "14:30");

      expect(timeInput).toHaveValue("14:30");
    });

    it("should update title field", async () => {
      const activity = createMockActivity({ title: "Old Title" });
      const user = await enterEditMode(activity);

      const titleInput = screen.getByLabelText(/Tytuł \*/);
      await user.clear(titleInput);
      await user.type(titleInput, "New Title");

      expect(titleInput).toHaveValue("New Title");
    });

    it("should update description field", async () => {
      const activity = createMockActivity({ description: "Old description" });
      const user = await enterEditMode(activity);

      const descInput = screen.getByLabelText(/Opis \*/);
      await user.clear(descInput);
      await user.type(descInput, "New description");

      expect(descInput).toHaveValue("New description");
    });

    it("should update location field", async () => {
      const activity = createMockActivity({ location: "Old Location" });
      const user = await enterEditMode(activity);

      const locationInput = screen.getByLabelText(/Lokalizacja \*/);
      await user.clear(locationInput);
      await user.type(locationInput, "New Location");

      expect(locationInput).toHaveValue("New Location");
    });

    it("should update optional duration field", async () => {
      const activity = createMockActivity({ duration: undefined });
      const user = await enterEditMode(activity);

      const durationInput = screen.getByLabelText(/Czas trwania/);
      await user.type(durationInput, "4 hours");

      expect(durationInput).toHaveValue("4 hours");
    });

    it("should update optional cost field", async () => {
      const activity = createMockActivity({ estimated_cost: undefined });
      const user = await enterEditMode(activity);

      const costInput = screen.getByLabelText(/Szacunkowy koszt/);
      await user.type(costInput, "120");

      expect(costInput).toHaveValue(120);
    });

    it("should update optional category field", async () => {
      const activity = createMockActivity({ category: undefined });
      const user = await enterEditMode(activity);

      const categoryInput = screen.getByLabelText(/Kategoria/);
      await user.type(categoryInput, "Shopping");

      expect(categoryInput).toHaveValue("Shopping");
    });
  });

  describe("Validation logic", () => {
    async function enterEditModeAndClickSave(activity: ActivityDto) {
      const user = userEvent.setup();
      render(
        <ActivityCard
          activity={activity}
          isEditMode={true}
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
        />
      );

      const editButton = screen.getByRole("button", { name: /Edytuj/i });
      await user.click(editButton);

      const saveButton = screen.getByRole("button", { name: /Zapisz/i });
      return { user, saveButton };
    }

    it("should require time field", async () => {
      const activity = createMockActivity({ time: "10:00" });
      const { user, saveButton } = await enterEditModeAndClickSave(activity);

      // Clear time field
      const timeInput = screen.getByLabelText(/Godzina \*/);
      await user.clear(timeInput);

      await user.click(saveButton);

      expect(screen.getByText("Godzina jest wymagana")).toBeInTheDocument();
      expect(mockOnUpdate).not.toHaveBeenCalled();
    });

    it("should validate time format (HH:MM)", async () => {
      const activity = createMockActivity({ time: "10:00" });
      const { user, saveButton } = await enterEditModeAndClickSave(activity);

      const timeInput = screen.getByLabelText(/Godzina \*/);
      await user.clear(timeInput);
      await user.type(timeInput, "25:99");

      await user.click(saveButton);

      expect(screen.getByText("Nieprawidłowy format (HH:MM)")).toBeInTheDocument();
      expect(mockOnUpdate).not.toHaveBeenCalled();
    });

    it("should accept valid time format", async () => {
      const activity = createMockActivity({ time: "10:00" });
      const { user, saveButton } = await enterEditModeAndClickSave(activity);

      const timeInput = screen.getByLabelText(/Godzina \*/);
      await user.clear(timeInput);
      await user.type(timeInput, "23:59");

      await user.click(saveButton);

      expect(screen.queryByText("Nieprawidłowy format (HH:MM)")).not.toBeInTheDocument();
      expect(mockOnUpdate).toHaveBeenCalled();
    });

    it("should require title field", async () => {
      const activity = createMockActivity({ title: "Old Title" });
      const { user, saveButton } = await enterEditModeAndClickSave(activity);

      const titleInput = screen.getByLabelText(/Tytuł \*/);
      await user.clear(titleInput);

      await user.click(saveButton);

      expect(screen.getByText("Tytuł jest wymagany")).toBeInTheDocument();
      expect(mockOnUpdate).not.toHaveBeenCalled();
    });

    it("should enforce title max length of 200 characters", async () => {
      const activity = createMockActivity({ title: "Short" });
      const { user, saveButton } = await enterEditModeAndClickSave(activity);

      const titleInput = screen.getByLabelText(/Tytuł \*/);
      await user.clear(titleInput);
      await user.type(titleInput, "A".repeat(201));

      await user.click(saveButton);

      expect(screen.getByText("Tytuł może mieć max 200 znaków")).toBeInTheDocument();
      expect(mockOnUpdate).not.toHaveBeenCalled();
    });

    it("should accept title at exactly 200 characters", async () => {
      const activity = createMockActivity({ title: "Short" });
      const { user, saveButton } = await enterEditModeAndClickSave(activity);

      const titleInput = screen.getByLabelText(/Tytuł \*/);
      await user.clear(titleInput);
      await user.type(titleInput, "A".repeat(200));

      await user.click(saveButton);

      expect(screen.queryByText("Tytuł może mieć max 200 znaków")).not.toBeInTheDocument();
      expect(mockOnUpdate).toHaveBeenCalled();
    });

    it("should require description field", async () => {
      const activity = createMockActivity({ description: "Old description" });
      const { user, saveButton } = await enterEditModeAndClickSave(activity);

      const descInput = screen.getByLabelText(/Opis \*/);
      await user.clear(descInput);

      await user.click(saveButton);

      expect(screen.getByText("Opis jest wymagany")).toBeInTheDocument();
      expect(mockOnUpdate).not.toHaveBeenCalled();
    });

    it("should require location field", async () => {
      const activity = createMockActivity({ location: "Old Location" });
      const { user, saveButton } = await enterEditModeAndClickSave(activity);

      const locationInput = screen.getByLabelText(/Lokalizacja \*/);
      await user.clear(locationInput);

      await user.click(saveButton);

      expect(screen.getByText("Lokalizacja jest wymagana")).toBeInTheDocument();
      expect(mockOnUpdate).not.toHaveBeenCalled();
    });

    it("should reject negative estimated cost", async () => {
      const activity = createMockActivity({ estimated_cost: 50 });
      const { user, saveButton } = await enterEditModeAndClickSave(activity);

      const costInput = screen.getByLabelText(/Szacunkowy koszt/);
      await user.clear(costInput);
      await user.type(costInput, "-10");

      await user.click(saveButton);

      expect(screen.getByText("Koszt musi być >= 0")).toBeInTheDocument();
      expect(mockOnUpdate).not.toHaveBeenCalled();
    });

    it("should accept zero cost", async () => {
      const activity = createMockActivity({ estimated_cost: 50 });
      const { user, saveButton } = await enterEditModeAndClickSave(activity);

      const costInput = screen.getByLabelText(/Szacunkowy koszt/);
      await user.clear(costInput);
      await user.type(costInput, "0");

      await user.click(saveButton);

      expect(screen.queryByText("Koszt musi być >= 0")).not.toBeInTheDocument();
      expect(mockOnUpdate).toHaveBeenCalled();
    });

    it("should clear validation error when field is corrected", async () => {
      const activity = createMockActivity({ title: "Old Title" });
      const { user, saveButton } = await enterEditModeAndClickSave(activity);

      const titleInput = screen.getByLabelText(/Tytuł \*/);

      // First, create an error
      await user.clear(titleInput);
      await user.click(saveButton);
      expect(screen.getByText("Tytuł jest wymagany")).toBeInTheDocument();

      // Then, fix it
      await user.type(titleInput, "New Title");

      // Error should be cleared
      await waitFor(() => {
        expect(screen.queryByText("Tytuł jest wymagany")).not.toBeInTheDocument();
      });
    });
  });

  describe("Save operation", () => {
    async function enterEditModeAndSave(activity: ActivityDto, newData: Partial<ActivityDto>) {
      const user = userEvent.setup();
      render(
        <ActivityCard
          activity={activity}
          isEditMode={true}
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
        />
      );

      const editButton = screen.getByRole("button", { name: /Edytuj/i });
      await user.click(editButton);

      // Update fields
      if (newData.title !== undefined) {
        const titleInput = screen.getByLabelText(/Tytuł \*/);
        await user.clear(titleInput);
        await user.type(titleInput, newData.title);
      }

      if (newData.description !== undefined) {
        const descInput = screen.getByLabelText(/Opis \*/);
        await user.clear(descInput);
        await user.type(descInput, newData.description);
      }

      const saveButton = screen.getByRole("button", { name: /Zapisz/i });
      await user.click(saveButton);
    }

    it("should call onUpdate with edited activity on valid save", async () => {
      const activity = createMockActivity({
        title: "Original Title",
        description: "Original description",
      });

      await enterEditModeAndSave(activity, {
        title: "Updated Title",
        description: "Updated description",
      });

      await waitFor(() => {
        expect(mockOnUpdate).toHaveBeenCalledTimes(1);
        expect(mockOnUpdate).toHaveBeenCalledWith(
          expect.objectContaining({
            title: "Updated Title",
            description: "Updated description",
          })
        );
      });
    });

    it("should exit edit mode after successful save", async () => {
      const activity = createMockActivity();
      await enterEditModeAndSave(activity, {});

      await waitFor(() => {
        // Should return to view mode (no save button visible)
        expect(screen.queryByRole("button", { name: /Zapisz/i })).not.toBeInTheDocument();
      });
    });

    it("should clear validation errors after successful save", async () => {
      const activity = createMockActivity({ title: "Original" });
      const user = userEvent.setup();

      render(
        <ActivityCard
          activity={activity}
          isEditMode={true}
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
        />
      );

      const editButton = screen.getByRole("button", { name: /Edytuj/i });
      await user.click(editButton);

      const titleInput = screen.getByLabelText(/Tytuł \*/);
      const saveButton = screen.getByRole("button", { name: /Zapisz/i });

      // Create validation error
      await user.clear(titleInput);
      await user.click(saveButton);
      expect(screen.getByText("Tytuł jest wymagany")).toBeInTheDocument();

      // Fix and save
      await user.type(titleInput, "Fixed Title");
      await user.click(saveButton);

      await waitFor(() => {
        expect(screen.queryByText("Tytuł jest wymagany")).not.toBeInTheDocument();
      });
    });

    it("should remain in edit mode if validation fails", async () => {
      const activity = createMockActivity({ title: "Original" });
      const user = userEvent.setup();

      render(
        <ActivityCard
          activity={activity}
          isEditMode={true}
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
        />
      );

      const editButton = screen.getByRole("button", { name: /Edytuj/i });
      await user.click(editButton);

      const titleInput = screen.getByLabelText(/Tytuł \*/);
      await user.clear(titleInput);

      const saveButton = screen.getByRole("button", { name: /Zapisz/i });
      await user.click(saveButton);

      // Should still be in edit mode
      expect(screen.getByRole("button", { name: /Zapisz/i })).toBeInTheDocument();
      expect(mockOnUpdate).not.toHaveBeenCalled();
    });
  });

  describe("Cancel operation", () => {
    it("should revert changes when cancel is clicked", async () => {
      const activity = createMockActivity({ title: "Original Title" });
      const user = userEvent.setup();

      render(
        <ActivityCard
          activity={activity}
          isEditMode={true}
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
        />
      );

      const editButton = screen.getByRole("button", { name: /Edytuj/i });
      await user.click(editButton);

      // Change the title
      const titleInput = screen.getByLabelText(/Tytuł \*/);
      await user.clear(titleInput);
      await user.type(titleInput, "Changed Title");

      // Cancel
      const cancelButton = screen.getByRole("button", { name: /Anuluj/i });
      await user.click(cancelButton);

      // Re-enter edit mode
      const editButtonAgain = screen.getByRole("button", { name: /Edytuj/i });
      await user.click(editButtonAgain);

      // Should have original value
      const titleInputAgain = screen.getByLabelText(/Tytuł \*/);
      expect(titleInputAgain).toHaveValue("Original Title");
    });

    it("should clear validation errors when cancel is clicked", async () => {
      const activity = createMockActivity({ title: "Original" });
      const user = userEvent.setup();

      render(
        <ActivityCard
          activity={activity}
          isEditMode={true}
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
        />
      );

      const editButton = screen.getByRole("button", { name: /Edytuj/i });
      await user.click(editButton);

      // Create validation error
      const titleInput = screen.getByLabelText(/Tytuł \*/);
      await user.clear(titleInput);

      const saveButton = screen.getByRole("button", { name: /Zapisz/i });
      await user.click(saveButton);
      expect(screen.getByText("Tytuł jest wymagany")).toBeInTheDocument();

      // Cancel
      const cancelButton = screen.getByRole("button", { name: /Anuluj/i });
      await user.click(cancelButton);

      // Re-enter edit mode - error should be gone
      const editButtonAgain = screen.getByRole("button", { name: /Edytuj/i });
      await user.click(editButtonAgain);

      expect(screen.queryByText("Tytuł jest wymagany")).not.toBeInTheDocument();
    });

    it("should exit edit mode when cancel is clicked", async () => {
      const activity = createMockActivity();
      const user = userEvent.setup();

      render(
        <ActivityCard
          activity={activity}
          isEditMode={true}
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
        />
      );

      const editButton = screen.getByRole("button", { name: /Edytuj/i });
      await user.click(editButton);

      const cancelButton = screen.getByRole("button", { name: /Anuluj/i });
      await user.click(cancelButton);

      // Should be back in view mode
      expect(screen.queryByRole("button", { name: /Zapisz/i })).not.toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Edytuj/i })).toBeInTheDocument();
    });

    it("should not call onUpdate when cancel is clicked", async () => {
      const activity = createMockActivity();
      const user = userEvent.setup();

      render(
        <ActivityCard
          activity={activity}
          isEditMode={true}
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
        />
      );

      const editButton = screen.getByRole("button", { name: /Edytuj/i });
      await user.click(editButton);

      const cancelButton = screen.getByRole("button", { name: /Anuluj/i });
      await user.click(cancelButton);

      expect(mockOnUpdate).not.toHaveBeenCalled();
    });
  });

  describe("Delete operation", () => {
    it("should call onDelete when delete button is clicked", async () => {
      const activity = createMockActivity();
      const user = userEvent.setup();

      render(
        <ActivityCard
          activity={activity}
          isEditMode={true}
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
        />
      );

      const editButton = screen.getByRole("button", { name: /Edytuj/i });
      await user.click(editButton);

      const deleteButton = screen.getByRole("button", { name: /Usuń/i });
      await user.click(deleteButton);

      expect(mockOnDelete).toHaveBeenCalledTimes(1);
    });

    it("should not call onUpdate when delete is clicked", async () => {
      const activity = createMockActivity();
      const user = userEvent.setup();

      render(
        <ActivityCard
          activity={activity}
          isEditMode={true}
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
        />
      );

      const editButton = screen.getByRole("button", { name: /Edytuj/i });
      await user.click(editButton);

      const deleteButton = screen.getByRole("button", { name: /Usuń/i });
      await user.click(deleteButton);

      expect(mockOnUpdate).not.toHaveBeenCalled();
    });
  });

  describe("Edge cases and boundary conditions", () => {
    it("should handle activity with minimal required fields only", () => {
      const activity = createMockActivity({
        time: "12:00",
        title: "Lunch",
        description: "Eat",
        location: "Restaurant",
        duration: undefined,
        estimated_cost: undefined,
        category: undefined,
      });

      render(
        <ActivityCard
          activity={activity}
          isEditMode={false}
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
        />
      );

      expect(screen.getByText("Lunch")).toBeInTheDocument();
      expect(screen.queryByText(/PLN/)).not.toBeInTheDocument();
    });

    it("should handle very long title (at boundary)", async () => {
      const longTitle = "A".repeat(200);
      const activity = createMockActivity({ title: "Short" });
      const user = userEvent.setup();

      render(
        <ActivityCard
          activity={activity}
          isEditMode={true}
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
        />
      );

      const editButton = screen.getByRole("button", { name: /Edytuj/i });
      await user.click(editButton);

      const titleInput = screen.getByLabelText(/Tytuł \*/);
      await user.clear(titleInput);
      await user.type(titleInput, longTitle);

      const saveButton = screen.getByRole("button", { name: /Zapisz/i });
      await user.click(saveButton);

      expect(mockOnUpdate).toHaveBeenCalledWith(expect.objectContaining({ title: longTitle }));
    });

    it("should handle special characters in text fields", () => {
      const activity = createMockActivity({
        title: "Café & Bäckerei <special>",
        description: "Visit 'famous' café with €10 discount",
        location: "Rue de l'Église, 75001",
        category: "Food & Drink",
      });

      render(
        <ActivityCard
          activity={activity}
          isEditMode={false}
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
        />
      );

      expect(screen.getByText("Café & Bäckerei <special>")).toBeInTheDocument();
      expect(screen.getByText("Visit 'famous' café with €10 discount")).toBeInTheDocument();
    });

    it("should handle decimal cost values", async () => {
      const activity = createMockActivity({ estimated_cost: 50 });
      const user = userEvent.setup();

      render(
        <ActivityCard
          activity={activity}
          isEditMode={true}
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
        />
      );

      const editButton = screen.getByRole("button", { name: /Edytuj/i });
      await user.click(editButton);

      const costInput = screen.getByLabelText(/Szacunkowy koszt/);
      await user.clear(costInput);
      await user.type(costInput, "49.99");

      const saveButton = screen.getByRole("button", { name: /Zapisz/i });
      await user.click(saveButton);

      expect(mockOnUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ estimated_cost: 49.99 })
      );
    });

    it("should handle whitespace-only values as invalid", async () => {
      const activity = createMockActivity({ title: "Original" });
      const user = userEvent.setup();

      render(
        <ActivityCard
          activity={activity}
          isEditMode={true}
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
        />
      );

      const editButton = screen.getByRole("button", { name: /Edytuj/i });
      await user.click(editButton);

      const titleInput = screen.getByLabelText(/Tytuł \*/);
      await user.clear(titleInput);
      await user.type(titleInput, "   ");

      const saveButton = screen.getByRole("button", { name: /Zapisz/i });
      await user.click(saveButton);

      expect(screen.getByText("Tytuł jest wymagany")).toBeInTheDocument();
      expect(mockOnUpdate).not.toHaveBeenCalled();
    });

    it("should handle clearing optional fields", async () => {
      const activity = createMockActivity({
        duration: "2 hours",
        estimated_cost: 50,
        category: "Culture",
      });
      const user = userEvent.setup();

      render(
        <ActivityCard
          activity={activity}
          isEditMode={true}
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
        />
      );

      const editButton = screen.getByRole("button", { name: /Edytuj/i });
      await user.click(editButton);

      // Clear all optional fields
      const durationInput = screen.getByLabelText(/Czas trwania/);
      await user.clear(durationInput);

      const costInput = screen.getByLabelText(/Szacunkowy koszt/);
      await user.clear(costInput);

      const categoryInput = screen.getByLabelText(/Kategoria/);
      await user.clear(categoryInput);

      const saveButton = screen.getByRole("button", { name: /Zapisz/i });
      await user.click(saveButton);

      expect(mockOnUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          duration: undefined,
          estimated_cost: undefined,
          category: undefined,
        })
      );
    });

    it("should handle time edge case 00:00", async () => {
      const activity = createMockActivity({ time: "12:00" });
      const user = userEvent.setup();

      render(
        <ActivityCard
          activity={activity}
          isEditMode={true}
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
        />
      );

      const editButton = screen.getByRole("button", { name: /Edytuj/i });
      await user.click(editButton);

      const timeInput = screen.getByLabelText(/Godzina \*/);
      await user.clear(timeInput);
      await user.type(timeInput, "00:00");

      const saveButton = screen.getByRole("button", { name: /Zapisz/i });
      await user.click(saveButton);

      expect(mockOnUpdate).toHaveBeenCalledWith(expect.objectContaining({ time: "00:00" }));
    });
  });

  describe("Accessibility", () => {
    it("should have proper labels for all form fields", async () => {
      const activity = createMockActivity();
      const user = userEvent.setup();

      render(
        <ActivityCard
          activity={activity}
          isEditMode={true}
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
        />
      );

      const editButton = screen.getByRole("button", { name: /Edytuj/i });
      await user.click(editButton);

      expect(screen.getByLabelText(/Godzina \*/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Tytuł \*/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Opis \*/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Lokalizacja \*/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Czas trwania/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Szacunkowy koszt/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Kategoria/)).toBeInTheDocument();
    });

    it("should mark invalid fields with aria-invalid", async () => {
      const activity = createMockActivity({ title: "Original" });
      const user = userEvent.setup();

      render(
        <ActivityCard
          activity={activity}
          isEditMode={true}
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
        />
      );

      const editButton = screen.getByRole("button", { name: /Edytuj/i });
      await user.click(editButton);

      const titleInput = screen.getByLabelText(/Tytuł \*/);
      await user.clear(titleInput);

      const saveButton = screen.getByRole("button", { name: /Zapisz/i });
      await user.click(saveButton);

      expect(titleInput).toHaveAttribute("aria-invalid", "true");
    });

    it("should have accessible button labels in edit mode", async () => {
      const activity = createMockActivity();
      const user = userEvent.setup();

      render(
        <ActivityCard
          activity={activity}
          isEditMode={true}
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
        />
      );

      const editButton = screen.getByRole("button", { name: /Edytuj/i });
      await user.click(editButton);

      expect(screen.getByRole("button", { name: /Zapisz/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Anuluj/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Usuń/i })).toBeInTheDocument();
    });
  });
});
