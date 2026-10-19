import type { Metadata } from "next";
import { ContentPage } from "@/components/site/content";
import About from "@/content/about.mdx";

export const metadata: Metadata = { title: "About", description: "Our mission, foundation, leadership and commitments to ethical, confidential pastoral care." };

export default function AboutPage() {
  return (
    <ContentPage>
      <About />
    </ContentPage>
  );
}
