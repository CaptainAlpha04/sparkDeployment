import { describe, expect, it } from "vitest";
import { buildCertificatePdf } from "./certificate-pdf";
import type { TemplateField } from "@/lib/certificate-types";

/**
 * The download used to go through the browser print dialog and produced blank
 * pages. These assert the PDF is actually built and contains something.
 */

// Smallest valid PNG: a single opaque pixel.
const PNG_1PX =
  "data:image/png;base64," +
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

const values = {
  recipient_name: "Ayesha Khan",
  event_title: "SPARKx Talk",
  event_date: "27 October 2025",
  certificate_code: "SPARK-A7K2-9QX4",
  issued_date: "15 August 2026",
  verify_url: "https://sparkchapter.com/verify/SPARK-A7K2-9QX4",
};

const field = (over: Partial<TemplateField>): TemplateField => ({
  id: "f",
  source: "recipient_name",
  x: 0.5,
  y: 0.5,
  fontSize: 0.08,
  color: "#1a1030",
  align: "center",
  weight: 700,
  family: "sans",
  ...over,
});

async function build(fields: TemplateField[]) {
  return buildCertificatePdf({
    backgroundUrl: PNG_1PX,
    backgroundWidth: 2000,
    backgroundHeight: 1414,
    fields,
    values,
  });
}

describe("buildCertificatePdf", () => {
  it("produces a real PDF", async () => {
    const pdf = await build([field({})]);
    expect(Buffer.from(pdf.slice(0, 5)).toString()).toBe("%PDF-");
    expect(pdf.byteLength).toBeGreaterThan(500);
  });

  it("renders every field source without throwing", async () => {
    const pdf = await build([
      field({ id: "a", source: "recipient_name" }),
      field({ id: "b", source: "event_title", y: 0.6 }),
      field({ id: "c", source: "event_date", y: 0.7 }),
      field({ id: "d", source: "issued_date", y: 0.75 }),
      field({ id: "e", source: "certificate_code", y: 0.9, family: "mono" }),
      field({ id: "f", source: "static", text: "Certificate", y: 0.3 }),
      field({ id: "g", source: "qr_code", x: 0.88, y: 0.84, fontSize: 0.13 }),
    ]);
    expect(pdf.byteLength).toBeGreaterThan(1000);
  });

  it("handles every typeface and alignment", async () => {
    const families: TemplateField["family"][] = [
      "display",
      "sans",
      "serif",
      "mono",
    ];
    const aligns: TemplateField["align"][] = ["left", "center", "right"];

    const fields = families.flatMap((family, i) =>
      aligns.map((align, j) =>
        field({ id: `${family}-${align}`, family, align, y: 0.1 + i * 0.2 + j * 0.05 }),
      ),
    );

    const pdf = await build(fields);
    expect(Buffer.from(pdf.slice(0, 5)).toString()).toBe("%PDF-");
  });

  it("draws letter-spaced text without throwing", async () => {
    // Tracked text is drawn glyph by glyph, since pdf-lib has no letter
    // spacing. That path is easy to break and never exercised otherwise.
    const pdf = await build([field({ letterSpacing: 0.12, uppercase: true })]);
    expect(pdf.byteLength).toBeGreaterThan(500);
  });

  it("skips empty fields rather than drawing blanks", async () => {
    const withText = await build([field({ source: "static", text: "Hello" })]);
    const withoutText = await build([field({ source: "static", text: "" })]);
    expect(withoutText.byteLength).toBeLessThan(withText.byteLength);
  });

  it("explains itself when the artwork is not a PNG or JPEG", async () => {
    await expect(
      buildCertificatePdf({
        backgroundUrl: "data:image/webp;base64,UklGRhoAAABXRUJQVlA4TA0AAAAvAAAAEAcQERGIiP4HAA==",
        backgroundWidth: 100,
        backgroundHeight: 100,
        fields: [field({})],
        values,
      }),
    ).rejects.toThrow(/PNG or JPEG/i);
  });
});
