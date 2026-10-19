"use server";

import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { z } from "zod";
import { signIn } from "@/server/auth";
import { log } from "@/server/log";

const emailSchema = z.email().max(320);

/** Same-origin relative paths only; anything else falls back to "/" (no open redirect). */
function safeRedirect(value: FormDataEntryValue | null): string {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//") || /[\\\u0000-\u001f]/.test(value)) {
    return "/";
  }
  return value;
}

export async function requestMagicLink(formData: FormData): Promise<void> {
  const email = emailSchema.safeParse(String(formData.get("email") ?? "").trim());
  if (!email.success) redirect("/sign-in?error=InvalidEmail");

  try {
    // Redirects to /sign-in/check-email on success (pages.verifyRequest).
    await signIn("email", { email: email.data, redirectTo: safeRedirect(formData.get("callbackUrl")) });
  } catch (err) {
    // signIn throws NEXT_REDIRECT on success: only Auth.js errors are handled here.
    if (!(err instanceof AuthError)) throw err;
    log.warn("auth.sign_in_failed", { errorName: err.type });
    redirect("/sign-in?error=EmailSignin");
  }
}
