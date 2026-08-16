import Link from "next/link";
import { Award, CalendarPlus, MapPin, Users } from "lucide-react";
import { getAdminOverview } from "@/server/events";
import { Reveal, Stagger } from "@/components/motion/reveal";
import { CountUp } from "@/components/motion/count-up";
import { Badge } from "@/components/ui/badge";

export const metadata = {
  title: "Admin · SPARK",
};

const DATE_TIME = new Intl.DateTimeFormat("en-GB", {
  weekday: "short",
  day: "numeric",
  month: "long",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Asia/Karachi",
});

const QUICK_LINKS = [
  {
    href: "/admin/events/new",
    icon: CalendarPlus,
    title: "Create an event",
    body: "Set the date, venue, and capacity, then publish when it is ready.",
  },
  {
    href: "/admin/certificates",
    icon: Award,
    title: "Certificates",
    body: "Design a template and issue it to everyone who checked in.",
  },
  {
    href: "/admin/members",
    icon: Users,
    title: "Members",
    body: "Search the community and manage moderator and admin access.",
  },
];

export default async function AdminOverviewPage() {
  const { totalEvents, totalMembers, totalConfirmed, totalCheckedIn, upcoming } =
    await getAdminOverview();

  const tiles = [
    { label: "Events", value: totalEvents },
    { label: "Members", value: totalMembers },
    { label: "Confirmed registrations", value: totalConfirmed },
    { label: "Check-ins", value: totalCheckedIn },
  ];

  return (
    <div>
      <Reveal>
        <p className="eyebrow mb-2">Admin</p>
        <h1 className="mb-2 text-4xl font-bold">Overview</h1>
        <p className="mb-8 max-w-2xl text-muted-foreground">
          Where SPARK stands right now — how many people are registered, how
          many actually turned up, and what is coming next.
        </p>
      </Reveal>

      <Stagger step={80} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {tiles.map((tile) => (
          <div
            key={tile.label}
            className="rounded-2xl border border-border bg-card/50 p-6"
          >
            <CountUp
              value={String(tile.value)}
              className="block text-3xl font-bold tabular-nums text-foreground"
            />
            <p className="eyebrow mt-2">{tile.label}</p>
          </div>
        ))}
      </Stagger>

      <section className="mt-10">
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="text-2xl font-semibold">Next up</h2>
          <Link
            href="/admin/events"
            className="text-sm text-primary hover:underline"
          >
            All events →
          </Link>
        </div>

        {upcoming.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-10 text-center">
            <p className="text-muted-foreground">
              Nothing published and upcoming.{" "}
              <Link
                href="/admin/events/new"
                className="text-primary hover:underline"
              >
                Create an event
              </Link>{" "}
              to get the calendar moving.
            </p>
          </div>
        ) : (
          <Stagger step={70} className="flex flex-col gap-3">
            {upcoming.map((event) => {
              const capacityLabel =
                event.capacity === null
                  ? `${event.confirmedCount} confirmed · unlimited`
                  : `${event.confirmedCount} / ${event.capacity} confirmed`;

              return (
                <Link
                  key={event.id}
                  href={`/admin/events/${event.id}/attendees`}
                  className="group rounded-2xl border border-border bg-card/50 p-5 transition-colors duration-300 hover:border-primary/60"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-lg font-semibold transition-colors group-hover:text-primary">
                        {event.title}
                      </p>
                      <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                        <span>{DATE_TIME.format(event.startsAt)} PKT</span>
                        {event.venueName && (
                          <span className="inline-flex items-center gap-1.5">
                            <MapPin className="size-4 shrink-0" />
                            {event.venueName}
                          </span>
                        )}
                      </p>
                    </div>

                    <div className="flex shrink-0 flex-wrap items-center gap-2">
                      <Badge variant="outline">{capacityLabel}</Badge>
                      {event.waitlistedCount > 0 && (
                        <Badge variant="secondary">
                          {event.waitlistedCount} waitlisted
                        </Badge>
                      )}
                      <Badge variant="ghost">
                        {event.checkedInCount} checked in
                      </Badge>
                    </div>
                  </div>
                </Link>
              );
            })}
          </Stagger>
        )}
      </section>

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
