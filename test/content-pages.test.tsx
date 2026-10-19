// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { contentComponents, TodoOrg } from "@/components/site/content";
import { useMDXComponents } from "@/mdx-components";

afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
});

describe("TodoOrg pending block", () => {
  it.each(["development", "test"])("renders the pending block in %s", (env) => {
    vi.stubEnv("NODE_ENV", env);
    render(<TodoOrg title="Leadership">Bios from the org.</TodoOrg>);
    const note = screen.getByRole("note", { name: "Content pending" });
    expect(note.textContent).toContain("TODO(org)");
    expect(note.textContent).toContain("Bios from the org.");
    expect(screen.getByRole("heading", { level: 2, name: "Leadership" })).toBeTruthy();
  });

  it("renders nothing in production, including its heading", () => {
    vi.stubEnv("NODE_ENV", "production");
    const { container } = render(<TodoOrg title="Leadership">Bios from the org.</TodoOrg>);
    expect(container.innerHTML).toBe("");
    expect(screen.queryByRole("heading", { name: "Leadership" })).toBeNull();
  });
});

describe("MDX components", () => {
  it("exposes TodoOrg and EmergencyNotice to content files and lets callers override", () => {
    const h1 = () => null;
    const merged = useMDXComponents({ h1 });
    expect(merged.TodoOrg).toBe(TodoOrg);
    expect(merged.EmergencyNotice).toBe(contentComponents.EmergencyNotice);
    expect(merged.h1).toBe(h1);
  });

  it("renders internal links with next/link and keeps external hrefs", () => {
    const A = contentComponents.a as (p: React.ComponentProps<"a">) => React.ReactElement;
    render(
      <>
        <A href="/contact">Contact us</A>
        <A href="https://example.org">Source</A>
      </>,
    );
    expect(screen.getByRole("link", { name: "Contact us" }).getAttribute("href")).toBe("/contact");
    expect(screen.getByRole("link", { name: "Source" }).getAttribute("href")).toBe("https://example.org");
  });
});
