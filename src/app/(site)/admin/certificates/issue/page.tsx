import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { listAllEvents } from "@/server/events";
import { listTemplates } from "@/server/certificates";
import { IssueForm } from "@/components/certificates/issue-form";

export default async function IssueCertificatesPage() {
  const [events, templates] = await Promise.all([listAllEvents(), listTemplates()]);

  // Only events with attendance can produce certificates, so the picker is
  // limited to those rather than listing every draft.
  const eligible = events
    .filter((event) => event.checkedInCount > 0)
    .map((event) => ({
      id: event.id,
      title: event.title,
      startsAt: event.startsAt.toISOString(),
      checkedInCount: event.checkedInCount,
    }));

  return (
    <div>
      <Link
        href="/admin/certificates"
        className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Templates
      </Link>

      <p className="eyebrow mb-2">Certificates</p>
      <h1 className="mb-2 text-4xl font-bold">Issue certificates</h1>
      <p className="mb-8 max-w-2xl text-muted-foreground">
        Certificates go to people who were <strong>checked in</strong>, not everyone
        who registered. Issuing twice is safe — anyone who already has one is
        skipped.
      </p>

      {eligible.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-12 text-center">
          <p className="text-muted-foreground">
            No event has any check-ins yet.
          </p>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Open an event&apos;s attendees screen and check people in as they
            arrive. Once anyone is marked present, that event appears here.
          </p>
          <Link
            href="/admin/events"
            className="mt-4 inline-block text-sm text-primary hover:underline"
          >
            Go to events →
          </Link>
        </div>
      ) : (
        <IssueForm events={eligible} templates={templates} />
      )}
    </div>
  );
}
