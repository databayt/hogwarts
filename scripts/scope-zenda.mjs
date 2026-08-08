// Transform zenda's Webflow globals.css into a hogwarts-safe scoped sheet by
// PREFIXING every selector with `.zenda-clone` (flat output — no CSS nesting,
// which Lightning CSS flattened unreliably for this 3k-line Webflow file).
//
// - drop Tailwind plumbing (@import "tailwindcss"/tw-animate-css, @theme, @layer base)
// - keep @keyframes at top level (global)
// - recurse into @media/@supports, prefixing their inner rules
// - `:root`/`html`/`body` selectors → `.zenda-clone`; everything else → `.zenda-clone <sel>`
//
// RTL (added 2026-08-07) happens in two passes, and the split is the whole
// reason the sheet does not double in size:
//
//   Pass A — LOGICALIZE. Every physical property that has an exact logical
//   twin is renamed in the BASE rule: margin-left → margin-inline-start, left
//   → inset-inline-start, and so on (~1,240 declarations). This is a no-op in
//   LTR — `margin-inline-start` *is* `margin-left` when direction is ltr — so
//   /en renders byte-identically, and RTL mirrors for free with no override at
//   all. It also sidesteps the trap that sinks the naive approach: an overlay
//   that only ADDS `margin-right` leaves the base `margin-left` still matching
//   under RTL, so the element gets both margins. Renaming has no such residue.
//
//   Pass B — OVERLAY. What is left after Pass A is value-level flipping that no
//   rename can express: 4-value `margin`/`padding`/`inset`/`border-radius`
//   shorthands, `translate()` x-offsets, `background-position`, `box-shadow`
//   x-offsets, `text-align: left`, `float: left`. In every one of those the
//   PROPERTY NAME is unchanged by the flip, so a plain override under
//   `.zenda-clone[dir="rtl"]` is complete — again no residue. rtlcss does the
//   flipping (a devDependency, generation-time only, zero runtime cost); we
//   diff its output against the input and emit only what actually changed.
//   The script asserts Pass B never renames a property — if it ever does, that
//   is a case Pass A missed and the overlay would be incomplete, so it throws.
//
// Arabic typography rides Pass B: DM Sans/Poppins/Satoshi/Montserrat carry no
// Arabic and fall through to a platform serif, so RTL rules restate
// `font-family` as `--font-heading` (Thmanyah) and zero the display tracking,
// exactly as `.zenda-heading` already does in school-marketing.css.
//
// @keyframes are deliberately NOT flipped: they are hoisted global (they carry
// no `.zenda-clone` scope, so a flip would leak to the whole app), and the
// marquee-style loops that use them are two identical copies sliding -50%,
// which is direction-agnostic anyway.
import { readFileSync, writeFileSync } from "node:fs"
import rtlcss from "rtlcss"

