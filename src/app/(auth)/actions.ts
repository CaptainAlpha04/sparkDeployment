"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signInSchema, signUpSchema } from "@/lib/validation/auth";
import { authErrorMessage } from "@/lib/auth-errors";

export type ActionResult = { ok: true } | { ok: false; error: string };

export async function signIn(formData: FormData): Promise<ActionResult> {
  const parsed = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    // Mapped rather than flattened. This used to report every failure as
    // "Incorrect email or password", which was actively misleading for anyone
    // whose confirmation email was never sent — they were told to check a
    // password that was correct. `invalid_credentials` is still deliberately
    // vague, because that one is an enumeration oracle; see auth-errors.ts.
    return { ok: false, error: authErrorMessage(error) };
  }

  revalidatePath("/", "layout");
  return { ok: true };
}

export async function signUp(formData: FormData): Promise<ActionResult> {
  const parsed = signUpSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const supabase = await createClient();
  const origin = (await headers()).get("origin");

  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      // Read by the handle_new_user trigger into profiles.full_name.
      data: { full_name: parsed.data.fullName },
      /*
       * Send the confirmation link through our own callback, which exchanges
       * the code for a session.
       *
       * Without this, Supabase falls back to the project's Site URL, so the
       * link lands on the homepage carrying a `code` nobody exchanges: the
       * account is marked confirmed but the person is not signed in, and has
       * to work out for themselves that they should now go and log in. One
       * account in the database is in exactly that state.
       */
      emailRedirectTo: origin ? `${origin}/auth/callback?next=/dashboard` : undefined,
    },
  });

  if (error) {
    return { ok: false, error: authErrorMessage(error) };
  }

  revalidatePath("/", "layout");
  return { ok: true };
}

export async function signInWithGoogle(next: string = "/") {
  const supabase = await createClient();
  const origin = (await headers()).get("origin");

  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/";

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(safeNext)}`,
    },
  });

  if (error || !data.url) redirect("/auth/auth-code-error");
  redirect(data.url);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}
