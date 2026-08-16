"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Archive,
  ArrowLeft,
  CalendarClock,
  Check,
  Cloud,
  ExternalLink,
  History,
  ImagePlus,
  Loader2,
  PanelRight,
  RotateCcw,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RichEditor, type EditorHandle } from "@/components/studio/rich-editor";
import { CoverPicker } from "@/components/studio/cover-picker";
import { cn } from "@/lib/utils";
import {
  deletePostAction,
  listRevisionsAction,
  publishPostAction,
  restoreRevisionAction,
  schedulePostAction,
  setPostSlugAction,
  unpublishPostAction,
  updatePostAction,
  type RevisionRow,
} from "@/app/(studio)/studio/actions";
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
  const cut = clean.slice(0, target + 1);
  const lastSpace = cut.lastIndexOf(" ");
  return `${clean.slice(0, lastSpace > 40 ? lastSpace : target).trimEnd().replace(/[,;:.\-–]$/, "")}…`;
}

function stripTags(html: string) {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const dateTime = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

/** Local-time value for a datetime-local input, which refuses an ISO string with a zone. */
function toLocalInput(date: Date) {
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

/* -------------------------------------------------------------------------
 * Composer
 * ---------------------------------------------------------------------- */

/**
 * The writing surface.
 *
 * Laid out like a document editor rather than a form: a slim app bar, the page
 * itself centred and unobstructed, and everything that decides how the piece is
 * found tucked into a panel that is closed by default. The first version put a
 * permanent toolbar over the first line and a permanent settings column beside
 * it, which left the actual document occupying about a third of the screen.
 *
 * Autosave is on, because losing an hour of writing to a closed tab is the one
 * failure this tool must not have. Publishing stays an explicit act.
 */
export function PostComposer({ post }: { post: ComposerPost }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [draft, setDraft] = useState(post);
  const [bodyHtml, setBodyHtml] = useState(post.bodyHtml ?? "");
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [panelOpen, setPanelOpen] = useState(false);
  const [editor, setEditor] = useState<EditorHandle | null>(null);

  const fileInput = useRef<HTMLInputElement>(null);

  const isCase = draft.kind === "case_study";
  const publicPath = `${isCase ? "/case-studies" : "/blog"}/${draft.slug}`;

  /*
   * Whether the publication moment has arrived.
   *
   * The clock is read in an effect rather than during render: rendering must
   * be pure, and two renders of identical props disagreeing about whether a
   * post is live is exactly the inconsistency that rule exists to prevent.
   *
   * The interval is not decoration either. A post scheduled for a few minutes
   * from now, with the tab left open, flips from "Scheduled" to "Live" on its
   * own rather than lying until someone reloads.
   */
  const [now, setNow] = useState(0);
  useEffect(() => {
    // Deferred rather than set in the effect body, which would cascade a
    // second render immediately after the first.
    const raf = requestAnimationFrame(() => setNow(Date.now()));
    const timer = setInterval(() => setNow(Date.now()), 30_000);
    return () => {
      cancelAnimationFrame(raf);
      clearInterval(timer);
    };
  }, []);

  const publishedDate = draft.publishedAt ? new Date(draft.publishedAt) : null;
  // Before the first effect runs `now` is 0, so nothing is treated as past.
  // That errs toward "scheduled", which is the safe way round: it never
  // labels an unpublished post as live.
  const scheduled =
    draft.status === "published" &&
    publishedDate !== null &&
    publishedDate.getTime() > now;
  const live = draft.status === "published" && !scheduled;

  const bodyText = stripTags(bodyHtml);
  const words = bodyText ? bodyText.split(/\s+/).length : 0;

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
        // Surfaced even on autosave: a silent failed save is how an hour of
        // writing gets lost while the tab still looks fine.
        toast.error(result.error);
      }
      return result.ok;
    },
    [draft, bodyHtml],
  );

  // The ref holds the latest save closure so the timer effect need not depend
  // on `save` — if it did, every keystroke would cancel and restart the timer
  // and a fast typist would never pause long enough for a save to fire.
  // Assigned in an effect, not during render, which is unsafe under concurrent
  // rendering where a render can be thrown away.
  const saveRef = useRef(save);
  useEffect(() => {
    saveRef.current = save;
  }, [save]);

  useEffect(() => {
    if (saveState !== "dirty") return;
    const timer = setTimeout(() => void saveRef.current(true), 1500);
    return () => clearTimeout(timer);
  }, [saveState, draft, bodyHtml]);

  useEffect(() => {
    function warn(event: BeforeUnloadEvent) {
      if (saveState === "dirty" || saveState === "saving") event.preventDefault();
    }
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [saveState]);

  // Escape closes the panel. There is no backdrop to click, because the whole
  // point is that the document stays editable while the panel is open.
  useEffect(() => {
    if (!panelOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setPanelOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [panelOpen]);

  // Cmd/Ctrl+S saves. Writers reach for it whatever the tool promises.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        void saveRef.current(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function publish() {
    if (draft.coverImageUrl && !draft.coverAlt?.trim()) {
      toast.error("Describe the cover image before publishing");
      setPanelOpen(true);
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
      toast.success("Published", { description: "It is live and in the sitemap." });
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
    <div className="flex min-h-screen flex-col">
      {/* ---------------------------------------------------------------- */}
      {/* App bar                                                          */}
      {/* ---------------------------------------------------------------- */}
      <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center gap-3 border-b border-white/8 bg-[#0a0b12]/90 px-4 backdrop-blur-xl">
        <Link
          href="/studio"
          className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-white/60 transition-colors hover:bg-white/5 hover:text-white"
        >
          <ArrowLeft className="size-4" />
          <span className="hidden sm:inline">Studio</span>
        </Link>

        <span className="h-5 w-px bg-white/10" aria-hidden />

        <StatusPill status={draft.status} scheduled={scheduled} />
        <SaveIndicator state={saveState} />

        <div className="ml-auto flex items-center gap-1">
          <span className="mr-2 hidden text-xs text-white/40 sm:inline">
            {words.toLocaleString()} words · {Math.max(1, Math.round(words / 200))} min
          </span>

          <BarButton
            label="Insert image"
            onClick={() => fileInput.current?.click()}
            disabled={!editor || editor.uploading}
          >
            {editor?.uploading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <ImagePlus className="size-4" />
            )}
          </BarButton>

          {live && (
            <BarButton label="View live" href={publicPath}>
              <ExternalLink className="size-4" />
            </BarButton>
          )}

          <BarButton
            label={panelOpen ? "Hide settings" : "Show settings"}
            onClick={() => setPanelOpen((open) => !open)}
            active={panelOpen}
          >
            <PanelRight className="size-4" />
          </BarButton>

          <Button
            size="sm"
            variant="ghost"
            className="gap-2 text-white/70 hover:text-white"
            disabled={pending || saveState === "saving"}
            onClick={() => void save(false)}
          >
            <Cloud className="size-4" />
            <span className="hidden sm:inline">Save</span>
          </Button>

          {live ? (
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
              {scheduled ? "Publish now" : "Publish"}
            </Button>
          )}
        </div>
      </header>

      <input
        ref={fileInput}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif,image/avif"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void editor?.insertImage(file);
          // Reset so choosing the same file twice still fires a change event.
          event.target.value = "";
        }}
      />

      {/* ---------------------------------------------------------------- */}
      {/* Document                                                         */}
      {/* ---------------------------------------------------------------- */}
      <div
        className={cn(
          "flex-1 transition-[padding] duration-300 ease-out",
          // Only pushed aside where there is room. Below this the panel
          // overlays, because squeezing a 68ch measure into what is left makes
          // the document unreadable.
          panelOpen && "xl:pr-[23rem]",
        )}
      >
        <div className="mx-auto w-full max-w-3xl px-6 py-14 sm:px-10">
          <textarea
            value={draft.title}
            onChange={(event) => patch({ title: event.target.value })}
            placeholder="Headline"
            aria-label="Title"
            rows={1}
            // A textarea, not an input, so a long headline wraps instead of
            // scrolling sideways out of view.
            className="w-full resize-none overflow-hidden bg-transparent font-display text-5xl leading-[1.08] font-bold tracking-tight outline-none placeholder:text-white/20"
            onInput={(event) => {
              const el = event.currentTarget;
              el.style.height = "auto";
              el.style.height = `${el.scrollHeight}px`;
            }}
            ref={(el) => {
              if (el) {
                el.style.height = "auto";
                el.style.height = `${el.scrollHeight}px`;
              }
            }}
          />

          <input
            value={draft.subtitle ?? ""}
            onChange={(event) => patch({ subtitle: event.target.value })}
            placeholder="Add a standfirst, if the headline needs support"
            aria-label="Subtitle"
            className="mt-4 w-full bg-transparent text-xl text-white/50 outline-none placeholder:text-white/20"
          />

          <div className="mt-10">
            <RichEditor
              postId={draft.id}
              initialContent={post.bodyJson}
              onReady={setEditor}
              onChange={({ json, html }) => {
                setDraft((prev) => ({ ...prev, bodyJson: json }));
                setBodyHtml(html);
                setSaveState("dirty");
              }}
            />
          </div>
        </div>
      </div>

      {/* ---------------------------------------------------------------- */}
      {/* Settings panel                                                    */}
      {/* ---------------------------------------------------------------- */}
      <aside
        aria-label="Post settings"
        aria-hidden={!panelOpen}
        className={cn(
          "fixed top-14 right-0 bottom-0 z-30 w-[23rem] max-w-full overflow-y-auto border-l border-white/8 bg-[#0f1018] transition-transform duration-300 ease-out",
          panelOpen ? "translate-x-0" : "pointer-events-none translate-x-full",
        )}
      >
        <SettingsPanel
          draft={draft}
          scheduled={scheduled}
          publishedDate={publishedDate}
          bodyText={bodyText}
          publicPath={publicPath}
          pending={pending}
          patch={patch}
          onClose={() => setPanelOpen(false)}
          onSetStatus={setStatus}
          onDelete={remove}
          onDraftChange={setDraft}
        />
      </aside>
    </div>
  );
}

