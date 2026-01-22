import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CreatePlanButtonProps {
  onClick: () => void;
}

/**
 * CreatePlanButton component
 * Floating action button (mobile) / prominent button (desktop) for creating new plans
 */
export function CreatePlanButton({ onClick }: CreatePlanButtonProps) {
  return (
    <Button
      onClick={onClick}
      size="lg"
      className="fixed bottom-6 right-6 z-50 size-14 rounded-full shadow-lg md:static md:w-auto md:h-10 md:rounded-md gap-2"
      aria-label="Utwórz nowy plan"
    >
      <Plus className="size-4" />
      <span className="hidden md:inline">Utwórz plan</span>
    </Button>
  );
}
