"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Check, Search, UserMinus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  cancelRegistrationAction,
  checkInAction,
} from "@/app/(site)/admin/events/actions";

export type AttendeeStatus = "confirmed" | "waitlisted" | "cancelled";

/**
 * A row as the door sees it. Timestamps arrive pre-formatted from the server:
 * rendering a Date here would print the operator's own zone and, worse, would
 * differ between the server pass and hydration.
 */
export type AttendeeView = {
  registrationId: string;
  userId: string;
  name: string;
  university: string | null;
  status: AttendeeStatus;
  registeredAt: string;
  checkedInAt: string | null;
};

const STATUS_VARIANT: Record<
  AttendeeStatus,
  "default" | "secondary" | "outline" | "destructive"
> = {
  confirmed: "default",
  waitlisted: "secondary",
  cancelled: "destructive",
};

const STATUS_LABEL: Record<AttendeeStatus, string> = {
  confirmed: "Confirmed",
  waitlisted: "Waitlisted",
  cancelled: "Cancelled",
};

function Tally({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-border bg-card/60 px-4 py-3">
      <p className="eyebrow">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
    </div>
  );
}

export function AttendeeTable({
  eventId,
  attendees,
}: {
  eventId: string;
  attendees: AttendeeView[];
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [cancelTarget, setCancelTarget] = useState<AttendeeView | null>(null);

  // Local overlays keep the row correct the instant the action returns, before
  // the router refresh lands. Server data still wins once it arrives, because
  // an overlay only ever fills in what the server has not reported yet.
  const [justCheckedIn, setJustCheckedIn] = useState<Record<string, string>>({});
  const [justCancelled, setJustCancelled] = useState<string[]>([]);

  const rows: AttendeeView[] = attendees.map((row) => ({
    ...row,
    status: justCancelled.includes(row.registrationId) ? "cancelled" : row.status,
    checkedInAt: row.checkedInAt ?? justCheckedIn[row.registrationId] ?? null,
  }));

  const confirmed = rows.filter((r) => r.status === "confirmed").length;
  const waitlisted = rows.filter((r) => r.status === "waitlisted").length;
  const checkedIn = rows.filter((r) => r.checkedInAt !== null).length;

  const needle = query.trim().toLowerCase();
  const visible = needle
    ? rows.filter((r) => r.name.toLowerCase().includes(needle))
    : rows;

  function onCheckIn(row: AttendeeView) {
    setError(null);
    setBusyId(row.registrationId);
    startTransition(async () => {
      const result = await checkInAction(eventId, row.registrationId);
      setBusyId(null);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setJustCheckedIn((prev) => ({
        ...prev,
        [row.registrationId]: result.data.checkedInAt,
      }));
      router.refresh();
    });
  }

  function onConfirmCancel() {
    const target = cancelTarget;
    if (!target) return;
    setError(null);
    setBusyId(target.registrationId);
    startTransition(async () => {
      const result = await cancelRegistrationAction(eventId, target.userId);
      setBusyId(null);
      setCancelTarget(null);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setJustCancelled((prev) => [...prev, target.registrationId]);
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-3 sm:max-w-md">
        <Tally label="Confirmed" value={confirmed} />
        <Tally label="Waitlist" value={waitlisted} />
        <Tally label="Checked in" value={checkedIn} />
      </div>

      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name…"
          aria-label="Search attendees by name"
          className="h-10 pl-8"
          autoComplete="off"
        />
      </div>

      {error && (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <span>{error}</span>
        </p>
      )}

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-12 text-center">
          <p className="text-muted-foreground">
            Nobody has registered for this event yet.
          </p>
        </div>
      ) : visible.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-12 text-center">
          <p className="text-muted-foreground">
            No attendee matches{" "}
            <span className="text-foreground">“{query.trim()}”</span>.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border bg-card/60 backdrop-blur-xl">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>University</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Registered</TableHead>
                <TableHead>Check-in</TableHead>
                <TableHead className="text-right">Manage</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visible.map((row) => {
                const isCheckedIn = row.checkedInAt !== null;
                const canCheckIn = row.status === "confirmed" && !isCheckedIn;
                const busy = pending && busyId === row.registrationId;

                return (
                  <TableRow key={row.registrationId}>
                    <TableCell className="font-medium text-foreground">
                      {row.name}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {row.university ?? "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={STATUS_VARIANT[row.status]}>
                        {STATUS_LABEL[row.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground tabular-nums">
                      {row.registeredAt}
                    </TableCell>
                    <TableCell>
                      {isCheckedIn ? (
                        // Done is a statement, not a button — re-clicking an
                        // arrival is never a thing the door needs to do.
                        <span className="inline-flex items-center gap-1.5 text-sm text-primary">
                          <Check className="size-4" />
                          <span className="tabular-nums">{row.checkedInAt}</span>
                        </span>
                      ) : canCheckIn ? (
                        <Button
                          type="button"
                          size="lg"
                          onClick={() => onCheckIn(row)}
                          disabled={busy}
                        >
                          {busy ? "Checking in…" : "Check in"}
                        </Button>
                      ) : (
                        // Waitlisted and cancelled rows get no control at all:
                        // attendance is what earns a certificate, so someone
                        // who never had a seat must not be markable as present.
                        <span className="text-sm text-muted-foreground">
                          {row.status === "waitlisted"
                            ? "Not seated"
                            : "Not attending"}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {row.status === "cancelled" ? (
                        <span className="text-sm text-muted-foreground">—</span>
                      ) : (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setError(null);
                            setCancelTarget(row);
                          }}
                          disabled={busy}
                        >
                          <UserMinus className="size-3.5" />
                          Cancel
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog
        open={cancelTarget !== null}
        onOpenChange={(open) => {
          if (!open) setCancelTarget(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel this registration?</DialogTitle>
            <DialogDescription>
              {cancelTarget?.name ?? "This attendee"} loses their place at this
              event. If they held a confirmed seat and the event has a capacity,
              the longest-waiting person on the waitlist is promoted into it
              automatically. They can register again themselves while
              registration is open.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setCancelTarget(null)}
              disabled={pending}
            >
              Keep registration
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={onConfirmCancel}
              disabled={pending}
            >
              {pending ? "Cancelling…" : "Cancel registration"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
