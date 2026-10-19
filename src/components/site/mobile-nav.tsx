"use client";

import { useState, type CSSProperties } from "react";
import Link from "next/link";
import { MenuIcon, XIcon } from "lucide-react";
import { Dialog } from "radix-ui";
import { isNavGroup, NAV_GROUPS, REQUEST_CARE, type NavLink } from "./nav";
import { EmergencyNotice } from "./site-footer";

const focus = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";
const toggle = `inline-flex min-h-11 items-center gap-2 rounded-md px-3 text-base decoration-gold underline-offset-[6px] hover:underline ${focus}`;
const bigLink = `flex min-h-11 items-center self-start rounded-md font-display text-h3 leading-tight font-medium tracking-tight [font-variation-settings:'SOFT'_50] underline-offset-[6px] decoration-band-gold hover:underline ${focus}`;

const GROUPS = NAV_GROUPS.filter(isNavGroup);
const LINKS = NAV_GROUPS.filter((entry): entry is NavLink => !isNavGroup(entry));
// Stagger order: each group heading then its links, then the plain links, then "Request care".
const GROUP_START = GROUPS.map((_, g) => GROUPS.slice(0, g).reduce((n, group) => n + 1 + group.links.length, 0));
const LINKS_START = GROUPS.reduce((n, group) => n + 1 + group.links.length, 0);

/** Position in the stagger (`menu-stagger` reads `--i`). */
const rise = (i: number) => ({ "--i": i }) as CSSProperties;

/**
 * Below `lg`: a full-screen forest overlay (ADR 007 Nav). Radix Dialog gives focus trap,
 * Escape to close and focus back on the trigger. Links rise in one by one; at once under
 * reduced motion (`motion-safe:`).
 */
export function MobileNav({ siteName }: { siteName: string }) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  const item = (link: NavLink, i: number) => (
    <li key={link.href} style={rise(i)} className="flex motion-safe:menu-stagger">
      <Link href={link.href} onClick={close} className={bigLink}>
        {link.label}
      </Link>
    </li>
  );

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger className={`${toggle} lg:hidden`} aria-label="Open menu">
        <MenuIcon aria-hidden="true" className="size-5" />
        <span aria-hidden="true">Menu</span>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Content className="band fixed inset-0 z-50 flex flex-col overflow-y-auto motion-safe:data-[state=closed]:animate-out motion-safe:data-[state=closed]:fade-out-0 motion-safe:data-[state=open]:animate-in motion-safe:data-[state=open]:fade-in-0">
          <div className="mx-auto flex min-h-header w-full max-w-6xl items-center justify-between gap-6 px-4 py-2 md:px-6">
            <Dialog.Title className="max-w-60 font-display text-lede leading-tight font-medium tracking-tight [font-variation-settings:'SOFT'_50] sm:max-w-none">
              {siteName}
            </Dialog.Title>
            <Dialog.Close className={`${toggle} decoration-band-gold`} aria-label="Close menu">
              <XIcon aria-hidden="true" className="size-5" />
              <span aria-hidden="true">Close</span>
            </Dialog.Close>
          </div>
          <Dialog.Description className="sr-only">Site navigation</Dialog.Description>
          <nav
            aria-label="Mobile"
            className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-4 pt-6 pb-8 md:px-6"
          >
            {GROUPS.map((group, g) => (
              <section key={group.label} aria-label={group.label} className="flex flex-col gap-1">
                <h2 style={rise(GROUP_START[g])} className="text-[0.9375rem] text-band-muted motion-safe:menu-stagger">
                  {group.label}
                </h2>
                <ul className="flex flex-col">
                  {group.links.map((link, l) => item(link, GROUP_START[g] + 1 + l))}
                </ul>
              </section>
            ))}
            <ul className="flex flex-col border-t border-band-gold/50 pt-6">
              {LINKS.map((link, l) => item(link, LINKS_START + l))}
            </ul>
            <Link
              style={rise(LINKS_START + LINKS.length)}
                href={REQUEST_CARE.href}
                onClick={close}
                className={`inline-flex min-h-12 items-center justify-center rounded-md bg-band-foreground px-5 text-lede font-medium text-band hover:bg-secondary motion-safe:menu-stagger sm:self-start ${focus}`}
              >
                {REQUEST_CARE.label}
              </Link>
          </nav>
          <div
            style={rise(LINKS_START + LINKS.length + 1)}
            className="mx-auto w-full max-w-6xl px-4 pb-10 text-band-muted motion-safe:menu-stagger md:px-6"
          >
            <div className="max-w-measure">
              <EmergencyNotice />
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
