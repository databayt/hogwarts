// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

// Arabic display strings for the static features catalog.
//
// English is canonical in `constants.tsx` (single source of truth for ids,
// icons, grouping, and the English copy). This map supplies the Arabic
// overrides only — the app ships exactly two locales (see
// `internationalization/config`), so a locale-keyed override table beats
// duplicating every English string into the shared dictionary JSON (which
// would guarantee drift). All look-ups fall back to the English constant
// when an Arabic key is missing, so the grid never renders blank.

import type { Locale } from "@/components/internationalization/config"

import type { Feature } from "./types"

/** id → Arabic { title, description } for every feature shown on the grid. */
const FEATURE_AR: Record<string, { title: string; description: string }> = {
  student: {
    title: "الطلاب",
    description:
      "سجلات طلابية مركزية للوصول السريع واتخاذ قرارات مبنية على البيانات.",
  },
  admission: {
    title: "القبول",
    description: "تسجيل سريع وشفّاف لالتحاق سهل ومبسّط.",
  },
  application: {
    title: "الطلبات",
    description: "اجمع وعالج جميع طلبات القبول من منصّة واحدة.",
  },
  attendance: {
    title: "الحضور",
    description: "تخلّص من أخطاء الإدخال اليدوي وتتبّع الحضور في كل مقرر.",
  },
  exam: {
    title: "الاختبارات",
    description:
      "جدولة وإدارة الاختبارات وفق أنظمة CCE وCPA والتقييم المعياري.",
  },
  gradebook: {
    title: "سجل الدرجات",
    description: "تتبّع جميع درجات الطلاب وتقدّمهم الأكاديمي من مكان واحد.",
  },
  timetable: {
    title: "الجدول الدراسي",
    description: "جدولة الحصص عبر جميع المقررات والدفعات مع الإشعارات.",
  },
  classroom: {
    title: "الفصول",
    description: "إدارة تجهيزات الفصل والمقاعد والجدولة اليومية والموارد.",
  },
  assignment: {
    title: "الواجبات",
    description: "أسنِد وتابع المهام للطلاب أفرادًا أو مجموعات أو دفعات كاملة.",
  },
  "e-learning": {
    title: "التعلّم الإلكتروني",
    description: "بوابة تعلّم موحّدة للطلاب والمعلمين بأدوات تعلّم متكاملة.",
  },
  qbank: {
    title: "بنك الأسئلة",
    description: "أنشئ وصنّف وأدِر مستودعًا مركزيًا للأسئلة للتقييمات.",
  },
  library: {
    title: "المكتبة",
    description: "أدِر جميع الكتب والمقالات والوسائط من مركز واحد.",
  },
  "live-classroom": {
    title: "المؤتمرات",
    description: "فصول افتراضية مع تتبّع الحضور المباشر وواجبات مُراقَبة.",
  },
  "google-meet": {
    title: "Google Meet",
    description:
      "احضر فصولًا افتراضية بمشاركة الشاشة والسبّورات والمجموعات الفرعية.",
  },
  zoom: {
    title: "Zoom",
    description:
      "أدوات السبّورة والتعليق تساعد المعلمين على تقديم الدروس الرقمية.",
  },
  "microsoft-teams": {
    title: "Microsoft Teams",
    description: "الدردشة والاتصال والتعاون من منصّة موحّدة للتعلّم اليومي.",
  },
  payment: {
    title: "المدفوعات",
    description: "معالجة مدفوعات متكاملة لجميع الرسوم والأقساط والالتحاق.",
  },
  accounting: {
    title: "المحاسبة",
    description:
      "إدارة الفوترة والإيصالات والمدفوعات وكل الأرصدة في نظام واحد.",
  },
  invoice: {
    title: "الفواتير",
    description: "أنشئ وأرسل وتابع الفواتير والإيصالات لكل رسم ومبلغ.",
  },
  payroll: {
    title: "الرواتب",
    description: "توليد قسائم الرواتب لكل الموظفين مرتبطة بالحضور.",
  },
  expense: {
    title: "المصروفات",
    description: "قلّل الأخطاء وحسّن الميزانيات عبر تقارير مصروفات أفضل.",
  },
  sales: {
    title: "المبيعات",
    description: "بسّط سير عمل المبيعات وقلّل الأخطاء اليدوية وارفع الإنتاجية.",
  },
  announcement: {
    title: "الإعلانات",
    description:
      "بثّ الأخبار والتعاميم والتنبيهات الفورية لمجتمع المدرسة بأكمله.",
  },
  discussion: {
    title: "الرسائل",
    description: "افتح قنوات نقاش لتنسيق ومناقشة أي موضوع مدرسي.",
  },
  "online-appointment": {
    title: "المواعيد",
    description: "يحجز الطلاب ويديرون مواعيد المعلمين بجداول مباشرة.",
  },
  "whatsapp-integration": {
    title: "واتساب",
    description: "مراسلة فورية مع أولياء الأمور والطلاب للإعلانات المهمة.",
  },
  "parent-login": {
    title: "دخول ولي الأمر",
    description:
      "بوابة لأولياء الأمور لمتابعة كل الأنشطة والإنجازات الأكاديمية.",
  },
  transcript: {
    title: "كشف الدرجات",
    description: "كشوف درجات وشهادات قابلة للتحقّق برمز QR.",
  },
  "automated-marketing": {
    title: "التسويق",
    description: "ادمج الحملات البريدية مع تحليلات CRM لزيادة معدلات الالتحاق.",
  },
  faculty: {
    title: "الكادر التعليمي",
    description: "أتمتة دورة حياة الكادر كاملةً من التعيين حتى توزيع الأعباء.",
  },
  transportation: {
    title: "النقل",
    description:
      "إدارة المسارات والمركبات وسلامة الطلاب لكل وسائل النقل المدرسي.",
  },
  canteen: {
    title: "المقصف",
    description: "نقطة بيع مدمجة مع مسح الباركود لمقاصف الطلاب.",
  },
  campus: {
    title: "الحرم",
    description: "إدارة مرافق الحرم وحجز الخدمات ومعالجة كل المعاملات.",
  },
  placement: {
    title: "التوظيف",
    description: "تتبّع جهات التوظيف وعروض العمل والمقابلات وتعيينات الطلاب.",
  },
  "leave-request": {
    title: "طلبات الإجازة",
    description:
      "قدّم واعتمد طلبات الإجازة عبر جميع المجموعات والأدوار والموظفين.",
  },
  timesheet: {
    title: "سجل الدوام",
    description: "تتبّع الوقت والحضور وكل مؤشرات الإنتاجية عبر سجلات الدوام.",
  },
  documents: {
    title: "المستندات",
    description: "شارك وأدِر كل مستندات المدرسة بأدوات امتثال مدمجة.",
  },
  events: {
    title: "الفعاليات",
    description: "نظّم الفعاليات المدرسية وبِع التذاكر وتابع وأدِر الحضور.",
  },
  "mobile-application": {
    title: "تطبيق الجوال",
    description: "وصول عبر الجوال للحصص والواجبات والفعاليات لكل الأدوار.",
  },
  dashboard: {
    title: "لوحة المعلومات",
    description: "اعرض كل المؤشرات في مكان واحد بلوحات وتقارير قابلة للتخصيص.",
  },
  reporting: {
    title: "التقارير",
    description: "أنشئ تقارير ثرية عبر كل قسم ونشاط مدرسي.",
  },
  "ai-powered": {
    title: "مدعوم بالذكاء الاصطناعي",
    description: "مسارات تعلّم مخصّصة وتصحيح آلي ورؤى ذكية.",
  },
}

