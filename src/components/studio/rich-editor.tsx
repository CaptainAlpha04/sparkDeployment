"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import {
  Bold,
  Code,
  Heading2,
  Heading3,
  ImagePlus,
  Italic,
  Link2,
  Link2Off,
  List,
  ListOrdered,
  Loader2,
  Minus,
  Quote,
  Redo2,
  Strikethrough,
  Underline as UnderlineIcon,
  Undo2,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { uploadPostImage } from "@/lib/post-media";
import { formatBytes, ImageRejected } from "@/lib/image-compress";

/**
 * The writing surface for blog posts and case studies.
 *
 * Tiptap rather than a markdown textarea: the brief was "how blog editors
 * are", and that means seeing the heading as a heading. What it must not mean
 * is the editor inventing its own semantics — every node here maps onto a tag
 * the sanitiser on the server already allows, so nothing an editor can type
 * gets silently dropped on save.
 *
 * Headings start at h2. The post title is the page's only h1, and a second one
 * inside the body breaks the document outline that screen readers and
 * crawlers both build from heading order.
 */

type Props = {
  /** ProseMirror JSON from a previous save, or null for a new post. */
  initialContent: unknown;
  /** Used to namespace uploaded images so a deleted post can sweep its folder. */
  postId: string;
  onChange: (value: { json: unknown; html: string; words: number }) => void;
  placeholder?: string;
};

