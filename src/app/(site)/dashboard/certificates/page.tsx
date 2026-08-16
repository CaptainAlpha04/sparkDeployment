import Link from "next/link";
import { verifyUrl } from "@/lib/site-url";
import { Award, ExternalLink } from "lucide-react";
import { getMyCertificates } from "@/server/certificates";
import { CertificateRender } from "@/components/certificates/certificate-render";
import { Reveal, Stagger } from "@/components/motion/reveal";

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Karachi",
  }).format(date);
}

export default async function MyCertificatesPage() {
  const certificates = await getMyCertificates();

  return (
    <div>
      <Reveal>
        <p className="eyebrow mb-2">Your record</p>
        <h1 className="mb-2 text-4xl font-bold">Certificates</h1>
        <p className="mb-8 max-w-xl text-muted-foreground">
          Certificates are awarded for events you attended. Each carries a code
          anyone can verify — share it on a CV or LinkedIn.
        </p>
      </Reveal>

      {certificates.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-12 text-center">
          <Award className="mx-auto mb-3 size-8 text-muted-foreground" />
          <p className="text-muted-foreground">
            No certificates yet. They appear here once you have attended a SPARK
            event.
          </p>
          <Link
            href="/events"
            className="mt-4 inline-block text-sm text-primary hover:underline"
          >
            See upcoming events →
          </Link>
        </div>
      ) : (
        <Stagger step={90} className="grid gap-6 sm:grid-cols-2">
          {certificates.map((cert) => (
            <div
              key={cert.id}
              className="overflow-hidden rounded-xl border border-border bg-card/50"
            >
              <Link
                href={`/certificates/${cert.code}`}
                className="block transition-transform duration-300 hover:scale-[1.02]"
              >
                <CertificateRender
                  backgroundUrl={cert.template.backgroundUrl}
                  backgroundWidth={cert.template.backgroundWidth}
                  backgroundHeight={cert.template.backgroundHeight}
                  fields={cert.template.fields}
                  values={{
                    recipient_name: cert.recipientName,
                    event_title: cert.eventTitle,
                    event_date: formatDate(cert.eventDate),
                    certificate_code: cert.code,
                    verify_url: verifyUrl(cert.code),
                    issued_date: formatDate(cert.issuedAt),
                  }}
                  width={420}
                  className="w-full"
                />
              </Link>

              <div className="flex items-start justify-between gap-3 p-4">
                <div className="min-w-0">
                  <p className="truncate font-medium">{cert.eventTitle}</p>
                  <p className="mt-0.5 font-mono text-xs tracking-widest text-muted-foreground">
                    {cert.code}
                  </p>
                  {cert.revokedAt && (
                    <p className="mt-1 text-xs text-destructive">Revoked</p>
                  )}
                </div>
                <Link
                  href={`/certificates/${cert.code}`}
                  className="shrink-0 text-muted-foreground transition-colors hover:text-foreground"
                  aria-label="Open certificate"
                >
                  <ExternalLink className="size-4" />
                </Link>
              </div>
            </div>
          ))}
        </Stagger>
      )}
    </div>
  );
}