/* -------------------------------------------------------------------------
 * App bar pieces
 * ---------------------------------------------------------------------- */

function BarButton({
  label,
  onClick,
  href,
  disabled,
  active,
  children,
}: {
  label: string;
  onClick?: () => void;
  href?: string;
  disabled?: boolean;
  active?: boolean;
  children: React.ReactNode;
}) {
  const className = cn(
    "inline-flex size-9 items-center justify-center rounded-lg transition-colors",
    active ? "bg-white/10 text-white" : "text-white/60 hover:bg-white/5 hover:text-white",
    disabled && "pointer-events-none opacity-40",
  );

  if (href) {
    return (
      <Link href={href} target="_blank" title={label} aria-label={label} className={className}>
        {children}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} disabled={disabled} title={label} aria-label={label} className={className}>
      {children}
    </button>
  );
}

function StatusPill({ status, scheduled }: { status: PostStatus; scheduled: boolean }) {
  if (scheduled) {
    return (
      <span className="flex items-center gap-1.5 rounded-full bg-amber-500/15 px-2.5 py-1 text-xs font-medium text-amber-300">
        <CalendarClock className="size-3" />
        Scheduled
      </span>
    );
  }
  const map = {
    published: "bg-emerald-500/15 text-emerald-300",
    archived: "bg-white/10 text-white/50",
    draft: "bg-white/10 text-white/60",
  } as const;
  const label = { published: "Live", archived: "Archived", draft: "Draft" }[status];

  return (
    <span className={cn("rounded-full px-2.5 py-1 text-xs font-medium", map[status])}>
      {label}
    </span>
  );
}