function ToolbarButton({
  onClick,
  active,
  disabled,
  label,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      aria-pressed={active}
      className={cn(
        "inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors",
        "hover:bg-white/10 hover:text-foreground",
        "disabled:pointer-events-none disabled:opacity-40",
        active && "bg-primary/20 text-primary",
      )}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <span className="mx-1 h-5 w-px shrink-0 bg-border" aria-hidden />;
}

/**
 * Link editing.
 *
 * window.prompt is deliberate here rather than a modal: it cannot lose the
 * selection, which is the single most annoying failure mode of hand-rolled
 * link dialogs inside a contenteditable.
 */
function toggleLink(editor: Editor) {
  const existing = editor.getAttributes("link").href as string | undefined;
  const input = window.prompt("Link URL", existing ?? "https://");

  if (input === null) return;
  const href = input.trim();

  if (!href) {
    editor.chain().focus().extendMarkRange("link").unsetLink().run();
    return;
  }
  // A bare domain is what people actually type. Without a scheme the browser
  // resolves it as a relative path and the link silently 404s on our own site.
  const url = /^(https?:|mailto:|\/)/i.test(href) ? href : `https://${href}`;
  editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
}

export function RichEditor({
  initialContent,
  postId,
  onChange,
  placeholder = "Start writing. Select any text for formatting.",
}: Props) {
  const [uploading, setUploading] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    // Rendering the editor on the server produces markup React then disagrees
    // with on hydration. Tiptap surfaces this exact flag for the purpose.
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3, 4] },
        link: {
          openOnClick: false,
          autolink: true,
          // Matches the server allowlist. Anything else is stripped on save,
          // so accepting it here would only mislead the person typing.
          protocols: ["https", "mailto"],
        },
        codeBlock: { HTMLAttributes: { class: "not-prose" } },
      }),
      Image.configure({
        inline: false,
        HTMLAttributes: { class: "rounded-xl" },
      }),
      Placeholder.configure({ placeholder }),
    ],
    content: (initialContent as never) ?? "",
    editorProps: {
      attributes: {
        class:
          "prose-spark min-h-[28rem] max-w-none px-6 py-8 focus:outline-none",
      },
    },
    onUpdate: ({ editor }) => {
      onChange({
        json: editor.getJSON(),
        html: editor.getHTML(),
        words: editor.storage.characterCount?.words?.() ?? 0,
      });
    },
  });

  const insertImage = useCallback(
    async (file: File) => {
      if (!editor) return;
      setUploading(true);
      try {
        const result = await uploadPostImage(file, postId);

        // Alt text is asked for at insert time rather than left for later,
        // because "later" means never and an unlabelled image is invisible to
        // a screen reader and to an image index alike.
        const alt =
          window.prompt(
            "Describe this image for screen readers and search engines",
            "",
          ) ?? "";

        editor
          .chain()
          .focus()
          .setImage({ src: result.url, alt })
          .createParagraphNear()
          .run();

        toast.success(
          result.deduped
            ? "Image already uploaded, reused it"
            : `Image added, ${formatBytes(result.originalBytes)} compressed to ${formatBytes(result.bytes)}`,
        );
      } catch (error) {
        toast.error(
          error instanceof ImageRejected
            ? error.message
            : error instanceof Error
              ? error.message
              : "Could not upload that image",
        );
      } finally {
        setUploading(false);
      }
    },
    [editor, postId],
  );

  // Paste and drop. Both are how people actually get an image into a post;
  // the toolbar button is the fallback, not the main path.
  useEffect(() => {
    if (!editor) return;
    const dom = editor.view.dom;

    const onPaste = (event: ClipboardEvent) => {
      const file = Array.from(event.clipboardData?.files ?? [])[0];
      if (file?.type.startsWith("image/")) {
        event.preventDefault();
        void insertImage(file);
      }
    };
    const onDrop = (event: DragEvent) => {
      const file = Array.from(event.dataTransfer?.files ?? [])[0];
      if (file?.type.startsWith("image/")) {
        event.preventDefault();
        void insertImage(file);
      }
    };

    dom.addEventListener("paste", onPaste);
    dom.addEventListener("drop", onDrop);
    return () => {
      dom.removeEventListener("paste", onPaste);
      dom.removeEventListener("drop", onDrop);
    };
  }, [editor, insertImage]);

  if (!editor) {
    return (
      <div className="flex min-h-[32rem] items-center justify-center rounded-2xl border border-border bg-card/40">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card/40 backdrop-blur-xl">
      {/* Sticky so the controls stay reachable in a long piece. */}
      <div className="sticky top-16 z-20 flex flex-wrap items-center gap-0.5 border-b border-border bg-card/90 px-3 py-2 backdrop-blur-xl">
        <ToolbarButton
          label="Undo"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
        >
          <Undo2 className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Redo"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
        >
          <Redo2 className="size-4" />
        </ToolbarButton>

        <Divider />

        <ToolbarButton
          label="Heading"
          active={editor.isActive("heading", { level: 2 })}
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
        >
          <Heading2 className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Subheading"
          active={editor.isActive("heading", { level: 3 })}
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 3 }).run()
          }
        >
          <Heading3 className="size-4" />
        </ToolbarButton>

        <Divider />

        <ToolbarButton
          label="Bold"
          active={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Italic"
          active={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Underline"
          active={editor.isActive("underline")}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        >
          <UnderlineIcon className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Strikethrough"
          active={editor.isActive("strike")}
          onClick={() => editor.chain().focus().toggleStrike().run()}
        >
          <Strikethrough className="size-4" />
        </ToolbarButton>

        <Divider />

        <ToolbarButton
          label="Bulleted list"
          active={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Numbered list"
          active={editor.isActive("orderedList")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Quote"
          active={editor.isActive("blockquote")}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        >
          <Quote className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Code block"
          active={editor.isActive("codeBlock")}
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        >
          <Code className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Divider"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
        >
          <Minus className="size-4" />
        </ToolbarButton>

        <Divider />

        <ToolbarButton
          label="Link"
          active={editor.isActive("link")}
          onClick={() => toggleLink(editor)}
        >
          <Link2 className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Insert image"
          disabled={uploading}
          onClick={() => fileInput.current?.click()}
        >
          {uploading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <ImagePlus className="size-4" />
          )}
        </ToolbarButton>

        <span className="ml-auto pr-1 text-xs text-muted-foreground">
          {editor.storage.characterCount?.words?.() ?? ""}
        </span>
      </div>

      <input
        ref={fileInput}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif,image/avif"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void insertImage(file);
          // Reset so choosing the same file twice still fires a change event.
          event.target.value = "";
        }}
      />

      <BubbleMenu
        editor={editor}
        className="flex items-center gap-0.5 rounded-xl border border-border bg-popover/95 p-1 shadow-2xl backdrop-blur-xl"
      >
        <ToolbarButton
          label="Bold"
          active={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Italic"
          active={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Link"
          active={editor.isActive("link")}
          onClick={() => toggleLink(editor)}
        >
          <Link2 className="size-4" />
        </ToolbarButton>
        {editor.isActive("link") && (
          <ToolbarButton
            label="Remove link"
            onClick={() => editor.chain().focus().unsetLink().run()}
          >
            <Link2Off className="size-4" />
          </ToolbarButton>
        )}
      </BubbleMenu>

      <EditorContent editor={editor} />
    </div>
  );
}
