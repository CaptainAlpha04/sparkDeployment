import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, CalendarDays, MapPin } from "lucide-react";
import {
  listPastEvents,
  listUpcomingEvents,
  type EventWithCounts,
} from "@/server/events";
import { GeometricHero } from "@/components/site/geometric-hero";
import { Reveal, Stagger } from "@/components/motion/reveal";
import { SparkBullet } from "@/components/brand/spark-mark";

export const metadata: Metadata = {
  title: "Upcoming Events | SPARK",
  description:
    "Workshops, competitions, and gatherings from the SPARK community — with live seat counts and registration.",
};

/* ── Dates ─────────────────────────────────────────────────────────────────
 * SPARK runs out of Islamabad. Rendering a Date directly would format against
 * the server's zone (UTC in production), which silently shifts an 8 pm event
 * into the previous afternoon. Everything below is pinned to Asia/Karachi.
 */
const ZONE = "Asia/Karachi";

const dayFormat = new Intl.DateTimeFormat("en-GB", {
  timeZone: ZONE,
  weekday: "short",
  day: "numeric",
  month: "short",
  year: "numeric",
});

const timeFormat = new Intl.DateTimeFormat("en-GB", {
  timeZone: ZONE,
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
});

function formatWhen(startsAt: Date, endsAt: Date) {
  const startDay = dayFormat.format(startsAt);
  const endDay = dayFormat.format(endsAt);

  // Same calendar day *in Karachi*, which is the only comparison that matters.
  if (startDay === endDay) {
    return `${startDay} · ${timeFormat.format(startsAt)} – ${timeFormat.format(endsAt)}`;
  }
  return `${startDay} – ${endDay}`;
}

/* ── Capacity ──────────────────────────────────────────────────────────── */

function isFull(event: EventWithCounts) {
  return event.capacity !== null && event.confirmedCount >= event.capacity;
}

/**
 * Honest by construction: it reports the real confirmed count against the real
 * cap, says "Open" when there is no cap rather than inventing one, and flips to
 * "Waitlist only" the moment the seats are gone.
 */
