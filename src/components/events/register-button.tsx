"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Check, Clock, Loader2, LogIn } from "lucide-react";
import {
  cancelRegistrationAction,
  registerAction,
  type RegistrationActionResult,
} from "@/app/(site)/events/actions";

type RegistrationStatus = "confirmed" | "waitlisted" | "cancelled";

type Props = {
  eventId: string;
  slug: string;
  /** The caller's own registration, or null when signed out or never registered. */
  initialStatus: RegistrationStatus | null;
  signedIn: boolean;
  /** capacity is set and confirmed registrations have reached it. */
  isFull: boolean;
};

export function RegisterButton({
  eventId,
  slug,
  initialStatus,
  signedIn,
  isFull,
}: Props) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  /**
   * The action revalidates and the server re-renders with fresh props, but that
   * round trip leaves a visible gap. Holding the status the server just settled
   * on closes it without lying — this is the server's own answer, not a guess.
   * Wrapped in an object so "cancelled back to nothing" is representable.
   */
  const [settled, setSettled] = useState<{
    status: RegistrationStatus | null;
  } | null>(null);

  const status = settled ? settled.status : initialStatus;
  // A cancelled row is a tombstone, not a live registration.
  const active = status === "confirmed" || status === "waitlisted";

  function run(
    action: () => Promise<RegistrationActionResult>,
    intent: "register" | "cancel",
  ) {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (!result.ok) {
        setError(result.error);
        return;
      }
      if (intent === "cancel") {
        setSettled({ status: null });
        return;
      }
      // Only trust an explicit status here. Anything else leaves the current
      // view alone and lets the revalidated server render settle it, rather
      // than flashing "Register" at someone who just got a seat.
      if (result.status === "confirmed" || result.status === "waitlisted") {
        setSettled({ status: result.status });
      }
    });
  }

  if (!signedIn) {
    return (
      <div className="flex flex-col gap-3">
        <Link
          href={`/login?next=${encodeURIComponent(`/events/${slug}`)}`}
          className="btn-stylized w-fit gap-2"
        >
          <LogIn className="size-4" />
          Sign in to register
        </Link>
        <p className="text-sm text-muted-foreground">
          A SPARK account keeps your seat, your check-in, and your certificate in
          one place.
        </p>
      </div>
    );
  }

  if (active) {
    const confirmed = status === "confirmed";
    return (
      <div className="flex flex-col gap-3">
        <div className="flex w-fit items-center gap-3 rounded-2xl border border-border bg-card px-5 py-4">
          <span className="text-primary">
            {confirmed ? (
              <Check className="size-5" />
            ) : (
              <Clock className="size-5" />
            )}
          </span>
          <div>
            <p className="font-medium text-foreground">
              {confirmed ? "You're registered" : "You're on the waitlist"}
            </p>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {confirmed
                ? "Bring your student ID — we check in at the door."
                : "Your place in the queue is held. If a seat frees up, the next person on the list is moved up automatically and you'll be notified."}
            </p>
          </div>
        </div>

        <button
          type="button"
          disabled={pending}
          onClick={() =>
            run(() => cancelRegistrationAction(eventId, slug), "cancel")
          }
          className="w-fit text-sm text-muted-foreground underline underline-offset-4 transition-colors hover:text-destructive disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 className="size-3.5 animate-spin" />
              Working…
            </span>
          ) : confirmed ? (
            "Cancel registration"
          ) : (
            "Leave the waitlist"
          )}
        </button>

        {error && (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        disabled={pending}
        onClick={() => run(() => registerAction(eventId, slug), "register")}
        className={
          isFull
            ? "inline-flex w-fit items-center justify-center gap-2 rounded-3xl border-2 border-dashed border-border bg-card px-8 py-3 font-medium text-foreground transition-colors hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
            : "btn-stylized w-fit gap-2 disabled:cursor-not-allowed disabled:opacity-50"
        }
      >
        {pending && <Loader2 className="size-4 animate-spin" />}
        {isFull ? "Join waitlist" : "Register"}
      </button>

      {isFull && (
        <p className="max-w-prose text-sm text-muted-foreground">
          Every seat is taken. Joining the waitlist puts you next in line — we
          promote automatically when someone cancels.
        </p>
      )}

      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
