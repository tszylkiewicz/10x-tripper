/**
 * EmptyState Component
 *
 * Generic empty state display for when a list or collection has no items.
 * Shows an icon, title, description, and action button.
 */

import type { LucideIcon } from "lucide-react";
import { Button } from "@ui/button";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
  containerTestId?: string;
  actionTestId?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  containerTestId,
  actionTestId,
}: EmptyStateProps) {
  return (
    <div
      className="flex min-h-[400px] flex-col items-center justify-center gap-4 text-center"
      data-testid={containerTestId}
    >
      <div className="rounded-full bg-muted p-6">
        <Icon className="size-12 text-muted-foreground" />
      </div>
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="max-w-md text-sm text-muted-foreground">{description}</p>
      </div>
      <Button onClick={onAction} className="mt-4" data-testid={actionTestId}>
        {actionLabel}
      </Button>
    </div>
  );
}
