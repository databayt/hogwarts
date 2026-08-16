// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Finance-block i18n audit — the two detectors the platform-wide ratchets
 * cannot see:
 *
 *  1. `findJsxTextLiterals()` — bare English JSX text (`<h3>Chart of
 *     Accounts</h3>`), English `title`/`alt`/`placeholder` attributes and
 *     `cond ? "Active" : "Inactive"` ternaries. The 8-pattern hardcoded-string
 *     ratchet only knows FormLabel/Button/toast/… shapes; a heading or an
 *     empty-state sentence sails past it.
 *  2. `findMissingDictionaryKeys()` — `alias?.key || "English"` lookups whose
 *     KEY does not exist in the slice the alias is bound to. EN↔AR parity
 *     cannot see these: both files lack the key, so the English fallback wins
 *     silently on /ar. 28 of them shipped this way (the whole offline-payment
 *     form, the reports hub tiles) until 2026-08-15.
 *
 * Consumed by src/tests/school-dashboard/finance/i18n-audit.test.ts as
 * ratchets. CLI: `pnpm tsx scripts/finance-i18n-audit.ts [--list]`.
 */
import { readdirSync, readFileSync, statSync } from "fs"
import { join, relative } from "path"
import ts from "typescript"

const ROOT = process.cwd()
export const FINANCE_DIRS = [
  join(ROOT, "src/components/school-dashboard/finance"),
  join(ROOT, "src/app/[lang]/s/[subdomain]/(school-dashboard)/finance"),
]

export interface JsxTextHit {
  file: string
  line: number
  kind: "text" | "attr" | "expr" | "ternary"
  text: string
}

export interface MissingKeyHit {
  file: string
  line: number
  alias: string
  key: string
  slice: string
}

function walk(dir: string, out: string[] = []): string[] {
  for (const e of readdirSync(dir).sort()) {
    if (e === "node_modules" || e.startsWith(".")) continue
    const full = join(dir, e)
    if (statSync(full).isDirectory()) walk(full, out)
    else if (/\.tsx?$/.test(e) && !/\.test\./.test(e)) out.push(full)
  }
  return out
}

