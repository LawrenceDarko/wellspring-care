import Link from "next/link";
import { MobileNav } from "./mobile-nav";
import { MAIN_NAV } from "./nav";

export const MAIN_CONTENT_ID = "main";

/** First focusable element on every public page; visible on focus only. */
export function SkipLink() {
  return (
    <a
      href={`#${MAIN_CONTENT_ID}`}
      className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground focus:outline-2 focus:outline-ring"
    >
      Skip to main content
    </a>
  );
}

export function SiteHeader({ siteName }: { siteName: string }) {
  return (
    <header className="border-b border-border bg-background">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-4">
        <Link
          href="/"
          className="font-display text-lg font-semibold text-primary focus-visible:outline-2 focus-visible:outline-ring"
        >
          {siteName}
        </Link>
        <nav aria-label="Main" className="hidden lg:block">
          <ul className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
            {MAIN_NAV.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="rounded-sm hover:text-primary hover:underline focus-visible:outline-2 focus-visible:outline-ring"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <MobileNav links={MAIN_NAV} siteName={siteName} />
      </div>
    </header>
  );
}
