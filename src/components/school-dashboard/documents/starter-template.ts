// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Starter `.docx` templates — a real Word file per category whose tags are
 * already correct, so a school edits styling instead of guessing syntax.
 *
 * This is the entry problem for the whole fill engine: an uploaded `.docx` with
 * no tags fills as a silent no-op (`nullGetter` returns ""), and a *wrongly*
 * tagged one is worse — a single-brace `{#questions}` is not a loop under the
 * engine's `{{ }}` delimiters, so it prints literally into the paper while its
 * body is dropped, and the merge-field detector still reports the inner tags so
 * the upload UI looks healthy.
 *
 * Tags come from `FIELD_VOCAB` via `t()`/`loop()` so the starter and the
 * documented vocabulary cannot drift apart.
 */
import type { DocumentTemplateCategory } from "@prisma/client"

import { buildDocx, type DocxParagraph } from "@/lib/docx-fill/build"

import { STARTER_CATEGORIES } from "./config"
import { FIELD_VOCAB } from "./field-vocab"

export { STARTER_CATEGORIES }

export type StarterLang = "ar" | "en"

/**
 * `{{tag}}`, checked against the category vocabulary. A typo here would ship a
 * starter that quietly fills as blank, so an unknown tag is a build-time throw
 * rather than a silent empty cell.
 */
function tagger(category: DocumentTemplateCategory) {
  const known = new Set(FIELD_VOCAB[category].map((f) => f.tag))
  const check = (tag: string) => {
    if (!known.has(tag)) {
      throw new Error(`Starter uses unknown ${category} tag: ${tag}`)
    }
    return tag
  }
  return {
    /** A value placeholder. */
    t: (tag: string) => `{{${check(tag)}}}`,
    /** Opens a repeating/conditional section. */
    open: (tag: string) => `{{#${check(tag)}}}`,
    /** Closes it. */
    close: (tag: string) => `{{/${check(tag)}}}`,
  }
}

const RULE_LINE = "..........................................................."

function examPaper(lang: StarterLang): DocxParagraph[] {
  const { t, open, close } = tagger("EXAM_PAPER")
  const rtl = lang === "ar"
  const L =
    lang === "ar"
      ? {
          studentName: "اسم الطالب",
          minutes: "دقيقة",
          marks: "درجة",
          questions: "سؤال",
          sectionMarks: "درجة",
        }
      : {
          studentName: "Student name",
          minutes: "min",
          marks: "marks",
          questions: "questions",
          sectionMarks: "marks",
        }

  const p = (
    text: string,
    extra: Partial<DocxParagraph> = {}
  ): DocxParagraph => ({ text, rtl, ...extra })

  return [
    p(t("schoolName"), { bold: true, size: 16, align: "center" }),
    p(t("examTitle"), { bold: true, size: 14, align: "center" }),
    p(`${t("subject")} · ${t("className")}`, { align: "center" }),
    p(
      `${t("date")} · ${t("duration")} ${L.minutes} · ${t("totalMarks")} ${L.marks}`,
      { align: "center", size: 10, spaceAfter: 6 }
    ),
    p(`${L.studentName}: ${RULE_LINE}`, { rule: true, spaceAfter: 10 }),
    p(t("instructions"), { size: 10, spaceAfter: 10 }),

    // Sectioned body: questions grouped by type, numbered continuously.
    p(open("sections")),
    p(
      `${t("number")}. ${t("title")}  (${t("count")} ${L.questions} · ${t("marks")} ${L.sectionMarks})`,
      { bold: true, size: 12, spaceAfter: 6 }
    ),
    p(open("questions")),
    p(`${t("order")}. ${t("text")}   [${t("marks")}]`, { spaceAfter: 4 }),
    // Choices, only for questions that actually carry them.
    p(open("hasOptions")),
    p(open("options")),
    p(`     ${t("label")}) ${t("text")}`),
    p(close("options")),
    p(close("hasOptions")),
    // Blank ruled writing space, sized by question type.
    p(open("answerLines")),
    p(RULE_LINE, { size: 10 }),
    p(close("answerLines")),
    p("", { spaceAfter: 6 }),
    p(close("questions")),
    p(close("sections")),
  ]
}

