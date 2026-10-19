// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
//
// "New homework" to the students it is for. A plain server module, NOT
// "use server": it takes a schoolId, so it must only be called by an action
// that has already authorised the caller.

import "server-only"

import { db } from "@/lib/db"
import { dispatchNotificationsToAudience } from "@/lib/dispatch-notification"
import { audienceUserIds } from "@/lib/teaching-scope"

const COPY = {
  ar: {
    title: (t: string) => `واجب جديد: ${t}`,
    body: (t: string, due: string | null) =>
      due ? `«${t}» — موعد التسليم ${due}.` : `«${t}» متاح الآن.`,
  },
  en: {
    title: (t: string) => `New homework: ${t}`,
    body: (t: string, due: string | null) =>
      due ? `"${t}" is due ${due}.` : `"${t}" is available now.`,
  },
} as const

/**
 * Tell the assignment's audience (its section's students, or its whole
 * grade's) that it was published. `assignment_created` existed as a type and
 * nothing ever sent it, so a student learned of homework from the reminder
 * the day before it was due — or not at all. Best effort: a failure here is
 * logged and never undoes the publish.
 */
export async function notifyAssignmentPublished(
  schoolId: string,
  assignmentId: string
): Promise<{ created: number }> {
  try {
    const a = await db.schoolAssignment.findFirst({
      where: { id: assignmentId, schoolId },
      select: {
        id: true,
        title: true,
        dueDate: true,
        gradeId: true,
        sectionId: true,
        subjectId: true,
        termId: true,
        school: { select: { preferredLanguage: true, timezone: true } },
      },
    })
    if (!a?.gradeId) return { created: 0 }

    const targetUserIds = await audienceUserIds(schoolId, a, {
      students: true,
    })
    if (targetUserIds.length === 0) return { created: 0 }

    const lang = a.school?.preferredLanguage === "en" ? "en" : "ar"
    const due = a.dueDate
      ? new Intl.DateTimeFormat(lang === "ar" ? "ar-EG" : "en-US", {
          timeZone: a.school?.timezone || "Africa/Khartoum",
          weekday: "long",
          day: "numeric",
          month: "long",
          hour: "numeric",
          minute: "2-digit",
        }).format(a.dueDate)
      : null

    return await dispatchNotificationsToAudience({
      schoolId,
      type: "assignment_created",
      title: COPY[lang].title(a.title),
      body: COPY[lang].body(a.title, due),
      lang,
      priority: "normal",
      channels: ["in_app", "push"],
      metadata: { assignmentId: a.id, url: `/assignments/${a.id}` },
      targetUserIds,
    })
  } catch (err) {
    console.error("[assignments] publish notification failed", {
      schoolId,
      assignmentId,
      err: err instanceof Error ? err.message : err,
    })
    return { created: 0 }
  }
}
