import { getCertificateForRender } from "@/server/certificates";
import { getCurrentProfile, isAdminRole } from "@/server/auth";
import { buildCertificatePdf } from "@/server/certificate-pdf";
import { verifyUrl } from "@/lib/site-url";

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Karachi",
  }).format(date);
}

/**
 * Streams the certificate as a PDF.
 *
 * Same authorisation as the certificate page: the holder, or an admin. The
 * public verification result lives at /verify/<code> and never exposes the
 * artwork itself.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;

  const profile = await getCurrentProfile();
  if (!profile) {
    return new Response("Not authenticated", { status: 401 });
  }

  const found = await getCertificateForRender(code);
  if (!found) return new Response("Not found", { status: 404 });

  const { certificate, template } = found;
  if (certificate.userId !== profile.id && !isAdminRole(profile.role)) {
    // 404 rather than 403: whether a certificate exists is not this caller's
    // business.
    return new Response("Not found", { status: 404 });
  }

  try {
    const pdf = await buildCertificatePdf({
      backgroundUrl: template.backgroundUrl,
      backgroundWidth: template.backgroundWidth,
      backgroundHeight: template.backgroundHeight,
      fields: template.fields,
      values: {
        recipient_name: certificate.recipientName,
        event_title: certificate.eventTitle,
        event_date: formatDate(certificate.eventDate),
        certificate_code: certificate.code,
        issued_date: formatDate(certificate.issuedAt),
        verify_url: verifyUrl(certificate.code),
      },
    });

    const filename = `SPARK-certificate-${certificate.code}.pdf`;

    return new Response(pdf as BodyInit, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": String(pdf.byteLength),
        // A certificate never changes once issued, but it is personal, so it
        // is cached by the browser and never by a shared proxy.
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (error) {
    return new Response((error as Error).message, { status: 500 });
  }
}
