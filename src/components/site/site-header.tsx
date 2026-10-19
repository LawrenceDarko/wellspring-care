import Link from "next/link";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { HeaderScroll } from "./header-scroll";
import { MobileNav } from "./mobile-nav";
import { isNavGroup, NAV_GROUPS, REQUEST_CARE } from "./nav";

export const MAIN_CONTENT_ID = "main";

const focus = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

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

/**
 * One row from `lg` (ADR 007 Nav): wordmark, grouped menus, plain links, "Request care".
 * Sticky; over a `[data-hero]` band it turns see-through with band tokens until a menu opens.
 */
export function SiteHeader({ siteName }: { siteName: string }) {
  return (
    <HeaderScroll className="group/header sticky top-0 z-40 border-b border-border bg-background text-foreground transition-[translate,background-color,border-color] duration-300 ease-out data-hidden:-translate-y-full data-over-hero:not-has-[[data-state=open]]:header-over-hero">
      <div className="mx-auto flex min-h-header w-full max-w-6xl items-center justify-between gap-6 px-4 py-2 md:px-6">
        {/* Two lines on narrow screens and at lg: a long org name never squeezes the nav. */}
        <Link
          href="/"
          className={`inline-flex min-h-11 max-w-60 items-center rounded-md font-display text-lede leading-tight font-medium tracking-tight text-primary [font-variation-settings:'SOFT'_50] sm:max-w-none lg:max-w-64 xl:max-w-none ${focus}`}
        >
          {siteName}
        </Link>
        <div className="hidden items-center gap-4 lg:flex">
          <NavigationMenu viewport={false} aria-label="Main" className="max-w-none flex-none">
            <NavigationMenuList className="gap-0">
              {NAV_GROUPS.map((entry) =>
                isNavGroup(entry) ? (
                  <NavigationMenuItem key={entry.label}>
                    <NavigationMenuTrigger>{entry.label}</NavigationMenuTrigger>
                    <NavigationMenuContent className="border-border bg-popover p-2">
                      <ul className="flex w-[24rem] flex-col">
                        {entry.links.map((link) => (
                          <li key={link.href}>
                            <NavigationMenuLink asChild className="min-h-11 gap-0.5 rounded-md px-3 py-2.5">
                              <Link href={link.href}>
                                <span className="text-base font-medium text-foreground">{link.label}</span>
                                {link.description ? (
                                  <span className="text-sm text-muted-foreground">{link.description}</span>
                                ) : null}
                              </Link>
                            </NavigationMenuLink>
                          </li>
                        ))}
                      </ul>
                    </NavigationMenuContent>
                  </NavigationMenuItem>
                ) : (
                  <NavigationMenuItem key={entry.href}>
                    <Link href={entry.href} className={navigationMenuTriggerStyle()}>
                      {entry.label}
                    </Link>
                  </NavigationMenuItem>
                ),
              )}
            </NavigationMenuList>
          </NavigationMenu>
          <Link
            href={REQUEST_CARE.href}
            className={`inline-flex min-h-11 items-center rounded-md bg-primary px-4 font-medium whitespace-nowrap text-primary-foreground transition-colors hover:bg-primary/90 ${focus}`}
          >
            {REQUEST_CARE.label}
          </Link>
        </div>
        <MobileNav siteName={siteName} />
      </div>
    </HeaderScroll>
  );
}
