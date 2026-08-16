import Link from "next/link";
import { CalendarPlus, Users } from "lucide-react";
import { listAllEvents } from "@/server/events";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Reveal } from "@/components/motion/reveal";

/** Every time on this screen is venue time, not the operator's browser time. */
const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Karachi",
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

type EventStatus = "draft" | "published" | "cancelled" | "completed";

const STATUS_VARIANT: Record<
  EventStatus,
  "default" | "secondary" | "outline" | "destructive"
> = {
  draft: "outline",
  published: "default",
  cancelled: "destructive",
  completed: "secondary",
};

const STATUS_LABEL: Record<EventStatus, string> = {
  draft: "Draft",
  published: "Published",
  cancelled: "Cancelled",
  completed: "Completed",
};

export default async function AdminEventsPage() {
  const events = await listAllEvents();

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow mb-2">Events</p>
          <h1 className="text-4xl font-bold">All events</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Drafts included. Times are Asia/Karachi.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/events/new">
            <CalendarPlus className="size-4" />
            New event
          </Link>
        </Button>
      </div>

      {events.length === 0 ? (
        <Reveal>
          <div className="rounded-2xl border border-dashed border-border p-12 text-center">
            <p className="text-muted-foreground">
              No events yet. The first one you create starts as a draft, so
              nothing goes public until you say so.
            </p>
            <Button asChild className="mt-6">
              <Link href="/admin/events/new">
                <CalendarPlus className="size-4" />
                Create the first event
              </Link>
            </Button>
          </div>
        </Reveal>
      ) : (
        <Reveal>
          <div className="overflow-x-auto rounded-2xl border border-border bg-card/60 backdrop-blur-xl">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Event</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Starts</TableHead>
                  <TableHead className="text-right">Seats</TableHead>
                  <TableHead className="text-right">Waitlist</TableHead>
                  <TableHead className="text-right">Checked in</TableHead>
                  <TableHead className="text-right">Door</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.map((event) => {
                  const status = event.status as EventStatus;
                  return (
                    <TableRow key={event.id}>
                      <TableCell>
                        <Link
                          href={`/admin/events/${event.id}`}
                          className="font-medium text-foreground transition-colors hover:text-primary"
                        >
                          {event.title}
                        </Link>
                        <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                          /events/{event.slug}
                        </p>
                      </TableCell>
                      <TableCell>
                        <Badge variant={STATUS_VARIANT[status]}>
                          {STATUS_LABEL[status]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground tabular-nums">
                        {dateFormatter.format(event.startsAt)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {event.capacity === null
                          ? `${event.confirmedCount} / unlimited`
                          : `${event.confirmedCount} / ${event.capacity}`}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground tabular-nums">
                        {event.waitlistedCount}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground tabular-nums">
                        {event.checkedInCount}
                      </TableCell>
                      <TableCell className="text-right">
                        <Link
                          href={`/admin/events/${event.id}/attendees`}
                          className="inline-flex items-center gap-1.5 text-sm text-primary underline-offset-4 hover:underline"
                        >
                          <Users className="size-3.5" />
                          Attendees
                        </Link>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </Reveal>
      )}

      {events.length > 0 && (
        <p className="mt-6 text-xs text-muted-foreground">
          Select an event title to edit it, or open Attendees to run the door on
          the night.
        </p>
      )}
    </div>
  );
}
