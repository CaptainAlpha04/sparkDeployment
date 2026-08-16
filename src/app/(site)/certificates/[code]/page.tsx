import type { Metadata } from "next";
import { verifyUrl } from "@/lib/site-url";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { getCertificateForRender } from "@/server/certificates";
import { requireUser, isAdminRole } from "@/server/auth";
import { CertificateRender } from "@/components/certificates/certificate-render";
import { DownloadButton } from "@/components/certificates/download-button";

export const metadata: Metadata = {
  title: "Your certificate | SPARK",
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

export default async function CertificatePage({
  params,
}: PageProps<"/certificates/[code]">) {
  const { code } = await params;

  // Signed-in view of the full artwork. The holder and admins only — the
  // public route is /verify/[code], which shows the facts without the
  // downloadable asset.
  const me = await requireUser();
  const found = await getCertificateForRender(code);
  if (!found) notFound();

  const { certificate, template } = found;
  if (certificate.userId !== me.id && !isAdminRole(me.role)) notFound();

  const values = {
    recipient_name: certificate.recipientName,
    event_title: certificate.eventTitle,
    event_date: formatDate(certificate.eventDate),
    certificate_code: certificate.code,
                    verify_url: verifyUrl(certificate.code),
    issued_date: formatDate(certificate.issuedAt),
  };

  return (
    <main className="min-h-screen w-full bg-gradient-to-b from-slate-950 to-background px-6 pt-28 pb-16">
      <div className="mx-auto max-w-4xl">
        <div className="print:hidden">
          <Link
            href="/dashboard/certificates"
            className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" /> Your certificates
          </Link>

          {certificate.revokedAt && (
            <div className="mb-6 rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm">
              This certificate has been revoked and is no longer valid.
              {certificate.revokedReason && ` ${certificate.revokedReason}`}
            </div>
          )}
        </div>

        {/* The only element that survives printing. */}
        <div className="certificate-sheet mx-auto w-fit overflow-hidden rounded-xl shadow-2xl print:rounded-none print:shadow-none">
          <CertificateRender
            backgroundUrl={template.backgroundUrl}
            backgroundWidth={template.backgroundWidth}
            backgroundHeight={template.backgroundHeight}
            fields={template.fields}
            values={values}
            width={900}
          />
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-3 print:hidden">
          <DownloadButton code={certificate.code} />
          <Link
            href={`/verify/${certificate.code}`}
            className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm transition-colors hover:bg-white/5"
          >
            <ShieldCheck className="size-4" />
            Public verification page
          </Link>
          <span className="font-mono text-xs tracking-widest text-muted-foreground">
            {certificate.code}
          </span>
        </div>

        <p className="mt-4 text-xs text-muted-foreground print:hidden">
          The PDF is generated on our side, so it looks the same wherever you
          open it.
          Anyone can confirm this certificate is genuine at{" "}
          <span className="font-mono">/verify/{certificate.code}</span>.
        </p>
      </div>
    </main>
  );
}
