import type { TemplateField } from "@/lib/certificate-types";

export type CertificateValues = {
  recipient_name: string;
  event_title: string;
  event_date: string;
  certificate_code: string;
  issued_date: string;
};

const FAMILY_VAR: Record<TemplateField["family"], string> = {
  display: "var(--font-bricolage), system-ui, sans-serif",
  sans: "var(--font-inter), system-ui, sans-serif",
  mono: "var(--font-geist-mono), ui-monospace, monospace",
};

export function fieldText(field: TemplateField, values: CertificateValues): string {
  if (field.source === "static") return field.text ?? "";
  return values[field.source] ?? "";
}

type Props = {
  backgroundUrl: string;
  backgroundWidth: number;
  backgroundHeight: number;
  fields: TemplateField[];
  values: CertificateValues;
  /** Rendered width in px. Everything scales from this. */
  width?: number;
  className?: string;
};

/**
 * Renders a certificate.
 *
 * Used by the designer preview, the public verification page, and download —
 * one implementation, so what an admin positions is exactly what a recipient
 * receives and a verifier sees.
 *
 * All field geometry is fractional (0–1), so the same template renders
 * correctly at a 320px thumbnail or a 2000px print export. Font sizes are a
 * fraction of height and converted with `em` against a root font-size set on
 * the container.
 */
export function CertificateRender({
  backgroundUrl,
  backgroundWidth,
  backgroundHeight,
  fields,
  values,
  width = 900,
  className = "",
}: Props) {
  const height = (width * backgroundHeight) / backgroundWidth;

  return (
    <div
      className={`relative overflow-hidden bg-white ${className}`}
      style={{ width, height }}
    >
      {/* Deliberately a plain img, not next/image: this element is rasterised
          to canvas for download, and next/image's srcset and lazy loading
          interfere with that. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={backgroundUrl}
        alt=""
        width={backgroundWidth}
        height={backgroundHeight}
        className="absolute inset-0 h-full w-full object-cover"
        crossOrigin="anonymous"
      />

      {fields.map((field) => {
        const text = fieldText(field, values);
        if (!text) return null;

        return (
          <span
            key={field.id}
            className="absolute whitespace-pre"
            style={{
              left: `${field.x * 100}%`,
              top: `${field.y * 100}%`,
              transform: `translate(${
                field.align === "center"
                  ? "-50%"
                  : field.align === "right"
                    ? "-100%"
                    : "0"
              }, -50%)`,
              fontSize: height * field.fontSize,
              lineHeight: 1.1,
              color: field.color,
              fontWeight: field.weight,
              fontFamily: FAMILY_VAR[field.family],
              letterSpacing: field.letterSpacing
                ? `${field.letterSpacing}em`
                : undefined,
              textTransform: field.uppercase ? "uppercase" : undefined,
              textAlign: field.align,
            }}
          >
            {text}
          </span>
        );
      })}
    </div>
  );
}

/** Sensible starting layout for a new template. */
export function defaultFields(): TemplateField[] {
  return [
    {
      id: "title",
      source: "static",
      text: "Certificate of Participation",
      x: 0.5,
      y: 0.3,
      fontSize: 0.06,
      color: "#1a1030",
      align: "center",
      weight: 700,
      family: "display",
      letterSpacing: 0.02,
    },
    {
      id: "recipient",
      source: "recipient_name",
      x: 0.5,
      y: 0.47,
      fontSize: 0.085,
      color: "#7c3aed",
      align: "center",
      weight: 700,
      family: "display",
    },
    {
      id: "event",
      source: "event_title",
      x: 0.5,
      y: 0.62,
      fontSize: 0.035,
      color: "#33304a",
      align: "center",
      weight: 500,
      family: "sans",
    },
    {
      id: "date",
      source: "event_date",
      x: 0.5,
      y: 0.7,
      fontSize: 0.026,
      color: "#66627f",
      align: "center",
      weight: 400,
      family: "sans",
    },
    {
      id: "code",
      source: "certificate_code",
      x: 0.5,
      y: 0.9,
      fontSize: 0.022,
      color: "#8b88a3",
      align: "center",
      weight: 400,
      family: "mono",
      letterSpacing: 0.08,
    },
  ];
}
