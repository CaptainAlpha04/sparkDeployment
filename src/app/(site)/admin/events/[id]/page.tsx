import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getEvent } from "@/server/events";
import { EventForm } from "@/components/admin/event-form";

export default async function EditEventPage({
  params,
}: PageProps<"/admin/events/[id]">) {
  const { id } = await params;
  const event = await getEvent(id);
  if (!event) notFound();

  return (
    <div>
      <Link
        href="/admin/events"
        className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> All events
      </Link>

      <p className="eyebrow mb-2">Edit event</p>
      <h1 className="mb-8 text-4xl font-bold">{event.title}</h1>

      <EventForm
        initial={{
          id: event.id,
          title: event.title,
          slug: event.slug,
          summary: event.summary ?? "",
          description: event.description ?? "",
          venueName: event.venueName ?? "",
          venueAddress: event.venueAddress ?? "",
          // Instants cross to the client as ISO strings; the form turns them
          // into an Asia/Karachi wall clock for the datetime-local inputs.
          startsAt: event.startsAt.toISOString(),
          endsAt: event.endsAt.toISOString(),
          capacity: event.capacity,
          registrationOpensAt: event.registrationOpensAt?.toISOString() ?? null,
          registrationClosesAt: event.registrationClosesAt?.toISOString() ?? null,
          status: event.status,
        }}
      />
    </div>
  );
}
