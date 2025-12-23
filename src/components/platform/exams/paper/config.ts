/**
 * Exam Paper System - Configuration Constants
 * Default values, templates, and shared configuration
 */

import type {
  AnswerSheetType,
  ExamPaperTemplate,
  PaperLayout,
} from "@prisma/client"

import type { PaperConfigFormData } from "./types"

// ============================================================================
// DEFAULT CONFIGURATION
// ============================================================================

export const DEFAULT_PAPER_CONFIG: PaperConfigFormData = {
  // Template & Layout
  template: "CLASSIC",
  layout: "SINGLE_COLUMN",
  answerSheetType: "SEPARATE",

  // Header
  showSchoolLogo: true,
  showExamTitle: true,
  showInstructions: true,
  customInstructions: undefined,
  showStudentInfo: true,

  // Questions
  showQuestionNumbers: true,
  showPointsPerQuestion: true,
  showQuestionType: false,
  shuffleQuestions: false,
  shuffleOptions: false,

  // Answer Space
  answerLinesShort: 3,
  answerLinesEssay: 12,

  // Footer & Print
  showPageNumbers: true,
  showTotalPages: true,
  customFooter: undefined,
  pageSize: "A4",
  orientation: "portrait",

  // Versioning
  versionCount: 1,
}

// ============================================================================
// PAGE DIMENSIONS
// ============================================================================

export const PAGE_DIMENSIONS = {
  A4: {
    width: 595.28, // 210mm in points
    height: 841.89, // 297mm in points
    widthMm: 210,
    heightMm: 297,
  },
  Letter: {
    width: 612, // 8.5in in points
    height: 792, // 11in in points
    widthMm: 215.9,
    heightMm: 279.4,
  },
} as const

export const PAGE_MARGINS = {
  top: 50,
  bottom: 50,
  left: 50,
  right: 50,
} as const

// ============================================================================
// FONT CONFIGURATION
// ============================================================================

export const FONTS = {
  arabic: {
    family: "Rubik",
    weights: {
      regular: 400,
      medium: 500,
      bold: 700,
    },
  },
  english: {
    family: "Inter",
    weights: {
      regular: 400,
      medium: 500,
      bold: 700,
    },
  },
} as const

export const FONT_SIZES = {
  title: 24,
  subtitle: 18,
  heading: 14,
  body: 11,
  small: 9,
  tiny: 8,
} as const

// ============================================================================
// QUESTION RENDERING DEFAULTS
// ============================================================================

export const QUESTION_SPACING = {
  betweenQuestions: 20,
  afterQuestionText: 8,
  afterOptions: 6,
  optionGap: 4,
} as const

export const MCQ_CONFIG = {
  optionLabels: ["A", "B", "C", "D", "E", "F"],
  bubbleRadius: 6,
  bubbleSpacing: 4,
} as const

export const ANSWER_LINE_CONFIG = {
  lineHeight: 20,
  lineColor: "#E5E5E5",
  lineWidth: 0.5,
} as const

// ============================================================================
// VERSION CODES
// ============================================================================

export const VERSION_CODES = ["A", "B", "C", "D", "E"] as const

export function getVersionCode(index: number): string {
  return VERSION_CODES[index] || `V${index + 1}`
}

// ============================================================================
// TEMPLATE STYLES
// ============================================================================

export const TEMPLATE_STYLES: Record<
  ExamPaperTemplate,
  {
    headerBg: string
    borderColor: string
    accentColor: string
    fontFamily: "serif" | "sans-serif"
  }
> = {
  CLASSIC: {
    headerBg: "#F8F9FA",
    borderColor: "#000000",
    accentColor: "#1A1A1A",
    fontFamily: "serif",
  },
  MODERN: {
    headerBg: "#FFFFFF",
    borderColor: "#E5E5E5",
    accentColor: "#3B82F6",
    fontFamily: "sans-serif",
  },
  FORMAL: {
    headerBg: "#F5F5F5",
    borderColor: "#2C2C2C",
    accentColor: "#1F2937",
    fontFamily: "serif",
  },
  CUSTOM: {
    headerBg: "#FFFFFF",
    borderColor: "#000000",
    accentColor: "#000000",
    fontFamily: "sans-serif",
  },
}

// ============================================================================
// LAYOUT CONFIGURATIONS
// ============================================================================

export const LAYOUT_CONFIG: Record<
  PaperLayout,
  {
    columns: number
    columnGap: number
    questionWidth: string
  }
> = {
  SINGLE_COLUMN: {
    columns: 1,
    columnGap: 0,
    questionWidth: "100%",
  },
  TWO_COLUMN: {
    columns: 2,
    columnGap: 20,
    questionWidth: "48%",
  },
  BOOKLET: {
    columns: 1,
    columnGap: 0,
    questionWidth: "100%",
  },
}

