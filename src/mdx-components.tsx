import type { MDXComponents } from "mdx/types";
import { contentComponents } from "@/components/site/content";

// Required by @next/mdx (App Router): components used by every compiled .mdx file.
export function useMDXComponents(components: MDXComponents): MDXComponents {
  return { ...contentComponents, ...components };
}
