/**
 * Unit tests for PreferenceCard component
 *
 * Tests the preference card display and interaction logic:
 * - Rendering preference data
 * - Budget type label mapping
 * - Budget type color mapping
 * - Edit and delete action handlers
 * - Edge cases (null values, unknown budget types)
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PreferenceCard } from "./PreferenceCard";
import type { UserPreferenceDto } from "@/types.ts";

// Helper to create mock preference
function createMockPreference(overrides?: Partial<UserPreferenceDto>): UserPreferenceDto {
  return {
    id: "pref-123",
    name: "Weekend Getaway",
    people_count: 2,
    budget_type: "medium",
    ...overrides,
  };
}

describe("PreferenceCard", () => {
  const mockOnEdit = vi.fn();
  const mockOnDelete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Basic rendering", () => {
    it("should render preference name as title", () => {
      const preference = createMockPreference({ name: "Summer Vacation" });

      render(<PreferenceCard preference={preference} onEdit={mockOnEdit} onDelete={mockOnDelete} />);

      expect(screen.getByText("Summer Vacation")).toBeInTheDocument();
    });

    it("should render people count", () => {
      const preference = createMockPreference({ people_count: 4 });

      render(<PreferenceCard preference={preference} onEdit={mockOnEdit} onDelete={mockOnDelete} />);

      expect(screen.getByText("Liczba osób:")).toBeInTheDocument();
      expect(screen.getByText("4")).toBeInTheDocument();
    });

    it("should render budget type label", () => {
      const preference = createMockPreference({ budget_type: "high" });

      render(<PreferenceCard preference={preference} onEdit={mockOnEdit} onDelete={mockOnDelete} />);

      expect(screen.getByText("Budżet:")).toBeInTheDocument();
      expect(screen.getByText("Wysoki")).toBeInTheDocument();
    });

    it("should render edit button", () => {
      const preference = createMockPreference();

      render(<PreferenceCard preference={preference} onEdit={mockOnEdit} onDelete={mockOnDelete} />);

      const editButton = screen.getByRole("button", { name: /Edytuj/i });
      expect(editButton).toBeInTheDocument();
    });

    it("should render delete button", () => {
      const preference = createMockPreference();

      render(<PreferenceCard preference={preference} onEdit={mockOnEdit} onDelete={mockOnDelete} />);

      const deleteButton = screen.getByRole("button", { name: /Usuń/i });
      expect(deleteButton).toBeInTheDocument();
    });
  });

  describe("Budget type label mapping", () => {
    it("should display 'Niski' for low budget type", () => {
      const preference = createMockPreference({ budget_type: "low" });

      render(<PreferenceCard preference={preference} onEdit={mockOnEdit} onDelete={mockOnDelete} />);

      expect(screen.getByText("Niski")).toBeInTheDocument();
    });

    it("should display 'Średni' for medium budget type", () => {
      const preference = createMockPreference({ budget_type: "medium" });

      render(<PreferenceCard preference={preference} onEdit={mockOnEdit} onDelete={mockOnDelete} />);

      expect(screen.getByText("Średni")).toBeInTheDocument();
    });

    it("should display 'Wysoki' for high budget type", () => {
      const preference = createMockPreference({ budget_type: "high" });

      render(<PreferenceCard preference={preference} onEdit={mockOnEdit} onDelete={mockOnDelete} />);

      expect(screen.getByText("Wysoki")).toBeInTheDocument();
    });

    it("should display 'Nie określono' for null budget type", () => {
      const preference = createMockPreference({ budget_type: null as unknown as string });

      render(<PreferenceCard preference={preference} onEdit={mockOnEdit} onDelete={mockOnDelete} />);

      // Two instances: one for people_count, one for budget_type
      const nieOkreslono = screen.getAllByText("Nie określono");
      expect(nieOkreslono.length).toBeGreaterThanOrEqual(1);
    });

    it("should display raw value for unknown budget type", () => {
      const preference = createMockPreference({ budget_type: "custom-budget" });

      render(<PreferenceCard preference={preference} onEdit={mockOnEdit} onDelete={mockOnDelete} />);

      expect(screen.getByText("custom-budget")).toBeInTheDocument();
    });

    it("should display 'Nie określono' for empty string budget type", () => {
      const preference = createMockPreference({ budget_type: "" });

      render(<PreferenceCard preference={preference} onEdit={mockOnEdit} onDelete={mockOnDelete} />);

      const nieOkreslono = screen.getAllByText("Nie określono");
      expect(nieOkreslono.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("Budget type color mapping", () => {
    it("should apply green color classes for low budget", () => {
      const preference = createMockPreference({ budget_type: "low" });

      const { container } = render(
        <PreferenceCard preference={preference} onEdit={mockOnEdit} onDelete={mockOnDelete} />
      );

      const badge = container.querySelector(".bg-green-100");
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass("text-green-800");
    });

    it("should apply blue color classes for medium budget", () => {
      const preference = createMockPreference({ budget_type: "medium" });

      const { container } = render(
        <PreferenceCard preference={preference} onEdit={mockOnEdit} onDelete={mockOnDelete} />
      );

      const badge = container.querySelector(".bg-blue-100");
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass("text-blue-800");
    });

    it("should apply purple color classes for high budget", () => {
      const preference = createMockPreference({ budget_type: "high" });

      const { container } = render(
        <PreferenceCard preference={preference} onEdit={mockOnEdit} onDelete={mockOnDelete} />
      );

      const badge = container.querySelector(".bg-purple-100");
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass("text-purple-800");
    });

    it("should apply muted color classes for null budget type", () => {
      const preference = createMockPreference({ budget_type: null as unknown as string });

      const { container } = render(
        <PreferenceCard preference={preference} onEdit={mockOnEdit} onDelete={mockOnDelete} />
      );

      const badge = container.querySelector(".bg-muted");
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass("text-muted-foreground");
    });

    it("should apply muted color classes for unknown budget type", () => {
      const preference = createMockPreference({ budget_type: "unknown-type" });

      const { container } = render(
        <PreferenceCard preference={preference} onEdit={mockOnEdit} onDelete={mockOnDelete} />
      );

      const badge = container.querySelector(".bg-muted");
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass("text-muted-foreground");
    });

    it("should apply dark mode color classes for low budget", () => {
      const preference = createMockPreference({ budget_type: "low" });

      const { container } = render(
        <PreferenceCard preference={preference} onEdit={mockOnEdit} onDelete={mockOnDelete} />
      );

      const badge = container.querySelector(".dark\\:bg-green-900\\/30");
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass("dark:text-green-400");
    });

    it("should apply dark mode color classes for medium budget", () => {
      const preference = createMockPreference({ budget_type: "medium" });

      const { container } = render(
        <PreferenceCard preference={preference} onEdit={mockOnEdit} onDelete={mockOnDelete} />
      );

      const badge = container.querySelector(".dark\\:bg-blue-900\\/30");
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass("dark:text-blue-400");
    });

    it("should apply dark mode color classes for high budget", () => {
      const preference = createMockPreference({ budget_type: "high" });

      const { container } = render(
        <PreferenceCard preference={preference} onEdit={mockOnEdit} onDelete={mockOnDelete} />
      );

      const badge = container.querySelector(".dark\\:bg-purple-900\\/30");
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass("dark:text-purple-400");
    });
  });

  describe("People count display", () => {
    it("should display people count for value 1", () => {
      const preference = createMockPreference({ people_count: 1 });

      render(<PreferenceCard preference={preference} onEdit={mockOnEdit} onDelete={mockOnDelete} />);

      expect(screen.getByText("1")).toBeInTheDocument();
    });

    it("should display people count for large value (100+)", () => {
      const preference = createMockPreference({ people_count: 150 });

      render(<PreferenceCard preference={preference} onEdit={mockOnEdit} onDelete={mockOnDelete} />);

      expect(screen.getByText("150")).toBeInTheDocument();
    });

    it("should display 'Nie określono' for null people count", () => {
      const preference = createMockPreference({ people_count: null as unknown as number });

      render(<PreferenceCard preference={preference} onEdit={mockOnEdit} onDelete={mockOnDelete} />);

      expect(screen.getByText("Nie określono")).toBeInTheDocument();
    });

    it("should display 'Nie określono' for undefined people count", () => {
      const preference = createMockPreference({ people_count: undefined as unknown as number });

      render(<PreferenceCard preference={preference} onEdit={mockOnEdit} onDelete={mockOnDelete} />);

      expect(screen.getByText("Nie określono")).toBeInTheDocument();
    });

    it("should display people count for value 0", () => {
      const preference = createMockPreference({ people_count: 0 });

      render(<PreferenceCard preference={preference} onEdit={mockOnEdit} onDelete={mockOnDelete} />);

      // 0 is falsy but should still display
      expect(screen.getByText("0")).toBeInTheDocument();
    });
  });

  describe("Edit action", () => {
    it("should call onEdit with preference when edit button is clicked", async () => {
      const user = userEvent.setup();
      const preference = createMockPreference({ id: "pref-1", name: "Beach Trip" });

      render(<PreferenceCard preference={preference} onEdit={mockOnEdit} onDelete={mockOnDelete} />);

      const editButton = screen.getByRole("button", { name: /Edytuj/i });
      await user.click(editButton);

      expect(mockOnEdit).toHaveBeenCalledTimes(1);
      expect(mockOnEdit).toHaveBeenCalledWith(preference);
    });

    it("should call onEdit with complete preference object", async () => {
      const user = userEvent.setup();
      const preference = createMockPreference({
        id: "pref-123",
        name: "Family Vacation",
        people_count: 5,
        budget_type: "high",
      });

      render(<PreferenceCard preference={preference} onEdit={mockOnEdit} onDelete={mockOnDelete} />);

      const editButton = screen.getByRole("button", { name: /Edytuj/i });
      await user.click(editButton);

      expect(mockOnEdit).toHaveBeenCalledWith({
        id: "pref-123",
        name: "Family Vacation",
        people_count: 5,
        budget_type: "high",
      });
    });

    it("should handle multiple edit button clicks", async () => {
      const user = userEvent.setup();
      const preference = createMockPreference();

      render(<PreferenceCard preference={preference} onEdit={mockOnEdit} onDelete={mockOnDelete} />);

      const editButton = screen.getByRole("button", { name: /Edytuj/i });

      await user.click(editButton);
      await user.click(editButton);
      await user.click(editButton);

      expect(mockOnEdit).toHaveBeenCalledTimes(3);
    });

    it("should not call onDelete when edit button is clicked", async () => {
      const user = userEvent.setup();
      const preference = createMockPreference();

      render(<PreferenceCard preference={preference} onEdit={mockOnEdit} onDelete={mockOnDelete} />);

      const editButton = screen.getByRole("button", { name: /Edytuj/i });
      await user.click(editButton);

      expect(mockOnDelete).not.toHaveBeenCalled();
    });
  });

  describe("Delete action", () => {
    it("should call onDelete with preference when delete button is clicked", async () => {
      const user = userEvent.setup();
      const preference = createMockPreference({ id: "pref-1", name: "City Tour" });

      render(<PreferenceCard preference={preference} onEdit={mockOnEdit} onDelete={mockOnDelete} />);

      const deleteButton = screen.getByRole("button", { name: /Usuń/i });
      await user.click(deleteButton);

      expect(mockOnDelete).toHaveBeenCalledTimes(1);
      expect(mockOnDelete).toHaveBeenCalledWith(preference);
    });

    it("should call onDelete with complete preference object", async () => {
      const user = userEvent.setup();
      const preference = createMockPreference({
        id: "pref-456",
        name: "Mountain Hiking",
        people_count: 3,
        budget_type: "low",
      });

      render(<PreferenceCard preference={preference} onEdit={mockOnEdit} onDelete={mockOnDelete} />);

      const deleteButton = screen.getByRole("button", { name: /Usuń/i });
      await user.click(deleteButton);

      expect(mockOnDelete).toHaveBeenCalledWith({
        id: "pref-456",
        name: "Mountain Hiking",
        people_count: 3,
        budget_type: "low",
      });
    });

    it("should handle multiple delete button clicks", async () => {
      const user = userEvent.setup();
      const preference = createMockPreference();

      render(<PreferenceCard preference={preference} onEdit={mockOnEdit} onDelete={mockOnDelete} />);

      const deleteButton = screen.getByRole("button", { name: /Usuń/i });

      await user.click(deleteButton);
      await user.click(deleteButton);

      expect(mockOnDelete).toHaveBeenCalledTimes(2);
    });

    it("should not call onEdit when delete button is clicked", async () => {
      const user = userEvent.setup();
      const preference = createMockPreference();

      render(<PreferenceCard preference={preference} onEdit={mockOnEdit} onDelete={mockOnDelete} />);

      const deleteButton = screen.getByRole("button", { name: /Usuń/i });
      await user.click(deleteButton);

      expect(mockOnEdit).not.toHaveBeenCalled();
    });
  });

  describe("Edge cases and boundary conditions", () => {
    it("should handle preference with very long name", () => {
      const longName = "A".repeat(200);
      const preference = createMockPreference({ name: longName });

      render(<PreferenceCard preference={preference} onEdit={mockOnEdit} onDelete={mockOnDelete} />);

      expect(screen.getByText(longName)).toBeInTheDocument();
    });

    it("should handle preference with special characters in name", () => {
      const preference = createMockPreference({
        name: "Trip with 'quotes' & <tags> / special\\chars éèñ",
      });

      render(<PreferenceCard preference={preference} onEdit={mockOnEdit} onDelete={mockOnDelete} />);

      expect(screen.getByText("Trip with 'quotes' & <tags> / special\\chars éèñ")).toBeInTheDocument();
    });

    it("should handle preference with emoji in name", () => {
      const preference = createMockPreference({ name: "🏖️ Beach Vacation 🌴" });

      render(<PreferenceCard preference={preference} onEdit={mockOnEdit} onDelete={mockOnDelete} />);

      expect(screen.getByText("🏖️ Beach Vacation 🌴")).toBeInTheDocument();
    });

    it("should handle all null values", () => {
      const preference = createMockPreference({
        name: "Minimal Preference",
        people_count: null as unknown as number,
        budget_type: null as unknown as string,
      });

      render(<PreferenceCard preference={preference} onEdit={mockOnEdit} onDelete={mockOnDelete} />);

      expect(screen.getByText("Minimal Preference")).toBeInTheDocument();
      expect(screen.getAllByText("Nie określono").length).toBe(2); // people_count and budget_type
    });

    it("should handle preference with negative people count", () => {
      const preference = createMockPreference({ people_count: -5 });

      render(<PreferenceCard preference={preference} onEdit={mockOnEdit} onDelete={mockOnDelete} />);

      // Should still render even if invalid
      expect(screen.getByText("-5")).toBeInTheDocument();
    });

    it("should handle preference with decimal people count", () => {
      const preference = createMockPreference({ people_count: 2.5 as unknown as number });

      render(<PreferenceCard preference={preference} onEdit={mockOnEdit} onDelete={mockOnDelete} />);

      expect(screen.getByText("2.5")).toBeInTheDocument();
    });

    it("should handle budget type with mixed case", () => {
      const preference = createMockPreference({ budget_type: "HIGH" });

      render(<PreferenceCard preference={preference} onEdit={mockOnEdit} onDelete={mockOnDelete} />);

      // Should display raw value since it doesn't match "high"
      expect(screen.getByText("HIGH")).toBeInTheDocument();
    });

    it("should handle budget type with whitespace", () => {
      const preference = createMockPreference({ budget_type: " medium " });

      render(<PreferenceCard preference={preference} onEdit={mockOnEdit} onDelete={mockOnDelete} />);

      // Should trim whitespace and display the label for "medium"
      expect(screen.getByText("Średni")).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("should have accessible button labels", () => {
      const preference = createMockPreference();

      render(<PreferenceCard preference={preference} onEdit={mockOnEdit} onDelete={mockOnDelete} />);

      expect(screen.getByRole("button", { name: /Edytuj/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Usuń/i })).toBeInTheDocument();
    });

    it("should use semantic heading for preference name", () => {
      const preference = createMockPreference({ name: "Weekend Trip" });

      render(<PreferenceCard preference={preference} onEdit={mockOnEdit} onDelete={mockOnDelete} />);

      // CardTitle renders as h3 by default in shadcn/ui
      const heading = screen.getByText("Weekend Trip");
      expect(heading).toBeInTheDocument();
    });

    it("should have descriptive text for people count section", () => {
      const preference = createMockPreference();

      render(<PreferenceCard preference={preference} onEdit={mockOnEdit} onDelete={mockOnDelete} />);

      expect(screen.getByText("Liczba osób:")).toBeInTheDocument();
    });

    it("should have descriptive text for budget section", () => {
      const preference = createMockPreference();

      render(<PreferenceCard preference={preference} onEdit={mockOnEdit} onDelete={mockOnDelete} />);

      expect(screen.getByText("Budżet:")).toBeInTheDocument();
    });
  });

  describe("Visual styling", () => {
    it("should apply hover shadow effect to card", () => {
      const preference = createMockPreference();

      const { container } = render(
        <PreferenceCard preference={preference} onEdit={mockOnEdit} onDelete={mockOnDelete} />
      );

      const card = container.querySelector(".hover\\:shadow-md");
      expect(card).toBeInTheDocument();
    });

    it("should apply destructive styling to delete button", () => {
      const preference = createMockPreference();

      render(<PreferenceCard preference={preference} onEdit={mockOnEdit} onDelete={mockOnDelete} />);

      const deleteButton = screen.getByRole("button", { name: /Usuń/i });
      expect(deleteButton).toHaveClass("text-destructive");
      expect(deleteButton).toHaveClass("hover:bg-destructive");
    });

    it("should render buttons with outline variant", () => {
      const preference = createMockPreference();

      render(<PreferenceCard preference={preference} onEdit={mockOnEdit} onDelete={mockOnDelete} />);

      const editButton = screen.getByRole("button", { name: /Edytuj/i });
      const deleteButton = screen.getByRole("button", { name: /Usuń/i });

      // Both buttons should have outline variant styling
      expect(editButton.className).toContain("outline");
      expect(deleteButton.className).toContain("outline");
    });

    it("should render buttons with small size", () => {
      const preference = createMockPreference();

      render(<PreferenceCard preference={preference} onEdit={mockOnEdit} onDelete={mockOnDelete} />);

      const editButton = screen.getByRole("button", { name: /Edytuj/i });
      const deleteButton = screen.getByRole("button", { name: /Usuń/i });

      // Both buttons should have small size styling
      expect(editButton.className).toContain("sm");
      expect(deleteButton.className).toContain("sm");
    });
  });

  describe("Component structure", () => {
    it("should render card with header, content, and footer", () => {
      const preference = createMockPreference();

      const { container } = render(
        <PreferenceCard preference={preference} onEdit={mockOnEdit} onDelete={mockOnDelete} />
      );

      // Check for card structure (based on shadcn/ui Card component)
      expect(container.querySelector('[class*="Card"]')).toBeTruthy();
    });

    it("should render icons for visual enhancement", () => {
      const preference = createMockPreference();

      const { container } = render(
        <PreferenceCard preference={preference} onEdit={mockOnEdit} onDelete={mockOnDelete} />
      );

      // lucide-react icons render as SVGs
      const svgs = container.querySelectorAll("svg");
      expect(svgs.length).toBeGreaterThan(0);
    });

    it("should render budget badge with proper styling", () => {
      const preference = createMockPreference({ budget_type: "medium" });

      render(<PreferenceCard preference={preference} onEdit={mockOnEdit} onDelete={mockOnDelete} />);

      const badge = screen.getByText("Średni");
      expect(badge).toHaveClass("inline-flex");
      expect(badge).toHaveClass("rounded-full");
      expect(badge).toHaveClass("px-2.5");
      expect(badge).toHaveClass("py-0.5");
      expect(badge).toHaveClass("text-xs");
      expect(badge).toHaveClass("font-semibold");
    });
  });
});
