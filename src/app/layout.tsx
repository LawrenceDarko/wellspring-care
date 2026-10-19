import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Wellspring Care",
  description:
    "Faith-based chaplaincy, pastoral care, renewal programs, weddings, funerals and events.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
