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
    description:
      "Tell us what went wrong on this page. The page address and your browser details are attached automatically.",
    categoryPlaceholder: "Category",
    descriptionPlaceholder: "What went wrong on this page?",
    descriptionHint: "{count}/{min} characters",
    minHint: "A few more words — at least {min} characters.",
    readyHint: "Press ⌘↵ / Ctrl+↵ to send.",
    readyHintMobile: "Ready — tap send.",
    composerPlaceholder: "What went wrong?",
    send: "Send report",
    close: "Close",
    emptyState:
      "Describe what you saw. Short is fine — where it happened is attached.",
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
    sentTitle: "Report sent",
    sentBody: "Thank you — we'll look into it.",
    sentBodyWithId: "Thank you — tracked as #{id}.",
    error: "Something went wrong. Try again.",
    cooldown: "Please wait a moment before submitting another report.",
    severityCritical_hint:
      "Reports flagged critical are escalated immediately.",
  },
  ar: {
    triggerText: "الإبلاغ عن مشكلة",
    triggerAriaLabel: "الإبلاغ عن مشكلة",
    title: "الإبلاغ عن مشكلة",
    description:
      "أخبرنا بما حدث في هذه الصفحة. يُرفق عنوان الصفحة وبيانات المتصفح تلقائياً.",
    categoryPlaceholder: "التصنيف",
    descriptionPlaceholder: "ما الذي حدث في هذه الصفحة؟",
    descriptionHint: "{count}/{min} حرف",
    minHint: "بضع كلمات إضافية — {min} حرفاً على الأقل.",
    readyHint: "اضغط ⌘↵ / Ctrl+↵ للإرسال.",
    readyHintMobile: "جاهز — اضغط إرسال.",
    composerPlaceholder: "ما الذي حدث؟",
    send: "إرسال البلاغ",
    close: "إغلاق",
    emptyState: "صف ما رأيته. الاختصار مقبول — مكان حدوثه مُرفق تلقائياً.",
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
    sentTitle: "تم إرسال البلاغ",
    sentBody: "شكرًا لك، سنراجعه.",
    sentBodyWithId: "شكرًا لك، رقم البلاغ #{id}.",
    error: "حدث خطأ. حاول مرة أخرى.",
    cooldown: "يرجى الانتظار لحظة قبل إرسال بلاغ آخر.",
    severityCritical_hint: "البلاغات الحرجة تُصعّد فوراً.",
  },
} as const

export type ReportDictKey = keyof (typeof REPORT_DICTIONARY)["en"]

/**
 * Widened to plain strings so a repo with a central dictionary (mkan) can pass
 * `strings={dict.reportIssue}` as a partial override without matching the
 * literal types of the defaults.
 */
export type ReportDict = Record<ReportDictKey, string>
