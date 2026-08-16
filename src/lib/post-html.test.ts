import { describe, expect, it } from "vitest";
import {
  countWords,
  deriveBody,
  deriveExcerpt,
  htmlToText,
  readingMinutes,
  sanitizePostHtml,
  slugifyHeading,
  withHeadingAnchors,
} from "./post-html";

/**
 * The sanitiser is the only thing standing between an editor account and
 * script running on every reader's browser, because the stored HTML is
 * rendered with dangerouslySetInnerHTML. It is worth testing like it matters.
 *
 * Note what is being asserted: that dangerous constructs are *removed*, not
 * merely escaped. An escaped payload is still a payload if anything downstream
 * ever unescapes it.
 */
describe("sanitizePostHtml", () => {
  it("removes script tags and their contents", () => {
    const out = sanitizePostHtml(
      "<p>Before</p><script>alert('xss')</script><p>After</p>",
    );
    expect(out).not.toContain("script");
    expect(out).not.toContain("alert");
    expect(out).toContain("Before");
    expect(out).toContain("After");
  });

  it("strips event handler attributes", () => {
    const out = sanitizePostHtml(
      `<p onclick="steal()">Text</p><img src="https://x.test/a.png" onerror="steal()">`,
    );
    expect(out).not.toContain("onclick");
    expect(out).not.toContain("onerror");
    expect(out).not.toContain("steal");
  });

  it("drops javascript: and data: hrefs", () => {
    const out = sanitizePostHtml(
      `<a href="javascript:alert(1)">a</a><a href="data:text/html,<script>">b</a>`,
    );
    expect(out).not.toContain("javascript:");
    expect(out).not.toContain("data:text/html");
  });

  it("removes iframes, styles, and form elements", () => {
    const out = sanitizePostHtml(
      `<iframe src="https://evil.test"></iframe><style>body{display:none}</style><form><input name="password"></form>`,
    );
    expect(out).not.toContain("iframe");
    expect(out).not.toContain("display:none");
    expect(out).not.toContain("<input");
  });

  it("refuses h1, which belongs to the page title", () => {
    // Two h1 elements break the document outline that screen readers and
    // search engines both build from heading order.
    const out = sanitizePostHtml("<h1>Second title</h1><h2>Real section</h2>");
    expect(out).not.toContain("<h1");
    expect(out).toContain("<h2");
  });

  it("keeps the tags the editor actually produces", () => {
    const html =
      "<h2>Head</h2><p><strong>Bold</strong> and <em>italic</em> and <code>code</code></p><ul><li>One</li></ul><blockquote><p>Quoted</p></blockquote><pre><code>x</code></pre><hr>";
    const out = sanitizePostHtml(html);

    for (const tag of ["h2", "strong", "em", "code", "ul", "li", "blockquote", "pre", "hr"]) {
      expect(out, tag).toContain(`<${tag}`);
    }
  });

  it("marks outbound links nofollow but leaves internal ones alone", () => {
    const external = sanitizePostHtml('<a href="https://example.com">out</a>');
    expect(external).toContain('rel="nofollow noopener noreferrer"');
    expect(external).toContain('target="_blank"');

    // Telling a crawler not to follow us around our own site would be an
    // own goal, so internal links must not pick up nofollow.
    const internal = sanitizePostHtml('<a href="/mission">in</a>');
    expect(internal).not.toContain("nofollow");
    expect(internal).not.toContain("target");
  });

  it("forces lazy loading and an alt attribute on images", () => {
    const out = sanitizePostHtml('<img src="https://cdn.test/a.webp">');
    expect(out).toContain('loading="lazy"');
    expect(out).toContain('alt=""');
  });
});

describe("htmlToText", () => {
  it("does not run block-level text together", () => {
    // "end.<p>Next" collapsing to "end.Next" corrupts the word count and makes
    // the generated excerpt read as nonsense.
    expect(htmlToText("<p>One.</p><p>Two.</p>")).toBe("One. Two.");
  });

  it("collapses whitespace and entities", () => {
    expect(htmlToText("<p>a&nbsp;&nbsp;b\n\n  c</p>")).toBe("a b c");
  });
});

