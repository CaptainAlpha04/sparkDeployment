"use client";

import { useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type Result = { ok: true } | { ok: false; error: string };

type Props = {
  /** What is being deleted, shown in the heading. */
  label: string;
  /** Exact text the admin must type to enable the button. */
  confirmText: string;
  /** Loaded when the dialog opens, so the warning reflects current data. */
  loadImpact?: () => Promise<{ ok: true; data: ReactNode } | { ok: false; error: string }>;
  onDelete: () => Promise<Result>;
  /** Where to go afterwards. Stays put if omitted. */
  redirectTo?: string;
  buttonLabel?: string;
  className?: string;
};

/**
 * Destructive delete behind a typed confirmation.
 *
 * Deletion here removes real records that people are attached to, so a single
 * click is too cheap. Typing the name is a deliberate speed bump, and the
 * dialog states what will actually be destroyed rather than asking "are you
 * sure?" about something unspecified.
 */
export function DeleteButton({
  label,
  confirmText,
  loadImpact,
  onDelete,
  redirectTo,
  buttonLabel = "Delete",
  className = "",
}: Props) {
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const [impact, setImpact] = useState<ReactNode>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, startLoading] = useTransition();
  const [deleting, startDeleting] = useTransition();
  const router = useRouter();

  function onOpenChange(next: boolean) {
    setOpen(next);
    setTyped("");
    setError(null);
    setImpact(null);

    if (next && loadImpact) {
      startLoading(async () => {
        const result = await loadImpact();
        if (result.ok) setImpact(result.data);
        else setError(result.error);
      });
    }
  }

  function confirm() {
    setError(null);
    startDeleting(async () => {
      const result = await onDelete();
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setOpen(false);
      if (redirectTo) router.push(redirectTo);
      else router.refresh();
    });
  }

  const matches = typed.trim() === confirmText;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={`gap-2 border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive ${className}`}
        >
          <Trash2 className="size-4" />
          {buttonLabel}
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="size-5 text-destructive" />
            Delete {label}?
          </DialogTitle>
          <DialogDescription>
            This cannot be undone.
          </DialogDescription>
        </DialogHeader>

        {loading && (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Checking what this would affect…
          </p>
        )}

        {impact && !loading && (
          <div className="rounded-xl border border-border bg-white/5 p-4 text-sm">
            {impact}
          </div>
        )}

        {error && (
          <p className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm">
            {error}
          </p>
        )}

        <div>
          <label
            htmlFor="delete-confirm"
            className="text-sm text-muted-foreground"
          >
            Type <span className="font-mono text-foreground">{confirmText}</span>{" "}
            to confirm.
          </label>
          <Input
            id="delete-confirm"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            autoComplete="off"
            className="mt-2"
          />
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={deleting}
          >
            Keep it
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={confirm}
            disabled={!matches || deleting}
            className="gap-2"
          >
            {deleting && <Loader2 className="size-4 animate-spin" />}
            Delete permanently
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