function CapacityMeter({ event }: { event: EventWithCounts }) {
  if (event.capacity === null) {
    return (
      <p className="eyebrow flex items-center gap-2 text-primary">
        <SparkBullet className="size-3" />
        Open — no seat limit
      </p>
    );
  }

  if (isFull(event)) {
    return (
      <div className="space-y-2">
        <p className="eyebrow text-foreground">Waitlist only</p>
        <div className="h-1 w-full overflow-hidden rounded-full bg-border">
          <div className="h-full w-full bg-primary" />
        </div>
        <p className="text-xs text-muted-foreground">
          {event.capacity} of {event.capacity} spots taken
          {event.waitlistedCount > 0 &&
            ` · ${event.waitlistedCount} waiting`}
        </p>
      </div>
    );
  }

  const pct = Math.round((event.confirmedCount / event.capacity) * 100);

  return (
    <div className="space-y-2">
      <p className="eyebrow text-muted-foreground">
        {event.confirmedCount} of {event.capacity} spots taken
      </p>
      <div className="h-1 w-full overflow-hidden rounded-full bg-border">
        <div
          className="h-full rounded-full bg-primary transition-[width] duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

/* ── Cover art ─────────────────────────────────────────────────────────── */

/**
 * Cover images live in Supabase storage, an origin the image optimiser is not
 * failing the request — and a null URL never renders a broken <img> at all, it
 * falls back to the mark on the same gradient the hero uses.
 */
function Cover({ event }: { event: EventWithCounts }) {
  if (!event.coverImageUrl) {
    return (
      <div
        className="flex aspect-[16/9] w-full items-center justify-center bg-gradient-to-br from-purple-950 via-background to-blue-950"
        aria-hidden
      >
        <SparkBullet className="size-10 text-primary/40" />
      </div>
    );
  }

  return (
    <Image
      src={event.coverImageUrl}
      alt=""
      width={640}
      height={360}
      className="aspect-[16/9] w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105 motion-reduce:transform-none"
    />
  );
}

/* ── Cards ─────────────────────────────────────────────────────────────── */

function UpcomingCard({ event }: { event: EventWithCounts }) {
  return (
    <Link
      href={`/events/${event.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card transition-colors duration-500 hover:border-primary/50"
    >
      <div className="overflow-hidden">
        <Cover event={event} />
      </div>

      <div className="flex flex-1 flex-col gap-4 p-6">
        <div className="space-y-2">
          <h3 className="text-xl font-semibold text-foreground">
            {event.title}
          </h3>
          {event.summary && (
            <p className="line-clamp-2 text-sm text-muted-foreground">
              {event.summary}
            </p>
          )}
        </div>

        <div className="space-y-2 text-sm text-muted-foreground">
          <p className="flex items-start gap-2">
            <CalendarDays className="mt-0.5 size-4 shrink-0" />
            <span>{formatWhen(event.startsAt, event.endsAt)}</span>
          </p>
          {event.venueName && (
            <p className="flex items-start gap-2">
              <MapPin className="mt-0.5 size-4 shrink-0" />
              <span>{event.venueName}</span>
            </p>
          )}
        </div>

        <div className="mt-auto pt-2">
          <CapacityMeter event={event} />
        </div>
      </div>
    </Link>
  );
}

function PastRow({ event }: { event: EventWithCounts }) {
  // Attendance is only claimed where the door actually scanned people in.
  const attendance =
    event.checkedInCount > 0
      ? `${event.checkedInCount} attended`
      : event.confirmedCount > 0
        ? `${event.confirmedCount} registered`
        : null;

  return (
    <Link
      href={`/events/${event.slug}`}
      className="group flex flex-col gap-1 border-b border-border py-4 transition-colors hover:border-primary/50 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6"
    >
      <span className="font-medium text-foreground transition-colors group-hover:text-primary">
        {event.title}
      </span>
      <span className="flex items-center gap-3 text-sm text-muted-foreground">
        <span>{dayFormat.format(event.startsAt)}</span>
        {attendance && (
          <span className="eyebrow text-muted-foreground">{attendance}</span>
        )}
        <ArrowUpRight className="size-4 opacity-0 transition-opacity group-hover:opacity-100" />
      </span>
    </Link>
  );
}

/* ── Page ──────────────────────────────────────────────────────────────── */

export default async function EventsPage() {
  const [upcoming, past] = await Promise.all([
    listUpcomingEvents(),
    listPastEvents(),
  ]);

  return (
    <div className="flex min-h-screen w-full flex-col bg-background text-foreground">
      <GeometricHero
        title="Upcoming Events"
        subtitle="Workshops, competitions, and the gatherings where SPARK actually happens."
      />

      <main className="mx-auto w-full max-w-6xl px-6 py-20">
        {upcoming.length > 0 ? (
          <Stagger
            as="section"
            step={80}
            className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3"
          >
            {upcoming.map((event) => (
              <UpcomingCard key={event.id} event={event} />
            ))}
          </Stagger>
        ) : (
          <Reveal as="section" className="mx-auto max-w-xl text-center">
            <SparkBullet className="mx-auto size-8 text-primary" />
            <h2 className="mt-6 text-3xl font-semibold text-foreground">
              Nothing on the calendar right now
            </h2>
            <p className="mt-4 text-muted-foreground">
              We schedule in bursts — a quiet week here usually means something
              is being put together. New events are announced on our channels
              first, so follow along and you&apos;ll hear before this page
              updates.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <a
                href="https://www.instagram.com/sparkchapter?igsh=dzZzMG01NjAxbmNi"
                target="_blank"
                rel="noreferrer noopener"
                className="btn-stylized"
              >
                Follow on Instagram
              </a>
              <a
                href="https://www.linkedin.com/company/sparkchapter/"
                target="_blank"
                rel="noreferrer noopener"
                className="text-sm text-muted-foreground underline underline-offset-4 transition-colors hover:text-foreground"
              >
                Or connect on LinkedIn
              </a>
            </div>
          </Reveal>
        )}

        {past.length > 0 && (
          <Reveal as="section" delay={120} className="mt-24">
            <h2 className="eyebrow mb-6">Past events</h2>
            <div className="border-t border-border">
              {past.map((event) => (
                <PastRow key={event.id} event={event} />
              ))}
            </div>
          </Reveal>
        )}
      </main>
    </div>
  );
}
