import { describe, expect, it } from "vitest";
import QRCode from "qrcode";
import { verifyUrl, siteUrl } from "./site-url";
import { normalizeCode, generateCertificateCode } from "./certificate-code";

describe("verifyUrl", () => {
  it("builds an absolute URL to the public verification page", () => {
    const url = verifyUrl("SPARK-A7K2-9QX4");
    expect(url).toMatch(/^https?:\/\//);
    expect(url.endsWith("/verify/SPARK-A7K2-9QX4")).toBe(true);
  });

  it("does not produce a double slash when the base has a trailing one", () => {
    const original = process.env.NEXT_PUBLIC_SITE_URL;
    process.env.NEXT_PUBLIC_SITE_URL = "https://sparkchapter.com/";
    expect(verifyUrl("SPARK-A7K2-9QX4")).toBe(
      "https://sparkchapter.com/verify/SPARK-A7K2-9QX4",
    );
    process.env.NEXT_PUBLIC_SITE_URL = original;
  });

  it("always returns a parseable URL", () => {
    expect(() => new URL(siteUrl())).not.toThrow();
  });
});

describe("certificate QR", () => {
  it("encodes a URL that round-trips back to the same code", async () => {
    // The QR is printed on paper. If what it encodes does not resolve to a
    // working verification page, there is no way to correct it afterwards.
    const code = generateCertificateCode();
    const url = verifyUrl(code);

    const qr = QRCode.create(url, { errorCorrectionLevel: "M" });
    expect(qr.modules.size).toBeGreaterThan(0);

    const path = new URL(url).pathname;
    expect(path.startsWith("/verify/")).toBe(true);

    const encoded = decodeURIComponent(path.replace("/verify/", ""));
    expect(normalizeCode(encoded)).toBe(code);
  });

  it("stays within a version that prints legibly at certificate scale", async () => {
    // Beyond roughly 45 modules the cells get too fine to scan reliably from
    // a printed certificate at the size the template uses.
    const url = verifyUrl(generateCertificateCode());
    const qr = QRCode.create(url, { errorCorrectionLevel: "M" });
    expect(qr.modules.size).toBeLessThanOrEqual(45);
  });
});
