import TurndownService from "turndown";
import { absoluteUrl, postPath, type SeoPost } from "@/lib/seo";

/**
 * The plain text form of a post, for agents and anyone reading with curl.
 *
 * Why this exists at all: an LLM fetching an article gets our full HTML page,
 * spends most of its budget on navigation, footer and script tags, and has to
 * infer which part was the article. A markdown variant is the whole article
 * and nothing else, with the metadata stated rather than implied.
 *
 * Turndown rather than a hand-rolled converter. The input is sanitised HTML
 * from a known schema, so a regex would mostly work, and "mostly" is how you
 * get a nested list silently flattened.
 */

function turndown() {
  const service = new TurndownService({
    headingStyle: "atx",
    codeBlockStyle: "fenced",
    bulletListMarker: "-",
    emDelimiter: "*",
  });

  // Images: keep the alt text, which is the part that carries meaning in a
  // text-only rendering.
  service.addRule("image", {
    filter: "img",
    replacement: (_content, node) => {
      const element = node as unknown as HTMLImageElement;
      const alt = element.getAttribute("alt") ?? "";
      const src = element.getAttribute("src") ?? "";
      return src ? `\n![${alt}](${src})\n` : "";
    },
  });

  return service;
}

/** ISO date, or nothing. Avoids printing "Invalid Date" into a feed. */
function isoDate(date: Date | null | undefined) {
  return date ? date.toISOString() : undefined;
}

/**
 * A post as markdown with a YAML front matter block.
 *
 * Front matter rather than prose preamble because it is unambiguous to parse
 * and every static site generator, note tool and agent already understands it.
 */
export function postToMarkdown(
  post: SeoPost & { bodyHtml: string | null },
): string {
  const url = absoluteUrl(postPath(post));
  const service = turndown();

  const front: [string, string | undefined][] = [
    ["title", JSON.stringify(post.title)],
    ["type", post.kind === "case_study" ? "case-study" : "article"],
    ["url", url],
    ["published", isoDate(post.publishedAt)],
    ["modified", isoDate(post.updatedAt)],
    ["author", post.authorName ? JSON.stringify(post.authorName) : undefined],
    ["reading_time", `${post.readingMinutes} min`],
    [
      "tags",
      post.tags.length ? `[${post.tags.map((t) => JSON.stringify(t)).join(", ")}]` : undefined,
    ],
    ["organisation", post.clientOrg ? JSON.stringify(post.clientOrg) : undefined],
    ["license", '"CC BY 4.0, attribute to SPARK Chapter"'],
  ];

  const header = front
    .filter(([, value]) => value !== undefined)
    .map(([key, value]) => `${key}: ${value}`)
    .join("\n");

  const parts = ["---", header, "---", "", `# ${post.title}`];

  if (post.subtitle) parts.push("", `*${post.subtitle}*`);
  if (post.excerpt) parts.push("", `> ${post.excerpt}`);

  const body = post.bodyHtml ? service.turndown(post.bodyHtml) : "";
  parts.push("", body.trim() || "_This post has no body yet._");

  parts.push(
    "",
    "---",
    "",
    `Source: ${url}`,
    "SPARK Chapter, a student innovation community at NUST H-12, Islamabad.",
  );

  return parts.join("\n");
}

/** Shared response shape, so both post kinds serve identical headers. */
export function markdownResponse(body: string) {
  return new Response(body, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control":
        "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
      // Tells a crawler this is a representation of the HTML page, not a
      // separate document competing with it for the same content.
      "X-Robots-Tag": "noindex, follow",
    },
  });
}
