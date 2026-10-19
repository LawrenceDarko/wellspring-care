import type { Metadata } from "next";
import { ContentPage } from "@/components/site/content";
import Programs from "@/content/programs.mdx";

export const metadata: Metadata = { title: "Programs", description: "The Spiritual Renewal Journey: guided 4-week and 8-week programs of scripture, prayer and reflection." };

export default function ProgramsPage() {
  return (
    <ContentPage media="forestPath">
      <Programs />
    </ContentPage>
  );
}
