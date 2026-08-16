import { afterAll, describe, expect, it } from "vitest";
import { sql } from "drizzle-orm";
import { db } from "./db";
import {
  getPublishedPost,
  getRelatedPosts,
  listPublishedIndex,
  listPublishedPosts,
  listPublishedTags,
  searchPublishedPosts,
  slugify,
  uniqueSlug,
} from "./posts";
import { CLEANUP_TIMEOUT, deletePostsByIds } from "@/test/cleanup";

/**
 * The read side is public and unguarded — the blog is public — so it is
 * directly testable, and its visibility rules are the ones worth pinning down.
 * A draft leaking onto the index would publish something before its author
 * meant to, which is the same class of bug as a draft event leaking.
 *
 * The write functions all call requireEditor(), which needs a request context,
 * so those are covered through the schema and the pure helpers instead.
 */

const postIds: string[] = [];
const tag = crypto.randomUUID().slice(0, 8);

async function makePost(opts: {
  kind?: "article" | "case_study";
  status?: "draft" | "published" | "archived";
  title?: string;
  slug?: string;
  tags?: string[];
  daysAgo?: number;
  featured?: boolean;
  body?: string;
  noindex?: boolean;
}): Promise<string> {
  const slug = opts.slug ?? `p-${tag}-${crypto.randomUUID().slice(0, 8)}`;
  const status = opts.status ?? "published";

  // Interpolating a JS array into a drizzle sql`` tag expands it as a row
  // constructor, so an empty one becomes a bare "()" and Postgres rejects the
  // statement. A literal string cast to text[] is unambiguous. Fixture tags
  // are plain identifiers, so no quoting is needed.
  const tagLiteral = `{${(opts.tags ?? []).join(",")}}`;

  const [row] = await db.execute(sql`
    insert into posts (
      slug, title, kind, status, published_at, tags, featured, body_text, body_html, noindex
    )
    values (
      ${slug},
      ${opts.title ?? `Test ${status}`},
      ${opts.kind ?? "article"}::post_kind,
      ${status}::post_status,
      ${
        status === "published"
          ? sql`now() - (${opts.daysAgo ?? 1} || ' days')::interval`
          : sql`null`
      },
      ${tagLiteral}::text[],
      ${opts.featured ?? false},
      ${opts.body ?? "Body text"},
      ${`<p>${opts.body ?? "Body text"}</p>`},
      ${opts.noindex ?? false}
    )
    returning id
  `);

  const id = row.id as string;
  postIds.push(id);
  return id;
}

afterAll(async () => {
  await deletePostsByIds(postIds);
}, CLEANUP_TIMEOUT);

describe("slugify", () => {
  it("makes a url-safe slug from a title", () => {
    expect(slugify("What We Learned, In 2026!")).toBe("what-we-learned-in-2026");
  });

  it("keeps non-ASCII letters instead of emptying the slug", () => {
    // Titles here are sometimes transliterated Urdu. Stripping to [a-z0-9]
    // would reduce some of them to an empty string.
    expect(slugify("Mehfil-e-Sukhan")).toBe("mehfil-e-sukhan");
    expect(slugify("Café")).toBe("café");
  });

  it("never ends in a separator", () => {
    expect(slugify("Trailing --- ")).toBe("trailing");
  });
});

describe("uniqueSlug", () => {
  it("suffixes rather than colliding", async () => {
    const base = `dup-${tag}`;
    await makePost({ slug: base, title: base });

    const next = await uniqueSlug(base);
    expect(next).toBe(`${base}-2`);
  });

  it("shares one namespace across both kinds", async () => {
    // Slugs are unique across articles and case studies so a piece can be
    // reclassified without its URL breaking.
    const base = `cross-${tag}`;
    await makePost({ slug: base, title: base, kind: "case_study" });

    expect(await uniqueSlug(base)).toBe(`${base}-2`);
  });

  it("lets a post keep its own slug when excluded", async () => {
    const base = `self-${tag}`;
    const id = await makePost({ slug: base, title: base });

    expect(await uniqueSlug(base, id)).toBe(base);
  });
});

