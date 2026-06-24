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
