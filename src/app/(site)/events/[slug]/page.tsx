import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, MapPin, TriangleAlert, Users } from "lucide-react";
import { getPublishedEventBySlug, type EventWithCounts } from "@/server/events";
import { getMyRegistration } from "@/server/registrations";
import { getCurrentProfile } from "@/server/auth";
import { Reveal } from "@/components/motion/reveal";
import { SparkBullet } from "@/components/brand/spark-mark";
import { RegisterButton } from "@/components/events/register-button";

/* ── Dates ─────────────────────────────────────────────────────────────────
 * Pinned to Asia/Karachi for the same reason as the listing: the production
 * server runs in UTC and would otherwise shift evening events onto the wrong
 * day for every reader.
 */
const ZONE = "Asia/Karachi";

const dayFormat = new Intl.DateTimeFormat("en-GB", {
  timeZone: ZONE,
  weekday: "long",
  day: "numeric",
  month: "long",
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

  if (startDay === endDay) {
    return `${startDay}, ${timeFormat.format(startsAt)} – ${timeFormat.format(endsAt)}`;
  }
  return `${startDay}, ${timeFormat.format(startsAt)} until ${endDay}, ${timeFormat.format(endsAt)}`;
}

/** Description is stored as loose markdown-ish text; blank lines are the only
 *  structure we honour. Rendering it as paragraphs beats pulling in a parser
 *  for text the committee writes by hand. */
function paragraphs(text: string) {
  return text
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean);
}

function isFull(event: EventWithCounts) {
  return event.capacity !== null && event.confirmedCount >= event.capacity;
}

/**
 * Reading the clock is impure, so it happens here rather than inline in the
 * component body — `react-hooks/purity` rejects `Date.now()` during render.
 * This is a server component rendered per request, so a single read is the
 * correct semantics anyway.
 */
async function hasEnded(endsAt: Date): Promise<boolean> {
  return endsAt.getTime() < Date.now();
}

export async function generateMetadata({
  params,
}: PageProps<"/events/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const event = await getPublishedEventBySlug(slug);

  if (!event) return { title: "Event not found | SPARK" };

  return {
    title: `${event.title} | SPARK`,
    description: event.summary ?? undefined,
  };
}

export default async function EventDetailPage({
  params,
}: PageProps<"/events/[slug]">) {
  const { slug } = await params;
  const event = await getPublishedEventBySlug(slug);
  if (!event) notFound();

  // getMyRegistration requires a session and throws without one, so the
  // signed-out path must never reach it.
  const profile = await getCurrentProfile();
  const registration = profile ? await getMyRegistration(event.id) : null;

  const cancelled = event.status === "cancelled";
  const ended = await hasEnded(event.endsAt);
  const full = isFull(event);
  const body = event.description ? paragraphs(event.description) : [];

  return (
    <div className="flex min-h-screen w-full flex-col bg-background text-foreground">
      <main className="mx-auto w-full max-w-5xl px-6 pt-28 pb-20">
        <Link
          href="/events"
          className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> All events
        </Link>

        {cancelled && (
          <div
            role="alert"
            className="mb-8 flex items-start gap-3 rounded-2xl border border-destructive/40 bg-destructive/10 p-5"
          >
            <TriangleAlert className="mt-0.5 size-5 shrink-0 text-destructive" />
            <div>
              <p className="font-semibold text-destructive">
                This event has been cancelled
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Registration is closed and no one is expected at the venue. If
                you had a place, you do not need to do anything.
              </p>
            </div>
          </div>
        )}

        <Reveal>
          {event.coverImageUrl ? (
            <Image
              src={event.coverImageUrl}
              alt=""
              width={1280}
              height={720}
              priority
              className="aspect-[16/9] w-full rounded-2xl border border-border object-cover"
            />
          ) : (
            <div
              className="flex aspect-[21/9] w-full items-center justify-center rounded-2xl border border-border bg-gradient-to-br from-purple-950 via-background to-blue-950"
              aria-hidden
            >
              <SparkBullet className="size-12 text-primary/40" />
            </div>
          )}
        </Reveal>

        <Reveal delay={80} as="header" className="mt-10">
          <h1 className="text-4xl font-bold text-foreground md:text-5xl">
            {event.title}
          </h1>
          {event.summary && (
            <p className="mt-4 max-w-prose text-lg font-light text-muted-foreground">
              {event.summary}
            </p>
          )}
        </Reveal>

        <div className="mt-12 grid gap-12 lg:grid-cols-[1fr_20rem]">
          <Reveal delay={140} as="article" className="space-y-5">
            {body.length > 0 ? (
              body.map((block, i) => (
                <p
                  key={i}
                  className="max-w-prose leading-relaxed whitespace-pre-line text-muted-foreground"
                >
                  {block}
                </p>
              ))
            ) : (
              <p className="text-muted-foreground">
                Full details for this event are still being written up.
              </p>
            )}
          </Reveal>

          <Reveal delay={200} as="aside" className="space-y-8">
            <div className="space-y-6 rounded-2xl border border-border bg-card p-6">
              <div>
                <p className="eyebrow mb-2">When</p>
                <p className="flex items-start gap-2 text-sm text-foreground">
                  <CalendarDays className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                  <span>{formatWhen(event.startsAt, event.endsAt)}</span>
                </p>
              </div>

              {(event.venueName || event.venueAddress) && (
                <div>
                  <p className="eyebrow mb-2">Where</p>
                  <p className="flex items-start gap-2 text-sm text-foreground">
                    <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                    <span>
                      {event.venueName}
                      {event.venueAddress && (
                        <span className="mt-0.5 block text-muted-foreground">
                          {event.venueAddress}
                        </span>
                      )}
                    </span>
                  </p>
                </div>
              )}

              <div>
                <p className="eyebrow mb-2">Capacity</p>
                <p className="flex items-start gap-2 text-sm text-foreground">
                  <Users className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                  <span>
                    {event.capacity === null ? (
                      "Open — no seat limit"
                    ) : (
                      <>
                        {Math.min(event.confirmedCount, event.capacity)} of{" "}
                        {event.capacity} spots taken
                        {full && (
                          <span className="mt-0.5 block text-muted-foreground">
                            Waitlist only
                            {event.waitlistedCount > 0 &&
                              ` · ${event.waitlistedCount} waiting`}
                          </span>
                        )}
                      </>
                    )}
                  </span>
                </p>
              </div>

              {ended && event.checkedInCount > 0 && (
                <div>
                  <p className="eyebrow mb-2">Attendance</p>
                  <p className="text-sm text-foreground">
                    {event.checkedInCount} checked in on the day
                  </p>
                </div>
              )}
            </div>

            {!cancelled &&
              (ended ? (
                <div className="rounded-2xl border border-border bg-card p-6">
                  <p className="font-medium text-foreground">
                    This event has ended
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Registration closed when the doors did. Keep an eye on{" "}
                    <Link
                      href="/events"
                      className="text-primary underline underline-offset-4"
                    >
                      upcoming events
                    </Link>{" "}
                    for the next one.
                  </p>
                </div>
              ) : (
                <RegisterButton
                  eventId={event.id}
                  slug={event.slug}
                  initialStatus={registration?.status ?? null}
                  signedIn={profile !== null}
                  isFull={full}
                />
              ))}
          </Reveal>
        </div>
      </main>
    </div>
  );
}
