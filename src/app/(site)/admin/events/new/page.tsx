import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { EventForm } from "@/components/admin/event-form";

export default function NewEventPage() {
  return (
    <div>
      <Link
        href="/admin/events"
        className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> All events
      </Link>

      <p className="eyebrow mb-2">Events</p>
      <h1 className="text-4xl font-bold">New event</h1>
      <p className="mt-2 mb-8 max-w-2xl text-muted-foreground">
        It saves as whatever status you pick — leave it on Draft and nothing
        appears on the public site until you come back and publish it.
      </p>

      <EventForm />
    </div>
  );
}
