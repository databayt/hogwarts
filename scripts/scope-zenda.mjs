// Transform zenda's Webflow globals.css into a hogwarts-safe scoped sheet by
// PREFIXING every selector with `.zenda-clone` (flat output — no CSS nesting,
// which Lightning CSS flattened unreliably for this 3k-line Webflow file).
//
// - drop Tailwind plumbing (@import "tailwindcss"/tw-animate-css, @theme, @layer base)
// - keep @keyframes at top level (global)
// - recurse into @media/@supports, prefixing their inner rules
// - `:root`/`html`/`body` selectors → `.zenda-clone`; everything else → `.zenda-clone <sel>`
import { readFileSync, writeFileSync } from "node:fs"

// Scope the Webflow shared stylesheet (the bulk — testimonial/hiw/services/
// parents-ease layout) FIRST, then zenda's local globals.css (tokens +
// overrides) so the overrides win. Strip CSS comments first: their `{ } ;`
// would desync the brace tokenizer.
const SRC_FILES = [
  "/Users/abdout/hogwarts/scripts/zenda-webflow-shared.css",
  "/Users/abdout/zenda/app/globals.css",
]
const src = SRC_FILES.map((f) =>
  readFileSync(f, "utf8").replace(/\/\*[\s\S]*?\*\//g, "")
).join("\n")

// Tokenize a CSS string into top-level units {prelude, body?, hasBlock}.
function tokenize(css) {
  const units = []
  let i = 0
  const n = css.length
  let prelude = ""
  while (i < n) {
    const ch = css[i]
    if (ch === "{") {
      let depth = 1
      let body = ""
      i++
      while (i < n && depth > 0) {
        const c = css[i]
        if (c === "{") depth++
        else if (c === "}") {
          depth--
          if (depth === 0) break
        }
        body += c
        i++
      }
      i++
      units.push({ prelude: prelude.trim(), body, hasBlock: true })
      prelude = ""
    } else if (ch === ";" && prelude.trim().startsWith("@")) {
      units.push({ prelude: (prelude + ";").trim(), body: "", hasBlock: false })
      prelude = ""
      i++
    } else {
      prelude += ch
      i++
    }
  }
  if (prelude.trim())
    units.push({ prelude: prelude.trim(), body: "", hasBlock: false })
  return units
}

const SCOPE = ".zenda-clone"

function prefixSelectorList(sel) {
  return sel
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => {
      if (s === ":root" || s === "html" || s === "body") return SCOPE
      if (s === "*") return `${SCOPE} *`
      // `html.scrolled` / `body.x` → scope the element part onto the wrapper
      if (/^html(\b|[.#:])/.test(s)) return SCOPE + s.replace(/^html/, "")
      if (/^body(\b|[.#:])/.test(s)) return SCOPE + s.replace(/^body/, "")
      return `${SCOPE} ${s}`
    })
    .join(", ")
}

const keyframes = []
const out = []

function emitRules(units, sink) {
  for (const u of units) {
    const p = u.prelude
    if (!u.hasBlock) continue // drop bare @import etc.
    if (/^@import\b/.test(p)) continue
    if (/^@theme\b/.test(p)) continue
    if (/^@layer\s+base\b/.test(p)) continue
    if (/^@(-\w+-)?keyframes\b/.test(p)) {
      keyframes.push(`${p} {${u.body}}`)
      continue
    }
    if (/^@(media|supports|container)\b/.test(p)) {
      const inner = []
      emitRules(tokenize(u.body), inner)
      sink.push(`${p} {\n${inner.join("\n")}\n}`)
      continue
    }
    if (/^@layer\b/.test(p)) {
      // keep other @layer wrappers, prefix inner
      const inner = []
      emitRules(tokenize(u.body), inner)
      sink.push(`${p} {\n${inner.join("\n")}\n}`)
      continue
    }
    // any other at-rule (@font-face, @page, @counter-style, @property, …) must
    // stay top-level and unprefixed — `.zenda-clone @font-face` is invalid.
    if (/^@/.test(p)) {
      keyframes.push(`${p} {${u.body}}`)
      continue
    }
    // ordinary style rule
    sink.push(`${prefixSelectorList(p)} {${u.body}}`)
  }
}

emitRules(tokenize(src), out)

const css =
  `/* Generated from zenda app/globals.css — every selector prefixed with .zenda-clone.\n` +
  ` * Do not edit by hand; regenerate with scope-zenda.mjs. */\n\n` +
  `@import url("https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&display=swap");\n\n` +
  keyframes.join("\n") +
  `\n\n` +
  out.join("\n") +
  `\n`

writeFileSync("/Users/abdout/hogwarts/src/styles/zenda-clone.css", css, "utf8")
console.log(
  `keyframes=${keyframes.length} rules=${out.length} bytes=${css.length}`
)
