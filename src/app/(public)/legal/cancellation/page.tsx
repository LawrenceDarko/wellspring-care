import type { Metadata } from "next";
import { LegalPage } from "@/components/site/content";
import Cancellation from "@/content/legal/cancellation.mdx";

export const metadata: Metadata = { title: "Cancellation Policy", description: "How to cancel or reschedule sessions, programs and ceremonies. Draft pending legal review." };

export default function CancellationPage() {
  return (
    <LegalPage>
      <Cancellation />
    </LegalPage>
  );
}
