import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MapPin, Pencil } from "lucide-react";
import { getEvent, listEventAttendees } from "@/server/events";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AttendeeTable,
  type AttendeeStatus,
  type AttendeeView,
} from "@/components/admin/attendee-table";

const dateTimeFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Karachi",
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

/** Check-ins all happen on the day, so the year would only be noise. */
const shortTimeFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Karachi",
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

export default async function EventAttendeesPage({
  params,
}: PageProps<"/admin/events/[id]/attendees">) {
  const { id } = await params;
  const [event, rows] = await Promise.all([getEvent(id), listEventAttendees(id)]);
  if (!event) notFound();

  // Formatting happens here rather than in the table so the browser's own zone
  // never leaks into a timestamp, and so server render and hydration agree.
  const attendees: AttendeeView[] = rows.map((row) => ({
    registrationId: row.registration.id,
    userId: row.registration.userId,
    name: row.fullName?.trim() || "Unnamed member",
    university: row.university,
    status: row.registration.status as AttendeeStatus,
    registeredAt: shortTimeFormatter.format(row.registration.registeredAt),
    checkedInAt: row.checkedInAt ? shortTimeFormatter.format(row.checkedInAt) : null,
  }));

  return (
    <div>
      <Link
        href="/admin/events"
        className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> All events
      </Link>

      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="eyebrow mb-2">Door list</p>
          <h1 className="text-4xl font-bold">{event.title}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
            <span className="tabular-nums">
              {dateTimeFormatter.format(event.startsAt)}
            </span>
            {event.venueName && (
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="size-3.5" />
                {event.venueName}
              </span>
            )}
            <Badge variant="outline">
              {event.capacity === null
                ? "Unlimited capacity"
                : `Capacity ${event.capacity}`}
            </Badge>
          </div>
        </div>
        <Button variant="outline" asChild>
          <Link href={`/admin/events/${event.id}`}>
            <Pencil className="size-4" />
            Edit event
          </Link>
        </Button>
      </div>

      <AttendeeTable eventId={event.id} attendees={attendees} />
    </div>
  );
}
