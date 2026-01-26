/**
 * SavePreferenceDialog Component
 *
 * Dialog for saving current trip plan form data as a preference template.
 * Allows user to enter a name for the new preference and saves it.
 */

import { useState } from "react";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { SavePreferenceDialogProps } from "./types";

export function SavePreferenceDialog({ open, onClose, onSave, isSaving }: SavePreferenceDialogProps) {
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Nazwa jest wymagana");
      return;
    }

    if (trimmedName.length > 256) {
      setError("Nazwa nie może przekraczać 256 znaków");
      return;
    }

    setError(null);

    try {
      await onSave(trimmedName);
      // Reset form on success
      setName("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Wystąpił błąd");
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen && !isSaving) {
      setName("");
      setError(null);
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Zapisz jako preferencję</DialogTitle>
          <DialogDescription>
            Zapisz bieżące ustawienia jako szablon, aby móc je szybko załadować w przyszłości.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="preference-name">
                Nazwa szablonu <span className="text-destructive">*</span>
              </Label>
              <Input
                id="preference-name"
                placeholder="np. Wakacje rodzinne"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isSaving}
                maxLength={256}
              />
              <div className="flex items-center justify-between">
                {error ? (
                  <p className="text-sm text-destructive">{error}</p>
                ) : (
                  <p className="text-sm text-muted-foreground">Max 256 znaków</p>
                )}
                <p className={`text-xs ${name.length > 256 ? "text-destructive" : "text-muted-foreground"}`}>
                  {name.length}/256
                </p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
              Anuluj
            </Button>
            <Button type="submit" disabled={isSaving || !name.trim()} className="gap-2">
              {isSaving ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Zapisywanie...
                </>
              ) : (
                "Zapisz"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
