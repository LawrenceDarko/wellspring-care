import Link from "next/link";
import { MobileNav } from "./mobile-nav";
import { MAIN_NAV } from "./nav";

export const MAIN_CONTENT_ID = "main";

/** First focusable element on every public page; visible on focus only. */
export function SkipLink() {
  return (
    <a
      href={`#${MAIN_CONTENT_ID}`}
      className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground focus:outline-2 focus:outline-offset-2 focus:outline-ring"
    >
      Skip to main content
    </a>
  );
}

/** Wordmark in the display face; the nav stays quiet (ADR 006: one bold element per page). */
export function SiteHeader({ siteName }: { siteName: string }) {
  return (
    <header className="border-b border-border bg-background">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-1 px-4 py-3 md:px-6 xl:py-4">
        <Link
          href="/"
          className="inline-flex min-h-11 items-center rounded-md font-display text-lede font-medium leading-snug md:text-h3 tracking-tight text-primary [font-variation-settings:'SOFT'_50] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          {siteName}
        </Link>
        {/* Own row from xl: a long org name and ten links never squeeze each other. */}
        <nav aria-label="Main" className="hidden xl:block xl:basis-full">
          <ul className="-ml-2.5 flex flex-wrap items-center gap-x-1 text-[0.9375rem]">
            {MAIN_NAV.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="inline-flex min-h-11 items-center rounded-md px-2.5 whitespace-nowrap text-muted-foreground underline-offset-[6px] hover:text-foreground hover:underline hover:decoration-gold focus-visible:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
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
