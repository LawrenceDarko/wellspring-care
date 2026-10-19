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

const bandLink =
  "underline decoration-band-gold underline-offset-4 hover:decoration-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

/** Forest band (ADR 006). `band` swaps the focus ring to linen so focus stays visible. */
export function SiteFooter({ settings }: { settings: SiteSettings }) {
  const { name, tagline, contactEmail, contactPhone, address, businessHours, legalEntityName } =
    settings;
  const hasContact = Boolean(contactEmail || contactPhone || address || businessHours);
  return (
    <footer className="band mt-auto">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-14 md:px-6 md:py-16">
        <div className="flex max-w-measure flex-col gap-2">
          <p className="font-display text-h2 font-medium tracking-tight [font-variation-settings:'SOFT'_50]">
            {name}
          </p>
          {tagline ? <p className="text-lede text-band-muted">{tagline}</p> : null}
          <p className="text-band-muted">
            Pastoral and spiritual care only. Not a medical or mental-health provider.
          </p>
        </div>
        <div className="grid gap-10 border-t border-band-gold/50 pt-10 md:grid-cols-3 md:gap-8">
          <section aria-labelledby="footer-contact" className="flex flex-col gap-3">
            <h2 id="footer-contact" className="text-lede font-medium">
              Contact
            </h2>
            {hasContact ? (
              <address className="flex flex-col gap-1.5 not-italic">
                {contactEmail ? (
                  <a href={`mailto:${contactEmail}`} className={`self-start ${bandLink}`}>
                    {contactEmail}
                  </a>
                ) : null}
                {contactPhone ? (
                  <a href={`tel:${contactPhone.replace(/[^\d+]/g, "")}`} className={`self-start ${bandLink}`}>
                    {contactPhone}
                  </a>
                ) : null}
                {address ? <span className="whitespace-pre-line text-band-muted">{address}</span> : null}
                {businessHours ? (
                  <span className="whitespace-pre-line text-band-muted">{businessHours}</span>
                ) : null}
              </address>
            ) : (
              <p className="text-band-muted">Contact details are not configured yet.</p>
            )}
            <Link href="/contact" className={`self-start ${bandLink}`}>
              Send us a message
            </Link>
          </section>
          <section aria-labelledby="footer-urgent" className="flex flex-col gap-3">
            <h2 id="footer-urgent" className="text-lede font-medium">
              If it is urgent
            </h2>
            <EmergencyNotice />
          </section>
          <section aria-labelledby="footer-legal" className="flex flex-col gap-3">
            <h2 id="footer-legal" className="text-lede font-medium">
              Policies
            </h2>
            <nav aria-label="Legal">
              <ul className="flex flex-col gap-1.5">
                {LEGAL_NAV.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className={bandLink}>
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </section>
        </div>
        <p className="border-t border-band-gold/50 pt-6 text-sm text-band-muted">
          © {legalEntityName ?? name}
        </p>
      </div>
    </footer>
  );
}
