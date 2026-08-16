/**
 * Certificate template field shapes.
 *
 * These live in lib rather than alongside the Drizzle schema because both the
 * database layer AND client components need them, and the ESLint boundary
 * (rightly) stops UI code importing from src/server/schema. The schema imports
 * these types; nothing flows the other way.
 */

export type TemplateFieldSource =
  | "recipient_name"
  | "event_title"
  | "event_date"
  | "certificate_code"
  | "issued_date"
  | "static"
  /** Scannable link to the public verification page for this certificate. */
  | "qr_code";

export type TemplateField = {
  id: string;
  /** Which value fills this field at issue time. `static` uses `text`. */
  source: TemplateFieldSource;
  /** Literal content — only used when source is "static". */
  text?: string;
  /** 0–1, fraction of background width/height. */
  x: number;
  y: number;
  /** Fraction of background height, so type scales with the artwork. */
  fontSize: number;
  color: string;
  align: "left" | "center" | "right";
  weight: number;
  family: "display" | "sans" | "mono";
  letterSpacing?: number;
  uppercase?: boolean;
};

export const FIELD_SOURCE_LABELS: Record<TemplateFieldSource, string> = {
  recipient_name: "Recipient name",
  event_title: "Event title",
  event_date: "Event date",
  certificate_code: "Certificate code",
  issued_date: "Issue date",
  static: "Fixed text",
  qr_code: "QR code",
};

/** Sources that render as a square graphic rather than a line of text. */
export function isGraphicField(source: TemplateFieldSource): boolean {
  return source === "qr_code";
}
