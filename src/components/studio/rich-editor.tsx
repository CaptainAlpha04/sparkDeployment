"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  EditorContent,
  useEditor,
  useEditorState,
  type Editor,
} from "@tiptap/react";
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
 * The writing surface, with a floating command bar pinned to the bottom.
 *
 * The bar is always there rather than appearing on selection. A selection-only
 * menu means the controls do not exist until you already know they do, and it
 * cannot offer anything that acts without a selection — undo, insert image,
 * insert a divider. Pinned to the bottom it stays out of the text's way while
 * remaining one glance away, and it never covers the line being typed the way
 * a top toolbar does.
 *
 * Headings start at h2. The post title is the page's only h1, and a second one
 * inside the body breaks the document outline that screen readers and crawlers
 * both build from heading order.
 */

type Props = {
  /** ProseMirror JSON from a previous save, or null for a new post. */
  initialContent: unknown;
  /** Namespaces uploaded images so a deleted post can sweep its own folder. */
  postId: string;
  onChange: (value: { json: unknown; html: string }) => void;
  /** Shifts the bar clear of the settings panel when it is open. */
  panelOpen?: boolean;
  placeholder?: string;
};

function BarButton({
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
      // Mousedown, not click. A click handler runs after the browser has
      // already moved focus out of the document, collapsing the selection the
      // command is meant to act on. This matters more with a permanent bar
      // than a selection menu, because the caret is always somewhere.
      onMouseDown={(event) => {
        event.preventDefault();
        if (!disabled) onClick();
      }}
      disabled={disabled}
      title={label}
      aria-label={label}
      aria-pressed={active}
      className={cn(
        "inline-flex size-8 shrink-0 items-center justify-center rounded-lg transition-colors",
        active
          ? "bg-primary/25 text-primary"
          : "text-white/65 hover:bg-white/10 hover:text-white",
        disabled && "pointer-events-none opacity-30",
      )}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <span className="mx-1 h-5 w-px shrink-0 bg-white/12" aria-hidden />;
}

/**
 * Link editing via window.prompt.
 *
 * Deliberate rather than lazy: a prompt cannot steal the selection, which is
 * the failure mode of every hand-rolled link popover inside a contenteditable.
 */
function promptForLink(editor: Editor) {
  const existing = editor.getAttributes("link").href as string | undefined;
  const input = window.prompt("Link URL", existing ?? "https://");
  if (input === null) return;

  const href = input.trim();
  if (!href) {
    editor.chain().focus().extendMarkRange("link").unsetLink().run();
    return;
  }
  // A bare domain is what people actually type. Without a scheme the browser
  // treats it as a relative path and the link 404s on our own site.
  const url = /^(https?:|mailto:|\/)/i.test(href) ? href : `https://${href}`;
  editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
}

export function RichEditor({
  initialContent,
  postId,
  onChange,
  panelOpen = false,
  placeholder = "Start writing.",
}: Props) {
  const [uploading, setUploading] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    // Server rendering produces markup React then disagrees with on hydration.
    // Tiptap exposes this flag for exactly this case.
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3, 4] },
        link: {
          openOnClick: false,
          autolink: true,
          // Matches the server allowlist. Accepting more here would only
          // mislead the person typing, since the extra would be stripped.
          protocols: ["https", "mailto"],
        },
        codeBlock: { HTMLAttributes: { class: "not-prose" } },
      }),
      Image.configure({ inline: false, HTMLAttributes: { class: "rounded-xl" } }),
      Placeholder.configure({ placeholder }),
    ],
    content: (initialContent as never) ?? "",
    editorProps: {
      attributes: {
        class: "prose-spark min-h-[60vh] max-w-none focus:outline-none",
      },
    },
    onUpdate: ({ editor }) => {
      onChange({ json: editor.getJSON(), html: editor.getHTML() });
    },
  });

  /*
   * Toolbar state, subscribed rather than read during render.
   *
   * useEditor does not re-render on every transaction in Tiptap 3 —
   * shouldRerenderOnTransaction defaults to false, for good performance
   * reasons. A selection menu gets away with that because it remounts on each
   * selection; a permanent bar does not, and would sit there showing whatever
   * was true when the component last happened to render. This hook subscribes
   * to exactly the flags the bar draws.
   */
  const state = useEditorState({
    editor,
    selector: ({ editor }) =>
      editor
        ? {
            h2: editor.isActive("heading", { level: 2 }),
            h3: editor.isActive("heading", { level: 3 }),
            bold: editor.isActive("bold"),
            italic: editor.isActive("italic"),
            underline: editor.isActive("underline"),
            strike: editor.isActive("strike"),
            code: editor.isActive("code"),
            bulletList: editor.isActive("bulletList"),
            orderedList: editor.isActive("orderedList"),
            blockquote: editor.isActive("blockquote"),
            link: editor.isActive("link"),
            canUndo: editor.can().undo(),
            canRedo: editor.can().redo(),
          }
        : null,
  });

  const insertImage = useCallback(
    async (file: File) => {
      if (!editor) return;
      setUploading(true);
      try {
        const result = await uploadPostImage(file, postId);

        // Alt text is asked for at insert time rather than left for later,
        // because later means never, and an unlabelled image is invisible to a
        // screen reader and to an image index alike.
        const alt =
          window.prompt(
            "Describe this image for screen readers and search engines",
            "",
          ) ?? "";

        editor.chain().focus().setImage({ src: result.url, alt }).createParagraphNear().run();

        toast.success(
          result.deduped
            ? "Image already uploaded, reused it"
            : `Image added, ${formatBytes(result.originalBytes)} compressed to ${formatBytes(result.bytes)}`,
        );
      } catch (error) {
        toast.error(
          error instanceof ImageRejected || error instanceof Error
            ? error.message
            : "Could not upload that image",
        );
      } finally {
        setUploading(false);
      }
    },
    [editor, postId],
  );

  // Paste and drop are how images actually get into a post; the bar button is
  // the fallback, not the main path.
  useEffect(() => {
    if (!editor) return;
    const dom = editor.view.dom;

    const handle = (files: FileList | undefined | null, event: Event) => {
      const file = Array.from(files ?? [])[0];
      if (file?.type.startsWith("image/")) {
        event.preventDefault();
        void insertImage(file);
      }
    };
    const onPaste = (e: ClipboardEvent) => handle(e.clipboardData?.files, e);
    const onDrop = (e: DragEvent) => handle(e.dataTransfer?.files, e);

    dom.addEventListener("paste", onPaste);
    dom.addEventListener("drop", onDrop);
    return () => {
      dom.removeEventListener("paste", onPaste);
      dom.removeEventListener("drop", onDrop);
    };
  }, [editor, insertImage]);

  if (!editor || !state) {
    // Matched to the editor's own min height so the page does not jump when
    // the real surface replaces this.
    return <div className="min-h-[60vh] animate-pulse" aria-hidden />;
  }

  return (
    <>
      <EditorContent editor={editor} />

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

      {/* Command bar ------------------------------------------------------
          Fixed to the viewport rather than the document, so it stays put while
          the page scrolls. The wrapper spans the full width and centres the
          pill inside it, which is what lets the bar follow the document when
          the settings panel pushes it aside. pointer-events are disabled on
          the wrapper so the strip of empty space either side of the pill does
          not swallow clicks meant for the text underneath. */}
      <div
        className={cn(
          "pointer-events-none fixed inset-x-0 bottom-0 z-30 flex justify-center px-4 pb-5 transition-[padding] duration-300 ease-out",
          panelOpen && "xl:pr-[23rem]",
        )}
      >
        <div
          role="toolbar"
          aria-label="Formatting"
          aria-orientation="horizontal"
          className="pointer-events-auto flex max-w-full items-center gap-0.5 overflow-x-auto rounded-2xl border border-white/10 bg-[#15161f]/95 p-1.5 shadow-2xl shadow-black/70 backdrop-blur-xl"
        >
          <BarButton
            label="Undo"
            disabled={!state.canUndo}
            onClick={() => editor.chain().focus().undo().run()}
          >
            <Undo2 className="size-4" />
          </BarButton>
          <BarButton
            label="Redo"
            disabled={!state.canRedo}
            onClick={() => editor.chain().focus().redo().run()}
          >
            <Redo2 className="size-4" />
          </BarButton>

          <Divider />

          <BarButton
            label="Heading"
            active={state.h2}
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          >
            <Heading2 className="size-4" />
          </BarButton>
          <BarButton
            label="Subheading"
            active={state.h3}
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          >
            <Heading3 className="size-4" />
          </BarButton>

          <Divider />

          <BarButton
            label="Bold"
            active={state.bold}
            onClick={() => editor.chain().focus().toggleBold().run()}
          >
            <Bold className="size-4" />
          </BarButton>
          <BarButton
            label="Italic"
            active={state.italic}
            onClick={() => editor.chain().focus().toggleItalic().run()}
          >
            <Italic className="size-4" />
          </BarButton>
          <BarButton
            label="Underline"
            active={state.underline}
            onClick={() => editor.chain().focus().toggleUnderline().run()}
          >
            <UnderlineIcon className="size-4" />
          </BarButton>
          <BarButton
            label="Strikethrough"
            active={state.strike}
            onClick={() => editor.chain().focus().toggleStrike().run()}
          >
            <Strikethrough className="size-4" />
          </BarButton>
          <BarButton
            label="Inline code"
            active={state.code}
            onClick={() => editor.chain().focus().toggleCode().run()}
          >
            <Code className="size-4" />
          </BarButton>

          <Divider />

          <BarButton
            label="Bulleted list"
            active={state.bulletList}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
          >
            <List className="size-4" />
          </BarButton>
          <BarButton
            label="Numbered list"
            active={state.orderedList}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
          >
            <ListOrdered className="size-4" />
          </BarButton>
          <BarButton
            label="Quote"
            active={state.blockquote}
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
          >
            <Quote className="size-4" />
          </BarButton>
          <BarButton
            label="Divider"
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
          >
            <Minus className="size-4" />
          </BarButton>

          <Divider />

          <BarButton
            label={state.link ? "Edit link" : "Add link"}
            active={state.link}
            onClick={() => promptForLink(editor)}
          >
            <Link2 className="size-4" />
          </BarButton>
          {state.link && (
            <BarButton
              label="Remove link"
              onClick={() => editor.chain().focus().unsetLink().run()}
            >
              <Link2Off className="size-4" />
            </BarButton>
          )}
          <BarButton
            label="Insert image"
            disabled={uploading}
            onClick={() => fileInput.current?.click()}
          >
            {uploading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <ImagePlus className="size-4" />
            )}
          </BarButton>
        </div>
      </div>
    </>
  );
}
