// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Lang-aware notification templates for the timetable block.
 *
 * These notifications are emitted from server actions (no request `dictionary`
 * in scope) and target the RECIPIENT school's preferred language — not the
 * acting user's request locale. The dictionary/`createI18nHelpers` system is
 * request-locale-bound and client-oriented, so a small static AR/EN map is the
 * correct tool here (the established sibling-block pattern). Pure functions →
 * trivially unit-testable.
 *
 * Unknown/missing languages fall back to Arabic, matching the historical
 * `preferredLanguage ?? "ar"` default at the call sites.
 */

export type NotifLang = "ar" | "en"

export interface NotifContent {
  title: string
  body: string
}

/** Normalize an arbitrary `preferredLanguage` value to a supported lang. */
export function toNotifLang(value: string | null | undefined): NotifLang {
  return value === "en" ? "en" : "ar"
}

/** Slot moved to a new day/time → notify the affected teacher. */
export function timetableMovedNotif(
  lang: NotifLang,
  p: { className?: string | null }
): NotifContent {
  const ar = p.className || "الحصة"
  const en = p.className || "the class"
  return lang === "en"
    ? {
        title: "Schedule Change",
        body: `${en} has been moved to a new day and time`,
      }
    : {
        title: "تغيير في الجدول",
        body: `تم نقل حصة ${ar} إلى يوم ووقت جديد`,
      }
}

/** Slot removed from the schedule → notify the affected teacher. */
export function slotCancelledNotif(
  lang: NotifLang,
  p: { className?: string | null }
): NotifContent {
  const ar = p.className || "الحصة"
  const en = p.className || "the class"
  return lang === "en"
    ? {
        title: "Class Cancelled",
        body: `${en} has been removed from the schedule`,
      }
    : {
        title: "إلغاء حصة",
        body: `تم إلغاء حصة ${ar} من الجدول`,
      }
}

/** A substitute teacher was assigned → notify that substitute. */
export function substituteAssignedNotif(
  lang: NotifLang,
  p: {
    originalTeacher: string
    className?: string | null
    periodName?: string | null
  }
): NotifContent {
  const className = p.className || (lang === "en" ? "a class" : "حصة")
  const periodName = p.periodName || (lang === "en" ? "a period" : "حصة")
  return lang === "en"
    ? {
        title: "Substitute Assignment",
        body: `You have been assigned as a substitute for ${p.originalTeacher} in ${className} (${periodName})`,
      }
    : {
        title: "تعيين بديل",
        body: `تم تعيينك كبديل لـ ${p.originalTeacher} في ${className} (${periodName})`,
      }
}

/** A substitute declined → notify admins so they can reassign. */
export function substituteDeclinedNotif(
  lang: NotifLang,
  p: { declineReason?: string | null }
): NotifContent {
  return lang === "en"
    ? {
        title: "Substitution Declined",
        body: `The substitute teacher declined the assignment${p.declineReason ? `: ${p.declineReason}` : ""}`,
      }
    : {
        title: "رفض البدالة",
        body: `رفض المعلم البديل التعيين${p.declineReason ? `: ${p.declineReason}` : ""}`,
      }
}

/** A substitution was cancelled → notify the substitute. */
export function substitutionCancelledNotif(
  lang: NotifLang,
  p: { reason?: string | null }
): NotifContent {
  return lang === "en"
    ? {
        title: "Substitution Cancelled",
        body: `Your substitute assignment has been cancelled${p.reason ? `: ${p.reason}` : ""}`,
      }
    : {
        title: "إلغاء البدالة",
        body: `تم إلغاء تعيينك كبديل${p.reason ? `: ${p.reason}` : ""}`,
      }
}
