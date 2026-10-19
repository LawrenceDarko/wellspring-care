import type { Metadata } from "next";
import { ContentPage } from "@/components/site/content";
import Funerals from "@/content/funerals.mdx";

export const metadata: Metadata = { title: "Funerals & Memorials", description: "Gentle help with funerals, memorials, graveside services and bereavement support." };

export default function FuneralsPage() {
  return (
    <ContentPage>
      <Funerals />
    </ContentPage>
  );
}
