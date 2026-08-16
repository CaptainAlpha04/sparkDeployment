"use client";

import { useRef, useState, type ReactNode } from "react";
import NextImage from "next/image";
import { ImagePlus, Loader2, RefreshCw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { uploadPostImage } from "@/lib/post-media";
import { formatBytes, ImageRejected } from "@/lib/image-compress";

type Props = {
  postId: string;
  url: string | null;
  alt: string | null;
  onChange: (value: { url: string | null; alt: string }) => void;
  /** The title and subtitle, drawn over the image once there is one. */
  children: ReactNode;
};

/**
 * The cover, edited in place as the hero it will become.
 *
 * The previous version put a thumbnail in the settings panel, which told you a
 * cover existed but nothing about how the page would look with it. Here the
 * image is the backdrop behind the headline, laid out exactly as the published
 * article lays it out, so choosing a cover is a decision about the finished
 * page rather than about a field in a form.
 *
 * Keep the scrim and the spacing in step with PostArticle. If the two drift,
 * this stops being a preview and becomes a second, lying design.
 */
export function CoverCanvas({ postId, url, alt, onChange, children }: Props) {
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  async function pick(file: File) {
    setBusy(true);
    try {
      const result = await uploadPostImage(file, postId, { cover: true });
      onChange({ url: result.url, alt: alt ?? "" });
      toast.success(
        result.deduped
          ? "Cover already uploaded, reused it"
          : `Cover added, ${formatBytes(result.originalBytes)} compressed to ${formatBytes(result.bytes)}`,
      );
    } catch (error) {
      toast.error(
        error instanceof ImageRejected || error instanceof Error
          ? error.message
          : "Could not upload that image",
      );
    } finally {
      setBusy(false);
    }
  }

  const fileInput = (
    <input
      ref={input}
      type="file"
      accept="image/png,image/jpeg,image/webp,image/avif"
      className="hidden"
      onChange={(event) => {
        const file = event.target.files?.[0];
        if (file) void pick(file);
        event.target.value = "";
      }}
    />
  );

  /* ---------------------------------------------------------------------
   * No cover: the headline sits on its own, with a quiet invitation above it.
   * ------------------------------------------------------------------ */
  if (!url) {
    return (
      <div
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          const file = event.dataTransfer.files?.[0];
          if (file?.type.startsWith("image/")) void pick(file);
        }}
        className={cn(
          "rounded-2xl transition-colors",
          dragging && "bg-primary/5 outline-2 outline-dashed outline-primary/40",
        )}
      >
        {fileInput}
        <button
          type="button"
          disabled={busy}
          onClick={() => input.current?.click()}
          className="mb-6 inline-flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-white/40 transition-colors hover:bg-white/5 hover:text-white/80 disabled:opacity-50"
        >
          {busy ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <ImagePlus className="size-4" />
          )}
          {busy ? "Compressing and uploading…" : "Add a cover image"}
        </button>

        {children}
      </div>
    );
  }

  /* ---------------------------------------------------------------------
   * With a cover: full-bleed backdrop, headline over the scrim.
   * ------------------------------------------------------------------ */
  return (
    <div className="group relative -mx-6 mb-8 overflow-hidden rounded-3xl sm:-mx-10">
      {fileInput}

      <NextImage
        src={url}
        alt={alt || ""}
        width={1600}
        height={900}
        priority
        className="absolute inset-0 size-full object-cover"
      />

      {/*
        The scrim is what makes white text legible over an arbitrary photo.
        Opaque at the bottom where the headline sits, clearing toward the top
        so the image is still recognisably an image.
      */}
      <div
        className="absolute inset-0 bg-gradient-to-t from-[#0a0b12] via-[#0a0b12]/75 to-[#0a0b12]/25"
        aria-hidden
      />

      <div className="absolute top-3 right-3 z-20 flex gap-1.5 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
        <button
          type="button"
          disabled={busy}
          onClick={() => input.current?.click()}
          className="inline-flex items-center gap-1.5 rounded-lg bg-black/70 px-2.5 py-1.5 text-xs text-white backdrop-blur transition-colors hover:bg-black/90 disabled:opacity-50"
        >
          {busy ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <RefreshCw className="size-3.5" />
          )}
          Replace
        </button>
        <button
          type="button"
          onClick={() => onChange({ url: null, alt: "" })}
          aria-label="Remove cover image"
          className="inline-flex items-center justify-center rounded-lg bg-black/70 p-1.5 text-white backdrop-blur transition-colors hover:bg-destructive"
        >
          <Trash2 className="size-3.5" />
        </button>
      </div>

      {/* pt is generous so the image reads as a backdrop rather than a strip
          with words on it. min-h keeps that true for a one-line headline. */}
      <div className="relative z-10 min-h-[26rem] px-6 pt-40 pb-8 sm:px-10">
        {children}

        <div className="mt-6">
          <input
            value={alt ?? ""}
            onChange={(event) => onChange({ url, alt: event.target.value })}
            placeholder="Describe this image for screen readers"
            aria-label="Cover image description"
            className={cn(
              "w-full max-w-md rounded-lg border bg-black/30 px-3 py-1.5 text-xs outline-none backdrop-blur transition-colors placeholder:text-white/35",
              // Amber rather than silent: this blocks publishing, so it should
              // look unfinished until it is filled in.
              alt?.trim()
                ? "border-white/10 text-white/70 focus:border-white/25"
                : "border-amber-500/40 text-amber-200 focus:border-amber-400",
            )}
          />
        </div>
      </div>
    </div>
  );
}
