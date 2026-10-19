import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { listOutboxEmails } from "@/server/data/email-outbox";
import { getDb } from "@/server/db";

// PRD §14: dev email transport viewer. 404 in production. Bodies hold sign-in
// links, so this page must never be reachable outside development.

export const metadata: Metadata = { title: "Dev outbox", robots: { index: false, follow: false } };

const URL_PATTERN = /(https?:\/\/[^\s]+)/g;

function Body({ text }: { text: string }) {
  // Make links clickable so magic links can be followed in dev.
  return (
    <pre className="whitespace-pre-wrap break-words text-sm">
      {text.split(URL_PATTERN).map((part, i) =>
        i % 2 === 1 ? (
          <a key={i} href={part} className="underline">
            {part}
          </a>
        ) : (
          part
        ),
      )}
    </pre>
  );
}

async function OutboxList() {
  await connection();
  const emails = await listOutboxEmails(await getDb());
  if (emails.length === 0) return <p>No emails yet.</p>;
  return (
    <ul className="flex flex-col gap-4">
      {emails.map((m) => (
        <li key={m._id?.toHexString()} className="rounded border p-4">
          <p className="text-sm">
            <strong>{m.subject}</strong> to {m.to} ({m.template}) at {m.createdAt.toISOString()}
          </p>
          <Body text={m.text} />
        </li>
      ))}
    </ul>
  );
}

export default function OutboxPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-10">
      <h1 className="text-2xl font-semibold">Dev outbox</h1>
      <p className="text-sm">Development only. Emails expire after 7 days. Newest first.</p>
      <Suspense fallback={<p>Loading...</p>}>
        <OutboxList />
      </Suspense>
    </main>
  );
}
