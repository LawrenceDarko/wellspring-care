"use client";

import { useState } from "react";
import Link from "next/link";
import { MenuIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import type { NavLink } from "./nav";

export function MobileNav({ links, siteName }: { links: readonly NavLink[]; siteName: string }) {
  const [open, setOpen] = useState(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          className="min-h-11 gap-2 rounded-md px-3 text-base xl:hidden"
          aria-label="Open menu"
        >
          <MenuIcon aria-hidden="true" className="size-5" />
          <span aria-hidden="true">Menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-80 max-w-[85vw] bg-background">
        <SheetHeader className="border-b border-border px-6 py-5">
          <SheetTitle className="font-display text-h3 font-medium tracking-tight text-primary">
            {siteName}
          </SheetTitle>
          <SheetDescription className="sr-only">Site navigation</SheetDescription>
        </SheetHeader>
        <nav aria-label="Mobile" className="overflow-y-auto px-3 pb-6">
          <ul className="flex flex-col">
            {links.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="flex min-h-11 items-center rounded-md px-3 text-lede hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
