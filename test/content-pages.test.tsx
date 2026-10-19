// @vitest-environment jsdom
import { motion } from "./helpers/match-media";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { ContentPage, contentComponents, TodoOrg } from "@/components/site/content";
import { useMDXComponents } from "@/mdx-components";
import { MEDIA } from "@/content/media";

afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
  motion.reduce = true;
});

/** Everything a reader gets: text, link targets, image alt text, in DOM order. */
function readerView(el: HTMLElement) {
  const links = [...el.querySelectorAll("a")].map((a) => a.getAttribute("href"));
  const alts = [...el.querySelectorAll("img")].map((i) => i.getAttribute("alt"));
  return { text: el.textContent, links, alts };
}

/** Renders `ui` with reduced motion and with motion; returns both reader views and the motion container. */
function renderBothWays(ui: React.ReactElement) {
  motion.reduce = true;
  const still = render(ui);
  const reduced = readerView(still.container);
  expect(still.container.querySelector("[style*='opacity']")).toBeNull();
  cleanup();
  motion.reduce = false;
  const moving = render(ui);
  return { reduced, animated: readerView(moving.container), container: moving.container };
}

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
    expect(
      aside!.compareDocumentPosition(container.querySelector("article")!) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it("uses no all-caps labels in the pending block (ADR 006 rule 2)", () => {
    const { container } = render(<TodoOrg>Pending.</TodoOrg>);
    expect(container.innerHTML).not.toMatch(/uppercase|tracking-wide/);
  });
});

describe("ContentPage header and motion (ADR 007, 1.10h)", () => {
  const page = (
    <ContentPage media="candle" note={<p>Side note</p>}>
      <h1>Funerals</h1>
      <p>Lede.</p>
    </ContentPage>
  );

  it("puts the registered photo in a header band before the page, and none without media", () => {
    const { container } = render(page);
    const header = container.querySelector("[data-page-header='media']")!;
    expect(header.querySelector("img")?.getAttribute("alt")).toBe(MEDIA.candle.alt);
    expect(
      header.compareDocumentPosition(container.querySelector("article")!) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    cleanup();
    const plain = render(
      <ContentPage>
        <h1>Title</h1>
      </ContentPage>,
    );
    expect(plain.container.querySelector("[data-page-header]")).toBeNull();
  });

  it("keeps the margin note sticky on desktop", () => {
    const { container } = render(page);
    expect(container.querySelector("aside")?.className).toContain("lg:sticky");
  });

  it("renders the same content with and without reduced motion", () => {
    const { reduced, animated, container } = renderBothWays(page);
    expect(animated).toEqual(reduced);
    expect(container.querySelector("[data-page-header] [style*='transform']")).toBeTruthy();
  });
});
