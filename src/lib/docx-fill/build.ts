// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * A minimal WordprocessingML writer — enough to emit a valid `.docx` from a
 * list of paragraphs, with no new dependency (PizZip is already here for the
 * fill side).
 *
 * It exists so the app can hand a school a **starter template**: a real Word
 * file whose `{{tags}}` and `{#loops}` are already correct. An uploaded `.docx`
 * with no tags fills as a silent no-op (`nullGetter` returns ""), so "here is a
 * file that already works, edit the styling" is the only reliable way in.
 *
 * Deliberately narrow: paragraphs of a single run each. That keeps every tag
 * inside one `<w:t>`, which is exactly the condition docxtemplater needs — a
 * tag split across runs (what Word's spell-checker does to hand-typed tags) is
 * the classic reason a template silently stops matching.
 */
import PizZip from "pizzip"

export interface DocxParagraph {
  /** Paragraph text. May contain `{{tags}}` / `{#loops}` verbatim. */
  text: string
  bold?: boolean
  /** Font size in points (default 11). */
  size?: number
  /** Logical alignment — resolved against `rtl` into a physical `w:jc`. */
  align?: "start" | "center" | "end"
  /** Right-to-left paragraph + run direction (Arabic). */
  rtl?: boolean
  /** Space after the paragraph, in points. */
  spaceAfter?: number
  /** Draw a bottom border — used as a section rule. */
  rule?: boolean
}

const XML_HEADER = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'

const CONTENT_TYPES = `${XML_HEADER}
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>`

const ROOT_RELS = `${XML_HEADER}
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>`

const DOC_RELS = `${XML_HEADER}
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"/>`

// A4 portrait with ~2cm margins, in twips (1/20 pt). Without a sectPr Word
// still opens the file but applies its own default page, which makes a starter
// look wrong the moment a school prints it.
const SECT_PR =
  '<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1134" w:header="709" w:footer="709" w:gutter="0"/></w:sectPr>'

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
}

/** Logical alignment → the physical `w:jc` value for this text direction. */
function justification(align: DocxParagraph["align"], rtl: boolean): string {
  if (align === "center") return "center"
  if (align === "end") return rtl ? "left" : "right"
  return rtl ? "right" : "left"
}

function paragraphXml(p: DocxParagraph): string {
  const rtl = p.rtl ?? false
  const halfPoints = Math.round((p.size ?? 11) * 2)

  const pPr = [
    rtl ? "<w:bidi/>" : "",
    `<w:jc w:val="${justification(p.align, rtl)}"/>`,
    p.spaceAfter
      ? `<w:spacing w:after="${Math.round(p.spaceAfter * 20)}"/>`
      : "",
    p.rule
      ? '<w:pBdr><w:bottom w:val="single" w:sz="6" w:space="4" w:color="999999"/></w:pBdr>'
      : "",
    // Run properties repeated at paragraph level so an empty paragraph still
    // carries the size — otherwise blank spacer lines collapse to Word's default.
    `<w:rPr>${rtl ? "<w:rtl/>" : ""}${p.bold ? "<w:b/><w:bCs/>" : ""}<w:sz w:val="${halfPoints}"/><w:szCs w:val="${halfPoints}"/></w:rPr>`,
  ].join("")

  if (!p.text) return `<w:p><w:pPr>${pPr}</w:pPr></w:p>`

  const rPr = `<w:rPr>${rtl ? "<w:rtl/>" : ""}${p.bold ? "<w:b/><w:bCs/>" : ""}<w:sz w:val="${halfPoints}"/><w:szCs w:val="${halfPoints}"/></w:rPr>`
  // xml:space="preserve" matters: template lines like `{{order}}. {{text}}`
  // depend on the literal spacing between tags surviving the round-trip.
  const run = `<w:r>${rPr}<w:t xml:space="preserve">${escapeXml(p.text)}</w:t></w:r>`
  return `<w:p><w:pPr>${pPr}</w:pPr>${run}</w:p>`
}

/**
 * Build a `.docx` buffer from `paragraphs`. The result is a complete OPC
 * package — openable in Word/Pages/LibreOffice and readable by the fill engine
 * in this same directory.
 */
export function buildDocx(paragraphs: DocxParagraph[]): Buffer {
  const body = paragraphs.map(paragraphXml).join("")
  const document = `${XML_HEADER}
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${body}${SECT_PR}</w:body></w:document>`

  const zip = new PizZip()
  zip.file("[Content_Types].xml", CONTENT_TYPES)
  zip.file("_rels/.rels", ROOT_RELS)
  zip.file("word/_rels/document.xml.rels", DOC_RELS)
  zip.file("word/document.xml", document)

  return zip.generate({ type: "nodebuffer", compression: "DEFLATE" }) as Buffer
}
