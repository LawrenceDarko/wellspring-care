import createMDX from "@next/mdx";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // test/e2e/server.ts sets a separate dir so e2e can run beside a dev server.
  distDir: process.env.E2E_DIST_DIR || ".next",
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

// MDX is imported from src/content/*.mdx by page.tsx files (PRD §4.2); no .mdx routes.
// Turbopack needs serializable options, so no remark/rehype plugin functions here.
const withMDX = createMDX({});

export default withMDX(nextConfig);
