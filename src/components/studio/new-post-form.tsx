"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, PenLine } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createPostAction } from "@/app/(studio)/studio/actions";

type Kind = "article" | "case_study";

const COPY: Record<Kind, { eyebrow: string; heading: string; hint: string }> = {
  article: {
    eyebrow: "New article",
    heading: "What are you writing about?",
    hint: "A working title is fine. You can change it, and the address, later.",
  },
  case_study: {
    eyebrow: "New case study",
    heading: "What did you run?",
    hint: "Name the programme or the place. Details and figures come next.",
  },
};

export function NewPostForm({ kind }: { kind: Kind }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [pending, startTransition] = useTransition();

  const copy = COPY[kind];

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!title.trim()) return;

    startTransition(async () => {
      const result = await createPostAction({
        kind,
        title,
        // An empty body is legal: the point of this screen is to get out of the
        // way and into the editor.
        bodyHtml: "",
        bodyJson: null,
      });

      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      router.push(`/studio/${result.data.id}`);
    });
  }

  return (
    <div className="mx-auto max-w-xl px-6 py-24">
      <Link
        href="/studio"
        className="mb-10 inline-flex items-center gap-2 text-sm text-white/50 transition-colors hover:text-white"
      >
        <ArrowLeft className="size-4" />
        Studio
      </Link>

      <p className="eyebrow mb-3">{copy.eyebrow}</p>
      <h1 className="text-5xl font-bold">{copy.heading}</h1>

      <form onSubmit={submit} className="mt-8 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="title" className="sr-only">
            Title
          </Label>
          <Input
            id="title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder={
              kind === "case_study"
                ? "A summer of building at NUST"
                : "The thing nobody tells you about starting"
            }
            autoFocus
            className="h-12 text-lg"
          />
          <p className="text-sm text-muted-foreground">{copy.hint}</p>
        </div>

        <Button
          type="submit"
          disabled={pending || !title.trim()}
          className="h-11 gap-2"
        >
          {pending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <PenLine className="size-4" />
          )}
          Start writing
        </Button>
      </form>
    </div>
  );
}
