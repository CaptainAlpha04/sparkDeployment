"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Archive,
  Check,
  Cloud,
  ExternalLink,
  Eye,
  Loader2,
  Send,
  Trash2,
  Undo2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { RichEditor } from "@/components/studio/rich-editor";
import { CoverPicker } from "@/components/studio/cover-picker";
import {
  deletePostAction,
  publishPostAction,
  setPostSlugAction,
  unpublishPostAction,
  updatePostAction,
} from "@/app/(site)/studio/actions";
import type { PostOutcome } from "@/lib/post-types";

type PostKind = "article" | "case_study";
type PostStatus = "draft" | "published" | "archived";

export type ComposerPost = {
  id: string;
  kind: PostKind;
  slug: string;
  title: string;
  subtitle: string | null;
  excerpt: string | null;
  coverImageUrl: string | null;
  coverAlt: string | null;
  bodyJson: unknown;
  bodyHtml: string | null;
  tags: string[];
  status: PostStatus;
  publishedAt: string | null;
  featured: boolean;
  seoTitle: string | null;
  seoDescription: string | null;
  canonicalUrl: string | null;
  noindex: boolean;
  clientOrg: string | null;
  period: string | null;
  outcomes: PostOutcome[] | null;
  readingMinutes: number;
};

type SaveState = "idle" | "dirty" | "saving" | "saved" | "error";

/** Matches deriveExcerpt on the server so the preview does not lie. */
function previewExcerpt(text: string, target = 165) {
  const clean = text.trim();
  if (clean.length <= target) return clean;
  const window = clean.slice(0, target + 1);
  const lastSpace = window.lastIndexOf(" ");
  const cut = clean.slice(0, lastSpace > 40 ? lastSpace : target).trimEnd();
  return `${cut.replace(/[,;:.\-–]$/, "")}…`;
}

