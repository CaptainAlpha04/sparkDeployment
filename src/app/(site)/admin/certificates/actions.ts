"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createTemplate,
  deleteTemplate,
  issueCertificatesForEvent,
  revokeCertificate,
  updateTemplate,
} from "@/server/certificates";
import { requireAdmin } from "@/server/auth";
import { createClient } from "@/lib/supabase/server";
import type { TemplateField } from "@/lib/certificate-types";
import { defaultFields } from "@/components/certificates/certificate-render";

export type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string };

const MAX_BYTES = 6 * 1024 * 1024;
const ALLOWED = ["image/png", "image/jpeg", "image/webp"];

/**
 * Uploads certificate background artwork.
 *
 * Validation is here on the server, not only in the file input's `accept`
 * attribute — that attribute is a convenience for the file picker and is
 * trivially bypassed by posting directly.
 */
export async function uploadBackground(
  formData: FormData,
): Promise<ActionResult<{ url: string; width: number; height: number }>> {
  await requireAdmin();

  const file = formData.get("file");
  const width = Number(formData.get("width"));
  const height = Number(formData.get("height"));

  if (!(file instanceof File)) return { ok: false, error: "No file provided" };
  if (!ALLOWED.includes(file.type)) {
    return { ok: false, error: "Use a PNG, JPEG, or WebP image" };
  }
  if (file.size > MAX_BYTES) {
    return { ok: false, error: "Image must be under 6 MB" };
  }
  if (!Number.isFinite(width) || !Number.isFinite(height) || width < 1 || height < 1) {
    return { ok: false, error: "Could not read the image dimensions" };
  }

  const supabase = await createClient();
  const ext = file.type.split("/")[1].replace("jpeg", "jpg");
  const path = `backgrounds/${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage
    .from("certificate-assets")
    .upload(path, file, { contentType: file.type, upsert: false });

  if (error) return { ok: false, error: error.message };

  const { data } = supabase.storage.from("certificate-assets").getPublicUrl(path);
  return { ok: true, data: { url: data.publicUrl, width, height } };
}

export async function createTemplateAction(input: {
  name: string;
  backgroundUrl: string;
  backgroundWidth: number;
  backgroundHeight: number;
}): Promise<ActionResult<{ id: string }>> {
  try {
    const name = input.name.trim();
    if (!name) return { ok: false, error: "Give the template a name" };

    const template = await createTemplate({
      name,
      backgroundUrl: input.backgroundUrl,
      backgroundWidth: input.backgroundWidth,
      backgroundHeight: input.backgroundHeight,
      fields: defaultFields(),
    });

    revalidatePath("/admin/certificates");
    return { ok: true, data: { id: template.id } };
  } catch (error) {
    return { ok: false, error: (error as Error).message };
  }
}

export async function saveTemplateAction(
  id: string,
  input: { name: string; fields: TemplateField[] },
): Promise<ActionResult> {
  try {
    await updateTemplate(id, { name: input.name.trim(), fields: input.fields });
    revalidatePath("/admin/certificates");
    revalidatePath(`/admin/certificates/${id}`);
    return { ok: true, data: undefined };
  } catch (error) {
    return { ok: false, error: (error as Error).message };
  }
}

export async function deleteTemplateAction(id: string): Promise<ActionResult> {
  try {
    await deleteTemplate(id);
    revalidatePath("/admin/certificates");
    return { ok: true, data: undefined };
  } catch (error) {
    return { ok: false, error: (error as Error).message };
  }
}

export async function issueAction(
  eventId: string,
  templateId: string,
): Promise<ActionResult<{ issued: number; skipped: number }>> {
  try {
    const result = await issueCertificatesForEvent(eventId, templateId);
    revalidatePath("/admin/certificates");
    return { ok: true, data: result };
  } catch (error) {
    return { ok: false, error: (error as Error).message };
  }
}

export async function revokeAction(
  id: string,
  reason: string,
): Promise<ActionResult> {
  try {
    await revokeCertificate(id, reason);
    revalidatePath("/admin/certificates");
    return { ok: true, data: undefined };
  } catch (error) {
    return { ok: false, error: (error as Error).message };
  }
}

export async function goToTemplate(id: string) {
  await requireAdmin();
  redirect(`/admin/certificates/${id}`);
}
