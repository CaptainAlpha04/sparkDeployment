import type { Metadata } from "next";
import { NewPostForm } from "@/components/studio/new-post-form";

export const metadata: Metadata = {
  title: "New · SPARK Studio",
  robots: { index: false, follow: false },
};

/**
 * Deliberately a form rather than "create a draft and redirect".
 *
 * Creating the row on GET would be neat, but Next prefetches links on hover,
 * so every pass of the cursor over "New case study" in the nav would leave an
 * empty draft behind.
 */
export default async function NewPostPage({
  searchParams,
}: PageProps<"/studio/new">) {
  const params = await searchParams;
  const kind = params.kind === "case_study" ? "case_study" : "article";

  return <NewPostForm kind={kind} />;
}
