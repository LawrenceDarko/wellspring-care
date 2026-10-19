// @vitest-environment jsdom
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { DRAFT_BANNER_TEXT, LegalPage } from "@/components/site/content";
import { LEGAL_NAV } from "@/components/site/nav";
import { checkAll, checkCopy } from "../scripts/copy-check.ts";

const root = process.cwd();

afterEach(cleanup);

describe("legal pages", () => {
  it("renders the draft banner above the page body", () => {
    render(
      <LegalPage>
        <h1>Privacy policy</h1>
      </LegalPage>,
    );
    const banner = screen.getByRole("note", { name: "Draft notice" });
    expect(banner.textContent).toContain(DRAFT_BANNER_TEXT);
    expect(DRAFT_BANNER_TEXT).toBe("Draft - requires legal review");
    expect(banner.compareDocumentPosition(screen.getByRole("heading", { level: 1 })) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it.each(LEGAL_NAV.map((l) => l.href))("%s has a route using LegalPage and an MDX draft", (href) => {
    const slug = href.replace("/legal/", "");
    const page = readFileSync(join(root, "src/app/(public)/legal", slug, "page.tsx"), "utf8");
    expect(page).toContain("<LegalPage>");
    expect(page).toContain(`@/content/legal/${slug}.mdx`);
    expect(existsSync(join(root, "src/content/legal", `${slug}.mdx`))).toBe(true);
  });
});

describe("copy-check", () => {
  it("passes on all current content", () => {
    expect(checkAll(root)).toEqual([]);
  });

  it.each([
    ["We offer Christian therapy.", "therapy"],
    ["Our program is guaranteed to help.", "outcome-guarantee"],
    ["Find healing in eight weeks.", "outcome-healing"],
    ["This retreat will cure anxiety.", "outcome-cure"],
    ["We promise you peace.", "outcome-promise"],
    ["Our chaplains are board-certified.", "credential"],
    ["We are HIPAA compliant.", "hipaa"],
    ["Professional counseling for couples.", "clinical-counseling"],
  ])("flags %j", (sentence, rule) => {
    expect(checkCopy("src/content/x.mdx", sentence).map((f) => f.rule)).toEqual([rule]);
  });

  it("allows negated phrases and reports line numbers", () => {
    const src = "The program is not a cure.\nOur care is not psychotherapy.\nWe cannot promise any result.\nReal healing here.";
    expect(checkCopy("src/content/x.mdx", src)).toMatchObject([{ line: 4, rule: "outcome-healing" }]);
  });

  it("negation in an earlier sentence does not excuse a later one", () => {
    expect(checkCopy("src/content/x.mdx", "We are not a clinic. We offer therapy.").map((f) => f.rule)).toEqual(["therapy"]);
  });

  it("skips TodoOrg blocks and code comments", () => {
    expect(checkCopy("src/content/x.mdx", "<TodoOrg>Certified chaplaincy bodies.</TodoOrg>")).toEqual([]);
    expect(checkCopy("src/components/site/x.tsx", '// avoid "therapy"\n/* guaranteed */\nconst a = 1;')).toEqual([]);
  });

  it("requires the emergency notice on prayer and service scope pages", () => {
    expect(checkCopy("src/content/prayer.mdx", "# Prayer").map((f) => f.rule)).toEqual(["emergency-notice"]);
    expect(checkCopy("src/content/legal/service-scope.mdx", "# Scope\n<EmergencyNotice />")).toEqual([]);
  });
});
