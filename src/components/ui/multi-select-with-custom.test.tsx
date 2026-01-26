/**
 * Tests for MultiSelectWithCustom component
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { MultiSelectWithCustom } from "./multi-select-with-custom";

describe("MultiSelectWithCustom", () => {
  const mockOptions = [
    { id: "opt1", label: "Option 1", labelEn: "Option 1" },
    { id: "opt2", label: "Option 2", labelEn: "Option 2" },
    { id: "opt3", label: "Option 3", labelEn: "Option 3" },
  ];

  describe("rendering", () => {
    it("should render with label", () => {
      render(
        <MultiSelectWithCustom
          label="Test Label"
          options={mockOptions}
          selectedValues={[]}
          onSelectionChange={vi.fn()}
        />
      );

      expect(screen.getByText("Test Label")).toBeInTheDocument();
    });

    it("should render selected predefined options as badges", () => {
      render(
        <MultiSelectWithCustom
          label="Test"
          options={mockOptions}
          selectedValues={["opt1", "opt2"]}
          onSelectionChange={vi.fn()}
        />
      );

      expect(screen.getByText("Option 1")).toBeInTheDocument();
      expect(screen.getByText("Option 2")).toBeInTheDocument();
    });

    it("should render custom options as badges with prefix", () => {
      render(
        <MultiSelectWithCustom
          label="Test"
          options={mockOptions}
          selectedValues={["custom:My Custom Option"]}
          onSelectionChange={vi.fn()}
        />
      );

      expect(screen.getByText("My Custom Option")).toBeInTheDocument();
    });

    it("should render placeholder text when no selections", () => {
      render(
        <MultiSelectWithCustom
          label="Test"
          options={mockOptions}
          selectedValues={[]}
          onSelectionChange={vi.fn()}
          customInputPlaceholder="Add custom..."
        />
      );

      expect(screen.getByPlaceholderText("Add custom...")).toBeInTheDocument();
    });
  });

  describe("interaction", () => {
    it("should call onSelectionChange when checkbox is toggled", async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();

      render(
        <MultiSelectWithCustom
          label="Test"
          options={mockOptions}
          selectedValues={[]}
          onSelectionChange={handleChange}
        />
      );

      // Open dropdown
      const button = screen.getByRole("button");
      await user.click(button);

      // Click first checkbox
      const checkboxes = screen.getAllByRole("checkbox");
      await user.click(checkboxes[0]);

      expect(handleChange).toHaveBeenCalledWith(["opt1"]);
    });

    it("should call onSelectionChange when custom option is added", async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();

      render(
        <MultiSelectWithCustom
          label="Test"
          options={mockOptions}
          selectedValues={[]}
          onSelectionChange={handleChange}
          customInputPlaceholder="Add custom..."
        />
      );

      const input = screen.getByPlaceholderText("Add custom...");
      await user.type(input, "My Custom{Enter}");

      expect(handleChange).toHaveBeenCalledWith(["custom:My Custom"]);
    });

    it("should remove option when badge X is clicked", async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();

      render(
        <MultiSelectWithCustom
          label="Test"
          options={mockOptions}
          selectedValues={["custom:First", "custom:Second"]}
          onSelectionChange={handleChange}
        />
      );

      // Find badge with "First" and click its X button
      const badge = screen.getByTestId("badge-custom:First");
      const removeButton = badge.querySelector("button");
      if (removeButton) {
        await user.click(removeButton);
      }

      expect(handleChange).toHaveBeenCalledWith(["custom:Second"]);
    });

    it("should not allow duplicate custom options", async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();

      render(
        <MultiSelectWithCustom
          label="Test"
          options={mockOptions}
          selectedValues={["custom:Existing"]}
          onSelectionChange={handleChange}
          customInputPlaceholder="Add custom..."
        />
      );

      const input = screen.getByPlaceholderText("Add custom...");
      await user.type(input, "Existing{Enter}");

      // Should not call handleChange with duplicate
      expect(handleChange).not.toHaveBeenCalled();
    });
  });

  describe("disabled state", () => {
    it("should disable all inputs when disabled prop is true", () => {
      render(
        <MultiSelectWithCustom
          label="Test"
          options={mockOptions}
          selectedValues={[]}
          onSelectionChange={vi.fn()}
          disabled={true}
          customInputPlaceholder="Add custom..."
        />
      );

      const button = screen.getByRole("button");
      const input = screen.getByPlaceholderText("Add custom...");

      expect(button).toBeDisabled();
      expect(input).toBeDisabled();
    });
  });

  describe("edge cases", () => {
    it("should handle empty options array", () => {
      render(<MultiSelectWithCustom label="Test" options={[]} selectedValues={[]} onSelectionChange={vi.fn()} />);

      expect(screen.getByText("Test")).toBeInTheDocument();
    });

    it("should handle empty selected values array", () => {
      render(
        <MultiSelectWithCustom label="Test" options={mockOptions} selectedValues={[]} onSelectionChange={vi.fn()} />
      );

      // Should render without errors
      expect(screen.getByText("Test")).toBeInTheDocument();
    });

    it("should trim whitespace from custom input", async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();

      render(
        <MultiSelectWithCustom
          label="Test"
          options={mockOptions}
          selectedValues={[]}
          onSelectionChange={handleChange}
          customInputPlaceholder="Add custom..."
        />
      );

      const input = screen.getByPlaceholderText("Add custom...");
      await user.type(input, "  Trimmed  {Enter}");

      expect(handleChange).toHaveBeenCalledWith(["custom:Trimmed"]);
    });

    it("should not add empty custom option", async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();

      render(
        <MultiSelectWithCustom
          label="Test"
          options={mockOptions}
          selectedValues={[]}
          onSelectionChange={handleChange}
          customInputPlaceholder="Add custom..."
        />
      );

      const input = screen.getByPlaceholderText("Add custom...");
      await user.type(input, "   {Enter}");

      expect(handleChange).not.toHaveBeenCalled();
    });
  });
});
