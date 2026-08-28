// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Upload-time screening for a school's own `.docx`.
 *
 * All three failures these cover are silent without the validator: the file
 * does not compile (stored active, then every fill dies with the literal words
 * "Multi error"), it uses single-brace markers (compiles, prints the markers,
 * drops the questions), or it misspells a tag (compiles, fills blank). Each was
 * reproduced against the real engine before this suite existed.
 */
import PizZip from "pizzip"
import { describe, expect, it } from "vitest"

import {
  docxTemplateIssues,
  fillDocxTemplate,
  validateDocxTemplate,
} from "@/lib/docx-fill"
import { buildDocx } from "@/lib/docx-fill/build"
import { FIELD_VOCAB } from "@/components/school-dashboard/documents/field-vocab"
import {
  buildStarterTemplate,
  STARTER_CATEGORIES,
  type StarterLang,
} from "@/components/school-dashboard/documents/starter-template"

const EXAM_TAGS = FIELD_VOCAB.EXAM_PAPER.map((f) => f.tag)
const LANGS: StarterLang[] = ["ar", "en"]

/** A well-formed sectioned paper — the shape a starter produces. */
const GOOD = [
  { text: "{{schoolName}}" },
  { text: "{{#sections}}" },
  { text: "{{number}}. {{title}}" },
  { text: "{{#questions}}" },
  { text: "{{order}}. {{text}}" },
  { text: "{{/questions}}" },
  { text: "{{/sections}}" },
]

describe("validateDocxTemplate — structural errors", () => {
  it("refuses a loop that is opened and never closed", () => {
    const report = validateDocxTemplate(
      buildDocx([{ text: "{{#questions}}" }, { text: "{{order}}" }]),
      EXAM_TAGS
    )

    expect(report.compiles).toBe(false)
    expect(report.structuralErrors).toHaveLength(1)
    expect(report.structuralErrors[0].id).toBe("unclosed_loop")
    // The tag is the actionable half — it is what the dialog shows the school.
    expect(report.structuralErrors[0].tag).toBe("questions")
    // A template that cannot compile has no trustworthy tag list.
    expect(report.tags).toEqual([])
  })

  it("refuses a loop that is closed and never opened", () => {
    const report = validateDocxTemplate(
      buildDocx([{ text: "{{/questions}}" }]),
      EXAM_TAGS
    )

    expect(report.compiles).toBe(false)
    expect(report.structuralErrors[0].id).toBe("unopened_loop")
    expect(report.structuralErrors[0].tag).toBe("questions")
  })

  it("reports every structural error, not just the first", () => {
    const report = validateDocxTemplate(
      buildDocx([
        { text: "{{#a}}" },
        { text: "{{/b}}" },
        { text: "{{#questions}}" },
      ]),
      EXAM_TAGS
    )

    expect(report.compiles).toBe(false)
    expect(report.structuralErrors.length).toBeGreaterThan(1)
    expect(report.structuralErrors.map((e) => e.id)).toContain("unclosed_loop")
  })

  it("survives an error that names no single tag", () => {
    // `closing_tag_does_not_match_opening_tag` carries no `xtag` — the tag must
    // come back as "" rather than crashing the extraction or printing
    // "undefined" at a school.
    const report = validateDocxTemplate(
      buildDocx([{ text: "{{#a}}" }, { text: "{{/b}}" }]),
      EXAM_TAGS
    )

    expect(report.compiles).toBe(false)
    for (const issue of report.structuralErrors) {
      expect(typeof issue.tag).toBe("string")
    }
  })

  it("passes a well-formed template and lists its tags", () => {
    const report = validateDocxTemplate(buildDocx(GOOD), EXAM_TAGS)

    expect(report.compiles).toBe(true)
    expect(report.structuralErrors).toEqual([])
    expect(report.singleBraceMarkers).toEqual([])
    expect(report.tags).toEqual(
      expect.arrayContaining(["schoolName", "sections", "questions", "order"])
    )
  })
})

