// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { LucideIcon } from "lucide-react"

import type { PlatformNavItem } from "@/components/template/platform-sidebar/config"
import { Icons } from "@/components/template/platform-sidebar/icons"

import type { Role, SearchItem } from "./types"

/**
 * Curated Arabic keywords that augment what `dictionary.platform.sidebar`
 * already provides. The dictionary handles the displayed title; these extra
 * tokens widen the fuzzy-match surface so an Arabic user can also find a
 * page by typing common synonyms or plurals. Only used by the diacritic-aware
 * `filterByQuery` — not surfaced in the UI.
 */
export const ARABIC_KEYWORDS: Record<string, string[]> = {
  dashboard: ["لوحة", "الرئيسية"],
  school: ["المدرسة", "الإدارة"],
  sales: ["المبيعات", "العملاء"],
  announcements: ["إعلانات", "أخبار"],
  finance: ["مالية", "محاسبة", "حسابات"],
  grades: ["درجات", "علامات", "تقديرات"],
  subjects: ["مواد", "مقررات", "منهج"],
  parents: ["أولياء", "آباء", "ذوي الطلاب"],
  admission: ["قبول", "تسجيل"],
  students: ["طلاب", "طالب", "تلاميذ"],
  teachers: ["معلمين", "معلم", "أساتذة"],
  classrooms: ["قاعات", "فصول", "صفوف"],
  exams: ["اختبارات", "امتحان"],
  events: ["فعاليات", "أنشطة"],
  attendance: ["حضور", "غياب"],
  timetable: ["جدول", "حصص"],
  library: ["مكتبة", "كتب"],
  transportation: ["نقل", "حافلات", "مواصلات"],
  transportationFees: ["رسوم النقل", "اشتراك الباص"],
  myTransportation: ["باصي", "نقلي"],
  transportationTrips: ["رحلات", "نقل"],
  stream: ["بث", "فيديو"],
  messages: ["رسائل", "محادثات"],
  whatsapp: ["واتساب", "محادثات"],
  profile: ["ملفي", "حسابي"],
  settings: ["إعدادات", "تفضيلات"],
  charts: ["رسوم بيانية", "إحصاءات"],
  stats: ["إحصاءات"],
  billing: ["الفوترة", "الاشتراك"],
}

interface DeriveOpts {
  navItems: readonly PlatformNavItem[]
  /**
   * `dictionary.platform.sidebar` keyed by the English `title` (matches the
   * existing sidebar lookup pattern; both diverge would be a regression).
   */
  sidebarDict?: Record<string, string>
  /** `dictionary.platform.breadcrumb` keyed by lowercase URL segment / nav key. */
  breadcrumbDict?: Record<string, string>
  /** Override the default `ARABIC_KEYWORDS` map. */
  arabicKeywords?: Record<string, string[]>
}

/**
 * Convert sidebar `platformNav` (the canonical role-gated list of dashboard
 * pages) into spotlight `SearchItem[]`. This makes `platformNav` the single
 * source of truth — adding a sidebar entry automatically surfaces it in
 * Cmd+K with the right roles, icon, and translated title, eliminating the
 * historical drift between the two registries.
 */
export function deriveNavSearchItems({
  navItems,
  sidebarDict,
  breadcrumbDict,
  arabicKeywords = ARABIC_KEYWORDS,
}: DeriveOpts): SearchItem[] {
  return navItems.map<SearchItem>((nav) => {
    const Icon = Icons[nav.icon] as LucideIcon | undefined
    const translatedTitle = sidebarDict?.[nav.title] ?? nav.title
    const breadcrumbLeaf =
      breadcrumbDict?.[nav.key] ??
      breadcrumbDict?.[nav.title.toLowerCase()] ??
      translatedTitle
    return {
      id: `nav-${nav.key}`,
      title: translatedTitle,
      type: "navigation",
      icon: Icon,
      href: nav.href,
      roles: nav.roles as Role[],
      // Keywords power the diacritic-aware filter but never render — safe to
      // include both the English title and the Arabic synonyms here.
      keywords: [nav.key, nav.title, ...(arabicKeywords[nav.key] ?? [])],
      breadcrumb: ["Platform", breadcrumbLeaf],
    }
  })
}
