import { describe, expect, it } from "vitest";
import { metadata } from "@/app/layout";

describe("smoke", () => {
  it("resolves the @ alias and loads app metadata", () => {
    expect(metadata.title).toBe("Wellspring Care");
  });
});
