import type { Metadata } from "next";
import { ContentPage } from "@/components/site/content";
import Chaplaincy from "@/content/chaplaincy.mdx";

export const metadata: Metadata = { title: "Chaplaincy", description: "Chaplains for hospice, healthcare and community settings, complementing clinical teams." };

export default function ChaplaincyPage() {
  return (
    <ContentPage media="heldHands">
      <Chaplaincy />
    </ContentPage>
  );
}
