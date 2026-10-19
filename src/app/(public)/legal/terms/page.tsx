import type { Metadata } from "next";
import { LegalPage } from "@/components/site/content";
import Terms from "@/content/legal/terms.mdx";

export const metadata: Metadata = { title: "Terms of Use", description: "Terms for using this website and our pastoral care services. Draft pending legal review." };

export default function TermsPage() {
  return (
    <LegalPage>
      <Terms />
    </LegalPage>
  );
}
