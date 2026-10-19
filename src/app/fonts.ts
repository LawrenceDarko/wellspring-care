import { Fraunces, Source_Sans_3 } from "next/font/google";

// ADR 002: serif display + humanist sans body (PRD §4.4). Self-hosted at build
// by next/font, so no request to Google from visitors' browsers.

export const headingFont = Fraunces({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-heading",
  axes: ["SOFT", "opsz"],
});

export const bodyFont = Source_Sans_3({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-body",
});
