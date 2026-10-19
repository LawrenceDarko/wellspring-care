import type { Metadata } from "next";
import { LegalPage } from "@/components/site/content";
import Accessibility from "@/content/legal/accessibility.mdx";

export const metadata: Metadata = { title: "Accessibility", description: "Our accessibility commitment and how to ask for help or another format." };

export default function AccessibilityPage() {
  return (
    <LegalPage>
      <Accessibility />
    </LegalPage>
  );
}