// Order matters, and it is the opposite of what "globals.css is the override
// layer" suggests. Measured on zenda itself: Next's CSS bundle (globals.css) is
// document.styleSheets[0] and the Webflow CDN <link> is [2], so the CDN loads
// LAST and wins ties. Zenda's globals.css is written knowing that -- it reaches
// for `!important` twenty times precisely because it cannot win on order alone.
//
// Concatenating the other way round silently inverted the cascade for every
// tie. It cost real fidelity: `.schools_lottie-wrap` is `width: 100%` in
// globals.css and `width: 132%` in the CDN's <=479px block, so the mobile
// Lottie rendered 351px wide against zenda's 463px.
//
// Strip CSS comments first: their `{ } ;` would desync the brace tokenizer.
const SRC_FILES = [
  "/Users/abdout/zenda/app/globals.css",
  "/Users/abdout/hogwarts/scripts/zenda-webflow-shared.css",
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

const RTL_SCOPE = `${SCOPE}[dir="rtl"]`

function prefixSelectorListRtl(sel) {
  return sel
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => {
      if (s === ":root" || s === "html" || s === "body") return RTL_SCOPE
      if (s === "*") return `${RTL_SCOPE} *`
      if (/^html(\b|[.#:])/.test(s)) return RTL_SCOPE + s.replace(/^html/, "")
      if (/^body(\b|[.#:])/.test(s)) return RTL_SCOPE + s.replace(/^body/, "")
      return `${RTL_SCOPE} ${s}`
    })
    .join(", ")
}

// ---------------------------------------------------------------- Pass A ----
// Physical → logical renames. Only properties with an EXACT logical twin are
// listed: the rename must not change LTR rendering at all, which is what makes
// this safe to apply to the base rule instead of an override.
//
// Not listed, on purpose: `text-align`, `float` and `clear` do have logical
// VALUES (start/end, inline-start), but flipping them keeps the property name,
// so Pass B overrides them cleanly and we avoid depending on `float:
// inline-start` support. Shorthands (`margin`, `padding`, `inset`,
// `border-radius`) have no per-side logical twin at all and are Pass B's too.
const LOGICAL_RENAMES = [
  ["margin-left", "margin-inline-start"],
  ["margin-right", "margin-inline-end"],
  ["padding-left", "padding-inline-start"],
  ["padding-right", "padding-inline-end"],
  ["left", "inset-inline-start"],
  ["right", "inset-inline-end"],
  ["border-left", "border-inline-start"],
  ["border-right", "border-inline-end"],
  ["border-left-width", "border-inline-start-width"],
  ["border-right-width", "border-inline-end-width"],
  ["border-left-color", "border-inline-start-color"],
  ["border-right-color", "border-inline-end-color"],
  ["border-left-style", "border-inline-start-style"],
  ["border-right-style", "border-inline-end-style"],
  ["border-top-left-radius", "border-start-start-radius"],
  ["border-top-right-radius", "border-start-end-radius"],
  ["border-bottom-left-radius", "border-end-start-radius"],
  ["border-bottom-right-radius", "border-end-end-radius"],
  ["scroll-margin-left", "scroll-margin-inline-start"],
  ["scroll-margin-right", "scroll-margin-inline-end"],
  ["scroll-padding-left", "scroll-padding-inline-start"],
  ["scroll-padding-right", "scroll-padding-inline-end"],
]
// Longest first, so `border-left-width` is not eaten by `border-left`.
const RENAME_RULES = [...LOGICAL_RENAMES]
  .sort((a, b) => b[0].length - a[0].length)
  .map(([from, to]) => [
    // A property name only ever starts a declaration: at the top of the body or
    // straight after a `;`. Anchoring there is what keeps `transform-origin:
    // left` and `background-position: right` — where the word is a VALUE — from
    // being rewritten, and it survives the four `url(data:…)` values in this
    // sheet, which a naive split on `;` would tear apart.
    new RegExp(`(^|;)(\\s*)${from}(\\s*:)`, "g"),
    `$1$2${to}$3`,
  ])

// `inset` is a rename's blind spot AND rtlcss's: verified against rtlcss 4.3,
// it flips `margin`, `padding`, `border-width/color/style` and `border-radius`
// shorthands but leaves `inset` completely untouched. This sheet carries ~70 of
// them and they position nearly every decorative absolute in the clone
// (`inset: 28% auto auto -6%` and friends), so without this the art stays
// pinned to the physical side it was authored on while the layout around it
// mirrors.
//
// The four-value form `inset: T R B L` splits exactly into the two logical
// shorthands — `inset-block: T B` and `inset-inline: L R`, where inset-inline
// takes START then END. In LTR start is left, so `inset-inline: L R` is
// literally the same box; in RTL start becomes right and it mirrors for free.
//
// Only the four-value form is touched. One, two and three values are all
// horizontally symmetric (`T H B` puts the same H on both sides), so they need
// no flip and are left exactly as authored.
const INSET_RE = /(^|;)(\s*)inset(\s*:\s*)([^;}]+)/g
let insetSplitCount = 0

function splitInset(body) {
  return body.replace(INSET_RE, (whole, lead, ws, colon, rawValue) => {
    const bang = /!\s*important/i.test(rawValue)
    const value = rawValue.replace(/!\s*important/i, "").trim()
    // A `calc()` or `var()` can hide spaces, which would break token counting —
    // leave anything with parentheses alone rather than mangle it.
    if (/[()]/.test(value)) return whole
    const parts = value.split(/\s+/).filter(Boolean)
    if (parts.length !== 4) return whole
    const [top, right, bottom, left] = parts
    const imp = bang ? " !important" : ""
    insetSplitCount++
    return `${lead}${ws}inset-block${colon}${top} ${bottom}${imp}; inset-inline: ${left} ${right}${imp}`
  })
}

let renameCount = 0
function logicalize(body) {
  let outBody = splitInset(body)
  for (const [re, sub] of RENAME_RULES) {
    outBody = outBody.replace(re, (...m) => {
      renameCount++
      return sub.replace(/\$(\d)/g, (_, i) => m[Number(i)])
    })
  }
  return outBody
}

// ---------------------------------------------------------------- Pass B ----
const propNames = (body) =>
  [...body.matchAll(/(^|;)\s*([-a-zA-Z]+)\s*:/g)].map((m) => m[2].toLowerCase())

// Split a declaration body into `prop: value` pairs without splitting on the
// semicolons inside `url(data:…)` — track paren depth instead of using `.split`.
function declarations(body) {
  const decls = []
  let buf = ""
  let depth = 0
  for (const ch of body) {
    if (ch === "(") depth++
    else if (ch === ")") depth--
    if (ch === ";" && depth === 0) {
      if (buf.trim()) decls.push(buf.trim())
      buf = ""
      continue
    }
    buf += ch
  }
  if (buf.trim()) decls.push(buf.trim())
  return decls
}

const ARABIC_STACK = "var(--font-heading), ui-sans-serif, system-ui, sans-serif"
// The Latin display faces this sheet asks for by name. None carries Arabic, so
// under RTL each falls through the generic families to a platform serif —
// visibly worse than the product's own Arabic face.
const LATIN_ONLY_FACES =
  /\b(poppins|dm sans|--font-dm-sans|satoshi|montserrat)\b/i

let overlayRuleCount = 0
let flipDeclCount = 0
let typoDeclCount = 0

// A rule that sets `direction` (or `unicode-bidi`) has taken MANUAL control of
// its own directionality, and mirroring fights that pin rather than serving it.
// Zenda's sheet does this for its Arabic terms-and-conditions blocks
// (`.rich-text-block-13..16`, next to `.arabic-tnc-section`): they declare
// `direction: rtl` precisely because they hold Arabic on an otherwise-LTR site.
// rtlcss dutifully flipped those to `direction: ltr` under RTL — turning the one
// Arabic region on the page left-to-right, the exact opposite of the intent.
//
// The same principle already governs this block by hand: the academic marquee
// pins `direction: ltr` on its track because row order there is decorative.
// A pin is an instruction, not a layout artifact — so skip flipping such a rule
// entirely. Arabic typography still applies: an Arabic block wants the Arabic
// face regardless of which way it runs.
const PINS_DIRECTION = /(^|;)\s*(direction|unicode-bidi)\s*:/

// Return the declarations that must be restated under `[dir="rtl"]`, or "".
function rtlOverlay(body, where) {
  const changed = []

  // -- direction flips (rtlcss) --
  let flipped = body
  if (!PINS_DIRECTION.test(body)) {
    try {
      flipped = rtlcss.process(`a{${body}}`).replace(/^a\{|\}$/g, "")
    } catch {
      flipped = body // a value rtlcss cannot parse is left as-is rather than lost
    }
  }
  if (flipped !== body) {
    const before = declarations(body)
    const after = declarations(flipped)
    // Pass A is supposed to have removed every case where flipping RENAMES a
    // property. If one survives, the overlay would add the mirrored property
    // while the base one kept matching — the exact both-margins bug this design
    // exists to avoid. Fail loudly rather than ship a silent layout break.
    const beforeProps = propNames(body).join("|")
    const afterProps = propNames(flipped).join("|")
    if (beforeProps !== afterProps) {
      throw new Error(
        `RTL flip renamed a property in ${where}\n  ltr: ${beforeProps}\n  rtl: ${afterProps}\n` +
          `Add the physical property to LOGICAL_RENAMES (Pass A).`
      )
    }
    for (let i = 0; i < after.length; i++) {
      if (after[i] !== before[i]) {
        changed.push(after[i])
        flipDeclCount++
      }
    }
  }

  // -- Arabic typography --
  for (const d of declarations(body)) {
    const colon = d.indexOf(":")
    if (colon < 0) continue
    const prop = d.slice(0, colon).trim().toLowerCase()
    const value = d.slice(colon + 1).trim()
    // `font-family` directly, but ALSO any custom property whose value names a
    // Latin-only face. Zenda routes most of its typography through two tokens
    // (`--_typography---font-styles--body` / `--heading`, both "DM Sans"), and
    // the rules that consume them read `var(…)` — a literal-value test sees no
    // face there and skips them. That is exactly how the first pass shipped an
    // Arabic footer still set in DM Sans: `.zenda-clone` itself resolved to the
    // Arabic face, and `.body-v2` one level down put DM Sans straight back.
    // Overriding the token is also the smaller fix — two declarations instead
    // of one per consuming rule.
    const isFontToken = prop.startsWith("--") && LATIN_ONLY_FACES.test(value)
    if (
      (prop === "font-family" || isFontToken) &&
      LATIN_ONLY_FACES.test(value)
    ) {
      const bang = /!important/.test(value) ? " !important" : ""
      changed.push(`${prop}: ${ARABIC_STACK}${bang}`)
      typoDeclCount++
    }
    // Zenda's display ramp tracks tight (-0.04em and friends). Negative
    // tracking breaks Arabic letter joining, so RTL always sets it back to 0 —
    // the same call `.zenda-heading` makes in school-marketing.css.
    if (prop === "letter-spacing" && !/^(0|normal)/.test(value)) {
      changed.push("letter-spacing: 0")
      typoDeclCount++
    }
  }

  if (!changed.length) return ""
  overlayRuleCount++
  return changed.join("; ")
}

// ------------------------------------------------------- local overrides ----
// The generated sheet says "do not edit by hand" at the top, and it was edited
// by hand anyway: 4e09f86ec changed `.section_services` to `background-color:
// inherit` so the feature-page showcase decks could show a themed background
// through zenda's section. That edit is real and load-bearing (`.zenda-clone`
// shadows the app's whole token set, so a themed background has to be
// INHERITED from a wrapper outside the scope rather than declared inside it),
// and a regeneration would silently revert it — which is exactly what the
// first run of this pass did.
//
// So local divergences from upstream live here instead of in the sheet, where
// the next regeneration erases them, or in scripts/zenda-webflow-shared.css,
// which is a verbatim vendored copy of zenda's Webflow output and should stay
// diffable against it. Each entry asserts the upstream value it replaces, so if
// zenda ever changes that declaration the script fails instead of quietly
// dropping our intent on the floor.
const LOCAL_OVERRIDES = [
  {
    selector: ".section_services",
    prop: "background-color",
    from: "transparent",
    to: "inherit",
    since: "4e09f86ec",
  },
]
const overridesApplied = new Set()

function applyLocalOverrides(sel, body) {
  let outBody = body
  for (const o of LOCAL_OVERRIDES) {
    if (sel.trim() !== o.selector) continue
    const re = new RegExp(`(^|;)(\\s*${o.prop}\\s*:\\s*)${o.from}\\b`, "g")
    if (!re.test(outBody)) continue
    outBody = outBody.replace(re, `$1$2${o.to}`)
    overridesApplied.add(o.selector + "|" + o.prop)
  }
  return outBody
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
    // ordinary style rule. The logicalized body is what the RTL overlay is
    // diffed against, not the original — Pass B must only ever see what Pass A
    // could not already express as a direction-agnostic property.
    const body = applyLocalOverrides(p, logicalize(u.body))
    sink.push(`${prefixSelectorList(p)} {${body}}`)
    const overlay = rtlOverlay(body, p)
    // Emitted immediately after its own base rule, so it lands inside the same
    // @media/@supports block and outranks it by exactly one attribute selector.
    // Adding the same +1 to every rule preserves the sheet's internal ordering.
    if (overlay) sink.push(`${prefixSelectorListRtl(p)} {${overlay}}`)
  }
}

emitRules(tokenize(src), out)

// No `@import` for DM Sans here, though the clone needs it: Next concatenates
// this file after globals.css, and an `@import` that is not at the top of the
// resulting stylesheet is invalid and gets dropped -- which is exactly what
// happened, leaving the whole clone in system Helvetica. DM Sans and Poppins
// are loaded via next/font instead, in src/components/atom/fonts.ts.
const missedOverrides = LOCAL_OVERRIDES.filter(
  (o) => !overridesApplied.has(o.selector + "|" + o.prop)
)
if (missedOverrides.length) {
  throw new Error(
    `Local override(s) never matched — upstream must have changed the ` +
      `declaration they patch, so the intent behind them is now unrepresented:\n` +
      missedOverrides
        .map(
          (o) =>
            `  ${o.selector} { ${o.prop}: ${o.from} → ${o.to} }  (since ${o.since})`
        )
        .join("\n") +
      `\nRe-check the rule upstream, then update or drop the entry.`
  )
}

const css =
  `/* Generated from zenda app/globals.css — every selector prefixed with .zenda-clone.\n` +
  ` * Do not edit by hand; regenerate with scope-zenda.mjs. */\n\n` +
  keyframes.join("\n") +
  `\n\n` +
  out.join("\n") +
  `\n`

writeFileSync("/Users/abdout/hogwarts/src/styles/zenda-clone.css", css, "utf8")
console.log(
  `keyframes=${keyframes.length} rules=${out.length} bytes=${css.length}\n` +
    `  Pass A  logical renames : ${renameCount} (+${insetSplitCount} inset shorthands split)\n` +
    `  Pass B  rtl overlay rules: ${overlayRuleCount} ` +
    `(${flipDeclCount} flipped, ${typoDeclCount} arabic-typography)`
)
