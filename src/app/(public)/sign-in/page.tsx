import type { Metadata } from "next";
import { Suspense } from "react";
import { ConfigError } from "@/server/config";
import { emailAvailable } from "@/server/email";
import { requestMagicLink } from "./actions";

export const metadata: Metadata = { title: "Sign in - Wellspring Care" };

// Auth.js error codes arrive as ?error=<code>. Messages stay generic.
const ERROR_MESSAGES: Record<string, string> = {
  InvalidEmail: "Please enter a valid email address.",
  Verification: "That sign-in link has expired or was already used. Request a new one below.",
  RateLimited: "Too many sign-in requests. Please wait a few minutes and try again.",
};
const DEFAULT_ERROR = "We could not sign you in. Please try again.";

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
  const params = await searchParams;
  const error = typeof params.error === "string" ? (ERROR_MESSAGES[params.error] ?? DEFAULT_ERROR) : null;
  const callbackUrl = typeof params.callbackUrl === "string" ? params.callbackUrl : "/";

  if (!signInConfigured()) {
    return (
      <p role="status" className="rounded border p-4 text-sm">
        Sign-in is not configured yet. Please contact us directly in the meantime.
      </p>
    );
  }

  return (
    <form action={requestMagicLink} className="flex flex-col gap-4">
      {error && (
        <p role="alert" className="rounded border border-red-700 p-3 text-sm text-red-800">
          {error}
        </p>
      )}
      <input type="hidden" name="callbackUrl" value={callbackUrl} />
      <label htmlFor="email" className="text-sm font-medium">
        Email address
      </label>
      <input
        id="email"
        name="email"
        type="email"
        required
        autoComplete="email"
        maxLength={320}
        className="min-h-11 rounded border px-3"
      />
      <button type="submit" className="min-h-11 rounded bg-black px-4 font-medium text-white">
        Email me a sign-in link
      </button>
    </form>
  );
}

export default function SignInPage({ searchParams }: PageProps<"/sign-in">) {
  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-6 px-4 py-16">
      <h1 className="text-2xl font-semibold">Sign in</h1>
      <p className="text-sm">We will email you a link that signs you in. No password needed.</p>
      <Suspense fallback={null}>
        <SignInForm searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
