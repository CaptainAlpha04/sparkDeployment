"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Award, BadgeCheck, Loader2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  issueAction,
  listCandidatesAction,
  listIssuedAction,
  revokeAction,
} from "@/app/(site)/admin/certificates/actions";

type EventOption = { id: string; title: string; startsAt: string; checkedInCount: number };
type TemplateOption = { id: string; name: string };

type Candidate = {
  userId: string;
  recipientName: string;
  alreadyIssued: boolean;
};

type Issued = {
  id: string;
  code: string;
  recipientName: string;
  issuedAt: string | Date;
  revokedAt: string | Date | null;
  revokedReason: string | null;
};

export function IssueForm({
  events,
  templates,
}: {
  events: EventOption[];
  templates: TemplateOption[];
}) {
  const [eventId, setEventId] = useState("");
  const [templateId, setTemplateId] = useState(templates[0]?.id ?? "");
  const [candidates, setCandidates] = useState<Candidate[] | null>(null);
  const [issued, setIssued] = useState<Issued[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [revokeReason, setRevokeReason] = useState("");
  const [loading, startLoading] = useTransition();
  const [issuing, startIssuing] = useTransition();
  const router = useRouter();

  function selectEvent(id: string) {
    setEventId(id);
    setCandidates(null);
    setIssued([]);
    setResult(null);
    setError(null);
    if (!id) return;

    startLoading(async () => {
      const [cands, alreadyIssued] = await Promise.all([
        listCandidatesAction(id),
        listIssuedAction(id),
      ]);
      if (!cands.ok) {
        setError(cands.error);
        return;
      }
      setCandidates(cands.data);
      if (alreadyIssued.ok) setIssued(alreadyIssued.data as Issued[]);
    });
  }

  function issue() {
    setError(null);
    setResult(null);
    startIssuing(async () => {
      const res = await issueAction(eventId, templateId);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setResult(
        res.data.issued === 0
          ? "Everyone eligible already has a certificate. Nothing to do."
          : `Issued ${res.data.issued} certificate${res.data.issued === 1 ? "" : "s"}.` +
              (res.data.skipped > 0 ? ` ${res.data.skipped} already had one.` : ""),
      );
      selectEvent(eventId);
      router.refresh();
    });
  }

  function revoke(id: string) {
    if (!revokeReason.trim()) {
      setError("Give a reason — it is shown on the public verification page.");
      return;
    }
    setError(null);
    startIssuing(async () => {
      const res = await revokeAction(id, revokeReason);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setRevokingId(null);
      setRevokeReason("");
      selectEvent(eventId);
      router.refresh();
    });
  }

  const pending = candidates?.filter((c) => !c.alreadyIssued) ?? [];
  const selectedEvent = events.find((e) => e.id === eventId);

  return (
    <div className="space-y-6">
      {/* Pickers */}
      <div className="rounded-2xl border border-border bg-card/60 p-6 backdrop-blur-xl">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="event" className="text-xs">
              Event
            </Label>
            <select
              id="event"
              value={eventId}
              onChange={(e) => selectEvent(e.target.value)}
              className="mt-1 h-10 w-full rounded-md border border-input bg-transparent px-2 text-sm"
            >
              <option value="" className="bg-popover">
                Choose an event…
              </option>
              {events.map((event) => (
                <option key={event.id} value={event.id} className="bg-popover">
                  {event.title} — {event.checkedInCount} checked in
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label htmlFor="template" className="text-xs">
              Template
            </Label>
            <select
              id="template"
              value={templateId}
              onChange={(e) => setTemplateId(e.target.value)}
              className="mt-1 h-10 w-full rounded-md border border-input bg-transparent px-2 text-sm"
            >
              {templates.map((template) => (
                <option key={template.id} value={template.id} className="bg-popover">
                  {template.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {templates.length === 0 && (
          <p className="mt-3 text-sm text-destructive">
            No templates yet — design one first.
          </p>
        )}
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Checking who attended…
        </div>
      )}

      {/* Preview before writing anything */}
      {candidates && !loading && (
        <div className="rounded-2xl border border-border bg-card/60 p-6 backdrop-blur-xl">
          <div className="mb-4 flex items-center gap-2">
            <Users className="size-4 text-muted-foreground" />
            <span className="eyebrow">Eligible attendees</span>
          </div>

          {candidates.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-8 text-center">
              <p className="text-muted-foreground">
                Nobody has been checked in for {selectedEvent?.title ?? "this event"}{" "}
                yet.
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Certificates are issued against attendance, not registration — check
                people in from the event&apos;s attendees screen first.
              </p>
            </div>
          ) : (
            <>
              <p className="mb-4 text-sm text-muted-foreground">
                {pending.length} will receive a certificate.{" "}
                {candidates.length - pending.length > 0 &&
                  `${candidates.length - pending.length} already have one and will be skipped.`}
              </p>

              <ul className="mb-5 grid gap-1.5 sm:grid-cols-2">
                {candidates.map((c) => (
                  <li
                    key={c.userId}
                    className="flex items-center gap-2 rounded-lg bg-white/5 px-3 py-2 text-sm"
                  >
                    {c.alreadyIssued ? (
                      <BadgeCheck className="size-3.5 shrink-0 text-emerald-400" />
                    ) : (
                      <Award className="size-3.5 shrink-0 text-muted-foreground" />
                    )}
                    <span className="truncate">{c.recipientName}</span>
                    {c.alreadyIssued && (
                      <span className="ml-auto shrink-0 text-xs text-muted-foreground">
                        issued
                      </span>
                    )}
                  </li>
                ))}
              </ul>

              <Button
                type="button"
                onClick={issue}
                disabled={issuing || pending.length === 0 || !templateId}
                className="gap-2"
              >
                {issuing ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Award className="size-4" />
                )}
                {pending.length === 0
                  ? "Nothing to issue"
                  : `Issue ${pending.length} certificate${pending.length === 1 ? "" : "s"}`}
              </Button>
            </>
          )}
        </div>
      )}

      {result && (
        <p className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-200">
          {result}
        </p>
      )}
      {error && (
        <p className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          {error}
        </p>
      )}

      {/* Already issued, with revoke */}
      {issued.length > 0 && (
        <div className="rounded-2xl border border-border bg-card/60 p-6 backdrop-blur-xl">
          <span className="eyebrow">Issued for this event</span>
          <div className="mt-4 space-y-2">
            {issued.map((cert) => (
              <div
                key={cert.id}
                className="rounded-xl border border-border/60 bg-white/5 p-3"
              >
                <div className="flex flex-wrap items-center gap-3">
                  <span className="font-medium">{cert.recipientName}</span>
                  <span className="font-mono text-xs tracking-widest text-muted-foreground">
                    {cert.code}
                  </span>
                  {cert.revokedAt ? (
                    <span className="rounded-full bg-destructive/20 px-2 py-0.5 text-xs text-destructive">
                      revoked
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() =>
                        setRevokingId(revokingId === cert.id ? null : cert.id)
                      }
                      className="ml-auto text-xs text-muted-foreground transition-colors hover:text-destructive"
                    >
                      Revoke
                    </button>
                  )}
                </div>

                {cert.revokedReason && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {cert.revokedReason}
                  </p>
                )}

                {revokingId === cert.id && (
                  <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                    <Input
                      value={revokeReason}
                      onChange={(e) => setRevokeReason(e.target.value)}
                      placeholder="Reason — shown on the public verification page"
                      className="h-9"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => revoke(cert.id)}
                      disabled={issuing}
                    >
                      Confirm revoke
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