describe("readingMinutes", () => {
  it("never returns zero", () => {
    // "0 min read" is not something a reader can act on.
    expect(readingMinutes("")).toBe(1);
    expect(readingMinutes("one two three")).toBe(1);
  });

  it("counts at roughly 200 words a minute", () => {
    const text = Array.from({ length: 600 }, () => "word").join(" ");
    expect(countWords(text)).toBe(600);
    expect(readingMinutes(text)).toBe(3);
  });
});

describe("deriveExcerpt", () => {
  it("returns short text unchanged and unellipsised", () => {
    expect(deriveExcerpt("Short enough.")).toBe("Short enough.");
  });

  it("cuts at a word boundary, not mid-word", () => {
    const text = Array.from({ length: 80 }, () => "alpha").join(" ");
    const excerpt = deriveExcerpt(text);

    expect(excerpt.length).toBeLessThanOrEqual(170);
    expect(excerpt.endsWith("…")).toBe(true);
    // A mid-word cut would leave a fragment like "alp…".
    expect(excerpt.replace("…", "").trim().split(" ").at(-1)).toBe("alpha");
  });

  it("does not leave dangling punctuation before the ellipsis", () => {
    const text = `${"padding ".repeat(20)}word, ${"more ".repeat(20)}`;
    expect(deriveExcerpt(text)).not.toContain(",…");
  });
});

describe("withHeadingAnchors", () => {
  it("adds ids and reports the headings it added", () => {
    const { html, headings } = withHeadingAnchors(
      "<h2>What we did</h2><p>x</p><h3>The setup</h3>",
    );

    expect(html).toContain('<h2 id="what-we-did">');
    expect(html).toContain('<h3 id="the-setup">');
    expect(headings).toEqual([
      { id: "what-we-did", text: "What we did", level: 2 },
      { id: "the-setup", text: "The setup", level: 3 },
    ]);
  });

  it("keeps duplicate headings on distinct anchors", () => {
    // Two sections legitimately called "Results" must not share an anchor, or
    // the second entry in the contents list jumps to the first section.
    const { headings } = withHeadingAnchors("<h2>Results</h2><h2>Results</h2>");
    expect(headings.map((h) => h.id)).toEqual(["results", "results-2"]);
  });

  it("ignores h4, which is below the contents threshold", () => {
    const { headings } = withHeadingAnchors("<h4>Minor</h4>");
    expect(headings).toEqual([]);
  });

  it("survives markup inside a heading", () => {
    const { html, headings } = withHeadingAnchors(
      "<h2>What <em>actually</em> happened</h2>",
    );
    expect(headings[0].text).toBe("What actually happened");
    expect(headings[0].id).toBe("what-actually-happened");
    // The inner markup must be preserved, not flattened into the output.
    expect(html).toContain("<em>actually</em>");
  });
});

describe("slugifyHeading", () => {
  it("keeps non-ASCII letters rather than emptying the slug", () => {
    expect(slugifyHeading("Café culture")).toBe("café-culture");
  });

  it("falls back rather than returning an empty id", () => {
    expect(slugifyHeading("!!!")).toBe("section");
  });
});

describe("deriveBody", () => {
  it("produces html, text, reading time and excerpt in step", () => {
    const result = deriveBody(
      "<h2>Hello</h2><p>This is the body of a post.</p><script>evil()</script>",
    );

    expect(result.html).not.toContain("script");
    expect(result.text).toBe("Hello This is the body of a post.");
    expect(result.readingMinutes).toBe(1);
    expect(result.excerpt).toBe("Hello This is the body of a post.");
  });

  it("handles an empty body without throwing", () => {
    // A post is created with no body at all, before anything is typed.
    const result = deriveBody("");
    expect(result.html).toBe("");
    expect(result.text).toBe("");
    expect(result.excerpt).toBe("");
    expect(result.readingMinutes).toBe(1);
  });
});
