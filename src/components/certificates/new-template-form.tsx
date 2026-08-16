"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createTemplateAction,
  uploadBackground,
} from "@/app/(site)/admin/certificates/actions";

/**
 * Creating a template needs the artwork's intrinsic dimensions, which only the
 * browser knows before upload. We read them from an object URL and send them
 * alongside the file, so the server never has to decode the image.
 */
function readDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("That file could not be read as an image"));
    };
    img.src = url;
  });
}

export function NewTemplateForm() {
  const [name, setName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  function onFile(selected: File | null) {
    setError(null);
    setFile(selected);
    setPreview(selected ? URL.createObjectURL(selected) : null);
  }

  function submit() {
    if (!file) {
      setError("Choose a background image");
      return;
    }
    if (!name.trim()) {
      setError("Give the template a name");
      return;
    }

    setError(null);
    startTransition(async () => {
      try {
        const { width, height } = await readDimensions(file);

        const formData = new FormData();
        formData.set("file", file);
        formData.set("width", String(width));
        formData.set("height", String(height));

        const uploaded = await uploadBackground(formData);
        if (!uploaded.ok) {
          setError(uploaded.error);
          return;
        }

        const created = await createTemplateAction({
          name,
          backgroundUrl: uploaded.data.url,
          backgroundWidth: uploaded.data.width,
          backgroundHeight: uploaded.data.height,
        });

        if (!created.ok) {
          setError(created.error);
          return;
        }

        router.push(`/admin/certificates/${created.data.id}`);
      } catch (err) {
        setError((err as Error).message);
      }
    });
  }

  return (
    <div className="rounded-2xl border border-border bg-card/60 p-6 backdrop-blur-xl">
      <h2 className="text-xl font-semibold">New template</h2>
      <p className="mt-1 mb-5 text-sm text-muted-foreground">
        Upload the certificate artwork, then position the text on top of it.
      </p>

      <div className="space-y-4">
        <div>
          <Label htmlFor="template-name" className="text-xs">
            Name
          </Label>
          <Input
            id="template-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="SPARKx Talk participation"
            className="mt-1"
          />
        </div>

        <div>
          <Label className="text-xs">Background</Label>
          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={(e) => onFile(e.target.files?.[0] ?? null)}
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="mt-1 flex w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border p-8 text-sm text-muted-foreground transition-colors hover:border-primary/60 hover:text-foreground"
          >
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={preview}
                alt=""
                className="max-h-52 w-auto rounded-lg object-contain"
              />
            ) : (
              <>
                <ImagePlus className="size-6" />
                Choose artwork — PNG, JPEG, or WebP, up to 6 MB
              </>
            )}
          </button>
          {file && (
            <p className="mt-2 text-xs text-muted-foreground">{file.name}</p>
          )}
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button onClick={submit} disabled={pending} className="w-full">
          {pending ? "Creating…" : "Create and open designer"}
        </Button>
      </div>
    </div>
  );
}
