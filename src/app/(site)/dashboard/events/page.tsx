import Link from "next/link";
import { CalendarDays, CircleCheck, CircleSlash, MapPin } from "lucide-react";
import { getMyRegistrations } from "@/server/events";
import { Reveal, Stagger } from "@/components/motion/reveal";
import { Badge } from "@/components/ui/badge";
import { CancelRegistrationDialog } from "@/components/dashboard/cancel-registration-dialog";

export const metadata = {
  title: "My events · SPARK",
};

const DATE_TIME = new Intl.DateTimeFormat("en-GB", {
  weekday: "short",
  day: "numeric",
  month: "long",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Asia/Karachi",
});

type Row = Awaited<ReturnType<typeof getMyRegistrations>>[number];

const STATUS_LABEL = {
  confirmed: "Confirmed",
  waitlisted: "Waitlisted",
  cancelled: "Cancelled",
} as const;

const STATUS_VARIANT = {
  confirmed: "default",
  waitlisted: "secondary",
  cancelled: "destructive",
} as const;

/**
 * Splits registrations into what is still ahead and what has happened.
 *
 * Reading the clock is impure, so it happens here rather than in the component
 * body — `react-hooks/purity` rejects `Date.now()` during render. This mirrors
 * the helper on the public event page. `getMyRegistrations` sorts newest-first,
 * which is right for history and backwards for what is coming, so the upcoming
 * half is re-sorted ascending.
 */
async function splitByTime(
  rows: Row[],
): Promise<{ upcoming: Row[]; past: Row[] }> {
  const now = Date.now();
  return {
    upcoming: rows
      .filter((row) => row.event.endsAt.getTime() >= now)
      .sort((a, b) => a.event.startsAt.getTime() - b.event.startsAt.getTime()),
    past: rows.filter((row) => row.event.endsAt.getTime() < now),
  };
}

function RegistrationRow({ row, past }: { row: Row; past: boolean }) {
  const { registration, event, attended } = row;
  const status = registration.status;
  const cancellable = !past && (status === "confirmed" || status === "waitlisted");

  return (
    <article className="rounded-2xl border border-border bg-card/50 p-5 transition-colors duration-300 hover:border-primary/40">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <Link
            href={`/events/${event.slug}`}
            className="text-lg font-semibold transition-colors hover:text-primary"
          >
            {event.title}
          </Link>
          <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="size-4 shrink-0" />
              {DATE_TIME.format(event.startsAt)} PKT
            </span>
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="size-4 shrink-0" />
              {event.venueName ?? "Venue to be announced"}
            </span>
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <Badge variant={STATUS_VARIANT[status]}>{STATUS_LABEL[status]}</Badge>
          {cancellable && (
            <CancelRegistrationDialog
              eventId={event.id}
              eventTitle={event.title}
              waitlisted={status === "waitlisted"}
            />
          )}
        </div>
      </div>

      {/* A bare "waitlisted" badge reads like a rejection. It is a queue. */}
      {!past && status === "waitlisted" && (
        <p className="mt-4 border-t border-border pt-3 text-sm text-muted-foreground">
          The room is full for now. If a confirmed place frees up, the
          longest-waiting person is promoted automatically — nothing for you to
          do but keep the date free.
        </p>
      )}

      {past && status !== "cancelled" && (
        <p className="mt-4 flex items-center gap-2 border-t border-border pt-3 text-sm">
          {attended ? (
            <>
              <CircleCheck className="size-4 shrink-0 text-primary" />
              <span className="text-muted-foreground">
                You attended — checked in at the door.
              </span>
            </>
          ) : (
            <>
              <CircleSlash className="size-4 shrink-0 text-muted-foreground" />
              <span className="text-muted-foreground">
                No check-in recorded, so this one does not count toward
                certificates.
              </span>
            </>
          )}
        </p>
      )}
    </article>
  );
}

export default async function MyEventsPage() {
  const registrations = await getMyRegistrations();
  const { upcoming, past } = await splitByTime(registrations);

  return (
    <div>
      <Reveal>
        <p className="eyebrow mb-2">Your events</p>
        <h1 className="mb-2 text-4xl font-bold">Registrations</h1>
        <p className="mb-8 max-w-xl text-muted-foreground">
          Everything you have signed up for, and everything you have been to.
          Attendance here is what earns a certificate.
        </p>
      </Reveal>

      <section className="mb-12">
        <h2 className="mb-4 text-2xl font-semibold">Upcoming</h2>
        {upcoming.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-10 text-center">
            <p className="text-muted-foreground">
              Nothing coming up. Take a look at{" "}
              <Link href="/events" className="text-primary hover:underline">
                what SPARK is running next
              </Link>
              .
            </p>
          </div>
        ) : (
          <Stagger step={80} className="flex flex-col gap-4">
            {upcoming.map((row) => (
              <RegistrationRow
                key={row.registration.id}
                row={row}
                past={false}
              />
            ))}
          </Stagger>
        )}
      </section>

      <section>
        <h2 className="mb-4 text-2xl font-semibold">Past</h2>
        {past.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-10 text-center">
            <p className="text-muted-foreground">
              No history yet — your first SPARK event will show up here
              afterwards.
            </p>
          </div>
        ) : (
          <Stagger step={80} className="flex flex-col gap-4">
            {past.map((row) => (
              <RegistrationRow key={row.registration.id} row={row} past />
            ))}
          </Stagger>
        )}
      </section>
    </div>
  );
}
