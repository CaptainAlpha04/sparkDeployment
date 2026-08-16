"use client";

import { useState, useTransition, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, ArrowLeft, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createEventAction,
  updateEventAction,
  type EventFormPayload,
  type EventStatus,
} from "@/app/(site)/admin/events/actions";

/* ── Time zone ─────────────────────────────────────────────────────────────

   A `datetime-local` input holds a bare wall clock — "2026-10-27T18:00" with
   no offset — and `new Date(thatString)` interprets it in whatever zone the
   admin's machine happens to be set to. An organiser working from a laptop
   still on UTC would silently file a 18:00 Karachi event as 23:00 Karachi.

   So the wall clock is pinned to Asia/Karachi in both directions: the value
   the admin types is read as Karachi time, and the instant coming back from
   the database is printed as Karachi time. The displayed clock is then the
   clock at the venue, whoever is editing and wherever they are sitting. ── */

const EVENT_TIME_ZONE = "Asia/Karachi";

const wallClock = new Intl.DateTimeFormat("en-GB", {
  timeZone: EVENT_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});

function partsOf(instant: Date): Record<string, string> {
  const parts: Record<string, string> = {};
  for (const part of wallClock.formatToParts(instant)) {
    if (part.type !== "literal") parts[part.type] = part.value;
  }
  return parts;
}


/** Offset of the event zone at a given instant, ms east of UTC. */
function zoneOffsetMs(instant: Date): number {
  const p = partsOf(instant);
  const asIfUtc = Date.UTC(
    Number(p.year),
    Number(p.month) - 1,
    Number(p.day),
    Number(p.hour),
    Number(p.minute),
    Number(p.second),
  );
  return asIfUtc - instant.getTime();
}

/** "YYYY-MM-DDTHH:mm" read as Karachi wall clock → ISO instant. */
function toIso(value: string): string | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(value.trim());
  if (!match) return null;
  const [, year, month, day, hour, minute] = match;

  // Interpret the wall clock as if it were UTC, then subtract the zone's
  // offset at roughly that moment. One correction is exact for a zone with no
  // DST, which Asia/Karachi has not observed since 2009.
  const asIfUtc = Date.UTC(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(minute),
  );
  const instant = new Date(asIfUtc - zoneOffsetMs(new Date(asIfUtc)));
  return Number.isNaN(instant.getTime()) ? null : instant.toISOString();
}

/* ── Date and time, kept as separate fields ────────────────────────────────
   A single `datetime-local` forces a time before it will yield any value, so
   an admin who knows the date but not yet the hour cannot save at all. Split
   into two inputs, with the time optional and a sensible default filled in. */

/** ISO instant → "YYYY-MM-DD" as read in Karachi. */
function toDateValue(iso: string | null): string {
  if (!iso) return "";
  const instant = new Date(iso);
  if (Number.isNaN(instant.getTime())) return "";
  const p = partsOf(instant);
  return `${p.year}-${p.month}-${p.day}`;
}

/** ISO instant → "HH:mm" as read in Karachi. */
function toTimeValue(iso: string | null): string {
  if (!iso) return "";
  const instant = new Date(iso);
  if (Number.isNaN(instant.getTime())) return "";
  const p = partsOf(instant);
  return `${p.hour}:${p.minute}`;
}

/**
 * Joins a date and an optional time into the wall-clock string `toIso` wants.
 *
 * `fallback` is used when no time is given: start-like fields open the day at
 * 00:00 and end-like fields close it at 23:59, so a date-only event reads as
 * lasting the whole day rather than starting and ending at midnight.
 */
function combine(date: string, time: string, fallback: "00:00" | "23:59"): string {
  if (!date.trim()) return "";
  return `${date}T${time.trim() || fallback}`;
}

/* ── Slug ──────────────────────────────────────────────────────────────── */

