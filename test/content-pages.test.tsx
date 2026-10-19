// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { ContentPage, contentComponents, TodoOrg } from "@/components/site/content";
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

describe("ContentPage book layout (ADR 006)", () => {
  it("keeps prose at reading measure, makes the first paragraph the lede and breaks h2 sections with a gold hairline", () => {
    const H1 = contentComponents.h1 as (p: React.ComponentProps<"h1">) => React.ReactElement;
    const H2 = contentComponents.h2 as (p: React.ComponentProps<"h2">) => React.ReactElement;
    const { container } = render(
      <ContentPage>
        <H1>About us</H1>
        <p>Lede.</p>
        <H2>Mission</H2>
      </ContentPage>,
    );
    const article = container.querySelector("article");
    expect(article?.className).toContain("max-w-measure");
    expect(article?.className).toContain("[&>h1+p]:text-lede");
    expect(screen.getByRole("heading", { level: 1 }).className).toContain("text-h1");
    const h2 = screen.getByRole("heading", { level: 2, name: "Mission" });
    expect(h2.className).toContain("border-gold/40");
    expect(h2.className).toContain("text-h2");
    expect(container.querySelector("aside")).toBeNull();
  });

  it("puts the note in the margin column, before the body in reading order", () => {
    const { container } = render(
      <ContentPage note={<p>Side note</p>}>
        <h1>Title</h1>
      </ContentPage>,
    );
    const aside = container.querySelector("aside");
    expect(aside?.textContent).toBe("Side note");
    expect(aside?.className).toContain("lg:col-start-2");
    expect(aside?.className).toContain("border-gold");
    expect(aside!.compareDocumentPosition(container.querySelector("article")!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("uses no all-caps labels in the pending block (ADR 006 rule 2)", () => {
    const { container } = render(<TodoOrg>Pending.</TodoOrg>);
    expect(container.innerHTML).not.toMatch(/uppercase|tracking-wide/);
  });
});
