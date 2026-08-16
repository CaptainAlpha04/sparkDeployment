"use server";

import { revalidatePath } from "next/cache";
import {
  createPost,
  deletePost,
  listRevisions,
  publishPost,
  restoreRevision,
  schedulePost,
  setPostSlug,
  setPostStatus,
  updatePost,
  type PostInput,
  type PostKind,
} from "@/server/posts";
import { requireEditor } from "@/server/auth";

export type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string };

function toMessage(error: unknown): string {
  if (error instanceof Error) {
    if (error.name === "AuthError") {
      return "You are not signed in as an editor any more. Sign in again.";
    }
    return error.message;
  }
  return "Something went wrong. Please try again.";
}

/**
 * Every surface a post appears on.
 *
 * Listed exhaustively rather than revalidating by tag because a published post
 * changes the index, the feed, the sitemap and the llms.txt at once, and a
 * stale sitemap is the kind of bug nobody notices for a month.
 */
function revalidatePost(kind: PostKind, slug?: string) {
  const base = kind === "case_study" ? "/case-studies" : "/blog";
  revalidatePath(base);
  if (slug) revalidatePath(`${base}/${slug}`);
  revalidatePath("/studio");
  revalidatePath("/sitemap.xml");
  revalidatePath("/llms.txt");
  revalidatePath("/blog/rss.xml");
  // The homepage carries a "latest writing" strip.
  revalidatePath("/");
}

/** Validates on the server because a Server Action is a public POST endpoint. */
function validate(input: PostInput): string | null {
  if (!input.title?.trim()) return "Give the post a title";
  if (input.title.trim().length > 160) return "That title is too long";
  if (input.kind !== "article" && input.kind !== "case_study") {
    return "Unknown post type";
  }
  if (input.coverImageUrl && !input.coverAlt?.trim()) {
    return "Describe the cover image so screen readers and search engines can read it";
  }
  return null;
}

export async function createPostAction(
  input: PostInput,
): Promise<ActionResult<{ id: string; slug: string }>> {
  try {
    await requireEditor();
    const problem = validate(input);
    if (problem) return { ok: false, error: problem };

    const post = await createPost(input);
    revalidatePost(post.kind, post.slug);
    return { ok: true, data: { id: post.id, slug: post.slug } };
  } catch (error) {
    return { ok: false, error: toMessage(error) };
  }
}

export async function updatePostAction(
  id: string,
  input: PostInput,
): Promise<ActionResult<{ slug: string }>> {
  try {
    await requireEditor();
    const problem = validate(input);
    if (problem) return { ok: false, error: problem };

    const post = await updatePost(id, input);
    revalidatePost(post.kind, post.slug);
    return { ok: true, data: { slug: post.slug } };
  } catch (error) {
    return { ok: false, error: toMessage(error) };
  }
}

export async function publishPostAction(
  id: string,
): Promise<ActionResult<{ slug: string; publishedAt: string | null }>> {
  try {
    const post = await publishPost(id);
    revalidatePost(post.kind, post.slug);
    return {
      ok: true,
      data: {
        slug: post.slug,
        publishedAt: post.publishedAt?.toISOString() ?? null,
      },
    };
  } catch (error) {
    return { ok: false, error: toMessage(error) };
  }
}

/**
 * Publish at a future moment.
 *
 * Nothing runs at the appointed hour. A scheduled post is an ordinary
 * published post whose date has not arrived, and the read predicate filters on
 * `published_at <= now()` — so it appears because the clock passed it, with no
 * cron to fail and no dependence on Vercel's once-a-day scheduled functions.
 */
export async function schedulePostAction(
  id: string,
  isoDateTime: string,
): Promise<ActionResult<{ publishedAt: string | null }>> {
  try {
    const post = await schedulePost(id, new Date(isoDateTime));
    revalidatePost(post.kind, post.slug);
    return {
      ok: true,
      data: { publishedAt: post.publishedAt?.toISOString() ?? null },
    };
  } catch (error) {
    return { ok: false, error: toMessage(error) };
  }
}

export type RevisionRow = {
  id: string;
  createdAt: string;
  reason: string | null;
  wordCount: number;
  title: string;
  authorName: string | null;
};

/** Fetched on demand, when the History tab is opened rather than on page load. */
export async function listRevisionsAction(
  postId: string,
): Promise<ActionResult<RevisionRow[]>> {
  try {
    const rows = await listRevisions(postId);
    return {
      ok: true,
      data: rows.map((row) => ({
        ...row,
        // Dates cannot cross the server/client boundary as Date objects.
        createdAt: row.createdAt.toISOString(),
      })),
    };
  } catch (error) {
    return { ok: false, error: toMessage(error) };
  }
}

/** Roll the body back to an earlier snapshot. Itself undoable — see restoreRevision. */
export async function restoreRevisionAction(
  revisionId: string,
): Promise<ActionResult<{ id: string }>> {
  try {
    const post = await restoreRevision(revisionId);
    revalidatePost(post.kind, post.slug);
    revalidatePath(`/studio/${post.id}`);
    return { ok: true, data: { id: post.id } };
  } catch (error) {
    return { ok: false, error: toMessage(error) };
  }
}

export async function unpublishPostAction(
  id: string,
  status: "draft" | "archived",
): Promise<ActionResult> {
  try {
    const post = await setPostStatus(id, status);
    revalidatePost(post.kind, post.slug);
    return { ok: true, data: undefined };
  } catch (error) {
    return { ok: false, error: toMessage(error) };
  }
}

/**
 * Renaming a slug is offered but never automatic.
 *
 * A published URL may already be cited, linked, or indexed, so this is a
 * deliberate act with a warning attached rather than something that happens
 * because someone fixed a typo in the title.
 */
export async function setPostSlugAction(
  id: string,
  slug: string,
): Promise<ActionResult<{ slug: string }>> {
  try {
    const post = await setPostSlug(id, slug);
    revalidatePost(post.kind, post.slug);
    return { ok: true, data: { slug: post.slug } };
  } catch (error) {
    return { ok: false, error: toMessage(error) };
  }
}

export async function deletePostAction(
  id: string,
  kind: PostKind,
  slug: string,
): Promise<ActionResult> {
  try {
    await deletePost(id);
    revalidatePost(kind, slug);
    return { ok: true, data: undefined };
  } catch (error) {
    return { ok: false, error: toMessage(error) };
  }
}
