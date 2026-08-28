// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * docx-fill — pure, reusable primitives for the document fill-engine.
 *
 * A school uploads a `.docx` template with `{{placeholder}}` tags (and
 * `{#loop}…{/loop}` sections for repeating content like exam questions or report
 * card subjects). These helpers detect the tags and merge real data into the
 * document, returning a finished `.docx` buffer.
 *
 * Uses `{{ }}` delimiters to match the existing certificate template convention
 * (`{{studentName}}`) and to stay compatible with Word mail-merge habits.
 */
import Docxtemplater from "docxtemplater"
// eslint-disable-next-line @typescript-eslint/no-var-requires
import InspectModule from "docxtemplater/js/inspect-module.js"
import PizZip from "pizzip"

const DELIMITERS = { start: "{{", end: "}}" } as const

/** One thing wrong with a template, in terms a school can act on. */
export interface DocxTemplateIssue {
  /** docxtemplater's stable id, e.g. `unclosed_loop`. Not user-facing. */
  id: string
  /** The tag it is about — `""` when the error names no single tag. */
  tag: string
  /** docxtemplater's sentence, e.g. `The loop with tag "questions" is unclosed`. */
  explanation: string
}

/** What an uploaded `.docx` will actually do when the engine fills it. */
export interface DocxTemplateReport {
  /**
   * False when the template cannot compile — it will never fill, and every
   * generate attempt against it fails.
   */
  compiles: boolean
  /** Why it does not compile. Empty when `compiles`. */
  structuralErrors: DocxTemplateIssue[]
  /** Merge tags found. Empty when the template does not compile. */
  tags: string[]
  /**
   * Verbatim `{#x}` / `{/x}` / `{x}` markers. These compile fine and are
   * therefore invisible to `structuralErrors`, but under `{{ }}` delimiters
   * they are ordinary text: they print into the finished document and their
   * body is dropped.
   */
  singleBraceMarkers: string[]
}

/**
 * Normalize whatever docxtemplater threw into issues.
 *
 * It raises a `multi_error` whose `properties.errors[]` holds the real
 * diagnoses; the wrapper's own `message` is the literal string `"Multi error"`,
 * which is what a caller doing `error.message` shows a teacher. `xtag` is
 * absent on some ids (a mismatched closing tag names two tags, not one), so it
 * is never assumed.
 */
export function docxTemplateIssues(error: unknown): DocxTemplateIssue[] {
  const asIssue = (e: unknown): DocxTemplateIssue | null => {
    if (!e || typeof e !== "object") return null
    const props = (e as { properties?: Record<string, unknown> }).properties
    const message = (e as { message?: unknown }).message
    const id = typeof props?.id === "string" ? props.id : ""
    if (!id) return null
    return {
      id,
      tag: typeof props?.xtag === "string" ? props.xtag : "",
      explanation:
        typeof props?.explanation === "string"
          ? props.explanation
          : typeof message === "string"
            ? message
            : "",
    }
  }

  const props = (error as { properties?: { errors?: unknown } } | null)
    ?.properties
  if (Array.isArray(props?.errors)) {
    return props.errors.map(asIssue).filter((i): i is DocxTemplateIssue => !!i)
  }
  const single = asIssue(error)
  return single ? [single] : []
}

/** The document parts a merge tag can legally live in. */
const TEXT_PARTS = /^word\/(document|header\d*|footer\d*)\.xml$/

/**
 * Flatten a WordprocessingML part to plain text.
 *
 * Dropping the markup is the point: Word splits a hand-typed tag across several
 * `<w:r>` runs (a spell-check squiggle is enough), so `{#questions}` only
 * becomes visible as one string once the runs are joined. Paragraph and break
 * boundaries survive as newlines so a marker cannot be stitched together out of
 * two unrelated lines.
 */
function xmlToText(xml: string): string {
  return (
    xml
      .replace(/<\/w:p>/g, "\n")
      .replace(/<w:br\s*\/?>/g, "\n")
      .replace(/<[^>]*>/g, "")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      // Last: an escaped `&amp;lt;` must not become `<`.
      .replace(/&amp;/g, "&")
  )
}

