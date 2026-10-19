import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Check your email - Wellspring Care" };

export default function CheckEmailPage() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-4 px-4 py-16">
      <h1 className="text-2xl font-semibold">Check your email</h1>
      <p>If that address can sign in, a link is on its way. It expires in 15 minutes and works once.</p>
      <p className="text-sm">
        No email? Check your spam folder, or <Link href="/sign-in" className="underline">request a new link</Link>.
      </p>
    </main>
  );
}
