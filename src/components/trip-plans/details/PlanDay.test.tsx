/**
 * Unit tests for PlanDay component
 *
 * Tests the day container with activities management:
 * - Rendering day header and activities
 * - Adding new activities with validation
 * - Updating and deleting activities
 * - Business rule: preventing deletion of last activity
 * - Deleting entire day
 * - Date formatting
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PlanDay } from "./PlanDay";
import type { ActivityDto } from "../../../types";

// Mock ActivityCard component
vi.mock("./ActivityCard", () => ({
  ActivityCard: ({
    activity,
    isEditMode,
    onUpdate,
    onDelete,
  }: {
    activity: ActivityDto;
    isEditMode: boolean;
    onUpdate: (activity: ActivityDto) => void;
    onDelete: () => void;
  }) => (
    <div data-testid={`activity-card-${activity.title}`}>
      <p>{activity.time}</p>
      <p>{activity.title}</p>
      <p>{activity.description}</p>
      <p>{activity.location}</p>
      {isEditMode && (
        <>
          <button
            data-testid={`edit-activity-${activity.title}`}
            onClick={() =>
              onUpdate({
                ...activity,
                title: `${activity.title} Updated`,
              })
            }
          >
            Edit
          </button>
          <button data-testid={`delete-activity-${activity.title}`} onClick={onDelete}>
            Delete Activity
          </button>
        </>
      )}
    </div>
  ),
}));

// Helper to create mock activity
function createMockActivity(overrides?: Partial<ActivityDto>): ActivityDto {
  return {
    time: "10:00",
    title: "Museum Visit",
    description: "Visit the museum",
    location: "Downtown",
    ...overrides,
  };
}

describe("PlanDay", () => {
  const mockOnUpdateActivity = vi.fn();
  const mockOnDeleteActivity = vi.fn();
  const mockOnAddActivity = vi.fn();
  const mockOnDeleteDay = vi.fn();

  const defaultProps = {
    day: 1,
    date: "2025-06-01",
    activities: [createMockActivity()],
    dayIndex: 0,
    isEditMode: false,
    onUpdateActivity: mockOnUpdateActivity,
    onDeleteActivity: mockOnDeleteActivity,
    onAddActivity: mockOnAddActivity,
    onDeleteDay: mockOnDeleteDay,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Basic rendering", () => {
    it("should render day number and formatted date", () => {
      render(<PlanDay {...defaultProps} />);

      expect(screen.getByText(/Dzień 1/)).toBeInTheDocument();
      // Polish date format: "sobota, 31 maja" or similar
      expect(screen.getByText(/czerwiec/i)).toBeInTheDocument();
    });

    it("should render activities list", () => {
      const activities = [
        createMockActivity({ title: "Activity 1" }),
        createMockActivity({ title: "Activity 2" }),
        createMockActivity({ title: "Activity 3" }),
      ];

      render(<PlanDay {...defaultProps} activities={activities} />);

      expect(screen.getByTestId("activity-card-Activity 1")).toBeInTheDocument();
      expect(screen.getByTestId("activity-card-Activity 2")).toBeInTheDocument();
      expect(screen.getByTestId("activity-card-Activity 3")).toBeInTheDocument();
    });

    it("should render single activity", () => {
      render(<PlanDay {...defaultProps} />);

      expect(screen.getByTestId("activity-card-Museum Visit")).toBeInTheDocument();
    });

    it("should not show delete day button when isEditMode is false", () => {
      render(<PlanDay {...defaultProps} isEditMode={false} />);

      expect(screen.queryByTitle("Usuń dzień")).not.toBeInTheDocument();
    });

    it("should not show add activity button when isEditMode is false", () => {
      render(<PlanDay {...defaultProps} isEditMode={false} />);

      expect(screen.queryByRole("button", { name: /Dodaj aktywność/i })).not.toBeInTheDocument();
    });
  });

  describe("Edit mode - delete day", () => {
    it("should show delete day button when isEditMode is true", () => {
      render(<PlanDay {...defaultProps} isEditMode={true} />);

      expect(screen.getByTitle("Usuń dzień")).toBeInTheDocument();
    });

    it("should call onDeleteDay when delete day button is clicked", async () => {
      const user = userEvent.setup();
      render(<PlanDay {...defaultProps} dayIndex={2} isEditMode={true} />);

      const deleteButton = screen.getByTitle("Usuń dzień");
      await user.click(deleteButton);

      expect(mockOnDeleteDay).toHaveBeenCalledTimes(1);
      expect(mockOnDeleteDay).toHaveBeenCalledWith(2);
    });
  });

  describe("Edit mode - add activity button", () => {
    it("should show add activity button when isEditMode is true", () => {
      render(<PlanDay {...defaultProps} isEditMode={true} />);

      expect(screen.getByRole("button", { name: /Dodaj aktywność/i })).toBeInTheDocument();
    });

    it("should show add activity form when button is clicked", async () => {
      const user = userEvent.setup();
      render(<PlanDay {...defaultProps} isEditMode={true} />);

      const addButton = screen.getByRole("button", { name: /Dodaj aktywność/i });
      await user.click(addButton);

      expect(screen.getByText("Nowa aktywność")).toBeInTheDocument();
      expect(screen.getByLabelText(/Godzina \*/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Tytuł \*/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Opis \*/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Lokalizacja \*/)).toBeInTheDocument();
    });

    it("should hide add activity button when form is open", async () => {
      const user = userEvent.setup();
      render(<PlanDay {...defaultProps} isEditMode={true} />);

      const addButton = screen.getByRole("button", { name: /Dodaj aktywność/i });
      await user.click(addButton);

      expect(screen.queryByRole("button", { name: /Dodaj aktywność/i })).not.toBeInTheDocument();
    });
  });

  describe("Add activity form - rendering", () => {
    async function openAddActivityForm() {
      const user = userEvent.setup();
      render(<PlanDay {...defaultProps} isEditMode={true} />);

      const addButton = screen.getByRole("button", { name: /Dodaj aktywność/i });
      await user.click(addButton);

      return user;
    }

    it("should render form with default time value", async () => {
      await openAddActivityForm();

      const timeInput = screen.getByLabelText(/Godzina \*/);
      expect(timeInput).toHaveValue("09:00");
    });

    it("should render form with empty required fields", async () => {
      await openAddActivityForm();

      expect(screen.getByLabelText(/Tytuł \*/)).toHaveValue("");
      expect(screen.getByLabelText(/Opis \*/)).toHaveValue("");
      expect(screen.getByLabelText(/Lokalizacja \*/)).toHaveValue("");
    });

    it("should render cancel and save buttons", async () => {
      await openAddActivityForm();

      expect(screen.getByRole("button", { name: /Anuluj/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Dodaj/i })).toBeInTheDocument();
    });
  });

  describe("Add activity form - field editing", () => {
    async function openAddActivityForm() {
      const user = userEvent.setup();
      render(<PlanDay {...defaultProps} isEditMode={true} />);

      const addButton = screen.getByRole("button", { name: /Dodaj aktywność/i });
      await user.click(addButton);

      return user;
    }

    it("should update time field", async () => {
      const user = await openAddActivityForm();

      const timeInput = screen.getByLabelText(/Godzina \*/);
      await user.clear(timeInput);
      await user.type(timeInput, "14:30");

      expect(timeInput).toHaveValue("14:30");
    });

    it("should update title field", async () => {
      const user = await openAddActivityForm();

      const titleInput = screen.getByLabelText(/Tytuł \*/);
      await user.type(titleInput, "Lunch Break");

      expect(titleInput).toHaveValue("Lunch Break");
    });

    it("should update description field", async () => {
      const user = await openAddActivityForm();

      const descInput = screen.getByLabelText(/Opis \*/);
      await user.type(descInput, "Have lunch at restaurant");

      expect(descInput).toHaveValue("Have lunch at restaurant");
    });

    it("should update location field", async () => {
      const user = await openAddActivityForm();

      const locationInput = screen.getByLabelText(/Lokalizacja \*/);
      await user.type(locationInput, "Main Street 123");

      expect(locationInput).toHaveValue("Main Street 123");
    });
  });

  describe("Add activity form - validation", () => {
    async function openFormAndClickSave() {
      const user = userEvent.setup();
      render(<PlanDay {...defaultProps} isEditMode={true} />);

      const addButton = screen.getByRole("button", { name: /Dodaj aktywność/i });
      await user.click(addButton);

      const saveButton = screen.getByRole("button", { name: /Dodaj/i });
      return { user, saveButton };
    }

    it("should require time field", async () => {
      const { user, saveButton } = await openFormAndClickSave();

      const timeInput = screen.getByLabelText(/Godzina \*/);
      await user.clear(timeInput);

      await user.click(saveButton);

      expect(screen.getByText("Godzina jest wymagana")).toBeInTheDocument();
      expect(mockOnAddActivity).not.toHaveBeenCalled();
    });

    it("should require title field", async () => {
      const { user, saveButton } = await openFormAndClickSave();

      // Fill other required fields
      const descInput = screen.getByLabelText(/Opis \*/);
      await user.type(descInput, "Description");
      const locationInput = screen.getByLabelText(/Lokalizacja \*/);
      await user.type(locationInput, "Location");

      await user.click(saveButton);

      expect(screen.getByText("Tytuł jest wymagany")).toBeInTheDocument();
      expect(mockOnAddActivity).not.toHaveBeenCalled();
    });

    it("should require description field", async () => {
      const { user, saveButton } = await openFormAndClickSave();

      // Fill other required fields
      const titleInput = screen.getByLabelText(/Tytuł \*/);
      await user.type(titleInput, "Title");
      const locationInput = screen.getByLabelText(/Lokalizacja \*/);
      await user.type(locationInput, "Location");

      await user.click(saveButton);

      expect(screen.getByText("Opis jest wymagany")).toBeInTheDocument();
      expect(mockOnAddActivity).not.toHaveBeenCalled();
    });

    it("should require location field", async () => {
      const { user, saveButton } = await openFormAndClickSave();

      // Fill other required fields
      const titleInput = screen.getByLabelText(/Tytuł \*/);
      await user.type(titleInput, "Title");
      const descInput = screen.getByLabelText(/Opis \*/);
      await user.type(descInput, "Description");

      await user.click(saveButton);

      expect(screen.getByText("Lokalizacja jest wymagana")).toBeInTheDocument();
      expect(mockOnAddActivity).not.toHaveBeenCalled();
    });

    it("should show all validation errors when all fields are empty", async () => {
      const { user, saveButton } = await openFormAndClickSave();

      const timeInput = screen.getByLabelText(/Godzina \*/);
      await user.clear(timeInput);

      await user.click(saveButton);

      expect(screen.getByText("Godzina jest wymagana")).toBeInTheDocument();
      expect(screen.getByText("Tytuł jest wymagany")).toBeInTheDocument();
      expect(screen.getByText("Opis jest wymagany")).toBeInTheDocument();
      expect(screen.getByText("Lokalizacja jest wymagana")).toBeInTheDocument();
    });

    it("should clear validation error when field is edited", async () => {
      const { user, saveButton } = await openFormAndClickSave();

      // Create error
      await user.click(saveButton);
      expect(screen.getByText("Tytuł jest wymagany")).toBeInTheDocument();

      // Fix it
      const titleInput = screen.getByLabelText(/Tytuł \*/);
      await user.type(titleInput, "New Title");

      await waitFor(() => {
        expect(screen.queryByText("Tytuł jest wymagany")).not.toBeInTheDocument();
      });
    });

    it("should not accept whitespace-only values", async () => {
      const { user, saveButton } = await openFormAndClickSave();

      const titleInput = screen.getByLabelText(/Tytuł \*/);
      await user.type(titleInput, "   ");

      const descInput = screen.getByLabelText(/Opis \*/);
      await user.type(descInput, "   ");

      const locationInput = screen.getByLabelText(/Lokalizacja \*/);
      await user.type(locationInput, "   ");

      await user.click(saveButton);

      expect(screen.getByText("Tytuł jest wymagany")).toBeInTheDocument();
      expect(screen.getByText("Opis jest wymagany")).toBeInTheDocument();
      expect(screen.getByText("Lokalizacja jest wymagana")).toBeInTheDocument();
    });
  });

  describe("Add activity form - save operation", () => {
    async function fillFormAndSave() {
      const user = userEvent.setup();
      render(<PlanDay {...defaultProps} dayIndex={3} isEditMode={true} />);

      const addButton = screen.getByRole("button", { name: /Dodaj aktywność/i });
      await user.click(addButton);

      // Fill all required fields
      const timeInput = screen.getByLabelText(/Godzina \*/);
      await user.clear(timeInput);
      await user.type(timeInput, "15:30");

      const titleInput = screen.getByLabelText(/Tytuł \*/);
      await user.type(titleInput, "Shopping");

      const descInput = screen.getByLabelText(/Opis \*/);
      await user.type(descInput, "Buy souvenirs");

      const locationInput = screen.getByLabelText(/Lokalizacja \*/);
      await user.type(locationInput, "Shopping Mall");

      const saveButton = screen.getByRole("button", { name: /Dodaj/i });
      await user.click(saveButton);
    }

    it("should call onAddActivity with correct data when form is valid", async () => {
      await fillFormAndSave();

      await waitFor(() => {
        expect(mockOnAddActivity).toHaveBeenCalledTimes(1);
        expect(mockOnAddActivity).toHaveBeenCalledWith(3, {
          time: "15:30",
          title: "Shopping",
          description: "Buy souvenirs",
          location: "Shopping Mall",
        });
      });
    });

    it("should close form after successful save", async () => {
      await fillFormAndSave();

      await waitFor(() => {
        expect(screen.queryByText("Nowa aktywność")).not.toBeInTheDocument();
      });
    });

    it("should show add activity button again after successful save", async () => {
      await fillFormAndSave();

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /Dodaj aktywność/i })).toBeInTheDocument();
      });
    });

    it("should reset form fields after successful save", async () => {
      const user = userEvent.setup();
      render(<PlanDay {...defaultProps} isEditMode={true} />);

      // First save
      await fillFormAndSave();

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /Dodaj aktywność/i })).toBeInTheDocument();
      });

      // Open form again
      const addButton = screen.getByRole("button", { name: /Dodaj aktywność/i });
      await user.click(addButton);

      // Fields should be reset
      expect(screen.getByLabelText(/Godzina \*/)).toHaveValue("09:00");
      expect(screen.getByLabelText(/Tytuł \*/)).toHaveValue("");
      expect(screen.getByLabelText(/Opis \*/)).toHaveValue("");
      expect(screen.getByLabelText(/Lokalizacja \*/)).toHaveValue("");
    });
  });

  describe("Add activity form - cancel operation", () => {
    it("should close form when cancel button is clicked", async () => {
      const user = userEvent.setup();
      render(<PlanDay {...defaultProps} isEditMode={true} />);

      const addButton = screen.getByRole("button", { name: /Dodaj aktywność/i });
      await user.click(addButton);

      const cancelButton = screen.getByRole("button", { name: /Anuluj/i });
      await user.click(cancelButton);

      expect(screen.queryByText("Nowa aktywność")).not.toBeInTheDocument();
    });

    it("should reset form fields when cancel is clicked", async () => {
      const user = userEvent.setup();
      render(<PlanDay {...defaultProps} isEditMode={true} />);

      const addButton = screen.getByRole("button", { name: /Dodaj aktywność/i });
      await user.click(addButton);

      // Fill some fields
      const titleInput = screen.getByLabelText(/Tytuł \*/);
      await user.type(titleInput, "Some Title");

      // Cancel
      const cancelButton = screen.getByRole("button", { name: /Anuluj/i });
      await user.click(cancelButton);

      // Open again
      const addButtonAgain = screen.getByRole("button", { name: /Dodaj aktywność/i });
      await user.click(addButtonAgain);

      // Should be empty
      expect(screen.getByLabelText(/Tytuł \*/)).toHaveValue("");
    });

    it("should clear validation errors when cancel is clicked", async () => {
      const user = userEvent.setup();
      render(<PlanDay {...defaultProps} isEditMode={true} />);

      const addButton = screen.getByRole("button", { name: /Dodaj aktywność/i });
      await user.click(addButton);

      // Create validation errors
      const saveButton = screen.getByRole("button", { name: /Dodaj/i });
      await user.click(saveButton);
      expect(screen.getByText("Tytuł jest wymagany")).toBeInTheDocument();

      // Cancel
      const cancelButton = screen.getByRole("button", { name: /Anuluj/i });
      await user.click(cancelButton);

      // Open again
      const addButtonAgain = screen.getByRole("button", { name: /Dodaj aktywność/i });
      await user.click(addButtonAgain);

      // Errors should be cleared
      expect(screen.queryByText("Tytuł jest wymagany")).not.toBeInTheDocument();
    });

    it("should not call onAddActivity when cancel is clicked", async () => {
      const user = userEvent.setup();
      render(<PlanDay {...defaultProps} isEditMode={true} />);

      const addButton = screen.getByRole("button", { name: /Dodaj aktywność/i });
      await user.click(addButton);

      const cancelButton = screen.getByRole("button", { name: /Anuluj/i });
      await user.click(cancelButton);

      expect(mockOnAddActivity).not.toHaveBeenCalled();
    });
  });

  describe("Activity operations via ActivityCard", () => {
    it("should call onUpdateActivity with correct indices when activity is updated", async () => {
      const user = userEvent.setup();
      const activities = [
        createMockActivity({ title: "Activity 1" }),
        createMockActivity({ title: "Activity 2" }),
      ];

      render(<PlanDay {...defaultProps} dayIndex={2} activities={activities} isEditMode={true} />);

      const editButton = screen.getByTestId("edit-activity-Activity 2");
      await user.click(editButton);

      await waitFor(() => {
        expect(mockOnUpdateActivity).toHaveBeenCalledTimes(1);
        expect(mockOnUpdateActivity).toHaveBeenCalledWith(2, 1, {
          time: "10:00",
          title: "Activity 2 Updated",
          description: "Visit the museum",
          location: "Downtown",
        });
      });
    });

    it("should call onDeleteActivity when activity delete is triggered", async () => {
      const user = userEvent.setup();
      const activities = [
        createMockActivity({ title: "Activity 1" }),
        createMockActivity({ title: "Activity 2" }),
      ];

      render(<PlanDay {...defaultProps} dayIndex={1} activities={activities} isEditMode={true} />);

      const deleteButton = screen.getByTestId("delete-activity-Activity 1");
      await user.click(deleteButton);

      await waitFor(() => {
        expect(mockOnDeleteActivity).toHaveBeenCalledTimes(1);
        expect(mockOnDeleteActivity).toHaveBeenCalledWith(1, 0);
      });
    });
  });

  describe("Business rule: prevent deletion of last activity", () => {
    it("should not call onDeleteActivity when only one activity exists", async () => {
      const user = userEvent.setup();
      const activities = [createMockActivity({ title: "Only Activity" })];

      render(<PlanDay {...defaultProps} activities={activities} isEditMode={true} />);

      const deleteButton = screen.getByTestId("delete-activity-Only Activity");
      await user.click(deleteButton);

      expect(mockOnDeleteActivity).not.toHaveBeenCalled();
    });

    it("should allow deletion when two activities exist", async () => {
      const user = userEvent.setup();
      const activities = [
        createMockActivity({ title: "Activity 1" }),
        createMockActivity({ title: "Activity 2" }),
      ];

      render(<PlanDay {...defaultProps} dayIndex={0} activities={activities} isEditMode={true} />);

      const deleteButton = screen.getByTestId("delete-activity-Activity 1");
      await user.click(deleteButton);

      expect(mockOnDeleteActivity).toHaveBeenCalledTimes(1);
      expect(mockOnDeleteActivity).toHaveBeenCalledWith(0, 0);
    });

    it("should allow deletion when multiple activities exist", async () => {
      const user = userEvent.setup();
      const activities = [
        createMockActivity({ title: "Activity 1" }),
        createMockActivity({ title: "Activity 2" }),
        createMockActivity({ title: "Activity 3" }),
      ];

      render(<PlanDay {...defaultProps} activities={activities} isEditMode={true} />);

      const deleteButton = screen.getByTestId("delete-activity-Activity 2");
      await user.click(deleteButton);

      expect(mockOnDeleteActivity).toHaveBeenCalled();
    });
  });

  describe("Date formatting", () => {
    it("should format valid ISO date to Polish locale", () => {
      render(<PlanDay {...defaultProps} date="2025-06-15" />);

      // Should display month in Polish
      expect(screen.getByText(/czerwiec/i)).toBeInTheDocument();
    });

    it("should handle different dates correctly", () => {
      const { rerender } = render(<PlanDay {...defaultProps} date="2025-12-25" />);

      expect(screen.getByText(/grudzień/i)).toBeInTheDocument();

      rerender(<PlanDay {...defaultProps} date="2025-01-01" />);
      expect(screen.getByText(/styczeń/i)).toBeInTheDocument();
    });

    it("should handle invalid date gracefully", () => {
      render(<PlanDay {...defaultProps} date="invalid-date" />);

      // Should still render something
      expect(screen.getByText(/Dzień 1/)).toBeInTheDocument();
    });

    it("should display weekday in Polish", () => {
      // 2025-06-02 is Monday
      render(<PlanDay {...defaultProps} date="2025-06-02" />);

      expect(screen.getByText(/poniedziałek/i)).toBeInTheDocument();
    });
  });

  describe("Edge cases and boundary conditions", () => {
    it("should handle empty activities array", () => {
      render(<PlanDay {...defaultProps} activities={[]} />);

      expect(screen.getByText(/Dzień 1/)).toBeInTheDocument();
      // No activity cards should be rendered
      expect(screen.queryByTestId(/activity-card-/)).not.toBeInTheDocument();
    });

    it("should handle large number of activities", () => {
      const activities = Array.from({ length: 20 }, (_, i) =>
        createMockActivity({ title: `Activity ${i + 1}` })
      );

      render(<PlanDay {...defaultProps} activities={activities} />);

      expect(screen.getByTestId("activity-card-Activity 1")).toBeInTheDocument();
      expect(screen.getByTestId("activity-card-Activity 20")).toBeInTheDocument();
    });

    it("should handle day number 0", () => {
      render(<PlanDay {...defaultProps} day={0} />);

      expect(screen.getByText(/Dzień 0/)).toBeInTheDocument();
    });

    it("should handle large day numbers", () => {
      render(<PlanDay {...defaultProps} day={365} />);

      expect(screen.getByText(/Dzień 365/)).toBeInTheDocument();
    });

    it("should handle negative dayIndex", () => {
      const user = userEvent.setup();
      render(<PlanDay {...defaultProps} dayIndex={-1} isEditMode={true} />);

      const deleteButton = screen.getByTitle("Usuń dzień");
      user.click(deleteButton);

      // Should still work
      expect(mockOnDeleteDay).toHaveBeenCalledWith(-1);
    });
  });

  describe("Accessibility", () => {
    it("should have proper labels for form fields", async () => {
      const user = userEvent.setup();
      render(<PlanDay {...defaultProps} isEditMode={true} />);

      const addButton = screen.getByRole("button", { name: /Dodaj aktywność/i });
      await user.click(addButton);

      expect(screen.getByLabelText(/Godzina \*/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Tytuł \*/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Opis \*/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Lokalizacja \*/)).toBeInTheDocument();
    });

    it("should mark invalid fields with aria-invalid", async () => {
      const user = userEvent.setup();
      render(<PlanDay {...defaultProps} isEditMode={true} />);

      const addButton = screen.getByRole("button", { name: /Dodaj aktywność/i });
      await user.click(addButton);

      const saveButton = screen.getByRole("button", { name: /Dodaj/i });
      await user.click(saveButton);

      const titleInput = screen.getByLabelText(/Tytuł \*/);
      expect(titleInput).toHaveAttribute("aria-invalid", "true");
    });

    it("should have accessible delete day button with title", () => {
      render(<PlanDay {...defaultProps} isEditMode={true} />);

      const deleteButton = screen.getByTitle("Usuń dzień");
      expect(deleteButton).toBeInTheDocument();
    });

    it("should have accessible button labels", async () => {
      const user = userEvent.setup();
      render(<PlanDay {...defaultProps} isEditMode={true} />);

      expect(screen.getByRole("button", { name: /Dodaj aktywność/i })).toBeInTheDocument();

      const addButton = screen.getByRole("button", { name: /Dodaj aktywność/i });
      await user.click(addButton);

      expect(screen.getByRole("button", { name: /Anuluj/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Dodaj/i })).toBeInTheDocument();
    });
  });
});
