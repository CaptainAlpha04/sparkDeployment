"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { KeyRound, Mail, ShieldCheck, User } from "lucide-react";
import StarryCanvas from "@/components/starry-canvas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { signUp, signInWithGoogle } from "../actions";

type Strength = "weak" | "medium" | "strong";

function evaluate(password: string): Strength {
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasDigit = /\d/.test(password);
  const hasSymbol = /[^A-Za-z0-9]/.test(password);
  const meetsAll = hasUpper && hasLower && hasDigit && hasSymbol;

  if (password.length < 8 || !meetsAll) return "weak";
  return password.length < 12 ? "medium" : "strong";
}

// The original swapped a hard border colour class. This animates a filling bar
// instead, tweening between the same three colours.
const STRENGTH_STYLE: Record<Strength, { width: string; className: string }> = {
  weak: { width: "33%", className: "bg-red-500" },
  medium: { width: "66%", className: "bg-orange-500" },
  strong: { width: "100%", className: "bg-green-500" },
};

export default function SignUpPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [pending, startTransition] = useTransition();

  // Derived state — computed during render, not synced via an effect. The old
  // app used useEffect + setState here, causing a cascading render per keystroke.
  const strength = evaluate(password);
  const matches = password !== "" && password === confirmPassword;
  const acceptable = strength !== "weak";
  const bar = STRENGTH_STYLE[strength];

  function onSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await signUp(formData);
      if (result.ok) setSent(true);
      else setError(result.error);
    });
  }

  return (
    <section className="planet-bg fixed z-30 flex h-screen w-screen flex-row overflow-auto">
      <StarryCanvas numberOfStars={140} />

      <div className="animation-fade-in relative z-10 flex h-screen w-screen flex-col items-center gap-6 overflow-y-auto bg-black/20 p-6 pt-4 backdrop-blur-3xl transition-all lg:w-1/3">
        <div className="flex w-full flex-row justify-between">
          <Button asChild variant="ghost" className="text-white hover:bg-white/10">
            <Link href="/">Back</Link>
          </Button>
          <Button asChild variant="ghost" className="text-white hover:bg-white/10">
            <Link href="/login">Login</Link>
          </Button>
        </div>

        <div className="flex flex-col items-center gap-4">
          <Image
            src="/images/logo-white.png"
            alt="SPARK"
            width={56}
            height={56}
            className="size-14 object-contain"
            priority
          />
          <h1 className="text-3xl font-bold text-white">Create an Account</h1>
          <p className="font-light text-white">
            Enter your details to become a member.
          </p>
        </div>

        {sent ? (
          <p className="rounded-lg border border-primary/40 bg-primary/10 p-4 text-center text-white">
            An email for account verification has been sent!
          </p>
        ) : (
          <>
            <form action={onSubmit} className="flex w-full flex-col gap-3">
              <label className="flex flex-row items-center gap-3">
                <User className="size-5 shrink-0 text-white/70" aria-hidden />
                <span className="hidden w-1/5 text-white md:flex">Name</span>
                <Input
                  name="fullName"
                  placeholder="Name"
                  required
                  autoComplete="name"
                  className="h-12 w-full rounded-lg bg-white/95 text-slate-900 placeholder:text-slate-500"
                />
              </label>

              <label className="flex flex-row items-center gap-3">
                <Mail className="size-5 shrink-0 text-white/70" aria-hidden />
                <span className="hidden w-1/5 text-white md:flex">Email</span>
                <Input
                  name="email"
                  type="email"
                  placeholder="Email"
                  required
                  autoComplete="email"
                  className="h-12 w-full rounded-lg bg-white/95 text-slate-900 placeholder:text-slate-500"
                />
              </label>

              <label className="flex flex-row items-center gap-3">
                <KeyRound className="size-5 shrink-0 text-white/70" aria-hidden />
                <span className="hidden w-1/5 text-white md:flex">Password</span>
                <Input
                  name="password"
                  type="password"
                  placeholder="Password"
                  required
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 w-full rounded-lg bg-white/95 text-slate-900 placeholder:text-slate-500"
                />
              </label>

              <div className="ml-8 h-1 w-full overflow-hidden rounded-full bg-white/15 md:ml-0">
                <div
                  className={`h-full rounded-full transition-all duration-500 ease-out ${bar.className}`}
                  style={{ width: password ? bar.width : "0%" }}
                />
              </div>

              <label className="flex flex-row items-center gap-3">
                <ShieldCheck className="size-5 shrink-0 text-white/70" aria-hidden />
                <span className="hidden w-1/5 text-white md:flex">Confirm</span>
                <Input
                  name="confirmPassword"
                  type="password"
                  placeholder="Confirm Password"
                  required
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`h-12 w-full rounded-lg border-b-4 bg-white/95 text-slate-900 transition-colors duration-300 placeholder:text-slate-500 ${
                    confirmPassword === ""
                      ? "border-b-transparent"
                      : matches
                        ? "border-b-green-500"
                        : "border-b-red-500"
                  }`}
                />
              </label>

              <p className="p-2 text-center text-xs text-white/80">
                Password must contain one Uppercase, one Lowercase character. A
                numerical digit and a Special Character!
              </p>

              {error && <p className="self-center text-red-400">{error}</p>}

              <Button
                type="submit"
                disabled={pending || !matches || !acceptable}
                className="h-12 w-full"
              >
                {pending ? "Registering…" : "Register"}
              </Button>
            </form>

            <form action={() => signInWithGoogle("/")} className="w-full">
              <Button
                type="submit"
                variant="outline"
                className="h-12 w-full border-white/40 bg-transparent text-white hover:bg-white/10"
              >
                Continue with Google
              </Button>
            </form>
          </>
        )}
      </div>
    </section>
  );
}
