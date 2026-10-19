import createMDX from "@next/mdx";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
