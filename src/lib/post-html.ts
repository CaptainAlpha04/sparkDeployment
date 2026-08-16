import sanitizeHtml from "sanitize-html";

/**
 * Turns editor output into the three stored representations of a body.
 *
 * The editor sends HTML it generated itself, which is convenient but not
 * trustworthy: the request is just a request, and an authenticated editor
 * account is a smaller step from compromise than we would like. So the HTML is
 * re-derived here through a strict allowlist that admits only the tags the
 * editor's own schema can produce. Anything else — script, style, iframe, an
 * onerror attribute, a javascript: href — is dropped rather than escaped.
 *
 * The plain-text form is not decoration. It backs reading time, the generated
 * excerpt, and the markdown-ish variant that agents and LLM crawlers fetch, so
 * it has to survive the same trip.
 */

/** Roughly the adult silent-reading rate for prose. */
const WORDS_PER_MINUTE = 200;
const EXCERPT_TARGET = 165;

export const ALLOWED_TAGS = [
  "p",
  // h1 is reserved for the post title in the page itself, so the body starts
  // at h2. A second h1 inside the article confuses the document outline that
  // both screen readers and search engines build from headings.
  "h2",
  "h3",
  "h4",
  "blockquote",
  "ul",
  "ol",
  "li",
  "pre",
  "code",
  "hr",
  "br",
  "strong",
  "em",
  "s",
  "u",
  "a",
  "img",
  "figure",
  "figcaption",
];

const SANITIZE_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: ALLOWED_TAGS,
  allowedAttributes: {
    a: ["href", "rel", "target"],
    img: ["src", "alt", "width", "height", "loading", "decoding"],
    code: ["class"],
    pre: ["class"],
  },
  // http is absent deliberately: a mixed-content image silently fails to load
  // on an https page, and a mixed-content link is a downgrade we should not
  // publish under our own name.
  allowedSchemes: ["https", "mailto"],
  allowedSchemesByTag: { img: ["https", "data"] },
  // Strip empty paragraphs the editor leaves behind, but keep <br> and <hr>.
  nonTextTags: ["style", "script", "textarea", "option", "noscript"],
  transformTags: {
    a: (tagName, attribs) => {
      const href = attribs.href ?? "";
      // Only outbound links get nofollow. Marking our own internal links
      // nofollow would ask crawlers not to follow us around our own site.
      const external = /^https?:\/\//i.test(href);
      const attributes: sanitizeHtml.Attributes = external
        ? { href, rel: "nofollow noopener noreferrer", target: "_blank" }
        : { href };
      return { tagName, attribs: attributes };
    },
    img: (tagName, attribs) => ({
      tagName,
      attribs: {
        ...attribs,
        alt: attribs.alt ?? "",
        loading: "lazy",
        decoding: "async",
      },
    }),
  },
};

export function sanitizePostHtml(html: string): string {
  return sanitizeHtml(html, SANITIZE_OPTIONS).trim();
}

/**
 * Plain text from sanitised HTML.
 *
 * Block tags become spaces first, otherwise "end.<p>Next" collapses into
 * "end.Next" and both the word count and the excerpt read as nonsense.
 */
export function htmlToText(html: string): string {
  // Stripping tags alone runs "<p>One.</p><p>Two.</p>" together into
  // "One.Two.", which corrupts the word count and makes the generated excerpt
  // read as one mangled sentence. Block boundaries become spaces first.
  const spaced = html.replace(
    /<\/(p|h[1-6]|li|blockquote|pre|figcaption|div|tr)>|<(br|hr)\s*\/?>/gi,
    " ",
  );

  return sanitizeHtml(spaced, { allowedTags: [], allowedAttributes: {} })
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function countWords(text: string): number {
  if (!text) return 0;
  return text.split(/\s+/).filter(Boolean).length;
}

/** Always at least 1: "0 min read" is not a thing a reader can act on. */
export function readingMinutes(text: string): number {
  return Math.max(1, Math.round(countWords(text) / WORDS_PER_MINUTE));
}

/**
 * A description-length summary, cut at a word boundary.
 *
 * Search engines truncate around 155 to 160 characters, so overshooting buys
 * an ellipsis and nothing else.
 */
export function deriveExcerpt(text: string, target = EXCERPT_TARGET): string {
  const clean = text.trim();
  if (clean.length <= target) return clean;

  const window = clean.slice(0, target + 1);
  const lastSpace = window.lastIndexOf(" ");
  const cut = clean.slice(0, lastSpace > 40 ? lastSpace : target).trimEnd();
  // Do not leave dangling punctuation before the ellipsis.
  return `${cut.replace(/[,;:.\-–]$/, "")}…`;
}

export type DerivedBody = {
  html: string;
  text: string;
  readingMinutes: number;
  excerpt: string;
};

/** One call, so the three representations can never drift out of step. */
export function deriveBody(rawHtml: string): DerivedBody {
  const html = sanitizePostHtml(rawHtml);
  const text = htmlToText(html);
  return {
    html,
    text,
    readingMinutes: readingMinutes(text),
    excerpt: deriveExcerpt(text),
  };
}

/**
 * Headings, for the in-article table of contents.
 *
 * Parsed from the sanitised HTML rather than tracked in the editor, so it can
 * never disagree with what is actually rendered.
 */
export type Heading = { id: string; text: string; level: 2 | 3 };

export function slugifyHeading(text: string): string {
  return (
    text
      .toLowerCase()
      .replace(/[^\p{L}\p{N}]+/gu, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "section"
  );
}

/**
 * Adds stable ids to h2/h3 and returns them, so the table of contents and the
 * anchors it points at are produced from a single pass.
 */
export function withHeadingAnchors(html: string): {
  html: string;
  headings: Heading[];
} {
  const headings: Heading[] = [];
  const seen = new Map<string, number>();

  const out = html.replace(
    /<h([23])>([\s\S]*?)<\/h\1>/g,
    (_match, level: string, inner: string) => {
      const text = htmlToText(inner);
      const base = slugifyHeading(text);
      // Two sections legitimately called "Results" must not share an anchor.
      const n = seen.get(base) ?? 0;
      seen.set(base, n + 1);
      const id = n === 0 ? base : `${base}-${n + 1}`;

      headings.push({ id, text, level: Number(level) as 2 | 3 });
      return `<h${level} id="${id}">${inner}</h${level}>`;
    },
  );

  return { html: out, headings };
}
