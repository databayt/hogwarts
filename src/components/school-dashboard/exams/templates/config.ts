// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Exam Paper Templates - Configuration & Theme Presets
 * Theme presets, page dimensions, fonts, spacing, labels
 */

import type { SchoolBranding } from "@prisma/client"

import type { PaperTheme } from "./types"

// ============================================================================
// THEME PRESETS
// ============================================================================

const BASE_FONT_SIZE = {
  title: 24,
  subtitle: 18,
  heading: 14,
  body: 11,
  small: 9,
  tiny: 8,
} as const

const BASE_SPACING = {
  questionGap: 20,
  sectionGap: 30,
  optionGap: 4,
  pageMargin: 50,
} as const

export const THEME_CLASSIC: PaperTheme = {
  primaryColor: "#1F2937",
  secondaryColor: "#6B7280",
  accentColor: "#374151",
  backgroundColor: "#F8F9FA",
  mutedColor: "#E5E7EB",
  surfaceColor: "#FFFFFF",
  fontFamily: "Rubik",
  fontSize: BASE_FONT_SIZE,
  ...BASE_SPACING,
  locale: "ar",
  isRTL: true,
  numberStyle: "plain",
  borderStyle: "solid",
}

export const THEME_MODERN: PaperTheme = {
  primaryColor: "#1E40AF",
  secondaryColor: "#6B7280",
  accentColor: "#3B82F6",
  backgroundColor: "#F9FAFB",
  mutedColor: "#E5E7EB",
  surfaceColor: "#F9FAFB",
  fontFamily: "Inter",
  fontSize: BASE_FONT_SIZE,
  ...BASE_SPACING,
  locale: "en",
  isRTL: false,
  numberStyle: "circle",
  borderStyle: "dashed",
}

export const THEME_FORMAL: PaperTheme = {
  primaryColor: "#1F2937",
  secondaryColor: "#4B5563",
  accentColor: "#1F2937",
  backgroundColor: "#F5F5F5",
  mutedColor: "#D1D5DB",
  surfaceColor: "#FFFFFF",
  fontFamily: "Rubik",
  fontSize: BASE_FONT_SIZE,
  ...BASE_SPACING,
  locale: "ar",
  isRTL: true,
  numberStyle: "plain",
  borderStyle: "double",
}

/** Resolve theme preset from ExamPaperTemplate enum */
export function getThemePreset(
  template: "CLASSIC" | "MODERN" | "FORMAL" | "CUSTOM"
): PaperTheme {
  switch (template) {
    case "CLASSIC":
      return THEME_CLASSIC
    case "MODERN":
      return THEME_MODERN
    case "FORMAL":
      return THEME_FORMAL
    case "CUSTOM":
      return THEME_CLASSIC // fallback, override with school branding
  }
}

/** Merge school branding into a base theme */
export function createSchoolTheme(
  base: PaperTheme,
  branding?: SchoolBranding | null
): PaperTheme {
  if (!branding) return base
  return {
    ...base,
    primaryColor: branding.primaryColor || base.primaryColor,
    secondaryColor: branding.secondaryColor || base.secondaryColor,
    accentColor: branding.primaryColor || base.accentColor,
  }
}

/** Apply locale override to any theme */
export function withLocale(theme: PaperTheme, locale: "en" | "ar"): PaperTheme {
  const isRTL = locale === "ar"
  return {
    ...theme,
    locale,
    isRTL,
    fontFamily: isRTL ? "Rubik" : "Inter",
  }
}

// ============================================================================
// PAGE DIMENSIONS
// ============================================================================

export const PAGE_DIMENSIONS = {
  A4: { width: 595.28, height: 841.89 },
  Letter: { width: 612, height: 792 },
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
    weights: { regular: 400, medium: 500, bold: 700 },
  },
  english: {
    family: "Inter",
    weights: { regular: 400, medium: 500, bold: 700 },
  },
} as const

// ============================================================================
// QUESTION RENDERING DEFAULTS
// ============================================================================

export const MCQ_OPTION_LABELS = ["A", "B", "C", "D", "E", "F"] as const

export const BUBBLE_CONFIG = {
  size: 14,
  borderWidth: 2,
  borderRadius: 7,
} as const

export const CHECKBOX_CONFIG = {
  size: 14,
  borderWidth: 1.5,
} as const

export const ANSWER_LINE_CONFIG = {
  height: 20,
  borderWidth: 0.5,
} as const

export const BLANK_SLOT_CONFIG = {
  width: 80,
  borderWidth: 1,
} as const

// ============================================================================
// VERSION CODES
// ============================================================================

export const VERSION_CODES = ["A", "B", "C", "D", "E"] as const

// ============================================================================
// BILINGUAL LABELS
// ============================================================================

export const QUESTION_TYPE_LABELS = {
  MULTIPLE_CHOICE: { en: "Multiple Choice", ar: "اختيار متعدد" },
  TRUE_FALSE: { en: "True/False", ar: "صح/خطأ" },
  SHORT_ANSWER: { en: "Short Answer", ar: "إجابة قصيرة" },
  ESSAY: { en: "Essay", ar: "مقالي" },
  FILL_BLANK: { en: "Fill in the Blank", ar: "أكمل الفراغ" },
  MATCHING: { en: "Matching", ar: "مطابقة" },
  ORDERING: { en: "Ordering", ar: "ترتيب" },
} as const

export const SECTION_LABELS = {
  en: ["A", "B", "C", "D", "E", "F", "G"],
  ar: ["أ", "ب", "ج", "د", "هـ", "و", "ز"],
} as const

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

export const TF_LABELS = {
  true: { en: "True", ar: "صح" },
  false: { en: "False", ar: "خطأ" },
} as const

export const POINTS_LABEL = { en: "pts", ar: "درجة" } as const
