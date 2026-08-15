import { describe, expect, it } from "vitest";
import {
  CODE_PATTERN,
  generateCertificateCode,
  normalizeCode,
} from "./certificate-code";

describe("generateCertificateCode", () => {
  it("produces the documented format", () => {
    for (let i = 0; i < 50; i++) {
      expect(generateCertificateCode()).toMatch(CODE_PATTERN);
    }
  });

  it("never emits ambiguous characters", () => {
    // I/L/O/U are excluded so codes survive being read off paper.
    for (let i = 0; i < 200; i++) {
      const body = generateCertificateCode().replace("SPARK-", "");
      expect(body).not.toMatch(/[ILOU]/);
    }
  });

  it("is not sequential or predictable", () => {
    // The code is the only credential on a public page. If codes collided or
    // clustered, anyone could enumerate every certificate ever issued.
    const seen = new Set<string>();
    for (let i = 0; i < 2000; i++) seen.add(generateCertificateCode());
    expect(seen.size).toBe(2000);
  });

  it("uses the injected randomness source", () => {
    const fixed = (n: number) => new Uint8Array(n).fill(0);
    const a = generateCertificateCode(fixed);
    const b = generateCertificateCode(fixed);
    expect(a).toBe(b);
    expect(a).toMatch(CODE_PATTERN);
  });
});

describe("normalizeCode", () => {
  it("accepts a correctly formatted code unchanged", () => {
    expect(normalizeCode("SPARK-A7K2-9QX4")).toBe("SPARK-A7K2-9QX4");
  });

  it("accepts lowercase", () => {
    expect(normalizeCode("spark-a7k2-9qx4")).toBe("SPARK-A7K2-9QX4");
  });

  it("accepts the bare body without the prefix", () => {
    expect(normalizeCode("A7K29QX4")).toBe("SPARK-A7K2-9QX4");
  });

  it("tolerates spaces and stray separators", () => {
    expect(normalizeCode("  SPARK A7K2 9QX4 ")).toBe("SPARK-A7K2-9QX4");
    expect(normalizeCode("SPARK--A7K2--9QX4")).toBe("SPARK-A7K2-9QX4");
  });

  it("repairs the transcription slips people actually make", () => {
    // O read as zero, I/L read as one, U read as V.
    expect(normalizeCode("SPARK-A7KO-9QX4")).toBe("SPARK-A7K0-9QX4");
    expect(normalizeCode("SPARK-A7KI-9QX4")).toBe("SPARK-A7K1-9QX4");
    expect(normalizeCode("SPARK-A7KL-9QX4")).toBe("SPARK-A7K1-9QX4");
    expect(normalizeCode("SPARK-A7KU-9QX4")).toBe("SPARK-A7KV-9QX4");
  });

  it("rejects wrong lengths and junk", () => {
    expect(normalizeCode("")).toBeNull();
    expect(normalizeCode("SPARK-A7K2")).toBeNull();
    expect(normalizeCode("SPARK-A7K2-9QX4-EXTRA")).toBeNull();
    expect(normalizeCode("A7K2-9QX!")).toBeNull();
    expect(normalizeCode("<script>alert(1)</script>")).toBeNull();
  });

  it("round-trips anything the generator produces", () => {
    for (let i = 0; i < 200; i++) {
      const code = generateCertificateCode();
      expect(normalizeCode(code)).toBe(code);
    }
  });
});
