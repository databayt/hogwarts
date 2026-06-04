// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Lang-aware notification copy for exam lifecycle events.
 *
 * Replaces the previously hardcoded Arabic strings in the exam CRUD/status
 * actions (audit §B5). The school's `preferredLanguage` selects the language,
 * so an English-preferring school no longer receives Arabic-only alerts.
 *
 * Plain module (not "use server") so it is importable by server actions AND
 * unit-testable.
 */

interface NotificationText {
  title: string
  body: string
}

/** "A new exam has been scheduled" alert. */
export function examScheduledNotification(
  examTitle: string,
  examDate: Date,
  lang: string
): NotificationText {
  const isAr = lang === "ar"
  return {
    title: isAr ? "امتحان جديد" : "New Exam",
    body: isAr
      ? `تم جدولة امتحان "${examTitle}" في ${examDate.toLocaleDateString("ar")}`
      : `Exam "${examTitle}" scheduled for ${examDate.toLocaleDateString("en")}`,
  }
}

/** "An exam has been cancelled" alert, with an optional reason. */
export function examCancelledNotification(
  examTitle: string,
  lang: string,
  reason?: string
): NotificationText {
  const isAr = lang === "ar"
  const suffix = reason ? `: ${reason}` : ""
  return {
    title: isAr ? "إلغاء امتحان" : "Exam Cancelled",
    body: isAr
      ? `تم إلغاء امتحان "${examTitle}"${suffix}`
      : `Exam "${examTitle}" has been cancelled${suffix}`,
  }
}