function stripTags(html: string) {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function TagInput({
  tags,
  onChange,
}: {
  tags: string[];
  onChange: (next: string[]) => void;
}) {
  const [value, setValue] = useState("");

  function commit(raw: string) {
    const tag = raw.trim().toLowerCase().replace(/\s+/g, " ");
    if (!tag || tags.includes(tag) || tags.length >= 12) return;
    onChange([...tags, tag]);
  }

  return (
    <div className="space-y-2">
      <Label htmlFor="tags">Tags</Label>
      <div className="flex flex-wrap gap-1.5">
        {tags.map((tag) => (
          <Badge key={tag} variant="secondary" className="gap-1 pr-1">
            {tag}
            <button
              type="button"
              onClick={() => onChange(tags.filter((t) => t !== tag))}
              aria-label={`Remove ${tag}`}
              className="rounded-full p-0.5 hover:bg-white/20"
            >
              <X className="size-3" />
            </button>
          </Badge>
        ))}
      </div>
      <Input
        id="tags"
        value={value}
        placeholder="Type a tag, press Enter"
        className="h-9"
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={(event) => {
          // Comma too: people paste comma-separated lists out of habit.
          if (event.key === "Enter" || event.key === ",") {
            event.preventDefault();
            commit(value);
            setValue("");
          } else if (event.key === "Backspace" && !value && tags.length) {
            onChange(tags.slice(0, -1));
          }
        }}
        onBlur={() => {
          commit(value);
          setValue("");
        }}
      />
    </div>
  );
}

/**
 * The whole writing surface: body on the left, everything that decides how the
 * piece is found and framed on the right.
 *
 * Autosave is on for the body and metadata, because losing an hour of writing
 * to a closed tab is the one failure this tool must not have. Publishing stays
 * an explicit button — saving is not the same as saying it is ready.
 */
export function PostComposer({ post }: { post: ComposerPost }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [draft, setDraft] = useState(post);
  const [bodyHtml, setBodyHtml] = useState(post.bodyHtml ?? "");
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [slugDraft, setSlugDraft] = useState(post.slug);
  const [editingSlug, setEditingSlug] = useState(false);

  const isCase = draft.kind === "case_study";
  const publicPath = `${isCase ? "/case-studies" : "/blog"}/${draft.slug}`;

  const bodyText = stripTags(bodyHtml);
  const words = bodyText ? bodyText.split(/\s+/).length : 0;

  // What search engines and social cards will actually show, derived exactly
  // the way the server derives it. The point of showing this is that nobody
  // has to think about SEO fields: they see the result and move on.
  const effectiveTitle = draft.seoTitle?.trim() || draft.title;
  const effectiveDescription =
    draft.seoDescription?.trim() ||
    draft.excerpt?.trim() ||
    previewExcerpt(bodyText);

  function patch(next: Partial<ComposerPost>) {
    setDraft((prev) => ({ ...prev, ...next }));
    setSaveState("dirty");
  }

  const save = useCallback(
    async (silent: boolean) => {
      setSaveState("saving");
      const result = await updatePostAction(draft.id, {
        kind: draft.kind,
        title: draft.title,
        subtitle: draft.subtitle,
        bodyHtml,
        bodyJson: draft.bodyJson,
        excerpt: draft.excerpt,
        coverImageUrl: draft.coverImageUrl,
        coverAlt: draft.coverAlt,
        tags: draft.tags,
        featured: draft.featured,
        seoTitle: draft.seoTitle,
        seoDescription: draft.seoDescription,
        canonicalUrl: draft.canonicalUrl,
        noindex: draft.noindex,
        clientOrg: draft.clientOrg,
        period: draft.period,
        outcomes: draft.outcomes,
      });

      if (result.ok) {
        setSaveState("saved");
        if (!silent) toast.success("Saved");
      } else {
        setSaveState("error");
        // Always surfaced, even on autosave: a silent failed save is how an
        // hour of writing gets lost while the tab still looks fine.
        toast.error(result.error);
      }
      return result.ok;
    },
    [draft, bodyHtml],
  );

  // Debounced autosave. The ref holds the latest save closure so the timer
  // effect does not list `save` as a dependency — if it did, every keystroke
  // would rebuild the closure, cancel the pending timer and restart it, and
  // a fast typist would never stop typing long enough for a save to fire.
  //
  // Written in an effect, not during render: mutating a ref while rendering is
  // unsafe under concurrent rendering, where a render can be discarded.
  const saveRef = useRef(save);
  useEffect(() => {
    saveRef.current = save;
  }, [save]);

  useEffect(() => {
    if (saveState !== "dirty") return;
    const timer = setTimeout(() => void saveRef.current(true), 1500);
    return () => clearTimeout(timer);
  }, [saveState, draft, bodyHtml]);

  // Last line of defence for the closed tab.
  useEffect(() => {
    function warn(event: BeforeUnloadEvent) {
      if (saveState === "dirty" || saveState === "saving") event.preventDefault();
    }
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [saveState]);

  function publish() {
    if (draft.coverImageUrl && !draft.coverAlt?.trim()) {
      toast.error("Describe the cover image before publishing");
      return;
    }
    startTransition(async () => {
      if (!(await save(true))) return;
      const result = await publishPostAction(draft.id);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setDraft((prev) => ({
        ...prev,
        status: "published",
        publishedAt: result.data.publishedAt,
      }));
      toast.success("Published", {
        description: "It is live and in the sitemap.",
      });
      router.refresh();
    });
  }

  function setStatus(status: "draft" | "archived") {
    startTransition(async () => {
      const result = await unpublishPostAction(draft.id, status);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setDraft((prev) => ({ ...prev, status }));
      toast.success(status === "draft" ? "Moved back to draft" : "Archived");
      router.refresh();
    });
  }

  function saveSlug() {
    startTransition(async () => {
      const result = await setPostSlugAction(draft.id, slugDraft);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setDraft((prev) => ({ ...prev, slug: result.data.slug }));
      setSlugDraft(result.data.slug);
      setEditingSlug(false);
      toast.success("Address updated");
    });
  }

  function remove() {
    if (
      !window.confirm(
        `Delete "${draft.title}"? This cannot be undone, and any link to it will break.`,
      )
    ) {
      return;
    }
    startTransition(async () => {
      const result = await deletePostAction(draft.id, draft.kind, draft.slug);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Deleted");
      router.push("/studio");
    });
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
      {/* ---------------------------------------------------------------- */}
      {/* Writing                                                           */}
      {/* ---------------------------------------------------------------- */}
      <div className="min-w-0 space-y-4">
        <div className="flex items-center gap-3 text-xs">
          <Badge variant={draft.status === "published" ? "default" : "outline"}>
            {draft.status === "published"
              ? "Published"
              : draft.status === "archived"
                ? "Archived"
                : "Draft"}
          </Badge>
          <span className="eyebrow">{isCase ? "Case study" : "Article"}</span>
          <SaveIndicator state={saveState} />
          <span className="ml-auto text-muted-foreground">
            {words} words · {Math.max(1, Math.round(words / 200))} min read
          </span>
        </div>

        <input
          value={draft.title}
          onChange={(event) => patch({ title: event.target.value })}
          placeholder="Headline"
          aria-label="Title"
          className="w-full bg-transparent font-display text-5xl font-bold tracking-tight outline-none placeholder:text-muted-foreground/40"
        />

        <input
          value={draft.subtitle ?? ""}
          onChange={(event) => patch({ subtitle: event.target.value })}
          placeholder="A standfirst, if the headline needs support"
          aria-label="Subtitle"
          className="w-full bg-transparent text-xl text-muted-foreground outline-none placeholder:text-muted-foreground/40"
        />

        <RichEditor
          postId={draft.id}
          initialContent={post.bodyJson}
          onChange={({ json, html }) => {
            setDraft((prev) => ({ ...prev, bodyJson: json }));
            setBodyHtml(html);
            setSaveState("dirty");
          }}
        />
      </div>

      {/* ---------------------------------------------------------------- */}
      {/* Everything that decides how it is found                           */}
      {/* ---------------------------------------------------------------- */}
      <aside className="space-y-6 lg:sticky lg:top-24 lg:h-fit">
        <div className="flex flex-wrap gap-2">
          {draft.status === "published" ? (
            <>
              <Button asChild variant="outline" size="sm" className="gap-2">
                <Link href={publicPath} target="_blank">
                  <ExternalLink className="size-4" />
                  View
                </Link>
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="gap-2"
                disabled={pending}
                onClick={() => setStatus("draft")}
              >
                <Undo2 className="size-4" />
                Unpublish
              </Button>
            </>
          ) : (
            <Button
              size="sm"
              className="gap-2"
              disabled={pending || !draft.title.trim()}
              onClick={publish}
            >
              {pending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Send className="size-4" />
              )}
              Publish
            </Button>
          )}

          <Button
            size="sm"
            variant="outline"
            className="gap-2"
            disabled={pending || saveState === "saving"}
            onClick={() => void save(false)}
          >
            <Cloud className="size-4" />
            Save
          </Button>
        </div>

        {/* Address ------------------------------------------------------ */}
        <div className="space-y-2 rounded-2xl border border-border bg-card/40 p-4">
          <Label className="text-xs">Address</Label>
          {editingSlug ? (
            <div className="space-y-2">
              <Input
                value={slugDraft}
                onChange={(event) => setSlugDraft(event.target.value)}
                className="h-9 font-mono text-xs"
              />
              {draft.status === "published" && (
                <p className="text-xs text-amber-400">
                  This post is live. Changing its address breaks every existing
                  link to it.
                </p>
              )}
              <div className="flex gap-2">
                <Button size="sm" onClick={saveSlug} disabled={pending}>
                  Save address
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setSlugDraft(draft.slug);
                    setEditingSlug(false);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setEditingSlug(true)}
              className="w-full truncate text-left font-mono text-xs text-muted-foreground hover:text-foreground"
            >
              {publicPath}
            </button>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-card/40 p-4">
          <CoverPicker
            postId={draft.id}
            url={draft.coverImageUrl}
            alt={draft.coverAlt}
            onChange={({ url, alt }) =>
              patch({ coverImageUrl: url, coverAlt: alt })
            }
          />
        </div>

        <div className="rounded-2xl border border-border bg-card/40 p-4">
          <TagInput tags={draft.tags} onChange={(tags) => patch({ tags })} />
          <label className="mt-4 flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={draft.featured}
              onChange={(event) => patch({ featured: event.target.checked })}
              className="size-4 accent-[var(--primary)]"
            />
            Feature at the top of the index
          </label>
        </div>

        {/* Case study specifics ----------------------------------------- */}
        {isCase && (
          <div className="space-y-4 rounded-2xl border border-border bg-card/40 p-4">
            <p className="eyebrow">Case study</p>
            <div className="space-y-1.5">
              <Label htmlFor="clientOrg" className="text-xs">
                Partner or setting
              </Label>
              <Input
                id="clientOrg"
                value={draft.clientOrg ?? ""}
                onChange={(event) => patch({ clientOrg: event.target.value })}
                placeholder="NUST H-12, Islamabad"
                className="h-9"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="period" className="text-xs">
                When
              </Label>
              <Input
                id="period"
                value={draft.period ?? ""}
                onChange={(event) => patch({ period: event.target.value })}
                placeholder="June to August 2026"
                className="h-9"
              />
            </div>
            <OutcomeEditor
              outcomes={draft.outcomes ?? []}
              onChange={(outcomes) => patch({ outcomes })}
            />
          </div>
        )}

        {/* Search preview ------------------------------------------------ */}
        <div className="space-y-3 rounded-2xl border border-border bg-card/40 p-4">
          <div className="flex items-center gap-2">
            <Eye className="size-3.5 text-muted-foreground" />
            <p className="eyebrow">How it will appear</p>
          </div>

          <div className="rounded-lg bg-black/30 p-3">
            <p className="truncate text-xs text-emerald-400/80">
              sparkchapter.com{publicPath}
            </p>
            <p className="mt-0.5 truncate text-sm font-medium text-blue-300">
              {effectiveTitle || "Untitled"}
            </p>
            <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
              {effectiveDescription || "The summary is written for you from the first lines of the post."}
            </p>
          </div>

          <p className="text-xs text-muted-foreground">
            Written for you from the post. Override it only if you need to.
          </p>

          <details className="group">
            <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">
              Override
            </summary>
            <div className="mt-3 space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="seoTitle" className="text-xs">
                  Search headline
                </Label>
                <Input
                  id="seoTitle"
                  value={draft.seoTitle ?? ""}
                  onChange={(event) => patch({ seoTitle: event.target.value })}
                  placeholder={draft.title}
                  className="h-9"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="seoDescription" className="text-xs">
                  Search summary
                </Label>
                <Textarea
                  id="seoDescription"
                  value={draft.seoDescription ?? ""}
                  onChange={(event) =>
                    patch({ seoDescription: event.target.value })
                  }
                  rows={3}
                  placeholder={effectiveDescription}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="canonicalUrl" className="text-xs">
                  Originally published at
                </Label>
                <Input
                  id="canonicalUrl"
                  value={draft.canonicalUrl ?? ""}
                  onChange={(event) =>
                    patch({ canonicalUrl: event.target.value })
                  }
                  placeholder="https://example.com/the-original"
                  className="h-9 font-mono text-xs"
                />
                <p className="text-xs text-muted-foreground">
                  Only if this ran somewhere else first. Points search engines
                  at the original so we do not compete with it.
                </p>
              </div>
              <label className="flex items-start gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={draft.noindex}
                  onChange={(event) => patch({ noindex: event.target.checked })}
                  className="mt-0.5 size-3.5 accent-[var(--primary)]"
                />
                Hide from search engines
              </label>
            </div>
          </details>
        </div>

        <div className="flex flex-wrap gap-2">
          {draft.status !== "archived" && (
            <Button
              size="sm"
              variant="ghost"
              className="gap-2 text-muted-foreground"
              disabled={pending}
              onClick={() => setStatus("archived")}
            >
              <Archive className="size-4" />
              Archive
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            className="gap-2 text-destructive hover:text-destructive"
            disabled={pending}
            onClick={remove}
          >
            <Trash2 className="size-4" />
            Delete
          </Button>
        </div>
      </aside>
    </div>
  );
}

function SaveIndicator({ state }: { state: SaveState }) {
  if (state === "saving") {
    return (
      <span className="flex items-center gap-1.5 text-muted-foreground">
        <Loader2 className="size-3 animate-spin" /> Saving
      </span>
    );
  }
  if (state === "saved") {
    return (
      <span className="flex items-center gap-1.5 text-emerald-400">
        <Check className="size-3" /> Saved
      </span>
    );
  }
  if (state === "dirty") {
    return <span className="text-amber-400">Unsaved</span>;
  }
  if (state === "error") {
    return <span className="text-destructive">Could not save</span>;
  }
  return null;
}

function OutcomeEditor({
  outcomes,
  onChange,
}: {
  outcomes: PostOutcome[];
  onChange: (next: PostOutcome[]) => void;
}) {
  return (
    <div className="space-y-2">
      <Label className="text-xs">Headline figures</Label>
      {outcomes.map((outcome, index) => (
        <div key={index} className="flex gap-2">
          <Input
            value={outcome.value}
            onChange={(event) => {
              const next = [...outcomes];
              next[index] = { ...outcome, value: event.target.value };
              onChange(next);
            }}
            placeholder="120"
            className="h-9 w-20"
            aria-label="Figure"
          />
          <Input
            value={outcome.label}
            onChange={(event) => {
              const next = [...outcomes];
              next[index] = { ...outcome, label: event.target.value };
              onChange(next);
            }}
            placeholder="Students"
            className="h-9 flex-1"
            aria-label="What it counts"
          />
          <button
            type="button"
            onClick={() => onChange(outcomes.filter((_, i) => i !== index))}
            aria-label="Remove figure"
            className="rounded-lg px-2 text-muted-foreground hover:text-destructive"
          >
            <X className="size-4" />
          </button>
        </div>
      ))}
      {outcomes.length < 4 && (
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => onChange([...outcomes, { label: "", value: "" }])}
        >
          Add a figure
        </Button>
      )}
    </div>
  );
}
