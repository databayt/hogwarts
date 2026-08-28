// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * The starter templates are only worth shipping if they survive a round-trip
 * through the very engine that will fill them, so every assertion here runs the
 * real `detectMergeFields` / `fillDocxTemplate` rather than inspecting XML.
 */
import PizZip from "pizzip"
import { describe, expect, it } from "vitest"

import { detectMergeFields, fillDocxTemplate } from "@/lib/docx-fill"
import { buildDocx } from "@/lib/docx-fill/build"
import { FIELD_VOCAB } from "@/components/school-dashboard/documents/field-vocab"
import {
  buildStarterTemplate,
  STARTER_CATEGORIES,
  type StarterLang,
} from "@/components/school-dashboard/documents/starter-template"

const LANGS: StarterLang[] = ["ar", "en"]

/** Every literal string Word would show a reader, in document order. */
function renderedText(docx: Buffer): string {
  const xml = new PizZip(docx).file("word/document.xml")!.asText()
  return [...xml.matchAll(/<w:t[^>]*>([^<]*)<\/w:t>/g)]
    .map((m) => decodeEntities(m[1]))
    .join(" ")
}

/** Word renders the escaped form; assertions read what a person would see. */
function decodeEntities(s: string): string {
  return s
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&")
}

const examData = {
  schoolName: "مدرسة الأمل",
  examTitle: "Geography — Final",
  subject: "Geography",
  className: "Grade 7",
  date: "1 June 2026",
  duration: 90,
  totalMarks: 50,
  instructions: "Answer all questions.",
  sections: [
    {
      number: 1,
      title: "Multiple choice",
      count: 2,
      marks: 4,
      questions: [
        {
          order: 1,
          text: "Capital of Sudan?",
          marks: 2,
          hasOptions: true,
          options: [
            { label: "A", text: "Khartoum" },
            { label: "B", text: "Cairo" },
          ],
          answerLines: [],
        },
        {
          order: 2,
          text: "Longest river?",
          marks: 2,
          hasOptions: true,
          options: [{ label: "A", text: "Nile" }],
          answerLines: [],
        },
      ],
    },
    {
      number: 2,
      title: "Essay",
      count: 1,
      marks: 10,
      questions: [
        {
          order: 3,
          text: "Describe the Nile basin.",
          marks: 10,
          hasOptions: false,
          options: [],
          answerLines: [{ n: 1 }, { n: 2 }],
        },
      ],
    },
  ],
}

describe("buildDocx", () => {
  it("produces an OPC package the fill engine can open", () => {
    const buf = buildDocx([{ text: "Hello {{name}}" }])
    const zip = new PizZip(buf)
    expect(zip.file("[Content_Types].xml")).toBeTruthy()
    expect(zip.file("_rels/.rels")).toBeTruthy()
    expect(zip.file("word/document.xml")).toBeTruthy()
    expect(detectMergeFields(buf)).toEqual(["name"])
  })

  it("keeps literal spacing between adjacent tags", () => {
    const buf = buildDocx([{ text: "{{a}}. {{b}}" }])
    expect(renderedText(fillDocxTemplate(buf, { a: "1", b: "two" }))).toContain(
      "1. two"
    )
  })

  it("escapes XML-significant characters in body text", () => {
    const buf = buildDocx([{ text: 'Tom & Jerry <b> "q"' }])
    expect(renderedText(buf)).toContain('Tom & Jerry <b> "q"')
  })
})

describe.each(STARTER_CATEGORIES)("starter template — %s", (category) => {
  it.each(LANGS)("builds a fillable .docx (%s)", (lang) => {
    const buf = buildStarterTemplate(category, lang)
    expect(buf).toBeInstanceOf(Buffer)
    expect(buf!.length).toBeGreaterThan(0)
    // Compiles under the real engine — a malformed loop throws here.
    expect(() => detectMergeFields(buf!)).not.toThrow()
  })

  it("uses only tags the category vocabulary documents", () => {
    const known = new Set(FIELD_VOCAB[category].map((f) => f.tag))
    for (const tag of detectMergeFields(
      buildStarterTemplate(category, "en")!
    )) {
      expect(known, `undocumented tag "${tag}"`).toContain(tag)
    }
  })
})

