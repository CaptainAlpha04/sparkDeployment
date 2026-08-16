"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CircleCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { profileUpdateSchema } from "@/lib/validation/profile";
import { updateProfileAction } from "@/app/(site)/dashboard/actions";

/** Only the fields the shared schema accepts. Role and email are not editable. */
type Values = {
  fullName: string;
  university: string;
  degree: string;
  phone: string;
  gradYear: string;
  bio: string;
};

type Props = {
  initial: {
    fullName: string | null;
    university: string | null;
    degree: string | null;
    phone: string | null;
    gradYear: number | null;
    bio: string | null;
  };
  /** Owned by Supabase Auth — shown for orientation, never submitted. */
  email: string | null;
};

const BIO_MAX = 500;

type FieldErrors = Partial<Record<keyof Values, string>>;

export function ProfileForm({ initial, email }: Props) {
  const [values, setValues] = useState<Values>({
    fullName: initial.fullName ?? "",
    university: initial.university ?? "",
    degree: initial.degree ?? "",
    phone: initial.phone ?? "",
    gradYear: initial.gradYear === null ? "" : String(initial.gradYear),
    bio: initial.bio ?? "",
  });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function set<K extends keyof Values>(key: K, value: string) {
    setValues((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => (prev[key] ? { ...prev, [key]: undefined } : prev));
    setSaved(false);
    setServerError(null);
  }

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setServerError(null);
    setSaved(false);

    // The same schema the server enforces — one source of truth, so client and
    // server rules cannot drift apart. An empty graduation year means "not
    // stated", not "year zero", so it is dropped before parsing rather than
    // coerced to 0 and failing the 1950 floor.
    const parsed = profileUpdateSchema.safeParse({
      fullName: values.fullName.trim(),
      university: values.university.trim(),
      degree: values.degree.trim(),
      phone: values.phone.trim(),
      gradYear: values.gradYear.trim() === "" ? undefined : values.gradYear,
      bio: values.bio.trim(),
    });

    if (!parsed.success) {
      const next: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof Values | undefined;
        if (key && !next[key]) next[key] = issue.message;
      }
      setErrors(next);
      return;
    }

    setErrors({});
    startTransition(async () => {
      const result = await updateProfileAction(parsed.data);
      if (!result.ok) {
        setServerError(result.error);
        return;
      }
      setSaved(true);
      // Pull the revalidated layout so the name in the header updates now
      // rather than on the next navigation.
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} noValidate className="max-w-xl">
      <div className="space-y-5 rounded-2xl border border-border bg-card/50 p-6">
        <Field
          id="fullName"
          label="Full name"
          error={errors.fullName}
          hint="This is the name printed on your certificates."
        >
          <Input
            id="fullName"
            value={values.fullName}
            onChange={(e) => set("fullName", e.target.value)}
            aria-invalid={Boolean(errors.fullName)}
            autoComplete="name"
          />
        </Field>

        {email && (
          <div>
            <Label htmlFor="email" className="text-xs">
              Email
            </Label>
            <Input id="email" value={email} disabled className="mt-1" />
            <p className="mt-1 text-xs text-muted-foreground">
              Your email is tied to how you sign in and cannot be changed here.
            </p>
          </div>
        )}

        <div className="grid gap-5 sm:grid-cols-2">
          <Field id="university" label="University" error={errors.university}>
            <Input
              id="university"
              value={values.university}
              onChange={(e) => set("university", e.target.value)}
              aria-invalid={Boolean(errors.university)}
              placeholder="NUST SEECS"
              autoComplete="organization"
            />
          </Field>

          <Field id="degree" label="Degree" error={errors.degree}>
            <Input
              id="degree"
              value={values.degree}
              onChange={(e) => set("degree", e.target.value)}
              aria-invalid={Boolean(errors.degree)}
              placeholder="BS Computer Science"
            />
          </Field>

          <Field id="phone" label="Phone" error={errors.phone}>
            <Input
              id="phone"
              value={values.phone}
              onChange={(e) => set("phone", e.target.value)}
              aria-invalid={Boolean(errors.phone)}
              placeholder="+92 300 0000000"
              autoComplete="tel"
              inputMode="tel"
            />
          </Field>

          <Field
            id="gradYear"
            label="Graduation year"
            error={errors.gradYear}
            hint="Leave blank if you would rather not say."
          >
            <Input
              id="gradYear"
              value={values.gradYear}
              onChange={(e) => set("gradYear", e.target.value)}
              aria-invalid={Boolean(errors.gradYear)}
              placeholder="2027"
              inputMode="numeric"
            />
          </Field>
        </div>

        <Field
          id="bio"
          label="Bio"
          error={errors.bio}
          hint={`${values.bio.length} / ${BIO_MAX} characters`}
        >
          <Textarea
            id="bio"
            value={values.bio}
            onChange={(e) => set("bio", e.target.value)}
            aria-invalid={Boolean(errors.bio)}
            rows={4}
            placeholder="What you are building, studying, or curious about."
          />
        </Field>
      </div>

      {serverError && (
        <p
          role="alert"
          className="mt-4 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          {serverError}
        </p>
      )}

      <div className="mt-5 flex items-center gap-4">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save changes"}
        </Button>
        {saved && !pending && (
          <p
            role="status"
            className="flex items-center gap-1.5 text-sm text-primary"
          >
            <CircleCheck className="size-4" />
            Profile saved
          </p>
        )}
      </div>
    </form>
  );
}

function Field({
  id,
  label,
  error,
  hint,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <Label htmlFor={id} className="text-xs">
        {label}
      </Label>
      <div className="mt-1">{children}</div>
      {error ? (
        <p className="mt-1 text-xs text-destructive">{error}</p>
      ) : hint ? (
        <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}
