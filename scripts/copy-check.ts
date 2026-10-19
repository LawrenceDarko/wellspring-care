// Copy checklist (PRD §1.3, §15.3): flags banned phrases in public copy.
// Run: npm run check:copy. Exits 1 when any finding is reported.
// A phrase is allowed when a negation ("not", "no", "never", "cannot", "n't", ...) comes
// earlier in the same sentence, e.g. "not a cure" or "not psychotherapy".
// `<TodoOrg>` blocks are skipped: they are instructions to the org, hidden in production.
import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

export type Rule = { id: string; pattern: RegExp; why: string };
export type Finding = { file: string; line: number; rule: string; text: string; why: string };

export const RULES: Rule[] = [
  { id: "therapy", pattern: /\b(psycho)?therap(y|ies|eutic)\b/gi, why: 'no "therapy" unless delivered by a licensed provider' },
  { id: "clinical-counseling", pattern: /\b(clinical|professional|licensed) counsell?ing\b/gi, why: "pastoral care is not clinical counseling" },
  { id: "outcome-guarantee", pattern: /\bguarantee(s|d)?\b/gi, why: "no outcome guarantees" },
  { id: "outcome-cure", pattern: /\bcur(e|es|ed|ing)\b/gi, why: "no promised outcomes" },
  { id: "outcome-healing", pattern: /\bheal(s|ed|ing)?\b/gi, why: "no promised outcomes" },
  { id: "outcome-promise", pattern: /\b(we|will) promise\b|\bpromises? (you|to)\b/gi, why: "no promised outcomes" },
  { id: "outcome-proven", pattern: /\b(proven|100%|miracle(s|ulous)?|life-changing)\b/gi, why: "no promised outcomes" },
  { id: "hipaa", pattern: /\bHIPAA[- ]?(compliant|compliance|certified)\b/gi, why: "never claim HIPAA compliance" },
  { id: "credential", pattern: /\b(board[- ]certified|accredited|certified|endorsed by|award[- ]winning)\b/gi, why: "no invented credentials or endorsements; org-verified facts go in TodoOrg" },
  { id: "faith-name", pattern: /\b(Moslem|Mohammedan|Romanist|Popish)\b/gi, why: "name faith traditions accurately" },
];

/** Pages that must show the emergency notice (PRD §1.3). Paths relative to repo root. */
export const REQUIRES_EMERGENCY_NOTICE = ["src/content/prayer.mdx", "src/content/legal/service-scope.mdx"];

export const SCAN_DIRS = ["src/content", "src/components/site", "src/app/(public)"];

const NEGATION = /\b(not|no|never|nor|without|cannot)\b|n't\b/i;

/** Blank out TodoOrg blocks and code comments, keeping newlines so line numbers stay right. */
function stripIgnored(source: string, isCode: boolean): string {
  const blank = (m: string) => m.replace(/[^\n]/g, " ");
  let out = source.replace(/<TodoOrg\b[^>]*?(\/>|>[\s\S]*?<\/TodoOrg>)/g, blank);
  if (isCode) out = out.replace(/\/\*[\s\S]*?\*\//g, blank).replace(/(^|[^:])\/\/.*$/gm, blank);
  return out;
}

function sentenceBefore(text: string, index: number): string {
  const start = Math.max(text.lastIndexOf(".", index - 1), text.lastIndexOf("\n", index - 1), text.lastIndexOf("!", index - 1), text.lastIndexOf("?", index - 1));
  return text.slice(start + 1, index);
}

export function checkCopy(file: string, source: string): Finding[] {
  const text = stripIgnored(source, /\.(t|j)sx?$/.test(file));
  const lines = text.split("\n");
  const findings: Finding[] = [];
  lines.forEach((lineText, i) => {
    for (const rule of RULES) {
      for (const m of lineText.matchAll(rule.pattern)) {
        if (NEGATION.test(sentenceBefore(lineText, m.index))) continue;
        findings.push({ file, line: i + 1, rule: rule.id, text: m[0], why: rule.why });
      }
    }
  });
  if (REQUIRES_EMERGENCY_NOTICE.includes(file) && !/<EmergencyNotice\b/.test(text)) {
    findings.push({ file, line: 1, rule: "emergency-notice", text: "", why: "page must render <EmergencyNotice />" });
  }
  return findings;
}

export function listCopyFiles(root: string, dirs = SCAN_DIRS): string[] {
  return dirs.flatMap((dir) =>
    readdirSync(join(root, dir), { recursive: true, encoding: "utf8" })
      .filter((f) => /\.(mdx|tsx)$/.test(f))
      .map((f) => relative(root, join(root, dir, f)).split("\\").join("/")),
  );
}

export function checkAll(root: string): Finding[] {
  return listCopyFiles(root).flatMap((file) => checkCopy(file, readFileSync(join(root, file), "utf8")));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const root = fileURLToPath(new URL("..", import.meta.url));
  const findings = checkAll(root);
  for (const f of findings) console.log(`${f.file}:${f.line} [${f.rule}] "${f.text}" - ${f.why}`);
  console.log(findings.length ? `copy-check: ${findings.length} finding(s)` : "copy-check: ok");
  process.exit(findings.length ? 1 : 0);
}
