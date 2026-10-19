import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import { FormGuardFields } from "@/components/site/form-guard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ConfigError } from "@/server/config";
import { emailAvailable } from "@/server/email";
import { publicFormToken } from "@/server/rate-limit";
import { requestMagicLink } from "./actions";

export const metadata: Metadata = { title: "Sign in - Wellspring Care" };

// Auth.js error codes arrive as ?error=<code>. Messages stay generic.
const ERROR_MESSAGES: Record<string, string> = {
  InvalidEmail: "That email address does not look right. Check it for typos, for example name@example.com, and try again.",
  Verification: "That sign-in link has expired or was already used. Request a new one below.",
  RateLimited: "Too many sign-in requests. Please wait a few minutes and try again.",
  FormExpired: "This form expired or was sent too quickly. Please enter your email again and send it.",
  EmailSignin: "We could not send the sign-in email just now. Please try again in a few minutes.",
};
const DEFAULT_ERROR = "We could not sign you in. Please request a new link below.";

function signInConfigured(): boolean {
  try {
    return emailAvailable();
  } catch (err) {
    // Missing env (e.g. no MONGODB_URI/AUTH_SECRET) shows "not configured" instead of crashing.
    if (err instanceof ConfigError) return false;
    throw err;
  }
}

async function SignInForm({ searchParams }: { searchParams: PageProps<"/sign-in">["searchParams"] }) {
  // The form token stamps the render time, so it must be minted per request.
  await connection();
  const params = await searchParams;
  const error = typeof params.error === "string" ? (ERROR_MESSAGES[params.error] ?? DEFAULT_ERROR) : null;
  const callbackUrl = typeof params.callbackUrl === "string" ? params.callbackUrl : "/";

  if (!signInConfigured()) {
    return (
      <p role="status" className="rounded-md bg-secondary p-4 text-secondary-foreground">
        Sign-in is not configured yet. Please contact us directly in the meantime.
      </p>
    );
  }

  return (
    <form action={requestMagicLink} className="relative flex flex-col gap-6">
      {error && (
        <p id="sign-in-error" role="alert" className="border-l-2 border-destructive pl-4 font-medium text-destructive">
          {error}
        </p>
      )}
      <input type="hidden" name="callbackUrl" value={callbackUrl} />
      <FormGuardFields token={publicFormToken()} />
      <div className="flex flex-col gap-2">
        <Label htmlFor="email">Email address</Label>
        <Input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          maxLength={320}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? "sign-in-error" : undefined}
          className="min-h-11"
        />
      </div>
      <Button type="submit" className="min-h-11 self-start">
        Email me a sign-in link
      </Button>
    </form>
  );
}

export default function SignInPage({ searchParams }: PageProps<"/sign-in">) {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 pt-12 pb-4 md:px-6 md:pt-16">
      <div className="flex max-w-md flex-col gap-6">
        <h1 className="text-h1 font-medium">Sign in</h1>
        <p className="text-lede">We will email you a link that signs you in. No password needed.</p>
        <Suspense fallback={null}>
          <SignInForm searchParams={searchParams} />
        </Suspense>
      </div>
    </div>
  );
}
