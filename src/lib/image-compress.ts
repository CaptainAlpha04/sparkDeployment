/**
 * Browser-side image compression, run before anything is uploaded.
 *
 * The problem this solves: a photo dragged straight off a phone into the
 * editor is 3 to 5 MB. Supabase's free tier allows 1 GB of storage and 2 GB of
 * egress a month, so a couple of hundred unprocessed images exhausts the
 * project. Supabase's own image transformation API would solve the delivery
 * half of this, but it is a paid Pro feature, so it is not available to us.
 *
 * Compressing at the source is strictly better than transforming on the way
 * out anyway: the bytes we never store cost nothing to store, nothing to back
 * up, and nothing to serve. Delivery is then handled by next/image, which
 * emits responsive AVIF and WebP from Vercel's edge cache.
 *
 * Everything here is browser-only — it touches `document` and `createImageBitmap`.
 */

/** Longest edge, in pixels, of a stored image. */
const MAX_EDGE = 2000;
/** Longest edge for a cover image, which is only ever shown full-bleed. */
export const COVER_MAX_EDGE = 2400;
const WEBP_QUALITY = 0.82;

export type CompressedImage = {
  blob: Blob;
  contentType: string;
  extension: string;
  width: number;
  height: number;
  /** Lowercase hex sha-256 of the final bytes, used to name the object. */
  hash: string;
  originalBytes: number;
};

export class ImageRejected extends Error {}

/**
 * SVG is deliberately refused. It is a document format that can carry script
 * and external references, and it would be served from our own origin off a
 * public bucket. No amount of convenience is worth that.
 */
const REJECTED = new Set(["image/svg+xml"]);

/** Animation does not survive a canvas round trip, so these pass through as-is. */
const PASS_THROUGH = new Set(["image/gif", "image/avif"]);

async function sha256Hex(buffer: ArrayBuffer): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", buffer);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function fit(width: number, height: number, maxEdge: number) {
  const longest = Math.max(width, height);
  // Never upscale. Enlarging a small image adds bytes and no detail.
  if (longest <= maxEdge) return { width, height };
  const scale = maxEdge / longest;
  return {
    width: Math.round(width * scale),
    height: Math.round(height * scale),
  };
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality: number,
): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

/**
 * Downscale and re-encode to WebP.
 *
 * Falls back to the original bytes whenever re-encoding would not actually
 * help — an already-small PNG screenshot of flat UI colour, for instance,
 * often survives WebP conversion larger than it started.
 */
export async function compressImage(
  file: File,
  { maxEdge = MAX_EDGE }: { maxEdge?: number } = {},
): Promise<CompressedImage> {
  if (!file.type.startsWith("image/")) {
    throw new ImageRejected("That file is not an image.");
  }
  if (REJECTED.has(file.type)) {
    throw new ImageRejected(
      "SVG uploads are not supported. Export a PNG or JPEG instead.",
    );
  }

  const originalBytes = file.size;

  if (PASS_THROUGH.has(file.type)) {
    const buffer = await file.arrayBuffer();
    const bitmap = await createImageBitmap(file);
    const result: CompressedImage = {
      blob: file,
      contentType: file.type,
      extension: file.type === "image/gif" ? "gif" : "avif",
      width: bitmap.width,
      height: bitmap.height,
      hash: await sha256Hex(buffer),
      originalBytes,
    };
    bitmap.close();
    return result;
  }

  const bitmap = await createImageBitmap(file);
  const { width, height } = fit(bitmap.width, bitmap.height, maxEdge);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    throw new ImageRejected("This browser could not process the image.");
  }
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const webp = await canvasToBlob(canvas, "image/webp", WEBP_QUALITY);

  // toBlob returns null when the type is unsupported, and browsers silently
  // substitute PNG rather than failing, so check the type we got back too.
  const usable = webp && webp.type === "image/webp" && webp.size < originalBytes;
  const blob = usable ? webp : file;
  const buffer = await blob.arrayBuffer();

  return {
    blob,
    contentType: usable ? "image/webp" : file.type,
    extension: usable ? "webp" : (file.name.split(".").pop() || "bin").toLowerCase(),
    width: usable ? width : bitmap.width,
    height: usable ? height : bitmap.height,
    hash: await sha256Hex(buffer),
    originalBytes,
  };
}

/** Human-readable byte count for the upload feedback line. */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
