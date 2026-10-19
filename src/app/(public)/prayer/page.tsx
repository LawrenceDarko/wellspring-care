import type { Metadata } from "next";
import { ContentPage } from "@/components/site/content";
import Prayer from "@/content/prayer.mdx";

export const metadata: Metadata = { title: "Prayer Requests", description: "Share a prayer request with our prayer team. Private by default." };

export default function PrayerPage() {
  return (
    <ContentPage>
      <Prayer />
    </ContentPage>
  );
}
