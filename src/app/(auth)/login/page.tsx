"use client";

import { Suspense, useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { KeyRound, Mail } from "lucide-react";
import StarryCanvas from "@/components/starry-canvas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { signIn, signInWithGoogle } from "../actions";

function LoginForm() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const rawNext = useSearchParams().get("next") ?? "/";
  const next = rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/";

  function onSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await signIn(formData);
      if (result.ok) {
        setSuccess(true);
        router.push(next);
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <>
      <form action={onSubmit} className="flex w-full flex-col gap-3">
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
            autoComplete="current-password"
            className="h-12 w-full rounded-lg bg-white/95 text-slate-900 placeholder:text-slate-500"
          />
        </label>

        {/* Explicitly typed. The old form left these untyped inside a <form>,
            so they defaulted to submit and fired a native GET alongside the
            handler — reloading the page with the password in the URL. */}
        <Button type="submit" disabled={pending} className="mt-2 h-12 w-full">
          {pending ? "Logging in…" : "Login"}
        </Button>

        {success && (
          <p className="mt-2 self-center text-green-400">Login successful!</p>
        )}
        {error && <p className="mt-2 self-center text-red-400">{error}</p>}
      </form>

      <form action={() => signInWithGoogle(next)} className="w-full">
        <Button
          type="submit"
          variant="outline"
          className="h-12 w-full border-white/40 bg-transparent text-white hover:bg-white/10"
        >
          Continue with Google
        </Button>
      </form>
    </>
  );
}

export default function LoginPage() {
  return (
    <section className="planet-bg fixed z-30 flex h-screen w-screen flex-row overflow-auto">
      <StarryCanvas numberOfStars={140} />

      <div className="animation-fade-in relative z-10 flex h-screen w-screen flex-col items-center gap-4 bg-black/20 p-6 pt-4 backdrop-blur-3xl transition-all md:w-1/3">
        <div className="flex w-full flex-row justify-between">
          <Button asChild variant="ghost" className="text-white hover:bg-white/10">
            <Link href="/">Back</Link>
          </Button>
          <Button asChild variant="ghost" className="text-white hover:bg-white/10">
            <Link href="/signup">Register</Link>
          </Button>
        </div>

        <Image
          src="/images/logo-white.png"
          alt="SPARK"
          width={80}
          height={80}
          className="mt-10 size-20 object-contain"
          priority
        />

        <h1 className="mt-10 text-3xl font-bold text-white">Login</h1>
        <p className="font-light text-white">
          Enter your email and password to log in.
        </p>

        <Suspense fallback={null}>
          <LoginForm />
        </Suspense>
      </div>
    </section>
  );
}
