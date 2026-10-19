import type { Metadata } from "next";
import { LegalPage } from "@/components/site/content";
import Privacy from "@/content/legal/privacy.mdx";

export const metadata: Metadata = { title: "Privacy Policy", description: "How we collect, protect and use your information. Draft pending legal review." };

export default function PrivacyPage() {
  return (
    <LegalPage>
      <Privacy />
    </LegalPage>
  );
}
