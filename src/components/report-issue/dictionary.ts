// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Bilingual strings for the canonical Report Issue dialog.
 * Repos can override per-language by extending this map.
 */

export type ReportLang = "en" | "ar"

export const REPORT_CATEGORY_LABELS = {
  en: {
    visual: "Visual / Layout",
    broken: "Broken / Not Working",
    data: "Wrong Data",
    slow: "Slow / Performance",
    confusing: "Confusing / UX",
    auth: "Sign in / Permissions",
    i18n: "Translation / Language",
    other: "Other",
  },
  ar: {
    visual: "مظهر / تخطيط",
    broken: "معطل / لا يعمل",
    data: "بيانات خاطئة",
    slow: "بطيء / أداء",
    confusing: "مربك / تجربة المستخدم",
    auth: "تسجيل الدخول / الصلاحيات",
    i18n: "ترجمة / لغة",
    other: "أخرى",
  },
} as const

export const REPORT_DICTIONARY = {
  en: {
    triggerText: "Report an issue",
    triggerAriaLabel: "Report an issue",
    title: "Report an issue",
    categoryPlaceholder: "Category",
    descriptionPlaceholder:
      "Describe the issue in detail (minimum 30 characters)…",
    descriptionHint: "{count}/30+ chars",
    addDetails: "Add steps and expected behavior (optional)",
    reproPlaceholder: "Steps to reproduce: 1. … 2. … 3. …",
    expectedPlaceholder: "What did you expect to happen?",
    actualPlaceholder: "What actually happened?",
    severityLabel: "Severity",
    severityLow: "Low — cosmetic",
    severityMedium: "Medium — noticeable",
    severityHigh: "High — blocks me",
    severityCritical: "Critical — data loss / outage",
    captchaHint: "Reports from signed-in users are processed faster.",
    captchaLink: "Sign in",
    submit: "Submit",
    submitting: "Submitting…",
    success: "Submitted. Thank you!",
    successWithId: "Submitted. Tracked as #{id}.",
    error: "Something went wrong. Try again.",
    cooldown: "Please wait a moment before submitting another report.",
    severityCritical_hint:
      "Reports flagged critical are escalated immediately.",
  },
  ar: {
    triggerText: "الإبلاغ عن مشكلة",
    triggerAriaLabel: "الإبلاغ عن مشكلة",
    title: "الإبلاغ عن مشكلة",
    categoryPlaceholder: "التصنيف",
    descriptionPlaceholder: "صف المشكلة بالتفصيل (30 حرفاً على الأقل)…",
    descriptionHint: "{count}/30+ حرف",
    addDetails: "أضف الخطوات والسلوك المتوقع (اختياري)",
    reproPlaceholder: "خطوات إعادة الإنتاج: 1. … 2. … 3. …",
    expectedPlaceholder: "ما الذي توقعت حدوثه؟",
    actualPlaceholder: "ما الذي حدث فعلياً؟",
    severityLabel: "الخطورة",
    severityLow: "منخفضة — مظهر فقط",
    severityMedium: "متوسطة — ملحوظة",
    severityHigh: "عالية — تعيقني",
    severityCritical: "حرجة — فقدان بيانات / تعطل",
    captchaHint: "البلاغات من المستخدمين المسجلين تُعالج أسرع.",
    captchaLink: "تسجيل الدخول",
    submit: "إرسال",
    submitting: "جاري الإرسال…",
    success: "تم الإرسال. شكراً لك!",
    successWithId: "تم الإرسال. رقم البلاغ #{id}.",
    error: "حدث خطأ. حاول مرة أخرى.",
    cooldown: "يرجى الانتظار لحظة قبل إرسال بلاغ آخر.",
    severityCritical_hint: "البلاغات الحرجة تُصعّد فوراً.",
  },
} as const

export type ReportDict = (typeof REPORT_DICTIONARY)[ReportLang]
