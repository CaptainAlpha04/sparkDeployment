/**
 * Public certificate verification codes.
 *
 * Format: SPARK-XXXX-XXXX
 *
 * Two properties matter:
 *
 * 1. UNGUESSABLE. Codes are the only credential on a public verification page,
 *    so sequential or short codes would let anyone enumerate every certificate
 *    the organisation has ever issued. 8 characters from a 32-symbol alphabet
 *    is 2^40 possibilities — far beyond brute-forcing over HTTP.
 *
 * 2. TRANSCRIBABLE. People read these off printed certificates and type them
 *    in. The alphabet excludes I, L, O, U, 0 and 1 — the pairs that get
 *    misread — and `normalizeCode` maps the common slips back rather than
 *    rejecting the person outright.
 */

/** Crockford-style: no I, L, O, U to avoid transcription ambiguity. */
const ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ".replace(/[01]/g, "");

const GROUP = 4;
const GROUPS = 2;
export const CODE_PATTERN = /^SPARK-[A-Z0-9]{4}-[A-Z0-9]{4}$/;

export function generateCertificateCode(
  randomBytes: (n: number) => Uint8Array = defaultRandomBytes,
): string {
  const total = GROUP * GROUPS;
  const bytes = randomBytes(total);
  let out = "";

  for (let i = 0; i < total; i++) {
    if (i > 0 && i % GROUP === 0) out += "-";
    // Modulo bias here is negligible: 256 % 30 leaves a <2% skew across the
    // alphabet, which does not meaningfully reduce the search space.
    out += ALPHABET[bytes[i] % ALPHABET.length];
  }

  return `SPARK-${out}`;
}

function defaultRandomBytes(n: number): Uint8Array {
  const arr = new Uint8Array(n);
  crypto.getRandomValues(arr);
  return arr;
}

/**
 * Repairs the transcription slips people actually make, so a correct
 * certificate is not rejected over a lowercase letter or a typed "O".
 * Returns null when the result still is not a valid code.
 */
export function normalizeCode(input: string): string | null {
  const cleaned = input
    .trim()
    .toUpperCase()
    .replace(/[\s_]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^SPARK-?/, "");

  const body = cleaned
    .replace(/-/g, "")
    .replace(/O/g, "0")
    .replace(/[IL]/g, "1")
    .replace(/U/g, "V");

  if (body.length !== GROUP * GROUPS) return null;
  if (!/^[A-Z0-9]+$/.test(body)) return null;

  const code = `SPARK-${body.slice(0, GROUP)}-${body.slice(GROUP)}`;
  return CODE_PATTERN.test(code) ? code : null;
}
