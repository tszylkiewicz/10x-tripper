import { RefreshCw, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PlanActionsProps } from "./types";

/**
 * PlanActions component
 *
 * Action buttons for the generated plan section.
 * Provides "Regenerate plan" and "Accept plan" buttons with
 * appropriate loading states and edit warnings.
 */
export function PlanActions({ onRegenerate, onAccept, isAccepting = false, isEdited = false }: PlanActionsProps) {
  return (
    <div className="sticky bottom-0 flex flex-col gap-3 border-t bg-background py-4 sm:flex-row sm:justify-end">
      {/* Edit warning message */}
      {isEdited && <p className="self-center text-xs text-muted-foreground sm:mr-auto">Plan został zmodyfikowany</p>}

      {/* Regenerate button */}
      <Button type="button" variant="outline" onClick={onRegenerate} disabled={isAccepting} className="gap-2">
        <RefreshCw className="size-4" />
        Regeneruj plan
      </Button>

      {/* Accept button */}
      <Button type="button" onClick={onAccept} disabled={isAccepting} className="gap-2">
        {isAccepting ? (
          <>
            <RefreshCw className="size-4 animate-spin" />
            Zapisywanie...
          </>
        ) : (
          <>
            <Check className="size-4" />
            Akceptuj plan
          </>
        )}
      </Button>
    </div>
  );
}
