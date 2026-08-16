import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SparkMark } from "@/components/brand/spark-mark";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Reveal } from "@/components/motion/reveal";
import { normalizeCode } from "@/lib/certificate-code";

export const metadata: Metadata = {
  title: "Verify a certificate | SPARK",
  description:
    "Confirm that a certificate issued by SPARK Chapter Pakistan is genuine.",
};

async function lookup(formData: FormData) {
  "use server";
  const raw = String(formData.get("code") ?? "");
  const normalized = normalizeCode(raw);
  // Send unparseable input through anyway — the result page explains what a
  // valid code looks like, which is more useful than an inline rejection.
  const target = normalized ?? (raw.trim() || "unknown");
  redirect(`/verify/${encodeURIComponent(target)}`);
}

export default function VerifyLandingPage() {
  return (
    <main className="flex min-h-screen w-full items-center justify-center bg-gradient-to-b from-black via-background to-purple-950/40 px-6 py-28">
      <Reveal className="w-full max-w-lg">
        <div className="rounded-2xl border border-border bg-card/70 p-8 backdrop-blur-xl">
          <div className="mb-7 flex items-center gap-3">
            <SparkMark className="size-7 text-primary" />
            <span className="eyebrow">Certificate verification</span>
          </div>

          <h1 className="text-4xl font-bold">Verify a certificate</h1>
          <p className="mt-3 text-muted-foreground">
            Enter the code printed on a SPARK certificate to confirm it is
            genuine, who it was awarded to, and what for.
          </p>

          <form action={lookup} className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Input
              name="code"
              required
              autoComplete="off"
              spellCheck={false}
              placeholder="SPARK-XXXX-XXXX"
              aria-label="Certificate code"
              className="h-12 font-mono tracking-widest uppercase"
            />
            <Button type="submit" className="h-12 sm:px-8">
              Verify
            </Button>
          </form>

          <p className="mt-4 text-xs text-muted-foreground">
            Codes are eight characters. Case does not matter, and you can leave
            out the dashes.
          </p>
        </div>
      </Reveal>
    </main>
  );
}
