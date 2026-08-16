"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cancelRegistrationAction } from "@/app/(site)/dashboard/actions";

type Props = {
  eventId: string;
  eventTitle: string;
  /** Waitlisted members lose their queue position, which is worth spelling out. */
  waitlisted: boolean;
};

/**
 * Confirm-then-cancel for a registration.
 *
 * Cancelling frees a seat and immediately promotes whoever is at the front of
 * the waitlist, so it is not silently undoable — hence the confirmation step
 * rather than a bare button.
 */
export function CancelRegistrationDialog({
  eventId,
  eventTitle,
  waitlisted,
}: Props) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function confirm() {
    setError(null);
    startTransition(async () => {
      const result = await cancelRegistrationAction(eventId);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setOpen(false);
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setError(null);
      }}
    >
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="sm">
          Cancel
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cancel your registration?</DialogTitle>
          <DialogDescription>
            {waitlisted ? (
              <>
                You will leave the waitlist for{" "}
                <span className="text-foreground">{eventTitle}</span> and lose
                your place in the queue. Re-registering later puts you at the
                back.
              </>
            ) : (
              <>
                Your seat at{" "}
                <span className="text-foreground">{eventTitle}</span> will be
                released to the next person on the waitlist straight away, so
                it may not be available if you change your mind.
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            onClick={() => setOpen(false)}
            disabled={pending}
          >
            Keep my place
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={confirm}
            disabled={pending}
          >
            {pending ? "Cancelling…" : "Yes, cancel"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
