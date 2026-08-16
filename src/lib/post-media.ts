"use client";

import { createClient } from "@/lib/supabase/client";
import {
  compressImage,
  COVER_MAX_EDGE,
  type CompressedImage,
} from "@/lib/image-compress";

export const POST_MEDIA_BUCKET = "post-media";

export type UploadedImage = {
  url: string;
  width: number;
  height: number;
  /** Bytes actually stored, after compression. */
  bytes: number;
  originalBytes: number;
  /** True when these exact bytes were already in the bucket. */
  deduped: boolean;
};

/**
 * Upload an image for a post, from the browser, straight to storage.
 *
 * Direct-to-storage rather than through a Server Action on purpose. Server
 * Action bodies are capped at 4.5 MB on Vercel, and routing an upload through
 * a function burns execution time to do nothing but forward bytes. The write
 * is gated by the `editors write post media` RLS policy, which calls the
 * SECURITY DEFINER `is_editor()` — the browser client carries the user's JWT,
 * so an ordinary member's upload is rejected by Postgres, not by our UI.
 *
 * Objects are content addressed: the name is the sha-256 of the compressed
 * bytes. Pasting the same screenshot into three posts stores it once, and
 * re-uploading after an undo is free.
 */
export async function uploadPostImage(
  file: File,
  postId: string,
  { cover = false }: { cover?: boolean } = {},
): Promise<UploadedImage> {
  const image: CompressedImage = await compressImage(file, {
    maxEdge: cover ? COVER_MAX_EDGE : undefined,
  });

  const supabase = createClient();
  // Prefixed by post so deleting a post can sweep its whole folder.
  const path = `posts/${postId}/${image.hash}.${image.extension}`;

  const { error } = await supabase.storage
    .from(POST_MEDIA_BUCKET)
    .upload(path, image.blob, {
      contentType: image.contentType,
      upsert: false,
      // A year, immutable: the name is a hash of the contents, so these bytes
      // can never change under this URL.
      cacheControl: "31536000",
    });

  // 409 means an object already exists at this path. Because the path is the
  // content hash, that is not a collision — it is the same image. Treat it as
  // a hit rather than an error.
  const deduped =
    !!error && ("statusCode" in error ? error.statusCode === "409" : false);

  if (error && !deduped) {
    throw new Error(
      error.message === "new row violates row-level security policy"
        ? "Your account is not allowed to upload images."
        : error.message,
    );
  }

  const { data } = supabase.storage.from(POST_MEDIA_BUCKET).getPublicUrl(path);

  return {
    url: data.publicUrl,
    width: image.width,
    height: image.height,
    bytes: image.blob.size,
    originalBytes: image.originalBytes,
    deduped,
  };
}
