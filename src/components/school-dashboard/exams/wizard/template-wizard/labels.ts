// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/** i18n labels for template wizard steps */
const labels = {
  gallery: {
    title: { en: "Choose a Template", ar: "اختر قالبًا" },
    description: {
      en: "Start from a regional preset or begin from scratch.",
      ar: "ابدأ من قالب إقليمي أو من الصفر.",
    },
  },
  name: {
    title: { en: "Template Name", ar: "اسم القالب" },
    description: {
      en: "Give your exam template a name and description.",
      ar: "أعطِ قالب الاختبار اسمًا ووصفًا.",
    },
  },
  subject: {
    title: { en: "Subject", ar: "المادة" },
    description: {
      en: "Select the subject for this template.",
      ar: "اختر المادة لهذا القالب.",
    },
  },
  targeting: {
    title: { en: "Targeting", ar: "الاستهداف" },
    description: {
      en: "Select which grades, sections, and classrooms this template targets.",
      ar: "حدد الصفوف والأقسام والفصول المستهدفة.",
    },
  },
  "question-types": {
    title: { en: "Question Types", ar: "أنواع الأسئلة" },
    description: {
      en: "Select question types and count for each.",
      ar: "اختر أنواع الأسئلة وعددها.",
    },
  },
  "duration-marks": {
    title: { en: "Duration & Marks", ar: "المدة والدرجات" },
    description: {
      en: "Set the exam duration and total marks.",
      ar: "حدد مدة الاختبار والدرجات الكلية.",
    },
  },
  header: {
    title: { en: "Header", ar: "الترويسة" },
    description: {
      en: "Choose a header design for your exam paper.",
      ar: "اختر تصميم ترويسة لورقة الاختبار.",
    },
  },
  "student-info": {
    title: { en: "Student Info", ar: "بيانات الطالب" },
    description: {
      en: "Choose how student information appears on the paper.",
      ar: "اختر طريقة عرض بيانات الطالب على الورقة.",
    },
  },
  instructions: {
    title: { en: "Instructions", ar: "التعليمات" },
    description: {
      en: "Choose how instructions appear on the paper.",
      ar: "اختر طريقة عرض التعليمات على الورقة.",
    },
  },
  "footer-layout": {
    title: { en: "Footer", ar: "التذييل" },
    description: {
      en: "Choose a footer design for your exam paper.",
      ar: "اختر تصميم تذييل لورقة الاختبار.",
    },
  },
  "answer-sheet": {
    title: { en: "Answer Sheet", ar: "ورقة الإجابة" },
    description: {
      en: "Choose an answer sheet layout.",
      ar: "اختر تخطيط ورقة الإجابة.",
    },
  },
  cover: {
    title: { en: "Cover Page", ar: "صفحة الغلاف" },
    description: {
      en: "Choose a cover page design.",
      ar: "اختر تصميم صفحة الغلاف.",
    },
  },
  difficulty: {
    title: { en: "Difficulty", ar: "مستوى الصعوبة" },
    description: {
      en: "Set the difficulty distribution for this question type.",
      ar: "حدد توزيع الصعوبة لهذا النوع من الأسئلة.",
    },
  },
  scoring: {
    title: { en: "Scoring & Grades", ar: "التقييم والدرجات" },
    description: {
      en: "Set the passing score and grade boundaries.",
      ar: "حدد درجة النجاح وحدود التقديرات.",
    },
  },
  print: {
    title: { en: "Print Settings", ar: "إعدادات الطباعة" },
    description: {
      en: "Configure page size, orientation, and decorations.",
      ar: "اضبط حجم الصفحة والاتجاه والزخارف.",
    },
  },
  preview: {
    title: { en: "Review & Preview", ar: "المراجعة والمعاينة" },
    description: {
      en: "Review your template settings before saving.",
      ar: "راجع إعدادات القالب قبل الحفظ.",
    },
  },
} as const

/** Question type labels for display */
export const QUESTION_TYPE_LABELS: Record<string, { en: string; ar: string }> =
  {
    MULTIPLE_CHOICE: { en: "Multiple Choice", ar: "اختيار من متعدد" },
    TRUE_FALSE: { en: "True / False", ar: "صح / خطأ" },
    SHORT_ANSWER: { en: "Short Answer", ar: "إجابة قصيرة" },
    ESSAY: { en: "Essay", ar: "مقالي" },
    FILL_BLANK: { en: "Fill in the Blank", ar: "أكمل الفراغ" },
    MATCHING: { en: "Matching", ar: "مطابقة" },
    ORDERING: { en: "Ordering", ar: "ترتيب" },
  }

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
  basicInfo: { en: "Basic Info", ar: "المعلومات الأساسية" },
  name: { en: "Name", ar: "الاسم" },
  duration: { en: "Duration", ar: "المدة" },
  marks: { en: "Marks", ar: "الدرجات" },
  questions: { en: "Questions", ar: "الأسئلة" },
  paperLayout: { en: "Paper Layout", ar: "تخطيط الورقة" },
  header: { en: "Header", ar: "الترويسة" },
  footer: { en: "Footer", ar: "التذييل" },
  studentInfo: { en: "Student Info", ar: "بيانات الطالب" },
  instructions: { en: "Instructions", ar: "التعليمات" },
  scoring: { en: "Scoring", ar: "التقييم" },
  passing: { en: "Passing", ar: "النجاح" },
  grades: { en: "Grades", ar: "التقديرات" },
  printSettings: { en: "Print Settings", ar: "إعدادات الطباعة" },
  size: { en: "Size", ar: "الحجم" },
  orientation: { en: "Orientation", ar: "الاتجاه" },
  layout: { en: "Layout", ar: "التخطيط" },
  questionDistribution: {
    en: "Question Distribution",
    ar: "توزيع الأسئلة",
  },
  saveTemplate: { en: "Save Template", ar: "حفظ القالب" },
  preview: { en: "Preview", ar: "معاينة" },
  min: { en: "min", ar: "د" },
} as const

export function t(key: keyof typeof previewLabels, locale: string): string {
  const lang = locale === "ar" ? "ar" : "en"
  return previewLabels[key][lang]
}

export default labels
