import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CreateActionButtonProps {
  onClick: () => void;
  label: string;
  ariaLabel?: string;
  testId?: string;
}

/**
 * CreateActionButton component
 * Generic floating action button (mobile) / prominent button (desktop) for primary create actions.
 * Responsive: FAB in bottom right on mobile, regular button in header on desktop.
 */
export function CreateActionButton({ onClick, label, ariaLabel, testId }: CreateActionButtonProps) {
  return (
    <Button
      onClick={onClick}
      size="lg"
      className="fixed bottom-6 right-6 z-50 size-14 rounded-full shadow-lg md:static md:h-10 md:w-auto md:rounded-md md:gap-2"
      aria-label={ariaLabel || label}
      data-testid={testId}
    >
      <Plus className="size-4" />
      <span className="hidden md:inline">{label}</span>
    </Button>
  );
}