/** Resolve a feature's display title/description for the active locale. */
export function localizeFeature(
  feature: Feature,
  lang: Locale
): { title: string; description: string } {
  if (lang === "ar") {
    const ar = FEATURE_AR[feature.id]
    if (ar) return ar
  }
  return { title: feature.title, description: feature.description }
}

/** Tab-group label id → Arabic label (includes the synthetic "all" tab). */
export const GROUP_LABEL_AR: Record<string, string> = {
  all: "الكل",
  academics: "الأكاديمية",
  learning: "التعلّم",
  finance: "المالية",
  communication: "التواصل",
  operations: "العمليات",
  insights: "الرؤى والذكاء الاصطناعي",
}

/** Impact-metric id → Arabic { label, description }. */
export const METRIC_AR: Record<string, { label: string; description: string }> =
  {
    "time-saved": {
      label: "الوقت الموفَّر",
      description: "تقليل المهام الإدارية عبر الأتمتة.",
    },
    "cost-reduction": {
      label: "خفض التكاليف",
      description: "تكاليف تشغيلية أقل مع سير عمل بلا أوراق.",
    },
    "enrollment-boost": {
      label: "زيادة الالتحاق",
      description: "ارتفاع في الالتحاق عبر القبول الإلكتروني.",
    },
    uptime: {
      label: "وقت التشغيل",
      description: "بنية سحابية موثوقة لوصول دون انقطاع.",
    },
  }

/** Small UI strings on the features listing page. */
export const FEATURES_UI_AR = {
  seeMore: "عرض المزيد",
  browseFeatures: "تصفّح المميزات",
  requestFeature: "اطلب ميزة",
  talkToSales: "تحدث مع المبيعات",
} as const

export const FEATURES_UI_EN = {
  seeMore: "See more",
  browseFeatures: "Browse Features",
  requestFeature: "Request Feature",
  talkToSales: "Talk to Sales",
} as const

/** Locale-aware accessor for the small UI strings. */
export function featuresUi(lang: Locale) {
  return lang === "ar" ? FEATURES_UI_AR : FEATURES_UI_EN
}
