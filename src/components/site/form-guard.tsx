import { FORM_TOKEN_FIELD, HONEYPOT_FIELD } from "@/server/rate-limit";

/**
 * PRD §13.5 hidden fields for public forms: a honeypot people never see or reach
 * by keyboard, and the signed render-time token from `publicFormToken()`.
 */
export function FormGuardFields({ token }: { token: string }) {
  return (
    <>
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label htmlFor={`hp-${HONEYPOT_FIELD}`}>Leave this field empty</label>
        <input id={`hp-${HONEYPOT_FIELD}`} type="text" name={HONEYPOT_FIELD} tabIndex={-1} autoComplete="off" defaultValue="" />
      </div>
      <input type="hidden" name={FORM_TOKEN_FIELD} value={token} />
    </>
  );
}