const ENGLISH_WORD = /\b[A-Za-z][a-z]{2,}\b/
/** HTML entities and punctuation-only nodes are layout, not copy. */
const NON_COPY = /^(?:&[a-z]+;|[\s\W\d])*$/
const ATTRS = new Set(["title", "aria-label", "alt", "placeholder"])
/** Ternary branches that are class names, hrefs, hashes or ids, not copy. */
const NOT_COPY_TERNARY =
  /^(?:[a-z0-9_:/#.\-\s]+|(?:text|bg|border|flex|grid|w|h|p|m|rounded|font|gap|space|items|justify|opacity|shadow|dark|hover|ms|me|ps|pe|hidden|block|inline)[-: ].*|.*-\d.*|#.*|\/.*|\?.*)$/

const isCopy = (t: string) => ENGLISH_WORD.test(t) && !NON_COPY.test(t)

export function findJsxTextLiterals(dirs = FINANCE_DIRS): JsxTextHit[] {
  const hits: JsxTextHit[] = []
  for (const dir of dirs) {
    for (const file of walk(dir)) {
      if (!file.endsWith(".tsx")) continue
      const src = readFileSync(file, "utf8")
      const sf = ts.createSourceFile(
        file,
        src,
        ts.ScriptTarget.Latest,
        true,
        ts.ScriptKind.TSX
      )
      const rel = relative(ROOT, file)
      const at = (n: ts.Node) =>
        sf.getLineAndCharacterOfPosition(n.getStart()).line + 1
      const visit = (n: ts.Node) => {
        if (ts.isJsxText(n)) {
          const t = n.getText().replace(/\s+/g, " ").trim()
          if (t && isCopy(t))
            hits.push({ file: rel, line: at(n), kind: "text", text: t })
        } else if (
          ts.isJsxAttribute(n) &&
          n.initializer &&
          ts.isStringLiteral(n.initializer) &&
          ATTRS.has(n.name.getText())
        ) {
          const t = n.initializer.text.trim()
          if (t && isCopy(t) && !/^[a-z0-9_@.-]+$/.test(t))
            hits.push({ file: rel, line: at(n), kind: "attr", text: t })
        } else if (
          ts.isJsxExpression(n) &&
          n.expression &&
          ts.isStringLiteral(n.expression) &&
          n.parent &&
          (ts.isJsxElement(n.parent) || ts.isJsxFragment(n.parent))
        ) {
          const t = n.expression.text.trim()
          if (t && isCopy(t))
            hits.push({ file: rel, line: at(n), kind: "expr", text: t })
        } else if (ts.isConditionalExpression(n)) {
          for (const branch of [n.whenTrue, n.whenFalse]) {
            if (
              ts.isStringLiteral(branch) &&
              isCopy(branch.text) &&
              !NOT_COPY_TERNARY.test(branch.text)
            )
              hits.push({
                file: rel,
                line: at(branch),
                kind: "ternary",
                text: branch.text,
              })
          }
        }
        ts.forEachChild(n, visit)
      }
      visit(sf)
    }
  }
  return hits
}

const get = (obj: unknown, path: string[]): unknown =>
  path.reduce<unknown>(
    (o, k) =>
      o && typeof o === "object"
        ? (o as Record<string, unknown>)[k]
        : undefined,
    obj
  )

export function findMissingDictionaryKeys(
  dirs = FINANCE_DIRS
): MissingKeyHit[] {
  const read = (p: string) =>
    JSON.parse(
      readFileSync(join(ROOT, "src/components/internationalization", p), "utf8")
    )
  const full: Record<string, unknown> = {
    ...read("en.json"),
    ...read("school-en.json"),
    finance: read("dictionaries/en/finance.json"),
    banking: read("dictionaries/en/banking.json"),
  }
  const hits: MissingKeyHit[] = []
  const bindRe =
    /const\s+(\w+)\s*=\s*\(?((?:\(?dictionary(?: as any)?\)?|fd|fullDict|d|dict)(?:\??\.\w+)+)\)?\s*(?:as\s+[^\n]+)?\n/g

  for (const dir of dirs) {
    for (const file of walk(dir)) {
      const src = readFileSync(file, "utf8")
      const raw: [string, string][] = []
      let m: RegExpExecArray | null
      while ((m = bindRe.exec(src))) raw.push([m[1], m[2]])
      const aliases = new Map<string, string[]>()
      const resolvePath = (expr: string): string[] | null => {
        const parts = expr
          .replace(/[()]/g, "")
          .replace(/ as any/g, "")
          .split(/\?\.|\./)
          .filter(Boolean)
        const head = parts[0]
        const base =
          head === "dictionary" || head === "fullDict" || head === "dict"
            ? []
            : aliases.get(head)
        return base ? [...base, ...parts.slice(1)] : null
      }
      // aliases chain (fd = dictionary.finance; rp = fd.reportsPage)
      for (let pass = 0; pass < 3; pass++)
        for (const [name, expr] of raw) {
          const p = resolvePath(expr)
          if (p) aliases.set(name, p)
        }
      const rel = relative(ROOT, file)
      for (const [alias, path] of aliases) {
        const slice = get(full, path)
        if (!slice || typeof slice !== "object") continue
        // `alias?.key` NOT followed by `(` (a method call) or `?.` (deeper path)
        const useRe = new RegExp(
          `\\b${alias}\\?\\.(\\w+)(?![\\w(])(?!\\?\\.)`,
          "g"
        )
        const seen = new Set<string>()
        let u: RegExpExecArray | null
        while ((u = useRe.exec(src))) {
          const key = u[1]
          if (seen.has(key)) continue
          seen.add(key)
          if ((slice as Record<string, unknown>)[key] === undefined) {
            hits.push({
              file: rel,
              line: src.slice(0, u.index).split("\n").length,
              alias,
              key,
              slice: path.join("."),
            })
          }
        }
      }
    }
  }
  return hits
}

if (process.argv[1] && process.argv[1].includes("finance-i18n-audit")) {
  const list = process.argv.includes("--list")
  const jsx = findJsxTextLiterals()
  const keys = findMissingDictionaryKeys()
  console.log(`JSX English literals: ${jsx.length}`)
  if (list)
    for (const h of jsx)
      console.log(`  ${h.file}:${h.line} [${h.kind}] ${h.text}`)
  console.log(`Missing dictionary keys: ${keys.length}`)
  if (list)
    for (const h of keys)
      console.log(
        `  ${h.file}:${h.line} ${h.alias}?.${h.key} (no '${h.key}' in ${h.slice})`
      )
}
