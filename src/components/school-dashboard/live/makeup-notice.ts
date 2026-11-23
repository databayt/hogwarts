// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
//
// The three notices a make-up class sends — booked, moved, cancelled — and who
// receives them. Pure; `actions/notifications.ts` loads the people and sends.

export type MakeupNoticeKind = "booked" | "moved" | "cancelled"

export const MAKEUP_NOTICE_TYPE = {
  booked: "live_class_makeup_booked",
  moved: "live_class_makeup_moved",
  cancelled: "live_class_makeup_cancelled",
} as const

export const MAKEUP_NOTICE_TEXT: Record<
  "ar" | "en",
  Record<MakeupNoticeKind, { title: string; body: string }>
> = {
  ar: {
    booked: {
      title: "حصة تعويضية: {what}",
      body: "حصة {what} الفائتة صار لها موعد تعويضي: {day} الساعة {time}",
    },
    moved: {
      title: "تغيّر موعد الحصة التعويضية",
      body: "حصة {what} التعويضية انتقلت إلى {day} الساعة {time}",
    },
    cancelled: {
      title: "أُلغيت الحصة التعويضية",
      body: "أُلغيت الحصة التعويضية لمادة {what} التي كانت {day} الساعة {time}",
    },
  },
  en: {
    booked: {
      title: "Make-up class: {what}",
      body: "The missed {what} class has a make-up: {day} at {time}",
    },
    moved: {
      title: "Make-up class moved",
      body: "The {what} make-up class moved to {day} at {time}",
    },
    cancelled: {
      title: "Make-up class cancelled",
      body: "The {what} make-up class on {day} at {time} was cancelled",
    },
  },
}

export function makeupNotice(
  kind: MakeupNoticeKind,
  lang: "ar" | "en",
  vars: { what: string; day: string; time: string }
): { title: string; body: string } {
  const t = MAKEUP_NOTICE_TEXT[lang][kind]
  const fill = (s: string) =>
    s
      .replace(/\{what\}/g, vars.what)
      .replace(/\{day\}/g, vars.day)
      .replace(/\{time\}/g, vars.time)
  return { title: fill(t.title), body: fill(t.body) }
}

/**
 * Everyone a make-up concerns: the section's students, their guardians and the
 * class's teacher — each once, and never the person who just did it (they
 * know). Empty ids are dropped.
 */
export function makeupAudience(input: {
  teacherUserId?: string | null
  studentUserIds: readonly (string | null | undefined)[]
  guardianUserIds: readonly (string | null | undefined)[]
  actorUserId?: string | null
}): string[] {
  const out = new Set<string>()
  const add = (id: string | null | undefined) => {
    if (id) out.add(id)
  }
  add(input.teacherUserId)
  input.studentUserIds.forEach(add)
  input.guardianUserIds.forEach(add)
  if (input.actorUserId) out.delete(input.actorUserId)
  return [...out]
}
