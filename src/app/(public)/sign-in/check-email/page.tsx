import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Check your email - Wellspring Care" };

export default function CheckEmailPage() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col px-4 pt-12 pb-4 md:px-6 md:pt-16">
      <div className="flex max-w-md flex-col gap-5">
        <h1 className="text-h1 font-medium">Check your email</h1>
        <p className="text-lede">If that address can sign in, a link is on its way. It expires in 15 minutes and works once.</p>
        <p>
          No email? Check your spam folder, or{" "}
          <Link
            href="/sign-in"
            className="font-medium text-primary underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-ring"
          >
            request a new link
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