describe("starter template — EXAM_PAPER", () => {
  it("exposes the sectioned-paper loops", () => {
    const tags = detectMergeFields(buildStarterTemplate("EXAM_PAPER", "en")!)
    for (const tag of [
      "schoolName",
      "examTitle",
      "totalMarks",
      "instructions",
      "sections",
      "questions",
      "options",
      "answerLines",
      "hasOptions",
      "order",
      "marks",
      "label",
    ]) {
      expect(tags).toContain(tag)
    }
  })

  it("renders sections, questions and options from resolver-shaped data", () => {
    const out = fillDocxTemplate(
      buildStarterTemplate("EXAM_PAPER", "en")!,
      examData
    )
    const text = renderedText(out)

    expect(text).toContain("Geography — Final")
    expect(text).toContain("1. Multiple choice")
    expect(text).toContain("1. Capital of Sudan?")
    expect(text).toContain("A) Khartoum")
    expect(text).toContain("2. Essay")
    // Continuous numbering across sections, not a per-section restart.
    expect(text).toContain("3. Describe the Nile basin.")
  })

  it("leaves no unfilled tag markup in the finished paper", () => {
    const text = renderedText(
      fillDocxTemplate(buildStarterTemplate("EXAM_PAPER", "en")!, examData)
    )
    expect(text).not.toContain("{{")
    expect(text).not.toContain("{#")
    expect(text).not.toContain("{/")
  })

  it("draws answer lines only where the question type asks for them", () => {
    const text = renderedText(
      fillDocxTemplate(buildStarterTemplate("EXAM_PAPER", "en")!, examData)
    )
    // Two lines for the one essay question, none for the MCQs.
    const rules = text.match(/\.{20,}/g) ?? []
    // One student-name rule in the header + two essay answer lines.
    expect(rules).toHaveLength(3)
  })

  it("omits the choices block for a question with no options", () => {
    const text = renderedText(
      fillDocxTemplate(buildStarterTemplate("EXAM_PAPER", "en")!, examData)
    )
    // The essay question must not emit a stray "A)" label.
    expect(text.match(/\bA\)/g) ?? []).toHaveLength(2)
  })

  it("marks the Arabic starter right-to-left", () => {
    const xml = new PizZip(buildStarterTemplate("EXAM_PAPER", "ar")!)
      .file("word/document.xml")!
      .asText()
    expect(xml).toContain("<w:bidi/>")
    expect(xml).toContain("<w:rtl/>")

    const ltr = new PizZip(buildStarterTemplate("EXAM_PAPER", "en")!)
      .file("word/document.xml")!
      .asText()
    expect(ltr).not.toContain("<w:bidi/>")
  })
})

describe("single-brace loop syntax", () => {
  /**
   * Regression guard for the bug the starter exists to prevent: under the
   * engine's `{{ }}` delimiters a `{#tag}` loop is not a loop. It prints
   * literally, its body is dropped — and the field detector still reports the
   * inner tags, so the upload UI's coverage badges look correct.
   *
   * `detectMergeFields` still cannot see it, and that is not a bug in it — it
   * reports merge tags, and these are text. The upload path catches it
   * separately now via `validateDocxTemplate().singleBraceMarkers`; see
   * `docx-validate.test.ts`.
   */
  it("is not a loop, and detection does not reveal that", () => {
    const wrong = buildDocx([
      { text: "{#questions}" },
      { text: "{{order}}. {{text}}" },
      { text: "{/questions}" },
    ])
    expect(detectMergeFields(wrong)).not.toContain("questions")
    expect(detectMergeFields(wrong)).toContain("order")

    const text = renderedText(
      fillDocxTemplate(wrong, { questions: [{ order: 1, text: "Q" }] })
    )
    expect(text).toContain("{#questions}")
    expect(text).not.toContain("Q")
  })
})