describe("validateDocxTemplate — single-brace markers", () => {
  /**
   * The hazard the starter templates were introduced to prevent, now actually
   * detected. `detectMergeFields` reports the INNER tags of a `{#loop}` and
   * says nothing about the marker, so before this the upload UI looked healthy
   * while the finished paper carried no questions at all.
   */
  it("flags a single-brace loop the tag detector cannot see", () => {
    const wrong = buildDocx([
      { text: "{#questions}" },
      { text: "{{order}}. {{text}}" },
      { text: "{/questions}" },
    ])
    const report = validateDocxTemplate(wrong, EXAM_TAGS)

    // It compiles — which is exactly why nothing else catches it.
    expect(report.compiles).toBe(true)
    expect(report.singleBraceMarkers).toEqual(
      expect.arrayContaining(["{#questions}", "{/questions}"])
    )

    // And this is what the school would otherwise have printed.
    const xml = new PizZip(
      fillDocxTemplate(wrong, { questions: [{ order: 1, text: "Q" }] })
    )
      .file("word/document.xml")!
      .asText()
    expect(xml).toContain("{#questions}")
    expect(xml).not.toContain("Q")
  })

  it("does not mistake a correct double-brace section for one", () => {
    const report = validateDocxTemplate(buildDocx(GOOD), EXAM_TAGS)
    expect(report.singleBraceMarkers).toEqual([])
  })

  it("finds a marker Word split across runs", () => {
    // Word breaks a hand-typed tag into several <w:r> runs on its own (a
    // spell-check squiggle is enough), so a scan of the raw XML misses it. This
    // is the shape a real school's file arrives in.
    const split = splitRunsDocx(["{", "#quest", "ions}"])
    const report = validateDocxTemplate(split, EXAM_TAGS)

    expect(report.singleBraceMarkers).toContain("{#questions}")
  })

  it("leaves ordinary braced prose alone", () => {
    const report = validateDocxTemplate(
      buildDocx([{ text: "Write your answer in the box {see overleaf}" }]),
      EXAM_TAGS
    )
    expect(report.singleBraceMarkers).toEqual([])
  })

  it("flags a bare single-brace tag that names a real field", () => {
    // `{examTitle}` has no sigil, so it is only suspicious because the category
    // actually has that field — a school that typed one brace too few.
    const report = validateDocxTemplate(
      buildDocx([{ text: "{examTitle}" }]),
      EXAM_TAGS
    )
    expect(report.singleBraceMarkers).toEqual(["{examTitle}"])
  })
})

describe("validateDocxTemplate — unknown tags", () => {
  it("reports a misspelled tag as a tag, leaving the caller to judge it", () => {
    // `{{schoolNmae}}` compiles and fills blank. The validator's job is to
    // surface it; `createDocumentTemplate` diffs against the vocabulary.
    const report = validateDocxTemplate(
      buildDocx([{ text: "{{schoolNmae}}" }]),
      EXAM_TAGS
    )

    expect(report.compiles).toBe(true)
    expect(report.tags).toContain("schoolNmae")
    expect(EXAM_TAGS).not.toContain("schoolNmae")
  })
})

describe("the starter templates pass their own gate", () => {
  /**
   * The starter is the documented way INTO the engine, so a validator that
   * rejected it would close the only door a school can reliably walk through.
   */
  it.each(STARTER_CATEGORIES.flatMap((c) => LANGS.map((l) => [c, l] as const)))(
    "%s / %s compiles with no warnings and no unknown tags",
    (category, lang) => {
      const known = FIELD_VOCAB[category].map((f) => f.tag)
      const report = validateDocxTemplate(
        buildStarterTemplate(category, lang)!,
        known
      )

      expect(report.compiles).toBe(true)
      expect(report.structuralErrors).toEqual([])
      expect(report.singleBraceMarkers).toEqual([])
      expect(report.tags.filter((t) => !known.includes(t))).toEqual([])
    }
  )
})

describe("docxTemplateIssues", () => {
  it("unwraps the multi_error docxtemplater actually throws", () => {
    // The wrapper's own `.message` is the literal string "Multi error", which
    // is what every catch block in the fill engine used to return to a teacher.
    let thrown: unknown
    try {
      validateDocxTemplate(buildDocx([{ text: "{{#questions}}" }]))
      // Compile happens inside validate; re-throw path covered below.
    } catch (error) {
      thrown = error
    }
    expect(thrown).toBeUndefined() // validate swallows it by design

    // Feed the raw shape directly.
    const issues = docxTemplateIssues({
      message: "Multi error",
      properties: {
        id: "multi_error",
        errors: [
          {
            message: "Unclosed loop",
            properties: {
              id: "unclosed_loop",
              xtag: "questions",
              explanation: 'The loop with tag "questions" is unclosed',
            },
          },
        ],
      },
    })

    expect(issues).toEqual([
      {
        id: "unclosed_loop",
        tag: "questions",
        explanation: 'The loop with tag "questions" is unclosed',
      },
    ])
  })

  it("returns nothing for an error that is not a template error", () => {
    // A network failure must fall through to the caller's generic code rather
    // than being mislabelled as a broken template.
    expect(docxTemplateIssues(new Error("fetch failed"))).toEqual([])
    expect(docxTemplateIssues(null)).toEqual([])
    expect(docxTemplateIssues("boom")).toEqual([])
  })
})

/** A `.docx` whose single paragraph is split into one run per fragment. */
function splitRunsDocx(fragments: string[]): Buffer {
  const header = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
  const runs = fragments
    .map((f) => `<w:r><w:t xml:space="preserve">${f}</w:t></w:r>`)
    .join("")
  const zip = new PizZip()
  zip.file(
    "[Content_Types].xml",
    `${header}<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>`
  )
  zip.file(
    "_rels/.rels",
    `${header}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>`
  )
  zip.file(
    "word/_rels/document.xml.rels",
    `${header}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"/>`
  )
  zip.file(
    "word/document.xml",
    `${header}<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p>${runs}</w:p></w:body></w:document>`
  )
  return zip.generate({ type: "nodebuffer" }) as Buffer
}