const DOUBLE_BRACE = /\{\{[^{}]*\}\}/g
const SINGLE_BRACE = /\{([#/^]?)([A-Za-z_][\w.]*)\}/g

/**
 * Find `{single-brace}` markers, ignoring anything inside a real `{{tag}}`.
 *
 * A bare `{word}` is only reported when it carries a section sigil (`#`, `/`,
 * `^` — shapes that exist for no other reason) or names a tag this category
 * actually has. Prose like `{see note}` is left alone; the cost of a false
 * positive is a warning a school can ignore, so recall is worth more here.
 */
function findSingleBraceMarkers(
  text: string,
  knownTags: Set<string>
): string[] {
  const stripped = text.replace(DOUBLE_BRACE, " ")
  const found = new Set<string>()
  for (const [whole, sigil, tag] of stripped.matchAll(SINGLE_BRACE)) {
    if (sigil || knownTags.has(tag)) found.add(whole)
  }
  return Array.from(found)
}

/**
 * Report what an uploaded `.docx` will do before it is stored.
 *
 * The three ways a school's template fails are all silent without this: it does
 * not compile (stored active, then every fill dies), it uses single-brace
 * markers (compiles, prints the markers, drops the questions), or it misspells
 * a tag (compiles, fills blank). Only the first is an error; the other two are
 * reported so the upload UI can say which.
 *
 * `knownTags` is the category's vocabulary, passed in so this module stays free
 * of any dependency on the document-category definitions.
 */
export function validateDocxTemplate(
  templateBuffer: Buffer,
  knownTags: Iterable<string> = []
): DocxTemplateReport {
  const zip = new PizZip(templateBuffer)

  const text = Object.keys(zip.files)
    .filter((path) => TEXT_PARTS.test(path))
    .map((path) => xmlToText(zip.file(path)?.asText() ?? ""))
    .join("\n")
  const singleBraceMarkers = findSingleBraceMarkers(text, new Set(knownTags))

  try {
    return {
      compiles: true,
      structuralErrors: [],
      tags: detectMergeFields(templateBuffer),
      singleBraceMarkers,
    }
  } catch (error) {
    const structuralErrors = docxTemplateIssues(error)
    return {
      compiles: false,
      // A throw with no recognizable diagnosis still means "cannot fill".
      structuralErrors: structuralErrors.length
        ? structuralErrors
        : [{ id: "unknown", tag: "", explanation: "" }],
      tags: [],
      singleBraceMarkers,
    }
  }
}

/**
 * Fill a `.docx` template buffer with `data` and return the rendered `.docx`
 * buffer. Missing scalar tags render as empty strings (never throws on a
 * placeholder the data doesn't supply); missing loop arrays render as nothing.
 */
export function fillDocxTemplate(
  templateBuffer: Buffer,
  data: Record<string, unknown>
): Buffer {
  const zip = new PizZip(templateBuffer)
  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
    delimiters: DELIMITERS,
    nullGetter: () => "",
  })
  doc.render(data)
  return doc.getZip().generate({ type: "nodebuffer" }) as Buffer
}

/**
 * List the merge tags (placeholders + loop markers) present in a `.docx`
 * template, so the UI can show schools which fields their template uses.
 */
export function detectMergeFields(templateBuffer: Buffer): string[] {
  const zip = new PizZip(templateBuffer)
  const iModule = new InspectModule()
  // Constructing with the inspect module compiles the template and records its
  // tags; no render (and therefore no data) is required.
  new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
    delimiters: DELIMITERS,
    modules: [iModule],
  })
  const tags = iModule.getAllTags() as Record<string, unknown>
  return flattenTagNames(tags)
}

function flattenTagNames(
  tags: Record<string, unknown>,
  out: Set<string> = new Set()
): string[] {
  for (const [key, value] of Object.entries(tags)) {
    out.add(key)
    if (value && typeof value === "object") {
      flattenTagNames(value as Record<string, unknown>, out)
    }
  }
  return Array.from(out)
}

/**
 * Download a template `.docx` from its public CDN url into a Buffer.
 * Templates are the school's own branded files (no student PII) and are stored
 * with public access, so a plain fetch is sufficient.
 */
export async function loadTemplateBufferFromUrl(
  fileUrl: string
): Promise<Buffer> {
  const res = await fetch(fileUrl)
  if (!res.ok) {
    throw new Error(`Failed to fetch template (${res.status})`)
  }
  return Buffer.from(await res.arrayBuffer())
}
