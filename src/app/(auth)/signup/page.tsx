"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { AlertCircle, Check, Loader2, MailCheck } from "lucide-react";
import { AuthShell } from "@/components/auth/auth-shell";
import { GoogleButton } from "@/components/auth/google-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signUp, signInWithGoogle } from "../actions";

/**
 * The four rules the shared zod schema enforces. Listed rather than described,
 * so a rejected password shows which rule failed instead of a paragraph the
 * reader has to re-check themselves against.
 */
const RULES = [
  { label: "8 characters or more", test: (p: string) => p.length >= 8 },
  { label: "An uppercase letter", test: (p: string) => /[A-Z]/.test(p) },
  { label: "A lowercase letter", test: (p: string) => /[a-z]/.test(p) },
  { label: "A number", test: (p: string) => /\d/.test(p) },
  { label: "A special character", test: (p: string) => /[^A-Za-z0-9]/.test(p) },
];

export default function SignUpPage() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [pending, startTransition] = useTransition();

  const met = RULES.filter((rule) => rule.test(password)).length;
  const strong = met === RULES.length;
  const matches = password !== "" && password === confirm;

  function onSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await signUp(formData);
      if (result.ok) setSent(true);
      else setError(result.error);
    });
  }

  return (
    <AuthShell
      eyebrow="Join SPARK"
      title="Create an account"
      subtitle="It is free, and there is no entry test."
      aside={{
        quote:
          "There is nothing more difficult to take in hand, more perilous to conduct, or more uncertain in its success, than to take the lead in the introduction of a new order of things.",
        source: "Machiavelli",
        work: "The Prince, 1532",
      }}
      footer={
        <>
          Already a member?{" "}
          <Link href="/login" className="text-primary hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      {sent ? (
        <div className="rounded-xl border border-primary/40 bg-primary/10 p-5">
          <MailCheck className="mb-3 size-6 text-primary" />
          <p className="font-semibold">Check your email</p>
          <p className="mt-1.5 text-sm text-muted-foreground">
            We have sent a confirmation link. Open it and you are in.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          <form action={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full name</Label>
              <Input
                id="fullName"
                name="fullName"
                required
                autoComplete="name"
                placeholder="Ayesha Khan"
                className="h-11"
              />
              <p className="text-xs text-muted-foreground">
                This is the name printed on your certificates.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="you@university.edu.pk"
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-11"
              />

              {/* Segmented strength meter, one segment per rule, so progress is
                  legible without reading the list. */}
              <div className="flex gap-1 pt-1">
                {RULES.map((rule, i) => (
                  <span
                    key={rule.label}
                    className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                      password === "" || i >= met
                        ? "bg-white/10"
                        : strong
                          ? "bg-emerald-500"
                          : met >= 3
                            ? "bg-amber-500"
                            : "bg-destructive"
                    }`}
                  />
                ))}
              </div>

              {password !== "" && !strong && (
                <ul className="space-y-1 pt-1">
                  {RULES.filter((rule) => !rule.test(password)).map((rule) => (
                    <li
                      key={rule.label}
                      className="flex items-center gap-2 text-xs text-muted-foreground"
                    >
                      <span className="size-1 rounded-full bg-muted-foreground" />
                      {rule.label}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  autoComplete="new-password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className="h-11 pr-10"
                />
                {matches && (
                  <Check className="absolute top-1/2 right-3 size-4 -translate-y-1/2 text-emerald-400" />
                )}
              </div>
              {confirm !== "" && !matches && (
                <p className="text-xs text-destructive">
                  These do not match yet.
                </p>
              )}
            </div>

            {error && (
              <p
                role="alert"
                className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive"
              >
                <AlertCircle className="mt-0.5 size-4 shrink-0" />
                {error}
              </p>
            )}

            <Button
              type="submit"
              disabled={pending || !strong || !matches}
              className="h-11 w-full gap-2"
            >
              {pending && <Loader2 className="size-4 animate-spin" />}
              {pending ? "Creating account…" : "Create account"}
            </Button>
          </form>

          <div className="flex items-center gap-3">
            <span className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted-foreground">or</span>
            <span className="h-px flex-1 bg-border" />
          </div>

          <form action={() => signInWithGoogle("/")}>
            <GoogleButton>Continue with Google</GoogleButton>
          </form>
        </div>
      )}
    </AuthShell>
  );
}
