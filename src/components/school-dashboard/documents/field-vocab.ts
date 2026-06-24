// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { DocumentTemplateCategory } from "@prisma/client"

/**
 * Canonical merge-field vocabulary per document category. Surfaced in the
 * upload UI and baked into the downloadable starter templates so schools know
 * exactly which `{{tags}}` (and `{#loops}`) their template can use.
 */
export interface FieldDef {
  /** The tag name used inside the .docx as `{{tag}}` (or `{#tag}…{/tag}` for loops). */
  tag: string
  labelEn: string
  labelAr: string
  /** True for a repeating loop section (e.g. questions, subjects). */
  loop?: boolean
}

const COMMON: FieldDef[] = [
  { tag: "schoolName", labelEn: "School name", labelAr: "اسم المدرسة" },
  {
    tag: "schoolNameEn",
    labelEn: "School name (English)",
    labelAr: "اسم المدرسة (إنجليزي)",
  },
  {
    tag: "schoolLogo",
    labelEn: "School logo URL",
    labelAr: "رابط شعار المدرسة",
  },
  { tag: "date", labelEn: "Date", labelAr: "التاريخ" },
]

export const FIELD_VOCAB: Record<DocumentTemplateCategory, FieldDef[]> = {
  CERTIFICATE: [
    { tag: "studentName", labelEn: "Student name", labelAr: "اسم الطالب" },
    {
      tag: "studentNameAr",
      labelEn: "Student name (Arabic)",
      labelAr: "اسم الطالب (عربي)",
    },
    {
      tag: "examTitle",
      labelEn: "Exam / award title",
      labelAr: "عنوان الاختبار/الجائزة",
    },
    { tag: "subject", labelEn: "Subject", labelAr: "المادة" },
    { tag: "score", labelEn: "Score", labelAr: "الدرجة" },
    { tag: "grade", labelEn: "Grade", labelAr: "التقدير" },
    { tag: "rank", labelEn: "Rank", labelAr: "الترتيب" },
    {
      tag: "certificateNumber",
      labelEn: "Certificate number",
      labelAr: "رقم الشهادة",
    },
    {
      tag: "verificationCode",
      labelEn: "Verification code",
      labelAr: "رمز التحقق",
    },
    {
      tag: "verificationUrl",
      labelEn: "Verification URL",
      labelAr: "رابط التحقق",
    },
    ...COMMON,
  ],
  EXAM_PAPER: [
    { tag: "examTitle", labelEn: "Exam title", labelAr: "عنوان الاختبار" },
    { tag: "subject", labelEn: "Subject", labelAr: "المادة" },
    { tag: "className", labelEn: "Class", labelAr: "الفصل" },
    {
      tag: "duration",
      labelEn: "Duration (minutes)",
      labelAr: "المدة (دقائق)",
    },
    { tag: "totalMarks", labelEn: "Total marks", labelAr: "الدرجة الكلية" },
    {
      tag: "questions",
      labelEn: "Questions (loop)",
      labelAr: "الأسئلة (تكرار)",
      loop: true,
    },
    { tag: "order", labelEn: "— question number", labelAr: "— رقم السؤال" },
    { tag: "text", labelEn: "— question text", labelAr: "— نص السؤال" },
    { tag: "marks", labelEn: "— question marks", labelAr: "— درجة السؤال" },
    {
      tag: "options",
      labelEn: "— options (loop)",
      labelAr: "— الخيارات (تكرار)",
      loop: true,
    },
    {
      tag: "label",
      labelEn: "—— option label (A/B/C)",
      labelAr: "—— رمز الخيار",
    },
    ...COMMON,
  ],
  REPORT_CARD: [
    { tag: "studentName", labelEn: "Student name", labelAr: "اسم الطالب" },
    { tag: "className", labelEn: "Class", labelAr: "الفصل" },
    { tag: "termName", labelEn: "Term", labelAr: "الفصل الدراسي" },
    { tag: "overallGrade", labelEn: "Overall grade", labelAr: "التقدير العام" },
    { tag: "gpa", labelEn: "GPA", labelAr: "المعدل" },
    { tag: "rank", labelEn: "Rank", labelAr: "الترتيب" },
    {
      tag: "subjects",
      labelEn: "Subjects (loop)",
      labelAr: "المواد (تكرار)",
      loop: true,
    },
    { tag: "name", labelEn: "— subject name", labelAr: "— اسم المادة" },
    { tag: "grade", labelEn: "— subject grade", labelAr: "— تقدير المادة" },
    {
      tag: "percentage",
      labelEn: "— subject percentage",
      labelAr: "— نسبة المادة",
    },
    ...COMMON,
  ],
  LETTER: [
    { tag: "studentName", labelEn: "Student name", labelAr: "اسم الطالب" },
    { tag: "className", labelEn: "Class", labelAr: "الفصل" },
    ...COMMON,
  ],
  RECEIPT: [
    { tag: "studentName", labelEn: "Student name", labelAr: "اسم الطالب" },
    { tag: "amount", labelEn: "Amount", labelAr: "المبلغ" },
    { tag: "receiptNumber", labelEn: "Receipt number", labelAr: "رقم الإيصال" },
    ...COMMON,
  ],
  ID_CARD: [
    { tag: "studentName", labelEn: "Student name", labelAr: "اسم الطالب" },
    { tag: "studentId", labelEn: "Student ID", labelAr: "رقم الطالب" },
    { tag: "className", labelEn: "Class", labelAr: "الفصل" },
    { tag: "photoUrl", labelEn: "Photo URL", labelAr: "رابط الصورة" },
    ...COMMON,
  ],
  CUSTOM: [...COMMON],
}
