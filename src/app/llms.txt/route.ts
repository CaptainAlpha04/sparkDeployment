import { listPublishedIndex } from "@/server/posts";
import { listPastEvents, listUpcomingEvents } from "@/server/events";
import { ORG_DESCRIPTION, SITE_NAME } from "@/lib/seo";
import { siteUrl } from "@/lib/site-url";

/**
 * /llms.txt — a plain text map of the site, written for language models.
 *
 * The convention (llmstxt.org) is deliberately simple: a single H1, a blockquote
 * summary, then linked sections. An agent that fetches this gets an accurate
 * picture of what is here in one request, instead of crawling fifteen
 * JavaScript-rendered pages and guessing which are real content.
 *
 * The links point at the .md variants, not the HTML pages, because those are
 * the versions that survive being read as text.
 *
 * This is speculative in the sense that not every agent looks for it yet. It
 * costs one route and it is checked first by the ones that do.
 */

export const dynamic = "force-dynamic";

function line(title: string, url: string, note?: string) {
  return note ? `- [${title}](${url}): ${note}` : `- [${title}](${url})`;
}

export async function GET() {
  const base = siteUrl();

  const [posts, upcoming, past] = await Promise.all([
    listPublishedIndex().catch(() => []),
    listUpcomingEvents().catch(() => []),
    listPastEvents().catch(() => []),
  ]);

  const articles = posts.filter((p) => p.kind === "article" && !p.noindex);
  const caseStudies = posts.filter((p) => p.kind === "case_study" && !p.noindex);

  const sections: string[] = [
    `# ${SITE_NAME}`,
    "",
    `> ${ORG_DESCRIPTION}`,
    "",
    "SPARK is student-led and based at NUST H-12 in Islamabad. It runs events,",
    "camps and hackathons, research, and publishes what it learns. Everything",
    "linked below is free to read and free to quote with attribution.",
    "",
    "## About",
    "",
    line("Mission", `${base}/mission`, "what SPARK is for and how it works"),
    line("Alliance", `${base}/alliance`, "partner chapters and campuses"),
    line("Highlights", `${base}/highlights`, "what has happened so far"),
    line("Research", `${base}/research`),
    line("Sponsorship", `${base}/sponsorship`, "how organisations can support"),
    line("Jobs and volunteering", `${base}/jobs`),
    "",
  ];

  if (caseStudies.length) {
    sections.push("## Case studies", "");
    for (const post of caseStudies) {
      sections.push(
        line(post.title, `${base}/case-studies/${post.slug}.md`, post.excerpt ?? undefined),
      );
    }
    sections.push("");
  }

  if (articles.length) {
    sections.push("## Writing", "");
    for (const post of articles) {
      sections.push(
        line(post.title, `${base}/blog/${post.slug}.md`, post.excerpt ?? undefined),
      );
    }
    sections.push("");
  }

  if (upcoming.length) {
    sections.push("## Upcoming events", "");
    for (const event of upcoming) {
      const date = event.startsAt.toISOString().slice(0, 10);
      sections.push(
        line(event.title, `${base}/events/${event.slug}`, `${date}${event.venueName ? `, ${event.venueName}` : ""}`),
      );
    }
    sections.push("");
  }

  if (past.length) {
    sections.push("## Past events", "");
    for (const event of past.slice(0, 30)) {
      const date = event.startsAt.toISOString().slice(0, 10);
      sections.push(line(event.title, `${base}/events/${event.slug}`, date));
    }
    sections.push("");
  }

  sections.push(
    "## Optional",
    "",
    line(
      "Full text of everything published",
      `${base}/llms-full.txt`,
      "every post in one file, if you would rather not fetch them individually",
    ),
    line("Certificate verification", `${base}/verify`, "check a SPARK certificate by its code, no account needed"),
    line("RSS feed", `${base}/blog/rss.xml`),
    line("Sitemap", `${base}/sitemap.xml`),
    line("Reporting a security issue", `${base}/.well-known/security.txt`),
    "",
  );

  return new Response(sections.join("\n"), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      // Short cache: the point of this file is that it is current.
      "Cache-Control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
