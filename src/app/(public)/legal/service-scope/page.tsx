import type { Metadata } from "next";
import { LegalPage } from "@/components/site/content";
import ServiceScope from "@/content/legal/service-scope.mdx";

export const metadata: Metadata = { title: "Service Scope", description: "What our pastoral care includes, what it does not, and where to find other help." };

export default function ServiceScopePage() {
  return (
    <LegalPage>
      <ServiceScope />
    </LegalPage>
  );
}
