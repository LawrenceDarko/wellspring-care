import type { Metadata } from "next";
import { LegalPage } from "@/components/site/content";
import Refund from "@/content/legal/refund.mdx";

export const metadata: Metadata = { title: "Refund Policy", description: "How refunds, deposits and hardship support work. Draft pending legal review." };

export default function RefundPage() {
  return (
    <LegalPage>
      <Refund />
    </LegalPage>
  );
}
