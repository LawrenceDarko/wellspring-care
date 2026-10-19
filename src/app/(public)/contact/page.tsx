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
      <p role="status" className="rounded-md bg-secondary p-4 text-secondary-foreground">
        The contact form is not configured yet. Please check back soon.
      </p>
    );
  }
  return <ContactForm guard={<FormGuardFields token={token} />} />;
}

const linkClass = "font-medium text-primary underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-ring";

// Book page (ADR 006): heading, lede and form at reading measure; emergency notice in the margin.
export default function ContactPage() {
  return (
    <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 pt-12 pb-4 md:px-6 md:pt-16 lg:grid-cols-[minmax(0,1fr)_15rem] lg:gap-x-16">
      <div className="flex min-w-0 max-w-measure flex-col gap-5">
        <h1 className="text-h1 font-medium">Contact us</h1>
        <p className="text-lede">
          Send us a general question about our pastoral care, programs, weddings, funerals or events. To
          request care for yourself or someone else, choose a service on our{" "}
          <Link href="/services" className={linkClass}>
            services
          </Link>{" "}
          page.
        </p>
      </div>
      <aside className="self-start border-l-2 border-gold pl-4 text-muted-foreground lg:col-start-2 lg:row-span-2 lg:mt-20">
        <EmergencyNotice />
      </aside>
      <div className="min-w-0 max-w-measure border-t border-gold/40 pt-10 lg:col-start-1">
        <Suspense fallback={<p>Loading the form...</p>}>
          <GuardedContactForm />
        </Suspense>
      </div>
    </div>
  );
}
