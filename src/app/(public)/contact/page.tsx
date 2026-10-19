import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { FormGuardFields } from "@/components/site/form-guard";
import { EmergencyNotice } from "@/components/site/site-footer";
import { ConfigError } from "@/server/config";
import { publicFormToken } from "@/server/rate-limit";
import { ContactForm } from "./contact-form";

export const metadata: Metadata = { title: "Contact" };

function formToken(): string | null {
  try {
    return publicFormToken();
  } catch (err) {
    // Missing env (no AUTH_SECRET): show "not configured" instead of crashing.
    if (err instanceof ConfigError) return null;
    throw err;
  }
}

async function GuardedContactForm() {
  // The token records render time, so it must be minted per request.
  await connection();
  const token = formToken();
  if (!token) {
    return (
      <p role="status" className="rounded border p-4 text-sm">
        The contact form is not configured yet.
      </p>
    );
  }
  return <ContactForm guard={<FormGuardFields token={token} />} />;
}

export default function ContactPage() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-12">
      <h1 className="font-display text-3xl">Contact us</h1>
      <p>
        Send us a general question about our pastoral care, programs, weddings, funerals or events. To
        request care for yourself or someone else, choose a service from our{" "}
        <Link href="/services" className="underline focus-visible:outline-2 focus-visible:outline-ring">
          services
        </Link>{" "}
        page.
      </p>
      <EmergencyNotice />
      <Suspense fallback={<p className="text-sm">Loading form...</p>}>
        <GuardedContactForm />
      </Suspense>
    </div>
  );
}
