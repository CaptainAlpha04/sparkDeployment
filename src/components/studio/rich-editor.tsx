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
  Italic,
  Link2,
  Link2Off,
  List,
  ListOrdered,
  Quote,
  Strikethrough,
  Underline as UnderlineIcon,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { uploadPostImage } from "@/lib/post-media";
import { formatBytes, ImageRejected } from "@/lib/image-compress";

/**
 * The writing surface.
 *
 * There is no toolbar attached to this component on purpose. A permanent bar
 * sitting on top of the page is what made the first version feel like a form:
 * it floated over the first line of the document and competed with the text
 * for attention. Formatting appears on selection instead, the way it does in a
 * document editor, and the two commands that need no selection — insert image,
 * insert link — are lifted into the app bar via `onReady`.
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
  /**
   * Hands the editor instance up so the app bar can drive commands that do not
   * belong in a selection menu.
   */
  onReady?: (editor: EditorHandle | null) => void;
  placeholder?: string;
};

export type EditorHandle = {
  insertImage: (file: File) => Promise<void>;
  setLink: () => void;
  focus: () => void;
  uploading: boolean;
};

function BubbleButton({
  onClick,
  active,
  label,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      // Mousedown, not click: a click handler fires after the browser has
      // already moved focus out of the document, which collapses the selection
      // the command is meant to act on.
      onMouseDown={(event) => {
        event.preventDefault();
        onClick();
      }}
      title={label}
      aria-label={label}
      aria-pressed={active}
      className={cn(
        "inline-flex size-8 items-center justify-center rounded-md transition-colors",
        active
          ? "bg-primary/25 text-primary"
          : "text-white/70 hover:bg-white/10 hover:text-white",
      )}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <span className="mx-0.5 h-5 w-px bg-white/15" aria-hidden />;
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
  onReady,
  placeholder = "Start writing. Select any text to format it.",
}: Props) {
  const [uploading, setUploading] = useState(false);

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

  // Publish the handle upward. Depends on `uploading` so the app bar's spinner
  // tracks an upload started from either place.
  const onReadyRef = useRef(onReady);
  useEffect(() => {
    onReadyRef.current = onReady;
  }, [onReady]);

  useEffect(() => {
    if (!editor) {
      onReadyRef.current?.(null);
      return;
    }
    onReadyRef.current?.({
      insertImage,
      setLink: () => promptForLink(editor),
      focus: () => editor.chain().focus().run(),
      uploading,
    });
  }, [editor, insertImage, uploading]);

  // Paste and drop are how images actually get into a post; the app bar button
  // is the fallback, not the main path.
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

  if (!editor) {
    // Matched to the editor's own min height so the page does not jump when
    // the real surface replaces this.
    return <div className="min-h-[60vh] animate-pulse" aria-hidden />;
  }

  return (
    <>
      <BubbleMenu
        editor={editor}
        className="flex items-center gap-0.5 rounded-xl border border-white/10 bg-[#15161f]/95 p-1 shadow-2xl shadow-black/60 backdrop-blur-xl"
      >
        <BubbleButton
          label="Heading"
          active={editor.isActive("heading", { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          <Heading2 className="size-4" />
        </BubbleButton>
        <BubbleButton
          label="Subheading"
          active={editor.isActive("heading", { level: 3 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        >
          <Heading3 className="size-4" />
        </BubbleButton>

        <Divider />

        <BubbleButton
          label="Bold"
          active={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold className="size-4" />
        </BubbleButton>
        <BubbleButton
          label="Italic"
          active={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic className="size-4" />
        </BubbleButton>
        <BubbleButton
          label="Underline"
          active={editor.isActive("underline")}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        >
          <UnderlineIcon className="size-4" />
        </BubbleButton>
        <BubbleButton
          label="Strikethrough"
          active={editor.isActive("strike")}
          onClick={() => editor.chain().focus().toggleStrike().run()}
        >
          <Strikethrough className="size-4" />
        </BubbleButton>
        <BubbleButton
          label="Inline code"
          active={editor.isActive("code")}
          onClick={() => editor.chain().focus().toggleCode().run()}
        >
          <Code className="size-4" />
        </BubbleButton>

        <Divider />

        <BubbleButton
          label="Bulleted list"
          active={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List className="size-4" />
        </BubbleButton>
        <BubbleButton
          label="Numbered list"
          active={editor.isActive("orderedList")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered className="size-4" />
        </BubbleButton>
        <BubbleButton
          label="Quote"
          active={editor.isActive("blockquote")}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        >
          <Quote className="size-4" />
        </BubbleButton>

        <Divider />

        <BubbleButton
          label="Link"
          active={editor.isActive("link")}
          onClick={() => promptForLink(editor)}
        >
          <Link2 className="size-4" />
        </BubbleButton>
        {editor.isActive("link") && (
          <BubbleButton
            label="Remove link"
            onClick={() => editor.chain().focus().unsetLink().run()}
          >
            <Link2Off className="size-4" />
          </BubbleButton>
        )}
      </BubbleMenu>

      <EditorContent editor={editor} />
    </>
  );
}