/**
 * Lowercase, spaces to dashes, everything outside [a-z0-9-] dropped.
 *
 * Kept separate from `tidySlug` on purpose: collapsing and trimming dashes on
 * every keystroke makes the field impossible to type a dash into, because the
 * trailing "-" of "my-" is eaten before the next character arrives.
 */
function sanitizeSlug(value: string): string {
  return value.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

/** Final form: no doubled dashes, no dashes on either end. */
function tidySlug(value: string): string {
  return sanitizeSlug(value)
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Auto-derivation from a title always produces the tidy form. */
function slugify(title: string): string {
  return tidySlug(title.trim());
}

/* ── Form ──────────────────────────────────────────────────────────────── */

export type EventFormInitial = {
  id: string;
  title: string;
  slug: string;
  summary: string;
  description: string;
  venueName: string;
  venueAddress: string;
  /** ISO instants. */
  startsAt: string;
  endsAt: string;
  capacity: number | null;
  registrationOpensAt: string | null;
  registrationClosesAt: string | null;
  status: EventStatus;
};

type FormState = {
  title: string;
  slug: string;
  summary: string;
  description: string;
  venueName: string;
  venueAddress: string;
  /** Wall clock in Asia/Karachi, split so the time can be left blank. */
  startsDate: string;
  startsTime: string;
  endsDate: string;
  endsTime: string;
  /** Kept as text so "" can mean unlimited without colliding with 0. */
  capacity: string;
  regOpensDate: string;
  regOpensTime: string;
  regClosesDate: string;
  regClosesTime: string;
  status: EventStatus;
};

const STATUSES: { value: EventStatus; label: string; hint: string }[] = [
  { value: "draft", label: "Draft", hint: "Hidden from the public site" },
  { value: "published", label: "Published", hint: "Live and open to registration" },
  { value: "cancelled", label: "Cancelled", hint: "Still listed, but called off" },
  { value: "completed", label: "Completed", hint: "Finished — moves to past events" },
];

function initialState(initial?: EventFormInitial): FormState {
  if (!initial) {
    return {
      title: "",
      slug: "",
      summary: "",
      description: "",
      venueName: "",
      venueAddress: "",
      startsDate: "",
      startsTime: "",
      endsDate: "",
      endsTime: "",
      capacity: "",
      regOpensDate: "",
      regOpensTime: "",
      regClosesDate: "",
      regClosesTime: "",
      status: "draft",
    };
  }
  return {
    title: initial.title,
    slug: initial.slug,
    summary: initial.summary,
    description: initial.description,
    venueName: initial.venueName,
    venueAddress: initial.venueAddress,
    startsDate: toDateValue(initial.startsAt),
    startsTime: toTimeValue(initial.startsAt),
    endsDate: toDateValue(initial.endsAt),
    endsTime: toTimeValue(initial.endsAt),
    capacity: initial.capacity === null ? "" : String(initial.capacity),
    regOpensDate: toDateValue(initial.registrationOpensAt),
    regOpensTime: toTimeValue(initial.registrationOpensAt),
    regClosesDate: toDateValue(initial.registrationClosesAt),
    regClosesTime: toTimeValue(initial.registrationClosesAt),
    status: initial.status,
  };
}

function Field({
  htmlFor,
  label,
  help,
  className = "",
  children,
}: {
  htmlFor: string;
  label: string;
  help?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={className}>
      <Label htmlFor={htmlFor} className="text-xs">
        {label}
      </Label>
      <div className="mt-1.5">{children}</div>
      {help && <p className="mt-1.5 text-xs text-muted-foreground">{help}</p>}
    </div>
  );
}

function Section({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border bg-card/60 p-6 backdrop-blur-xl">
      <h2 className="text-2xl font-semibold">{title}</h2>
      {hint && <p className="mt-1 mb-5 text-sm text-muted-foreground">{hint}</p>}
      {!hint && <div className="mb-5" />}
      {children}
    </section>
  );
}

/**
 * A date beside an optional time.
 *
 * The time input is visibly secondary and labelled with what happens when it
 * is left empty, so an admin who only knows the day is not stuck guessing.
 */
function DateTimeField({
  id,
  label,
  date,
  time,
  onDate,
  onTime,
  fallbackLabel,
  help,
  required = false,
}: {
  id: string;
  label: string;
  date: string;
  time: string;
  onDate: (value: string) => void;
  onTime: (value: string) => void;
  fallbackLabel: string;
  help?: string;
  required?: boolean;
}) {
  return (
    <div>
      <Label htmlFor={`${id}-date`} className="text-xs">
        {label}
        {!required && (
          <span className="ml-1.5 font-normal text-muted-foreground">
            optional
          </span>
        )}
      </Label>

      <div className="mt-1.5 grid grid-cols-[1.4fr_1fr] gap-2">
        <Input
          id={`${id}-date`}
          type="date"
          value={date}
          onChange={(e) => onDate(e.target.value)}
          className="[&::-webkit-calendar-picker-indicator]:opacity-60"
        />
        <Input
          id={`${id}-time`}
          type="time"
          value={time}
          onChange={(e) => onTime(e.target.value)}
          aria-label={`${label} time`}
          className="[&::-webkit-calendar-picker-indicator]:opacity-60"
        />
      </div>

      <p className="mt-1.5 text-xs text-muted-foreground">
        {help ? `${help} ` : ""}
        {date && !time ? (
          <span className="text-foreground/70">Time blank, so {fallbackLabel}.</span>
        ) : (
          <>Leave the time blank and {fallbackLabel}.</>
        )}
      </p>
    </div>
  );
}

export function EventForm({ initial }: { initial?: EventFormInitial }) {
  const isEdit = initial !== undefined;
  const router = useRouter();
  const [state, setState] = useState<FormState>(() => initialState(initial));
  // Once the slug is typed into by hand it is never rewritten underneath the
  // author, and on an existing event it is never derived at all — the slug is
  // the public URL, and quietly renaming it breaks every shared link.
  const [slugLocked, setSlugLocked] = useState(isEdit);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setSaved(false);
    setState((prev) => ({ ...prev, [key]: value }));
  }

  function onTitleChange(value: string) {
    setSaved(false);
    setState((prev) => ({
      ...prev,
      title: value,
      slug: slugLocked ? prev.slug : slugify(value),
    }));
  }

  function onSlugChange(value: string) {
    setSlugLocked(true);
    set("slug", sanitizeSlug(value));
  }

  // Read-back of the window the current inputs actually produce. Computed
  // during render rather than in an effect; it is derived state.
  const preview = (() => {
    const startIso = toIso(combine(state.startsDate, state.startsTime, "00:00"));
    const endIso = toIso(
      combine(state.endsDate || state.startsDate, state.endsTime, "23:59"),
    );
    if (!startIso || !endIso) return null;

    const fmt = new Intl.DateTimeFormat("en-GB", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
      timeZone: EVENT_TIME_ZONE,
    });
    const sameDay =
      toDateValue(startIso) === toDateValue(endIso);

    if (sameDay) {
      const endTime = new Intl.DateTimeFormat("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23",
        timeZone: EVENT_TIME_ZONE,
      }).format(new Date(endIso));
      return `${fmt.format(new Date(startIso))} to ${endTime} PKT`;
    }
    return `${fmt.format(new Date(startIso))} to ${fmt.format(new Date(endIso))} PKT`;
  })();

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSaved(false);

    if (!state.title.trim()) {
      setError("Give the event a title.");
      return;
    }
    // Tidy only at submit time, and write it back so the field shows exactly
    // what was saved rather than a stale in-progress version.
    const slug = tidySlug(state.slug);
    if (!slug) {
      setError("The event needs a slug — it becomes the public URL.");
      return;
    }
    if (slug !== state.slug) setState((prev) => ({ ...prev, slug }));

    // Time is optional. A date on its own runs 00:00 to 23:59.
    const startsAt = toIso(combine(state.startsDate, state.startsTime, "00:00"));
    const endsAt = toIso(
      combine(state.endsDate || state.startsDate, state.endsTime, "23:59"),
    );
    if (!startsAt) {
      setError("Pick a start date.");
      return;
    }
    if (!endsAt) {
      setError("Pick an end date.");
      return;
    }
    if (new Date(endsAt) <= new Date(startsAt)) {
      setError("The event has to end after it starts.");
      return;
    }

    let capacity: number | null = null;
    if (state.capacity.trim() !== "") {
      const parsed = Number(state.capacity);
      if (!Number.isInteger(parsed) || parsed < 1) {
        setError(
          "Capacity must be a whole number of at least 1 — leave it empty for unlimited.",
        );
        return;
      }
      capacity = parsed;
    }

    const payload: EventFormPayload = {
      title: state.title,
      slug,
      summary: state.summary,
      description: state.description,
      venueName: state.venueName,
      venueAddress: state.venueAddress,
      startsAt,
      endsAt,
      capacity,
      registrationOpensAt: toIso(
        combine(state.regOpensDate, state.regOpensTime, "00:00"),
      ),
      registrationClosesAt: toIso(
        combine(state.regClosesDate, state.regClosesTime, "23:59"),
      ),
      status: state.status,
    };

    startTransition(async () => {
      const result = initial
        ? await updateEventAction(initial.id, payload)
        : await createEventAction(payload);

      if (!result.ok) {
        setError(result.error);
        return;
      }

      if (initial) {
        setSaved(true);
        router.refresh();
      } else {
        router.push(`/admin/events/${result.data.id}`);
      }
    });
  }

  return (
    <form onSubmit={submit} className="space-y-6" noValidate>
      <Section title="Basics">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            htmlFor="event-title"
            label="Title"
            className="sm:col-span-2"
            help={
              isEdit
                ? undefined
                : "The slug fills itself in from the title until you edit it."
            }
          >
            <Input
              id="event-title"
              value={state.title}
              onChange={(e) => onTitleChange(e.target.value)}
              placeholder="SPARKx Talk: Building in Public"
              autoComplete="off"
            />
          </Field>

          <Field
            htmlFor="event-slug"
            label="Slug"
            className="sm:col-span-2"
            help={
              isEdit
                ? "This is the public URL. Changing it breaks links people have already shared."
                : "Lowercase letters, numbers, and dashes only."
            }
          >
            <div className="flex items-center gap-2">
              <span className="shrink-0 font-mono text-xs text-muted-foreground">
                /events/
              </span>
              <Input
                id="event-slug"
                value={state.slug}
                onChange={(e) => onSlugChange(e.target.value)}
                placeholder="sparkx-talk-building-in-public"
                className="font-mono"
                autoComplete="off"
              />
            </div>
          </Field>

          <Field
            htmlFor="event-summary"
            label="Summary"
            className="sm:col-span-2"
            help="One or two lines, shown on the events listing."
          >
            <Input
              id="event-summary"
              value={state.summary}
              onChange={(e) => set("summary", e.target.value)}
              placeholder="An evening with founders who ship in the open."
            />
          </Field>

          <Field
            htmlFor="event-description"
            label="Description"
            className="sm:col-span-2"
            help="Markdown. Shown on the event page."
          >
            <Textarea
              id="event-description"
              value={state.description}
              onChange={(e) => set("description", e.target.value)}
              rows={8}
              className="min-h-40"
              placeholder="What happens, who it is for, what to bring."
            />
          </Field>

          <Field
            htmlFor="event-status"
            label="Status"
            help={STATUSES.find((s) => s.value === state.status)?.hint}
          >
            <Select
              value={state.status}
              onValueChange={(value) => set("status", value as EventStatus)}
            >
              <SelectTrigger id="event-status" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUSES.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field
            htmlFor="event-capacity"
            label="Capacity"
            help="Leave empty for unlimited. Anyone beyond capacity joins the waitlist."
          >
            <Input
              id="event-capacity"
              type="number"
              min={1}
              step={1}
              inputMode="numeric"
              value={state.capacity}
              onChange={(e) => set("capacity", e.target.value)}
              placeholder="Unlimited"
            />
          </Field>
        </div>
      </Section>

      <Section
        title="When and where"
        hint={`All times are ${EVENT_TIME_ZONE} (PKT), whatever your own clock says.`}
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <DateTimeField
            id="event-starts"
            label="Starts"
            required
            date={state.startsDate}
            time={state.startsTime}
            onDate={(v) => set("startsDate", v)}
            onTime={(v) => set("startsTime", v)}
            fallbackLabel="the day starts at midnight"
          />

          <DateTimeField
            id="event-ends"
            label="Ends"
            required
            date={state.endsDate}
            time={state.endsTime}
            onDate={(v) => set("endsDate", v)}
            onTime={(v) => set("endsTime", v)}
            fallbackLabel="it runs to 23:59"
          />

          <DateTimeField
            id="event-reg-opens"
            label="Registration opens"
            date={state.regOpensDate}
            time={state.regOpensTime}
            onDate={(v) => set("regOpensDate", v)}
            onTime={(v) => set("regOpensTime", v)}
            help="No date means open the moment the event is published."
            fallbackLabel="it opens at midnight"
          />

          <DateTimeField
            id="event-reg-closes"
            label="Registration closes"
            date={state.regClosesDate}
            time={state.regClosesTime}
            onDate={(v) => set("regClosesDate", v)}
            onTime={(v) => set("regClosesTime", v)}
            help="No date means open right up until the event starts."
            fallbackLabel="it closes at 23:59"
          />
        </div>

        {/* Live read-back. Splitting date and time makes it easy to set a
            window you did not intend, so the result is shown plainly. */}
        {preview && (
          <p className="mt-5 rounded-xl border border-border bg-white/5 px-4 py-3 text-sm">
            <span className="eyebrow mr-2">Event runs</span>
            <span className="text-foreground">{preview}</span>
          </p>
        )}

        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <Field htmlFor="event-venue-name" label="Venue name">
            <Input
              id="event-venue-name"
              value={state.venueName}
              onChange={(e) => set("venueName", e.target.value)}
              placeholder="SEECS Seminar Hall"
            />
          </Field>

          <Field htmlFor="event-venue-address" label="Venue address">
            <Input
              id="event-venue-address"
              value={state.venueAddress}
              onChange={(e) => set("venueAddress", e.target.value)}
              placeholder="NUST H-12, Islamabad"
            />
          </Field>
        </div>
      </Section>

      {/* Deliberately not wrapped in <Reveal>: it starts at opacity 0 and only
          animates in once scrolled to, and a submit error the author cannot see
          is worse than one that appears without ceremony. */}
      {error && (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <span>{error}</span>
        </p>
      )}

      {saved && !error && (
        <p className="flex items-center gap-2 rounded-xl border border-border bg-card/60 p-4 text-sm text-muted-foreground">
          <Check className="size-4 text-primary" />
          Saved.
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending
            ? isEdit
              ? "Saving…"
              : "Creating…"
            : isEdit
              ? "Save changes"
              : "Create event"}
        </Button>
        <Button type="button" variant="ghost" asChild>
          <Link href="/admin/events">
            <ArrowLeft className="size-4" />
            Back to events
          </Link>
        </Button>
        {isEdit && (
          <Button type="button" variant="outline" asChild className="ml-auto">
            <Link href={`/admin/events/${initial.id}/attendees`}>Attendees</Link>
          </Button>
        )}
      </div>
    </form>
  );
}
