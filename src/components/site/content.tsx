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
      className="flex flex-col gap-2 rounded-lg border-2 border-dashed border-gold bg-accent p-5 text-accent-foreground"
    >
      {title ? <h2 className="text-2xl font-semibold">{title}</h2> : null}
      <p className="text-sm font-semibold uppercase tracking-wide">Content pending - TODO(org)</p>
      <div className="text-sm">{children}</div>
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

export const contentComponents: MDXComponents = {
  h1: (props) => <h1 className="text-4xl font-semibold md:text-5xl" {...props} />,
  h2: (props) => <h2 className="mt-6 text-2xl font-semibold md:text-3xl" {...props} />,
  h3: (props) => <h3 className="mt-2 text-xl font-semibold" {...props} />,
  p: (props) => <p className="leading-relaxed" {...props} />,
  ul: (props) => <ul className="flex list-disc flex-col gap-1 pl-6" {...props} />,
  ol: (props) => <ol className="flex list-decimal flex-col gap-1 pl-6" {...props} />,
  a: ContentLink,
  TodoOrg,
  EmergencyNotice,
};

export function ContentPage({ children }: { children: React.ReactNode }) {
  return <article className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 py-14">{children}</article>;
}
