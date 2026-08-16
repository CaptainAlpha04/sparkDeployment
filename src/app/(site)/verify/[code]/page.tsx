import type { Metadata } from "next";
import Link from "next/link";
import { BadgeCheck, CircleSlash, SearchX } from "lucide-react";
import { verifyCertificate } from "@/server/certificates";
import { SparkMark } from "@/components/brand/spark-mark";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/motion/reveal";

export const metadata: Metadata = {
  title: "Verify a certificate | SPARK",
  description: "Confirm that a SPARK certificate is genuine.",
  // A verification result is not something to index.
  robots: { index: false, follow: false },
};

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Karachi",
  }).format(date);
}

export default async function VerifyPage({
  params,
}: PageProps<"/verify/[code]">) {
  const { code } = await params;
  const result = await verifyCertificate(decodeURIComponent(code));

  return (
    <main className="flex min-h-screen w-full items-center justify-center bg-gradient-to-b from-black via-background to-purple-950/40 px-6 py-28">
      <Reveal className="w-full max-w-lg">
        <div className="rounded-2xl border border-border bg-card/70 p-8 backdrop-blur-xl">
          <div className="mb-7 flex items-center gap-3">
            <SparkMark className="size-7 text-primary" />
            <span className="eyebrow">Certificate verification</span>
          </div>

          {result.status === "not_found" && (
            <>
              <SearchX className="mb-4 size-9 text-muted-foreground" aria-hidden />
              <h1 className="text-3xl font-bold">No certificate found</h1>
              <p className="mt-3 text-muted-foreground">
                We have no record of{" "}
                <span className="font-mono text-foreground">
                  {decodeURIComponent(code)}
                </span>
                . Check the code against the certificate and try again — it is
                eight characters, written as{" "}
                <span className="font-mono">SPARK-XXXX-XXXX</span>.
              </p>
            </>
          )}

          {result.status === "revoked" && (
            <>
              <CircleSlash className="mb-4 size-9 text-destructive" aria-hidden />
              <h1 className="text-3xl font-bold">This certificate was revoked</h1>
              <p className="mt-3 text-muted-foreground">
                It was issued to <strong>{result.recipientName}</strong> for{" "}
                <strong>{result.eventTitle}</strong>, then withdrawn by SPARK.
                It should not be treated as valid.
              </p>
              {result.revokedReason && (
                <p className="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm">
                  {result.revokedReason}
                </p>
              )}
            </>
          )}

          {result.status === "valid" && (
            <>
              <BadgeCheck className="mb-4 size-9 text-emerald-400" aria-hidden />
              <h1 className="text-3xl font-bold">This certificate is genuine</h1>
              <p className="mt-3 text-muted-foreground">
                Issued by SPARK Chapter Pakistan and verified against our records.
              </p>

              <dl className="mt-7 space-y-4 border-t border-border pt-6">
                <div>
                  <dt className="eyebrow">Awarded to</dt>
                  <dd className="mt-1 text-xl font-semibold">
                    {result.recipientName}
                  </dd>
                </div>
                <div>
                  <dt className="eyebrow">For</dt>
                  <dd className="mt-1 text-lg">{result.eventTitle}</dd>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <dt className="eyebrow">Event date</dt>
                    <dd className="mt-1 text-sm text-muted-foreground">
                      {formatDate(result.eventDate)}
                    </dd>
                  </div>
                  <div>
                    <dt className="eyebrow">Issued</dt>
                    <dd className="mt-1 text-sm text-muted-foreground">
                      {formatDate(result.issuedAt)}
                    </dd>
                  </div>
                </div>
                <div>
                  <dt className="eyebrow">Code</dt>
                  <dd className="mt-1 font-mono text-sm tracking-widest">
                    {result.code}
                  </dd>
                </div>
              </dl>
            </>
          )}

          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild variant="outline">
              <Link href="/verify">Check another code</Link>
            </Button>
            <Button asChild variant="ghost">
              <Link href="/">Go to SPARK</Link>
            </Button>
          </div>
        </div>
      </Reveal>
    </main>
  );
}
