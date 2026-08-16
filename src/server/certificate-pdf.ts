import { PDFDocument, StandardFonts, rgb, type PDFFont } from "pdf-lib";
import QRCode from "qrcode";
import type { TemplateField } from "@/lib/certificate-types";

/**
 * Renders a certificate to a real PDF.
 *
 * This replaces a print-to-PDF flow that opened the browser dialog and
 * produced blank pages, because print stylesheets drop background images by
 * default and the sheet was laid out with absolutely positioned elements the
 * print renderer collapsed.
 *
 * Everything is drawn here instead: the artwork, the text, and the QR. No
 * headless browser, no print dialog, and identical output on every machine.
 *
 * FONTS: only the fonts built into the PDF spec are used, so nothing has to be
 * embedded or downloaded and the output is byte-identical everywhere. The
 * on-screen renderer uses matching CSS stacks, so the designer preview and the
 * downloaded file agree.
 */

/** A4 landscape width in points. Height follows the artwork's aspect. */
const PAGE_WIDTH = 842;

type Values = {
  recipient_name: string;
  event_title: string;
  event_date: string;
  certificate_code: string;
  issued_date: string;
  verify_url: string;
};

function hexToRgb(hex: string) {
  const clean = hex.replace("#", "").trim();
  const full =
    clean.length === 3
      ? clean
          .split("")
          .map((c) => c + c)
          .join("")
      : clean;
  const n = Number.parseInt(full, 16);
  if (Number.isNaN(n)) return rgb(0, 0, 0);
  return rgb(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
}

function fieldValue(field: TemplateField, values: Values): string {
  if (field.source === "static") return field.text ?? "";
  if (field.source === "qr_code") return "";
  return values[field.source] ?? "";
}

export async function buildCertificatePdf(input: {
  backgroundUrl: string;
  backgroundWidth: number;
  backgroundHeight: number;
  fields: TemplateField[];
  values: Values;
}): Promise<Uint8Array> {
  const { backgroundWidth, backgroundHeight, fields, values } = input;

  const pageHeight = (PAGE_WIDTH * backgroundHeight) / backgroundWidth;
  const doc = await PDFDocument.create();
  const page = doc.addPage([PAGE_WIDTH, pageHeight]);

  doc.setTitle(`SPARK certificate ${values.certificate_code}`);
  doc.setSubject(values.event_title);
  doc.setProducer("SPARK Chapter");

  /* ── Background ──────────────────────────────────────────────────────── */

  const response = await fetch(input.backgroundUrl);
  if (!response.ok) {
    throw new Error("Could not load the certificate artwork");
  }
  const bytes = new Uint8Array(await response.arrayBuffer());
  const type = response.headers.get("content-type") ?? "";

  // pdf-lib embeds PNG and JPEG only. WebP is accepted at upload, so it is
  // rejected here with a message that says what to do rather than a stack.
  const image = type.includes("png")
    ? await doc.embedPng(bytes)
    : type.includes("jpeg") || type.includes("jpg")
      ? await doc.embedJpg(bytes)
      : null;

  if (!image) {
    throw new Error(
      "Certificate artwork must be a PNG or JPEG to export as PDF. Re-upload the background in one of those formats.",
    );
  }

  page.drawImage(image, { x: 0, y: 0, width: PAGE_WIDTH, height: pageHeight });

  /* ── Fonts ───────────────────────────────────────────────────────────── */

  const [helvetica, helveticaBold, times, timesBold, courier, courierBold] =
    await Promise.all([
      doc.embedFont(StandardFonts.Helvetica),
      doc.embedFont(StandardFonts.HelveticaBold),
      doc.embedFont(StandardFonts.TimesRoman),
      doc.embedFont(StandardFonts.TimesRomanBold),
      doc.embedFont(StandardFonts.Courier),
      doc.embedFont(StandardFonts.CourierBold),
    ]);

  const pick = (field: TemplateField): PDFFont => {
    const bold = field.weight >= 600;
    if (field.family === "serif") return bold ? timesBold : times;
    if (field.family === "mono") return bold ? courierBold : courier;
    // "display" and "sans" both resolve to Helvetica; weight distinguishes them.
    return bold ? helveticaBold : helvetica;
  };

  /* ── Fields ──────────────────────────────────────────────────────────── */

  for (const field of fields) {
    if (field.source === "qr_code") {
      drawQr(page, field, values.verify_url, PAGE_WIDTH, pageHeight);
      continue;
    }

    let text = fieldValue(field, values);
    if (!text) continue;
    if (field.uppercase) text = text.toUpperCase();

    const font = pick(field);
    const size = field.fontSize * pageHeight;
    const tracking = (field.letterSpacing ?? 0) * size;

    // Width including letter spacing, which pdf-lib does not account for.
    const width =
      font.widthOfTextAtSize(text, size) + tracking * Math.max(0, text.length - 1);

    const centerX = field.x * PAGE_WIDTH;
    const x =
      field.align === "center"
        ? centerX - width / 2
        : field.align === "right"
          ? centerX - width
          : centerX;

    // PDF's origin is bottom-left and drawText places the baseline. The web
    // renderer centres the glyphs on the point, so shift down by roughly half
    // the cap height to match.
    const y = pageHeight - field.y * pageHeight - size * 0.36;

    if (tracking === 0) {
      page.drawText(text, { x, y, size, font, color: hexToRgb(field.color) });
    } else {
      // pdf-lib has no letter-spacing, so tracked text is drawn per glyph.
      let cursor = x;
      for (const char of text) {
        page.drawText(char, {
          x: cursor,
          y,
          size,
          font,
          color: hexToRgb(field.color),
        });
        cursor += font.widthOfTextAtSize(char, size) + tracking;
      }
    }
  }

  return doc.save();
}

function drawQr(
  page: ReturnType<PDFDocument["addPage"]>,
  field: TemplateField,
  url: string,
  pageWidth: number,
  pageHeight: number,
) {
  const qr = QRCode.create(url, { errorCorrectionLevel: "M" });
  const count = qr.modules.size;
  const data = qr.modules.data;

  const margin = 4;
  const total = count + margin * 2;
  const edge = field.fontSize * pageHeight;
  const cell = edge / total;

  const left = field.x * pageWidth - edge / 2;
  const top = pageHeight - field.y * pageHeight + edge / 2;

  // White quiet zone. Without it scanners struggle to lock on, and the
  // artwork behind would otherwise show through the code.
  page.drawRectangle({
    x: left,
    y: top - edge,
    width: edge,
    height: edge,
    color: rgb(1, 1, 1),
  });

  const dark = hexToRgb(field.color);
  for (let row = 0; row < count; row += 1) {
    for (let col = 0; col < count; col += 1) {
      if (!data[row * count + col]) continue;
      page.drawRectangle({
        x: left + (col + margin) * cell,
        // Rows run top-down; PDF y runs bottom-up.
        y: top - (row + margin + 1) * cell,
        width: cell,
        height: cell,
        color: dark,
      });
    }
  }
}