describe("visibility", () => {
  it("shows published posts and hides drafts and archives", async () => {
    const draftSlug = `draft-${tag}`;
    const archivedSlug = `arch-${tag}`;
    const liveSlug = `live-${tag}`;

    await makePost({ slug: draftSlug, status: "draft" });
    await makePost({ slug: archivedSlug, status: "archived" });
    await makePost({ slug: liveSlug, status: "published" });

    expect(await getPublishedPost(liveSlug)).not.toBeNull();
    // An unfinished draft reachable by guessing its URL is a leak.
    expect(await getPublishedPost(draftSlug)).toBeNull();
    expect(await getPublishedPost(archivedSlug)).toBeNull();
  });

  it("separates articles from case studies in the index", async () => {
    const articleSlug = `art-${tag}`;
    const caseSlug = `case-${tag}`;
    await makePost({ slug: articleSlug, kind: "article" });
    await makePost({ slug: caseSlug, kind: "case_study" });

    const articles = await listPublishedPosts({ kind: "article", limit: 200 });
    const cases = await listPublishedPosts({ kind: "case_study", limit: 200 });

    expect(articles.map((p) => p.slug)).toContain(articleSlug);
    expect(articles.map((p) => p.slug)).not.toContain(caseSlug);
    expect(cases.map((p) => p.slug)).toContain(caseSlug);
  });

  it("puts featured posts first, then newest", async () => {
    const old = `ord-old-${tag}`;
    const recent = `ord-new-${tag}`;
    const starred = `ord-star-${tag}`;

    await makePost({ slug: old, daysAgo: 40, tags: [`ord${tag}`] });
    await makePost({ slug: recent, daysAgo: 2, tags: [`ord${tag}`] });
    await makePost({ slug: starred, daysAgo: 90, featured: true, tags: [`ord${tag}`] });

    const ordered = (await listPublishedPosts({ tag: `ord${tag}`, limit: 50 })).map(
      (p) => p.slug,
    );

    expect(ordered[0]).toBe(starred);
    expect(ordered.indexOf(recent)).toBeLessThan(ordered.indexOf(old));
  });
});

describe("tags", () => {
  it("filters by tag", async () => {
    const wanted = `t-${tag}`;
    const hit = `tagged-${tag}`;
    await makePost({ slug: hit, tags: [wanted, "other"] });
    await makePost({ slug: `untagged-${tag}`, tags: ["other"] });

    const found = await listPublishedPosts({ tag: wanted, limit: 50 });
    expect(found.map((p) => p.slug)).toEqual([hit]);
  });

  it("counts only published posts", async () => {
    const wanted = `tc-${tag}`;
    await makePost({ slug: `tc-live-${tag}`, tags: [wanted] });
    await makePost({ slug: `tc-draft-${tag}`, tags: [wanted], status: "draft" });

    const counts = await listPublishedTags();
    expect(counts.find((c) => c.tag === wanted)?.count).toBe(1);
  });
});

describe("listPublishedIndex", () => {
  it("returns published posts without their bodies", async () => {
    const slug = `idx-${tag}`;
    await makePost({ slug });

    const index = await listPublishedIndex();
    const entry = index.find((p) => p.slug === slug);

    expect(entry).toBeDefined();
    // The sitemap and llms.txt iterate every post on the site; shipping the
    // body column to them would be the largest read on the site for no reason.
    expect(entry).not.toHaveProperty("bodyHtml");
  });

  it("reports noindex so the sitemap can skip those posts", async () => {
    const slug = `noidx-${tag}`;
    await makePost({ slug, noindex: true });

    const entry = (await listPublishedIndex()).find((p) => p.slug === slug);
    expect(entry?.noindex).toBe(true);
  });
});

describe("getRelatedPosts", () => {
  it("excludes the post itself", async () => {
    const shared = `rel-${tag}`;
    const id = await makePost({ slug: `rel-self-${tag}`, tags: [shared] });
    await makePost({ slug: `rel-other-${tag}`, tags: [shared] });

    const related = await getRelatedPosts(
      { id, kind: "article", tags: [shared] },
      5,
    );
    expect(related.map((p) => p.id)).not.toContain(id);
  });

  it("does not throw for a post with no tags", async () => {
    // The tag-overlap ordering term is only added when there are tags to
    // overlap; without the guard this builds invalid SQL.
    const id = await makePost({ slug: `rel-bare-${tag}`, tags: [] });
    await expect(
      getRelatedPosts({ id, kind: "article", tags: [] }, 3),
    ).resolves.toBeInstanceOf(Array);
  });
});

describe("searchPublishedPosts", () => {
  it("matches title and body, and never returns drafts", async () => {
    const needle = `zebracorn${tag}`;
    await makePost({ slug: `s-title-${tag}`, title: `About ${needle}` });
    await makePost({ slug: `s-body-${tag}`, body: `mentions ${needle} inside` });
    await makePost({
      slug: `s-draft-${tag}`,
      title: `Draft ${needle}`,
      status: "draft",
    });

    const found = await searchPublishedPosts(needle, 20);
    const slugs = found.map((p) => p.slug);

    expect(slugs).toContain(`s-title-${tag}`);
    expect(slugs).toContain(`s-body-${tag}`);
    expect(slugs).not.toContain(`s-draft-${tag}`);
  });

  it("returns nothing for an empty query rather than everything", async () => {
    expect(await searchPublishedPosts("   ")).toEqual([]);
  });
});
