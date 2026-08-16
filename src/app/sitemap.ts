import type { MetadataRoute } from "next";
import { listPublishedIndex, listPublishedTags } from "@/server/posts";
import { listPastEvents, listUpcomingEvents } from "@/server/events";
import { siteUrl } from "@/lib/site-url";

/**
 * The sitemap, generated rather than maintained.
 *
 * A hand-written sitemap is a file that is correct on the day it is written
 * and wrong from then on. Everything here is read from the database or from a
 * list that sits next to the routes it describes, so publishing a post puts it
 * in the sitemap and nobody has to remember.
 *
 * changeFrequency and priority are advisory and largely ignored by Google
 * these days; lastModified is the field that actually earns a recrawl, so it
 * is the one taken from real data.
 */

/**
 * Not prerendered.
 *
 * Without this Next sees a sitemap that returns a value and bakes it at build
 * time, which means it lists exactly the posts that existed when the site was
 * last deployed and silently omits everything published since. The symptom is
 * a sitemap that looks perfectly valid and is quietly months out of date.
 */
export const dynamic = "force-dynamic";

/** Static pages, with how often each genuinely changes. */
const STATIC_ROUTES: {
  path: string;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  priority: number;
}[] = [
  { path: "/", changeFrequency: "weekly", priority: 1 },
  { path: "/mission", changeFrequency: "monthly", priority: 0.9 },
  { path: "/blog", changeFrequency: "daily", priority: 0.9 },
  { path: "/case-studies", changeFrequency: "weekly", priority: 0.9 },
  { path: "/events", changeFrequency: "daily", priority: 0.8 },
  { path: "/alliance", changeFrequency: "monthly", priority: 0.7 },
  { path: "/highlights", changeFrequency: "monthly", priority: 0.6 },
  { path: "/research", changeFrequency: "monthly", priority: 0.6 },
  { path: "/products", changeFrequency: "monthly", priority: 0.5 },
  { path: "/sponsorship", changeFrequency: "monthly", priority: 0.5 },
  { path: "/jobs", changeFrequency: "weekly", priority: 0.5 },
  { path: "/verify", changeFrequency: "yearly", priority: 0.4 },
  { path: "/legal", changeFrequency: "yearly", priority: 0.2 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const now = new Date();

  // One slow table must not take the whole sitemap down: a 500 here means
  // search engines stop discovering everything, not just the missing section.
  const [posts, tags, upcoming, past] = await Promise.all([
    listPublishedIndex().catch(() => []),
    listPublishedTags().catch(() => []),
    listUpcomingEvents().catch(() => []),
    listPastEvents().catch(() => []),
  ]);
  const events = [...upcoming, ...past];

  const staticEntries = STATIC_ROUTES.map((route) => ({
    url: `${base}${route.path}`,
    lastModified: now,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));

  const postEntries = posts
    // A post marked noindex asked not to be listed. Putting it in the sitemap
    // while telling the crawler not to index it is a contradiction we would be
    // sending on purpose.
    .filter((post) => !post.noindex)
    .map((post) => ({
      url: `${base}${post.kind === "case_study" ? "/case-studies" : "/blog"}/${post.slug}`,
      lastModified: post.updatedAt,
      changeFrequency: "monthly" as const,
      priority: post.kind === "case_study" ? 0.8 : 0.7,
    }));

  const tagEntries = tags.map((tag) => ({
    url: `${base}/blog/tag/${encodeURIComponent(tag.tag)}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.4,
  }));

  const eventEntries = events.map((event) => ({
    url: `${base}/events/${event.slug}`,
    lastModified: event.updatedAt ?? now,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  return [...staticEntries, ...postEntries, ...tagEntries, ...eventEntries];
}
