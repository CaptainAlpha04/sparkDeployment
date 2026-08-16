import type { Metadata } from "next";
import { siteUrl } from "@/lib/site-url";

/**
 * One place that decides how anything on this site is described to a machine.
 *
 * The rule the studio UI promises is enforced here: nothing needs an SEO field
 * filled in. Every tag falls out of content that already exists — the title,
 * the derived excerpt, the cover image, the publication date. The override
 * columns are consulted first and are expected to be null.
 *
 * "AEO" is answer engine optimisation, which in practice means two things
 * neither of the traditional tags cover: structured data an LLM can parse
 * without guessing, and a plain text route it can fetch without executing our
 * JavaScript. Both live here too.
 */

export const SITE_NAME = "SPARK Chapter";
export const SITE_TAGLINE = "Pakistan's student innovation community";
export const ORG_DESCRIPTION =
  "SPARK is a student-led innovation community based at NUST H-12 in Islamabad, running events, research, and hands-on programmes for people building what comes next.";

export function absoluteUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  return `${siteUrl()}${path.startsWith("/") ? path : `/${path}`}`;
}

export type SeoPost = {
  kind: "article" | "case_study";
  slug: string;
  title: string;
  subtitle: string | null;
  excerpt: string | null;
  coverImageUrl: string | null;
  coverAlt: string | null;
  tags: string[];
  publishedAt: Date | null;
  updatedAt: Date;
  readingMinutes: number;
  seoTitle: string | null;
  seoDescription: string | null;
  canonicalUrl: string | null;
  noindex: boolean;
  authorName: string | null;
  clientOrg?: string | null;
};

export function postPath(post: Pick<SeoPost, "kind" | "slug">): string {
  return `${post.kind === "case_study" ? "/case-studies" : "/blog"}/${post.slug}`;
}

/**
 * The social card image, or nothing.
 *
 * Returning undefined is load-bearing rather than a gap. Next generates the
 * card from opengraph-image.tsx and injects it automatically, but only if the
 * page has not set `openGraph.images` itself — and its generated route carries
 * a content hash in the URL (`/opengraph-image-fx5gi7`) that we cannot predict
 * from here. Setting a guessed URL both overrides the working convention and
 * points at a 404, which is exactly what it did before this comment existed.
 *
 * So: an explicit cover wins, and otherwise we stay out of the way.
 */
function ogImage(post: SeoPost) {
  if (!post.coverImageUrl) return undefined;
  return { url: post.coverImageUrl, alt: post.coverAlt ?? post.title };
}

export function postMetadata(post: SeoPost): Metadata {
  const title = post.seoTitle?.trim() || post.title;
  const description =
    post.seoDescription?.trim() || post.excerpt?.trim() || SITE_TAGLINE;
  const path = postPath(post);
  const image = ogImage(post);

  return {
    title,
    description,
    alternates: {
      // A canonicalUrl means this ran somewhere else first, so we point at the
      // original rather than compete with it in the index.
      canonical: post.canonicalUrl || absoluteUrl(path),
      types: {
        // Advertised so an agent can find the plain text without guessing.
        "text/markdown": absoluteUrl(`${path}.md`),
      },
    },
    robots: post.noindex
      ? { index: false, follow: true }
      : { index: true, follow: true },
    openGraph: {
      type: "article",
      title,
      description,
      url: absoluteUrl(path),
      siteName: SITE_NAME,
      publishedTime: post.publishedAt?.toISOString(),
      modifiedTime: post.updatedAt.toISOString(),
      authors: post.authorName ? [post.authorName] : undefined,
      tags: post.tags,
      // Spread, not `images: undefined`. Next treats the key being present as
      // "this page has decided", so an explicit undefined suppresses the
      // generated card instead of deferring to it. The key has to be absent.
      ...(image ? { images: [image] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      ...(image ? { images: [image.url] } : {}),
    },
    other: {
      // Read by some readers and aggregators, and cheap to emit.
      "article:published_time": post.publishedAt?.toISOString() ?? "",
      "twitter:label1": "Reading time",
      "twitter:data1": `${post.readingMinutes} min`,
    },
  };
}

/* -------------------------------------------------------------------------
 * Structured data
 *
 * Emitted as JSON-LD rather than microdata: it is the format Google documents
 * for rich results, and it is the one an LLM can lift out of the page without
 * reconstructing the DOM.
 * ---------------------------------------------------------------------- */

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${siteUrl()}/#organization`,
    name: SITE_NAME,
    alternateName: "SPARK",
    description: ORG_DESCRIPTION,
    url: siteUrl(),
    // The real file in public/, not a guessed path. A logo URL that 404s is
    // worse than no logo: it is a structured-data error rather than an
    // omission, and Search Console reports it as one.
    logo: {
      "@type": "ImageObject",
      url: absoluteUrl("/images/logo.png"),
      width: 307,
      height: 323,
    },
    sameAs: [
      "https://www.linkedin.com/company/sparkchapter/",
      "https://www.instagram.com/sparkchapter",
      "https://www.facebook.com/profile.php?id=61564825415487",
    ],
    foundingLocation: {
      "@type": "Place",
      name: "NUST H-12, Islamabad, Pakistan",
    },
    areaServed: { "@type": "Country", name: "Pakistan" },
  };
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${siteUrl()}/#website`,
    name: SITE_NAME,
    description: SITE_TAGLINE,
    url: siteUrl(),
    publisher: { "@id": `${siteUrl()}/#organization` },
    inLanguage: "en",
  };
}

export function postJsonLd(post: SeoPost) {
  const path = postPath(post);

  return {
    "@context": "https://schema.org",
    // schema.org has no CaseStudy type. Article with an articleSection is what
    // consumers actually understand, so a case study is not misdescribed as a
    // BlogPosting either.
    "@type": post.kind === "case_study" ? "Article" : "BlogPosting",
    "@id": `${absoluteUrl(path)}#article`,
    headline: post.title,
    alternativeHeadline: post.subtitle ?? undefined,
    description: post.excerpt ?? undefined,
    articleSection: post.kind === "case_study" ? "Case study" : "Blog",
    keywords: post.tags.length ? post.tags.join(", ") : undefined,
    // Omitted rather than guessed when there is no cover: the generated card's
    // URL carries a content hash we cannot construct here, and a broken image
    // in structured data is worse than an absent one.
    image: post.coverImageUrl ? [post.coverImageUrl] : undefined,
    datePublished: post.publishedAt?.toISOString(),
    dateModified: post.updatedAt.toISOString(),
    author: post.authorName
      ? { "@type": "Person", name: post.authorName }
      : { "@id": `${siteUrl()}/#organization` },
    publisher: { "@id": `${siteUrl()}/#organization` },
    isAccessibleForFree: true,
    mainEntityOfPage: { "@type": "WebPage", "@id": absoluteUrl(path) },
    timeRequired: `PT${post.readingMinutes}M`,
    url: absoluteUrl(path),
  };
}

export function breadcrumbJsonLd(trail: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function collectionJsonLd({
  name,
  description,
  path,
  items,
}: {
  name: string;
  description: string;
  path: string;
  items: { title: string; kind: "article" | "case_study"; slug: string }[];
}) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name,
    description,
    url: absoluteUrl(path),
    isPartOf: { "@id": `${siteUrl()}/#website` },
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: items.length,
      itemListElement: items.map((item, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: item.title,
        url: absoluteUrl(postPath(item)),
      })),
    },
  };
}
