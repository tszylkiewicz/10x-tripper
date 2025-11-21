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
      className="fixed bottom-6 right-6 z-50 size-14 rounded-full shadow-lg md:static md:size-auto md:rounded-md"
      aria-label="Utwórz nowy plan"
    >
      <Plus className="size-6 md:mr-2 md:size-5" />
      <span className="hidden md:inline">Utwórz plan</span>
    </Button>
  );
}
