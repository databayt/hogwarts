// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Plain-text class report for pasting into WhatsApp. Pure: takes the rows the
 * page already has, returns a string.
 */

import { reasonChips, asReadinessLang } from "./labels"
import type { ReadinessReason } from "./rules"

export type ClassReportInput = {
  className: string
  supervisor: {
    name: string
    reasons: ReadinessReason[]
    canCover: boolean
  } | null
  classes: {
    /** "HH:mm" */
    start: string
    subject: string | null
    teacherName: string | null
    reasons: ReadinessReason[]
  }[]
  students: { name: string; reasons: ReadinessReason[] }[]
}

const T = {
  ar: {
    title: "حصص اليوم",
    supervisor: "مشرفة الصف",
    honorific: "أ.",
    canCover: "تقدر تغطي أي حصة يغيب معلمها ✅",
    cannotCover: "⚠️ عشان يوصلها تنبيه غياب المعلم لازم تفتح التطبيق وتفعّل الإشعارات",
    teachers: "المعلمين:",
    students: "الطلاب:",
    noSupervisor: "ما في مشرفة معيّنة للصف",
  },
  en: {
    title: "today's classes",
    supervisor: "Class supervisor",
    honorific: "",
    canCover: "Can cover any class whose teacher is absent ✅",
    cannotCover:
      "⚠️ To get the teacher-absence alert she must open the app and turn notifications on",
    teachers: "Teachers:",
    students: "Students:",
    noSupervisor: "No supervisor assigned",
  },
} as const

function named(honorific: string, name: string) {
  return honorific ? `${honorific} ${name}` : name
}

export function classReportText(card: ClassReportInput, lang: string): string {
  const l = asReadinessLang(lang)
  const t = T[l]
  const lines: string[] = [`📋 ${card.className} — ${t.title}`]

  if (card.supervisor) {
    const s = card.supervisor
    lines.push(
      `👩‍🏫 ${t.supervisor}: ${named(t.honorific, s.name)} — ${reasonChips(s.reasons, l)}`
    )
    lines.push(s.canCover ? t.canCover : t.cannotCover)
  } else {
    lines.push(`👩‍🏫 ${t.noSupervisor}`)
  }

  if (card.classes.length) {
    lines.push("", t.teachers)
    for (const c of card.classes) {
      const who = c.teacherName ? named(t.honorific, c.teacherName) : "—"
      const subject = c.subject ? ` ${c.subject}` : ""
      lines.push(`• ${c.start}${subject} — ${who}: ${reasonChips(c.reasons, l)}`)
    }
  }

  if (card.students.length) {
    lines.push("", t.students)
    for (const s of card.students) {
      lines.push(`• ${s.name}: ${reasonChips(s.reasons, l)}`)
    }
  }

  return lines.join("\n")
}

/** Every class report, separated by a blank line. */
export function allClassesReportText(
  cards: ClassReportInput[],
  lang: string
): string {
  return cards.map((c) => classReportText(c, lang)).join("\n\n")
}
