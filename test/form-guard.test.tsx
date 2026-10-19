// @vitest-environment jsdom
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FormGuardFields } from "@/components/site/form-guard";
import { FORM_TOKEN_FIELD, HONEYPOT_FIELD } from "@/server/rate-limit";

describe("FormGuardFields", () => {
  it("renders an empty, unfocusable, hidden honeypot and the form token", () => {
    const { container } = render(<form><FormGuardFields token="123.abc" /></form>);
    const honeypot = container.querySelector<HTMLInputElement>(`input[name="${HONEYPOT_FIELD}"]`);
    expect(honeypot?.value).toBe("");
    expect(honeypot?.tabIndex).toBe(-1);
    expect(honeypot?.closest("[aria-hidden='true']")).not.toBeNull();
    expect(container.querySelector<HTMLInputElement>(`input[name="${FORM_TOKEN_FIELD}"]`)?.value).toBe("123.abc");
  });
});
