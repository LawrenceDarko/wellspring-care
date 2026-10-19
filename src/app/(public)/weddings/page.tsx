import type { Metadata } from "next";
import { ContentPage } from "@/components/site/content";
import Weddings from "@/content/weddings.mdx";

export const metadata: Metadata = { title: "Weddings", description: "Christian wedding officiants and ceremonies shaped around your tradition." };

export default function WeddingsPage() {
  return (
    <ContentPage>
      <Weddings />
    </ContentPage>
  );
}
