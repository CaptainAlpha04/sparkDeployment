import Link from "next/link";
import { Award, CalendarDays, MapPin, Ticket } from "lucide-react";
import { getMemberOverview, getMyRegistrations } from "@/server/events";
import { Reveal, Stagger } from "@/components/motion/reveal";
import { CountUp } from "@/components/motion/count-up";
import { SparkBullet } from "@/components/brand/spark-mark";
import { Badge } from "@/components/ui/badge";

export const metadata = {
  title: "Dashboard · SPARK",
};

const DATE_TIME = new Intl.DateTimeFormat("en-GB", {
  weekday: "short",
  day: "numeric",
  month: "long",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Asia/Karachi",
});

/** "Ayesha Khan" → "Ayesha". Falls back to a neutral greeting. */
function firstName(fullName: string | null): string {
  const first = (fullName ?? "").trim().split(/\s+/)[0];
  return first || "there";
}

type Row = Awaited<ReturnType<typeof getMyRegistrations>>[number];

/**
 * The soonest event the member still holds a live place at.
 *
 * Reading the clock is impure, so it happens here rather than in the component
 * body — `react-hooks/purity` rejects `Date.now()` during render. This mirrors
 * the helper on the public event page. `getMyRegistrations` sorts newest-first,
 * which is backwards for "what is next", hence the re-sort.
 */
async function pickNextUp(rows: Row[]): Promise<Row | undefined> {
  const now = Date.now();
  return rows
    .filter(
      (row) =>
        row.registration.status !== "cancelled" &&
        row.event.endsAt.getTime() >= now,
    )
    .sort((a, b) => a.event.startsAt.getTime() - b.event.startsAt.getTime())[0];
}

const QUICK_LINKS = [
  {
    href: "/dashboard/events",
    icon: Ticket,
    title: "My registrations",
    body: "Check your seat, see what is past, or cancel if plans change.",
  },
  {
    href: "/dashboard/certificates",
    icon: Award,
    title: "Certificates",
    body: "Everything you have earned by attending, with a verifiable code.",
  },
  {
    href: "/events",
    icon: CalendarDays,
    title: "Browse events",
    body: "What SPARK is running next, and what is still open.",
  },
];

export default async function DashboardPage() {
  const [{ profile, upcomingCount, attendedCount }, registrations] =
    await Promise.all([getMemberOverview(), getMyRegistrations()]);

  const nextUp = await pickNextUp(registrations);
  const hasHistory = registrations.length > 0;

  return (
    <div>
      <Reveal>
        <p className="eyebrow mb-2">Your dashboard</p>
        <h1 className="mb-2 text-4xl font-bold">
          Hello, {firstName(profile.fullName)}
        </h1>
        <p className="mb-8 max-w-xl text-muted-foreground">
          Your seat at everything SPARK is running, and the record of what you
          have already been part of.
        </p>
      </Reveal>

      <Stagger step={90} className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card/50 p-6">
          <CountUp
            value={String(upcomingCount)}
            className="block text-3xl font-bold tabular-nums text-primary"
          />
          <p className="eyebrow mt-2">Upcoming registrations</p>
        </div>
        <div className="rounded-2xl border border-border bg-card/50 p-6">
          <CountUp
            value={String(attendedCount)}
            className="block text-3xl font-bold tabular-nums text-foreground"
          />
          <p className="eyebrow mt-2">Events attended</p>
        </div>
      </Stagger>

      {!hasHistory ? (
        <Reveal delay={120}>
          <section className="mt-8 rounded-2xl border border-dashed border-border p-10 text-center">
            <SparkBullet className="mx-auto mb-4 size-6 text-primary" />
            <h2 className="text-2xl font-semibold">
              You have not registered for anything yet
            </h2>
            <p className="mx-auto mt-2 max-w-md text-muted-foreground">
              SPARK runs talks, workshops, and build sessions through the year.
              Pick one that looks interesting — a seat takes one click, and you
              can cancel any time.
            </p>
            <Link
              href="/events"
              className="mt-5 inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-80"
            >
              Browse upcoming events
            </Link>
          </section>
        </Reveal>
      ) : nextUp ? (
        <Reveal delay={120}>
          <section className="mt-8">
            <h2 className="eyebrow mb-3">Next up</h2>
            <Link
              href={`/events/${nextUp.event.slug}`}
              className="group block rounded-2xl border border-border bg-card/60 p-6 transition-colors duration-300 hover:border-primary/60"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="text-2xl font-semibold transition-colors group-hover:text-primary">
                    {nextUp.event.title}
                  </h3>
                  <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5">
                      <CalendarDays className="size-4" />
                      {DATE_TIME.format(nextUp.event.startsAt)} PKT
                    </span>
                    {nextUp.event.venueName && (
                      <span className="inline-flex items-center gap-1.5">
                        <MapPin className="size-4" />
                        {nextUp.event.venueName}
                      </span>
                    )}
                  </p>
                </div>
                <Badge
                  variant={
                    nextUp.registration.status === "confirmed"
                      ? "default"
                      : "outline"
                  }
                >
                  {nextUp.registration.status === "confirmed"
                    ? "Confirmed"
                    : "Waitlisted"}
                </Badge>
              </div>

              {nextUp.registration.status === "waitlisted" && (
                <p className="mt-4 border-t border-border pt-4 text-sm text-muted-foreground">
                  You are on the waitlist. If someone with a confirmed seat
                  cancels, the longest-waiting person is promoted
                  automatically — you do not need to do anything.
                </p>
              )}
            </Link>
          </section>
        </Reveal>
      ) : (
        <Reveal delay={120}>
          <section className="mt-8 rounded-2xl border border-dashed border-border p-8 text-center">
            <p className="text-muted-foreground">
              Nothing on your calendar right now. Your{" "}
              <Link
                href="/dashboard/events"
                className="text-primary hover:underline"
              >
                past events
              </Link>{" "}
              are still here, and{" "}
              <Link href="/events" className="text-primary hover:underline">
                new ones
              </Link>{" "}
              open regularly.
            </p>
          </section>
        </Reveal>
      )}

      <Stagger step={80} className="mt-10 grid gap-4 sm:grid-cols-3">
        {QUICK_LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="group h-full rounded-2xl border border-border bg-card/40 p-5 transition-colors duration-300 hover:border-primary/60"
          >
            <link.icon className="size-5 text-muted-foreground transition-colors group-hover:text-primary" />
            <p className="mt-3 font-medium">{link.title}</p>
            <p className="mt-1 text-sm text-muted-foreground">{link.body}</p>
          </Link>
        ))}
      </Stagger>
    </div>
  );
}