function certificate(lang: StarterLang): DocxParagraph[] {
  const { t } = tagger("CERTIFICATE")
  const rtl = lang === "ar"
  const L =
    lang === "ar"
      ? {
          heading: "شهادة تقدير",
          awarded: "تُمنح هذه الشهادة إلى",
          forSubject: "في مادة",
          score: "الدرجة",
          grade: "التقدير",
          rank: "الترتيب",
          number: "رقم الشهادة",
          verify: "للتحقق",
        }
      : {
          heading: "Certificate of achievement",
          awarded: "This certificate is awarded to",
          forSubject: "in",
          score: "Score",
          grade: "Grade",
          rank: "Rank",
          number: "Certificate no.",
          verify: "Verify at",
        }

  const p = (
    text: string,
    extra: Partial<DocxParagraph> = {}
  ): DocxParagraph => ({ text, rtl, align: "center", ...extra })

  return [
    p(t("schoolName"), { bold: true, size: 14, spaceAfter: 18 }),
    p(L.heading, { bold: true, size: 22, spaceAfter: 14 }),
    p(L.awarded, { size: 11, spaceAfter: 6 }),
    p(t("studentName"), { bold: true, size: 18, spaceAfter: 10 }),
    p(`${t("examTitle")} — ${L.forSubject} ${t("subject")}`, {
      size: 12,
      spaceAfter: 14,
    }),
    p(
      `${L.score}: ${t("score")}   ·   ${L.grade}: ${t("grade")}   ·   ${L.rank}: ${t("rank")}`,
      { size: 11, spaceAfter: 18 }
    ),
    p(t("date"), { size: 11, spaceAfter: 14 }),
    p(`${L.number}: ${t("certificateNumber")}`, { size: 9 }),
    p(`${L.verify}: ${t("verificationUrl")} (${t("verificationCode")})`, {
      size: 9,
    }),
  ]
}

function reportCard(lang: StarterLang): DocxParagraph[] {
  const { t, open, close } = tagger("REPORT_CARD")
  const rtl = lang === "ar"
  const L =
    lang === "ar"
      ? {
          heading: "بطاقة النتائج",
          student: "الطالب",
          klass: "الفصل",
          term: "الفصل الدراسي",
          overall: "التقدير العام",
          gpa: "المعدل",
          rank: "الترتيب",
        }
      : {
          heading: "Report card",
          student: "Student",
          klass: "Class",
          term: "Term",
          overall: "Overall",
          gpa: "GPA",
          rank: "Rank",
        }

  const p = (
    text: string,
    extra: Partial<DocxParagraph> = {}
  ): DocxParagraph => ({ text, rtl, ...extra })

  return [
    p(t("schoolName"), { bold: true, size: 16, align: "center" }),
    p(L.heading, { bold: true, size: 13, align: "center", spaceAfter: 10 }),
    p(`${L.student}: ${t("studentName")}`),
    p(`${L.klass}: ${t("className")}   ·   ${L.term}: ${t("termName")}`, {
      rule: true,
      spaceAfter: 10,
    }),
    p(open("subjects")),
    p(`${t("name")}   —   ${t("percentage")}%   —   ${t("grade")}`),
    p(close("subjects")),
    p("", { spaceAfter: 10 }),
    p(
      `${L.overall}: ${t("overallGrade")}   ·   ${L.gpa}: ${t("gpa")}   ·   ${L.rank}: ${t("rank")}`,
      { bold: true, rule: true }
    ),
    p(t("date"), { size: 10, align: "end" }),
  ]
}

const LAYOUTS: Partial<
  Record<DocumentTemplateCategory, (lang: StarterLang) => DocxParagraph[]>
> = {
  EXAM_PAPER: examPaper,
  CERTIFICATE: certificate,
  REPORT_CARD: reportCard,
}

/**
 * Build the starter `.docx` for a category, or `null` when that category has no
 * resolver yet (nothing would fill it, so offering a starter would mislead).
 */
export function buildStarterTemplate(
  category: DocumentTemplateCategory,
  lang: StarterLang
): Buffer | null {
  const layout = LAYOUTS[category]
  if (!layout) return null
  return buildDocx(layout(lang))
}