// ============================================================================
// ANSWER SHEET CONFIGURATIONS
// ============================================================================

export const ANSWER_SHEET_CONFIG: Record<
  AnswerSheetType,
  {
    separatePage: boolean
    bubbleStyle: boolean
    includeInstructions: boolean
  }
> = {
  NONE: {
    separatePage: false,
    bubbleStyle: false,
    includeInstructions: false,
  },
  SEPARATE: {
    separatePage: true,
    bubbleStyle: false,
    includeInstructions: true,
  },
  BUBBLE: {
    separatePage: true,
    bubbleStyle: true,
    includeInstructions: true,
  },
}

// ============================================================================
// INSTRUCTIONS TEMPLATES
// ============================================================================

export const DEFAULT_INSTRUCTIONS = {
  en: [
    "Answer all questions in the spaces provided.",
    "Write clearly using black or blue ink.",
    "Do not write in the margins.",
    "Show all working for calculation questions.",
    "Check your answers before submitting.",
  ],
  ar: [
    "أجب على جميع الأسئلة في المساحات المخصصة.",
    "اكتب بوضوح باستخدام الحبر الأسود أو الأزرق.",
    "لا تكتب في الهوامش.",
    "أظهر جميع خطوات الحل للأسئلة الحسابية.",
    "راجع إجاباتك قبل التسليم.",
  ],
} as const

export const MCQ_INSTRUCTIONS = {
  en: [
    "Choose the best answer for each question.",
    "Fill in the bubble completely using a dark pencil.",
    "Erase completely if you change your answer.",
    "Only one answer per question.",
  ],
  ar: [
    "اختر أفضل إجابة لكل سؤال.",
    "املأ الفقاعة بالكامل باستخدام قلم رصاص داكن.",
    "امسح بالكامل إذا غيرت إجابتك.",
    "إجابة واحدة فقط لكل سؤال.",
  ],
} as const

// ============================================================================
// QUESTION TYPE DISPLAY
// ============================================================================

export const QUESTION_TYPE_LABELS = {
  MULTIPLE_CHOICE: { en: "Multiple Choice", ar: "اختيار متعدد" },
  TRUE_FALSE: { en: "True/False", ar: "صح/خطأ" },
  SHORT_ANSWER: { en: "Short Answer", ar: "إجابة قصيرة" },
  ESSAY: { en: "Essay", ar: "مقالي" },
  FILL_BLANK: { en: "Fill in the Blank", ar: "أكمل الفراغ" },
} as const

export const DIFFICULTY_LABELS = {
  EASY: { en: "Easy", ar: "سهل" },
  MEDIUM: { en: "Medium", ar: "متوسط" },
  HARD: { en: "Hard", ar: "صعب" },
} as const

// ============================================================================
// PAPER FOOTER TEMPLATES
// ============================================================================

export const FOOTER_TEMPLATES = {
  simple: {
    en: "Page {page} of {total}",
    ar: "صفحة {page} من {total}",
  },
  withVersion: {
    en: "Page {page} of {total} | Version {version}",
    ar: "صفحة {page} من {total} | النسخة {version}",
  },
  withExam: {
    en: "{exam} | Page {page} of {total}",
    ar: "{exam} | صفحة {page} من {total}",
  },
} as const

// ============================================================================
// STORAGE PATHS
// ============================================================================

export const STORAGE_PATHS = {
  papers: "exams/papers",
  answerKeys: "exams/answer-keys",
  certificates: "exams/certificates",
} as const

// ============================================================================
// FILE NAMING
// ============================================================================

export function generatePaperFilename(
  examTitle: string,
  versionCode?: string,
  locale: "en" | "ar" = "en"
): string {
  const sanitized = examTitle
    .replace(/[^a-zA-Z0-9\u0600-\u06FF\s-]/g, "")
    .replace(/\s+/g, "-")
    .toLowerCase()
  const timestamp = new Date().toISOString().split("T")[0]
  const version = versionCode ? `-v${versionCode}` : ""
  return `${sanitized}${version}-${timestamp}.pdf`
}

export function generateAnswerKeyFilename(
  examTitle: string,
  locale: "en" | "ar" = "en"
): string {
  const sanitized = examTitle
    .replace(/[^a-zA-Z0-9\u0600-\u06FF\s-]/g, "")
    .replace(/\s+/g, "-")
    .toLowerCase()
  const timestamp = new Date().toISOString().split("T")[0]
  const suffix = locale === "ar" ? "مفتاح-الإجابة" : "answer-key"
  return `${sanitized}-${suffix}-${timestamp}.pdf`
}