function SaveIndicator({ state }: { state: SaveState }) {
  if (state === "saving") {
    return (
      <span className="flex items-center gap-1.5 text-xs text-white/40">
        <Loader2 className="size-3 animate-spin" /> Saving
      </span>
    );
  }
  if (state === "saved") {
    return (
      <span className="flex items-center gap-1.5 text-xs text-emerald-400/80">
        <Check className="size-3" /> Saved
      </span>
    );
  }
  if (state === "dirty") return <span className="text-xs text-white/40">Unsaved</span>;
  if (state === "error") return <span className="text-xs text-destructive">Could not save</span>;
  return null;
}

/* -------------------------------------------------------------------------
 * Settings panel
 * ---------------------------------------------------------------------- */

function SettingsPanel({
  draft,
  scheduled,
  publishedDate,
  bodyText,
  publicPath,
  pending,
  patch,
  onClose,
  onSetStatus,
  onDelete,
  onDraftChange,
}: {
  draft: ComposerPost;
  scheduled: boolean;
  publishedDate: Date | null;
  bodyText: string;
  publicPath: string;
  pending: boolean;
  patch: (next: Partial<ComposerPost>) => void;
  onClose: () => void;
  onSetStatus: (status: "draft" | "archived") => void;
  onDelete: () => void;
  onDraftChange: React.Dispatch<React.SetStateAction<ComposerPost>>;
}) {
  const isCase = draft.kind === "case_study";

  const effectiveTitle = draft.seoTitle?.trim() || draft.title;
  const effectiveDescription =
    draft.seoDescription?.trim() || draft.excerpt?.trim() || previewExcerpt(bodyText);

  return (
    <div className="p-4">
      <div className="mb-4 flex items-center justify-between">
        <p className="eyebrow">Settings</p>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close settings"
          className="rounded-lg p-1.5 text-white/50 transition-colors hover:bg-white/5 hover:text-white"
        >
          <X className="size-4" />
        </button>
      </div>

      <Tabs defaultValue="post">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="post">Post</TabsTrigger>
          <TabsTrigger value="seo">Search</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        {/* ---- Post ---------------------------------------------------- */}
        <TabsContent value="post" className="mt-4 space-y-6">
          <SchedulePanel
            postId={draft.id}
            status={draft.status}
            scheduled={scheduled}
            publishedDate={publishedDate}
            onScheduled={(iso) =>
              onDraftChange((prev) => ({ ...prev, status: "published", publishedAt: iso }))
            }
          />

          <SlugPanel
            postId={draft.id}
            slug={draft.slug}
            publicPath={publicPath}
            isPublished={draft.status === "published"}
            onChange={(slug) => onDraftChange((prev) => ({ ...prev, slug }))}
          />

          <CoverPicker
            postId={draft.id}
            url={draft.coverImageUrl}
            alt={draft.coverAlt}
            onChange={({ url, alt }) => patch({ coverImageUrl: url, coverAlt: alt })}
          />

          <TagInput tags={draft.tags} onChange={(tags) => patch({ tags })} />

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={draft.featured}
              onChange={(event) => patch({ featured: event.target.checked })}
              className="size-4 accent-[var(--primary)]"
            />
            Feature at the top of the index
          </label>

          {isCase && (
            <div className="space-y-4 border-t border-white/8 pt-5">
              <p className="eyebrow">Case study</p>
              <Field
                id="clientOrg"
                label="Partner or setting"
                value={draft.clientOrg ?? ""}
                placeholder="NUST H-12, Islamabad"
                onChange={(v) => patch({ clientOrg: v })}
              />
              <Field
                id="period"
                label="When"
                value={draft.period ?? ""}
                placeholder="June to August 2026"
                onChange={(v) => patch({ period: v })}
              />
              <OutcomeEditor
                outcomes={draft.outcomes ?? []}
                onChange={(outcomes) => patch({ outcomes })}
              />
            </div>
          )}

          <div className="flex flex-wrap gap-2 border-t border-white/8 pt-5">
            {draft.status !== "archived" && (
              <Button
                size="sm"
                variant="ghost"
                className="gap-2 text-white/50"
                disabled={pending}
                onClick={() => onSetStatus("archived")}
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
              onClick={onDelete}
            >
              <Trash2 className="size-4" />
              Delete
            </Button>
          </div>
        </TabsContent>

        {/* ---- Search -------------------------------------------------- */}
        <TabsContent value="seo" className="mt-4 space-y-5">
          <div className="rounded-xl bg-black/40 p-3">
            <p className="truncate text-xs text-emerald-400/80">sparkchapter.com{publicPath}</p>
            <p className="mt-0.5 truncate text-sm font-medium text-blue-300">
              {effectiveTitle || "Untitled"}
            </p>
            <p className="mt-0.5 line-clamp-2 text-xs text-white/50">
              {effectiveDescription ||
                "The summary is written for you from the first lines of the post."}
            </p>
          </div>

          <p className="text-xs text-white/40">
            All of this is written for you from the post itself. Override it only
            if you have a reason to.
          </p>

          <Field
            id="seoTitle"
            label="Search headline"
            value={draft.seoTitle ?? ""}
            placeholder={draft.title || "Same as the headline"}
            onChange={(v) => patch({ seoTitle: v })}
          />

          <div className="space-y-1.5">
            <Label htmlFor="seoDescription" className="text-xs">
              Search summary
            </Label>
            <Textarea
              id="seoDescription"
              value={draft.seoDescription ?? ""}
              onChange={(event) => patch({ seoDescription: event.target.value })}
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
              onChange={(event) => patch({ canonicalUrl: event.target.value })}
              placeholder="https://example.com/the-original"
              className="h-9 font-mono text-xs"
            />
            <p className="text-xs text-white/40">
              Only if this ran somewhere else first. Points search engines at the
              original so we do not compete with it.
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
        </TabsContent>

        {/* ---- History ------------------------------------------------- */}
        <TabsContent value="history" className="mt-4">
          <HistoryPanel postId={draft.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Field({
  id,
  label,
  value,
  placeholder,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs">
        {label}
      </Label>
      <Input
        id={id}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="h-9"
      />
    </div>
  );
}

/* -------------------------------------------------------------------------
 * Scheduling
 * ---------------------------------------------------------------------- */

function SchedulePanel({
  postId,
  status,
  scheduled,
  publishedDate,
  onScheduled,
}: {
  postId: string;
  status: PostStatus;
  scheduled: boolean;
  publishedDate: Date | null;
  onScheduled: (iso: string | null) => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(() => {
    // Default to tomorrow at 9am, which is a plausible intent rather than a
    // timestamp the writer has to overwrite before it means anything.
    const base = publishedDate ?? new Date(Date.now() + 24 * 60 * 60 * 1000);
    if (!publishedDate) base.setHours(9, 0, 0, 0);
    return toLocalInput(base);
  });

  function submit() {
    startTransition(async () => {
      const result = await schedulePostAction(postId, new Date(value).toISOString());
      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      onScheduled(result.data.publishedAt);
      setOpen(false);
      toast.success("Scheduled", {
        description: result.data.publishedAt
          ? `Goes live ${dateTime.format(new Date(result.data.publishedAt))}.`
          : undefined,
      });
      router.refresh();
    });
  }

  if (status === "published" && !scheduled) {
    return (
      <div className="rounded-xl border border-white/8 bg-white/[0.02] p-3">
        <p className="eyebrow mb-1">Published</p>
        <p className="text-sm text-white/70">
          {publishedDate ? dateTime.format(publishedDate) : "Live"}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-white/8 bg-white/[0.02] p-3">
      <p className="eyebrow mb-2">Publishing</p>

      {scheduled && publishedDate && (
        <p className="mb-3 flex items-start gap-2 text-sm text-amber-300">
          <CalendarClock className="mt-0.5 size-4 shrink-0" />
          Goes live on its own at {dateTime.format(publishedDate)}.
        </p>
      )}

      {open ? (
        <div className="space-y-2">
          <Label htmlFor="scheduleAt" className="text-xs">
            Publish at
          </Label>
          <Input
            id="scheduleAt"
            type="datetime-local"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            className="h-9"
          />
          <p className="text-xs text-white/40">
            Your local time. Nothing needs to be running when it arrives.
          </p>
          <div className="flex gap-2">
            <Button size="sm" onClick={submit} disabled={pending}>
              {pending && <Loader2 className="mr-1.5 size-3.5 animate-spin" />}
              {scheduled ? "Reschedule" : "Schedule"}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <Button
          size="sm"
          variant="outline"
          className="w-full gap-2"
          onClick={() => setOpen(true)}
        >
          <CalendarClock className="size-4" />
          {scheduled ? "Change the time" : "Schedule for later"}
        </Button>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------
 * Slug
 * ---------------------------------------------------------------------- */

function SlugPanel({
  postId,
  slug,
  publicPath,
  isPublished,
  onChange,
}: {
  postId: string;
  slug: string;
  publicPath: string;
  isPublished: boolean;
  onChange: (slug: string) => void;
}) {
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(slug);

  // No effect syncing `value` to `slug`. The draft is seeded when editing
  // starts, which is the only moment it can be stale, and syncing in an effect
  // would overwrite what someone was mid-way through typing.
  function startEditing() {
    setValue(slug);
    setEditing(true);
  }

  function submit() {
    startTransition(async () => {
      const result = await setPostSlugAction(postId, value);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      onChange(result.data.slug);
      setEditing(false);
      toast.success("Address updated");
    });
  }

  return (
    <div className="space-y-2">
      <Label className="text-xs">Address</Label>
      {editing ? (
        <div className="space-y-2">
          <Input
            value={value}
            onChange={(event) => setValue(event.target.value)}
            className="h-9 font-mono text-xs"
          />
          {isPublished && (
            <p className="text-xs text-amber-400">
              This post is live. Changing its address breaks every existing link
              to it.
            </p>
          )}
          <div className="flex gap-2">
            <Button size="sm" onClick={submit} disabled={pending}>
              Save address
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setValue(slug);
                setEditing(false);
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={startEditing}
          className="w-full truncate rounded-lg bg-black/30 px-3 py-2 text-left font-mono text-xs text-white/50 transition-colors hover:text-white"
        >
          {publicPath}
        </button>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------
 * History
 * ---------------------------------------------------------------------- */

function HistoryPanel({ postId }: { postId: string }) {
  const router = useRouter();
  const [rows, setRows] = useState<RevisionRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // Loaded when the tab mounts rather than with the page: most editing
  // sessions never open it, and each row carries a full body server-side.
  useEffect(() => {
    let cancelled = false;
    void listRevisionsAction(postId).then((result) => {
      if (cancelled) return;
      if (result.ok) setRows(result.data);
      else setError(result.error);
    });
    return () => {
      cancelled = true;
    };
  }, [postId]);

  function restore(id: string, when: string) {
    if (
      !window.confirm(
        `Restore the version from ${dateTime.format(new Date(when))}? The current text is saved to history first, so you can undo this.`,
      )
    ) {
      return;
    }
    startTransition(async () => {
      const result = await restoreRevisionAction(id);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Restored", { description: "Reloading the document." });
      router.refresh();
    });
  }

  if (error) return <p className="text-sm text-destructive">{error}</p>;

  if (!rows) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="size-4 animate-spin text-white/40" />
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="py-8 text-center">
        <History className="mx-auto mb-3 size-6 text-white/25" />
        <p className="text-sm text-white/50">No earlier versions yet.</p>
        <p className="mt-1 text-xs text-white/35">
          A snapshot is kept when you publish, and roughly every fifteen minutes
          while you write.
        </p>
      </div>
    );
  }

  return (
    <ul className="space-y-1">
      {rows.map((row) => (
        <li
          key={row.id}
          className="group rounded-lg px-3 py-2.5 transition-colors hover:bg-white/5"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-sm text-white/80">
                {dateTime.format(new Date(row.createdAt))}
              </p>
              <p className="mt-0.5 truncate text-xs text-white/40">
                {row.wordCount.toLocaleString()} words
                {row.authorName ? ` · ${row.authorName}` : ""}
                {row.reason ? ` · ${row.reason}` : ""}
              </p>
            </div>
            <button
              type="button"
              onClick={() => restore(row.id, row.createdAt)}
              disabled={pending}
              className="shrink-0 rounded-md p-1.5 text-white/40 opacity-0 transition-all group-hover:opacity-100 hover:bg-white/10 hover:text-white focus-visible:opacity-100 disabled:opacity-40"
              title="Restore this version"
              aria-label={`Restore the version from ${dateTime.format(new Date(row.createdAt))}`}
            >
              <RotateCcw className="size-3.5" />
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}

/* -------------------------------------------------------------------------
 * Small inputs
 * ---------------------------------------------------------------------- */

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
      <Label htmlFor="tags" className="text-xs">
        Tags
      </Label>
      {tags.length > 0 && (
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
      )}
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
            className="rounded-lg px-2 text-white/40 hover:text-destructive"
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
