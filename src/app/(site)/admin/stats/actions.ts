"use server";

import { revalidatePath } from "next/cache";
import {
  createSiteStat,
  deleteSiteStat,
  updateSiteStat,
} from "@/server/stats";

export type ActionResult = { ok: true } | { ok: false; error: string };

function toMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Something went wrong";
}

/** These appear on the public homepage, so every change revalidates it. */
function revalidateAll() {
  revalidatePath("/");
  revalidatePath("/admin/stats");
}

export async function updateStatAction(
  key: string,
  input: { label: string; value: string },
): Promise<ActionResult> {
  try {
    await updateSiteStat(key, input);
    revalidateAll();
    return { ok: true };
  } catch (error) {
    return { ok: false, error: toMessage(error) };
  }
}

export async function createStatAction(input: {
  label: string;
  value: string;
}): Promise<ActionResult> {
  try {
    await createSiteStat(input);
    revalidateAll();
    return { ok: true };
  } catch (error) {
    return { ok: false, error: toMessage(error) };
  }
}

export async function deleteStatAction(key: string): Promise<ActionResult> {
  try {
    await deleteSiteStat(key);
    revalidateAll();
    return { ok: true };
  } catch (error) {
    return { ok: false, error: toMessage(error) };
  }
}
