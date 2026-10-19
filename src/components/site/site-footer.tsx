import Link from "next/link";
import type { SiteSettings } from "@/server/data/settings";
import { LEGAL_NAV } from "./nav";

/** PRD §1.3: not an emergency service; links to 911 and 988. */
export function EmergencyNotice() {
  return (
    <p role="note" className="text-sm">
      <strong>Not an emergency service.</strong> Messages are not monitored continuously. In an
      emergency call{" "}
      <a href="tel:911" className="underline focus-visible:outline-2 focus-visible:outline-ring">
        911
      </a>
      . For a mental-health crisis call or text{" "}
      <a href="tel:988" className="underline focus-visible:outline-2 focus-visible:outline-ring">
        988
      </a>{" "}
      (Suicide &amp; Crisis Lifeline).
    </p>
  );
}

export function SiteFooter({ settings }: { settings: SiteSettings }) {
  const { name, tagline, contactEmail, contactPhone, address, businessHours, legalEntityName } =
    settings;
  const hasContact = Boolean(contactEmail || contactPhone || address || businessHours);
  return (
    <footer className="mt-auto border-t border-border bg-secondary text-secondary-foreground">
      <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-10 md:grid-cols-3">
        <div className="flex flex-col gap-2">
          <p className="font-display text-lg font-semibold">{name}</p>
          {tagline ? <p className="text-sm">{tagline}</p> : null}
          <p className="text-sm">Pastoral and spiritual care only. Not a medical or mental-health provider.</p>
        </div>
        <section aria-labelledby="footer-contact" className="flex flex-col gap-2 text-sm">
          <h2 id="footer-contact" className="text-base font-semibold">
            Contact
          </h2>
          {hasContact ? (
            <address className="flex flex-col gap-1 not-italic">
              {contactEmail ? (
                <a href={`mailto:${contactEmail}`} className="underline focus-visible:outline-2 focus-visible:outline-ring">
                  {contactEmail}
                </a>
              ) : null}
              {contactPhone ? (
                <a href={`tel:${contactPhone.replace(/[^\d+]/g, "")}`} className="underline focus-visible:outline-2 focus-visible:outline-ring">
                  {contactPhone}
                </a>
              ) : null}
              {address ? <span className="whitespace-pre-line">{address}</span> : null}
              {businessHours ? <span className="whitespace-pre-line">{businessHours}</span> : null}
            </address>
          ) : (
            <p>Contact details are not configured yet.</p>
          )}
        </section>
        <div className="flex flex-col gap-4">
          <EmergencyNotice />
          <nav aria-label="Legal">
            <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
              {LEGAL_NAV.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="underline focus-visible:outline-2 focus-visible:outline-ring">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>
      <p className="border-t border-border px-4 py-4 text-center text-xs">
        © {legalEntityName ?? name}
      </p>
    </footer>
  );
}
