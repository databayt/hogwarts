// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/** i18n labels for exam generate wizard steps */
const labels = {
  template: {
    title: { en: "Select Template", ar: "اختر القالب" },
    description: {
      en: "Choose an exam template to generate from.",
      ar: "اختر قالب اختبار للإنشاء منه.",
    },
  },
  exam: {
    title: { en: "Exam Details", ar: "تفاصيل الاختبار" },
    description: {
      en: "Configure the exam title, class, date, and marks.",
      ar: "اضبط عنوان الاختبار والصف والتاريخ والدرجات.",
    },
  },
  questions: {
    title: { en: "Select Questions", ar: "اختر الأسئلة" },
    description: {
      en: "Choose questions from the question bank to include in the exam.",
      ar: "اختر أسئلة من بنك الأسئلة لتضمينها في الاختبار.",
    },
  },
  "paper-config": {
    title: { en: "Paper Configuration", ar: "إعدادات الورقة" },
    description: {
      en: "Configure the exam paper template, layout, and print settings.",
      ar: "اضبط قالب ورقة الاختبار والتخطيط وإعدادات الطباعة.",
    },
  },
  preview: {
    title: { en: "Preview & Generate", ar: "المعاينة والإنشاء" },
    description: {
      en: "Review the exam configuration before generating.",
      ar: "راجع إعدادات الاختبار قبل الإنشاء.",
    },
  },
} as const

export type StepKey = keyof typeof labels

export function getStepLabel(
  step: StepKey,
  field: "title" | "description",
  locale: string
): string {
  const entry = labels[step]
  if (!entry) return ""
  const lang = locale === "ar" ? "ar" : "en"
  return entry[field][lang]
}

/** Preview section labels */
export const previewLabels = {
  template: { en: "Template", ar: "القالب" },
  noTemplate: { en: "No template selected", ar: "لم يتم اختيار قالب" },
  examDetails: { en: "Exam Details", ar: "تفاصيل الاختبار" },
  title: { en: "Title", ar: "العنوان" },
  untitled: { en: "Untitled", ar: "بدون عنوان" },
  date: { en: "Date", ar: "التاريخ" },
  notSet: { en: "Not set", ar: "غير محدد" },
  duration: { en: "Duration", ar: "المدة" },
  marks: { en: "Marks", ar: "الدرجات" },
  total: { en: "total", ar: "كلي" },
  passing: { en: "passing", ar: "نجاح" },
  questions: { en: "Questions", ar: "الأسئلة" },
  questionsSelected: {
    en: "questions selected",
    ar: "أسئلة مختارة",
  },
  totalLabel: { en: "Total", ar: "المجموع" },
  paperConfig: { en: "Paper Configuration", ar: "إعدادات الورقة" },
  pageSize: { en: "Page Size", ar: "حجم الصفحة" },
  versions: { en: "Versions", ar: "النسخ" },
  shuffleQuestions: { en: "Shuffle Questions", ar: "خلط الأسئلة" },
  shuffleOptions: { en: "Shuffle Options", ar: "خلط الخيارات" },
  schoolLogo: { en: "School Logo", ar: "شعار المدرسة" },
  instructions: { en: "Instructions", ar: "التعليمات" },
  pointsPerQuestion: {
    en: "Points Per Question",
    ar: "الدرجات لكل سؤال",
  },
  min: { en: "min", ar: "د" },
} as const

export function t(key: keyof typeof previewLabels, locale: string): string {
  const lang = locale === "ar" ? "ar" : "en"
  return previewLabels[key][lang]
}

export default labels
