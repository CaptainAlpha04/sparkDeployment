"use client";

import { useRef, useState } from "react";
import NextImage from "next/image";
import { ImagePlus, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { uploadPostImage } from "@/lib/post-media";
import { formatBytes, ImageRejected } from "@/lib/image-compress";

type Props = {
  postId: string;
  url: string | null;
  alt: string | null;
  onChange: (value: { url: string | null; alt: string }) => void;
};

/**
 * Cover image, which doubles as the social card and the JSON-LD image.
 *
 * Alt text sits directly under the picker rather than behind a settings
 * disclosure, because it is required before the post can be published and
 * hiding a required field is how you get a field nobody fills in.
 */
export function CoverPicker({ postId, url, alt, onChange }: Props) {
  const [busy, setBusy] = useState(false);
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

  return (
    <div className="space-y-3">
      <Label>Cover image</Label>

      {url ? (
        <div className="group relative overflow-hidden rounded-xl border border-border">
          <NextImage
            src={url}
            alt={alt || "Cover preview"}
            width={800}
            height={450}
            className="aspect-video w-full object-cover"
          />
          <button
            type="button"
            onClick={() => onChange({ url: null, alt: "" })}
            className="absolute top-2 right-2 inline-flex size-8 items-center justify-center rounded-lg bg-black/70 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-destructive"
            aria-label="Remove cover image"
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          disabled={busy}
          onClick={() => input.current?.click()}
          className="flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border text-sm text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground disabled:opacity-50"
        >
          {busy ? (
            <Loader2 className="size-5 animate-spin" />
          ) : (
            <ImagePlus className="size-5" />
          )}
          {busy ? "Compressing and uploading…" : "Add a cover image"}
          <span className="text-xs">Resized and converted to WebP for you</span>
        </button>
      )}

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

      {url && (
        <div className="space-y-1.5">
          <Label htmlFor="coverAlt" className="text-xs">
            Describe the cover
          </Label>
          <Input
            id="coverAlt"
            value={alt ?? ""}
            onChange={(event) => onChange({ url, alt: event.target.value })}
            placeholder="Students building a robot at a workbench"
            className="h-9"
          />
          {!alt?.trim() && (
            <p className="text-xs text-amber-400">
              Required before publishing.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
