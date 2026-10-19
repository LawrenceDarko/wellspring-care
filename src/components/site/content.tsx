import Link from "next/link";
import type { MDXComponents } from "mdx/types";
import { EmergencyNotice } from "@/components/site/site-footer";

// Long-form content pages (PRD §4.1, §4.2). Copy lives in src/content/*.mdx and is styled
// through `contentComponents` (wired up in src/mdx-components.tsx).
// Org-supplied facts are never invented: they are `<TodoOrg>` blocks (find them with
// `rg -n TodoOrg src/content`), visible in development and omitted in production.

const linkClass = "font-medium text-primary underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-ring";

export function TodoOrg({ title, children }: { title?: string; children?: React.ReactNode }) {
  if (process.env.NODE_ENV === "production") return null;
  return (
    <aside
      role="note"
      aria-label="Content pending"
      className="flex flex-col gap-2 rounded-md border-2 border-dashed border-gold bg-accent p-5 text-accent-foreground"
    >
      {title ? <h2 className="text-h3 font-medium">{title}</h2> : null}
      <p className="text-[0.9375rem] font-semibold">Content pending: TODO(org)</p>
      <div className="text-[0.9375rem]">{children}</div>
    </aside>
  );
}

function ContentLink({ href = "", children, ...rest }: React.ComponentProps<"a">) {
  if (href.startsWith("/")) {
    return (
      <Link href={href} className={linkClass}>
        {children}
      </Link>
    );
  }
  return (
    <a href={href} className={linkClass} {...rest}>
      {children}
    </a>
  );
}

// Book page (ADR 006): prose at reading measure, sections broken by a gold hairline,
// side notes in a narrow margin column on desktop (stacked above the text on mobile).
const marginNote = "self-start border-l-2 border-gold pl-4 text-[0.9375rem] text-muted-foreground";

export const contentComponents: MDXComponents = {
  h1: (props) => <h1 className="text-h1 font-medium" {...props} />,
  h2: (props) => <h2 className="mt-6 border-t border-gold/40 pt-10 text-h2 font-medium" {...props} />,
  h3: (props) => <h3 className="mt-2 text-h3 font-medium" {...props} />,
  p: (props) => <p {...props} />,
  ul: (props) => <ul className="flex list-disc flex-col gap-2 pl-6 marker:text-gold" {...props} />,
  ol: (props) => <ol className="flex list-decimal flex-col gap-2 pl-6 marker:text-gold" {...props} />,
  a: ContentLink,
  TodoOrg,
  EmergencyNotice,
};

/**
 * Long-form page. The paragraph right after the h1 is the lede. `note` sits in the margin
 * column; it comes first in the DOM so it reads before the body on mobile.
 */
export function ContentPage({ note, children }: { note?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 pt-12 pb-4 md:px-6 md:pt-16 lg:grid-cols-[minmax(0,1fr)_15rem] lg:gap-x-16">
      {note ? <aside className={`${marginNote} lg:col-start-2 lg:row-start-1 lg:mt-20`}>{note}</aside> : null}
      <article className="flex min-w-0 max-w-measure flex-col gap-5 lg:col-start-1 lg:row-start-1 [&>h1+p]:text-lede">
        {children}
      </article>
    </div>
  );
}

export const DRAFT_BANNER_TEXT = "Draft - requires legal review";

/** Shown on every legal page in every environment until counsel signs off (PLAN 1.7). */
export function DraftBanner() {
  return (
    <div role="note" aria-label="Draft notice" className="flex flex-col gap-1 text-foreground">
      <p className="font-semibold">{DRAFT_BANNER_TEXT}</p>
      <p className="text-muted-foreground">This page is a working draft and is not yet final. Contact us with any questions.</p>
    </div>
  );
}

/** Legal and scope pages (PRD §4.1): draft notice in the margin, read before the body. */
export function LegalPage({ children }: { children: React.ReactNode }) {
  return <ContentPage note={<DraftBanner />}>{children}</ContentPage>;
}
