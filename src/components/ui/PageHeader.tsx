import { CreateActionButton } from "./CreateActionButton";

interface PageHeaderProps {
  title: string;
  description: string;
  onCreateClick: () => void;
  createButtonLabel: string;
  createButtonAriaLabel?: string;
  titleTestId?: string;
  createButtonTestId?: string;
}

/**
 * PageHeader component
 * Reusable header pattern for list/dashboard pages with a primary create action.
 * Includes title, description, and responsive create button (desktop header + mobile FAB).
 */
export function PageHeader({
  title,
  description,
  onCreateClick,
  createButtonLabel,
  createButtonAriaLabel,
  titleTestId,
  createButtonTestId,
}: PageHeaderProps) {
  return (
    <>
      {/* Header Section */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" data-testid={titleTestId}>
            {title}
          </h1>
          <p className="mt-2 text-muted-foreground">{description}</p>
        </div>
        <div className="hidden md:block">
          <CreateActionButton
            onClick={onCreateClick}
            label={createButtonLabel}
            ariaLabel={createButtonAriaLabel}
            testId={createButtonTestId ? `${createButtonTestId}-desktop` : undefined}
          />
        </div>
      </div>

      {/* Mobile FAB */}
      <div className="md:hidden">
        <CreateActionButton
          onClick={onCreateClick}
          label={createButtonLabel}
          ariaLabel={createButtonAriaLabel}
          testId={createButtonTestId ? `${createButtonTestId}-mobile` : undefined}
        />
      </div>
    </>
  );
}
