// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
//
// The name a person carries INTO a room — on their tile, in the hands queue,
// beside every chat message, live and saved.
//
// It was `username ?? email`. For a school member the username is their LOGIN
// CODE (`student-provisioning.ts`: six digits), so a class saw "260049 raised
// a hand" — and half of that student's credentials, next to an address for
// anyone without one. The name comes from the person's own record now, in the
// school's chosen display, and never from a credential.
//
// A plain module: the select and the composing are pure, so the two callers
// (the join ticket, the saved chat message) share them without sharing a query.

import type { UserRole } from "@prisma/client"

import {
  displayName,
  isNameDisplay,
  NAME_DISPLAY_DEFAULT,
  type PersonNameParts,
} from "@/lib/name-utils"

const NAME = { firstName: true, middleName: true, lastName: true } as const

/** What to read from `User` to name them in a room — one query. */
export const ROOM_NAME_USER_SELECT = {
  username: true,
  student: { select: NAME },
  teacher: { select: NAME },
  guardian: { select: NAME },
  staffMember: { select: NAME },
} as const

export type RoomNameUser = {
  username?: string | null
  student?: PersonNameParts | null
  teacher?: PersonNameParts | null
  guardian?: PersonNameParts | null
  staffMember?: PersonNameParts | null
} | null

/** What a seat is called when there is no record to name it from. */
const ROLE_WORD: Record<"ar" | "en", Record<string, string>> = {
  ar: {
    STUDENT: "طالب",
    TEACHER: "معلّم",
    GUARDIAN: "وليّ أمر",
    ADMIN: "الإدارة",
    DEVELOPER: "الدعم",
    STAFF: "موظّف",
    ACCOUNTANT: "موظّف",
  },
  en: {
    STUDENT: "Student",
    TEACHER: "Teacher",
    GUARDIAN: "Parent",
    ADMIN: "Admin",
    DEVELOPER: "Support",
    STAFF: "Staff",
    ACCOUNTANT: "Staff",
  },
}

/** A username that is a login code (all digits) or an address is a credential. */
function isCredential(username: string): boolean {
  return /^\d+$/.test(username) || username.includes("@")
}

/**
 * The room name for one user: their own record first (by role, then whichever
 * record exists), then a username that is a real display name, then the word
 * for their role. Never a login code, never an email.
 */
export function roomDisplayName(
  user: RoomNameUser,
  role: UserRole | string,
  schoolNameDisplay: unknown,
  lang: string | null | undefined
): string {
  const mode = isNameDisplay(schoolNameDisplay)
    ? schoolNameDisplay
    : NAME_DISPLAY_DEFAULT
  const byRole =
    role === "STUDENT"
      ? user?.student
      : role === "TEACHER"
        ? user?.teacher
        : role === "GUARDIAN"
          ? user?.guardian
          : user?.staffMember
  for (const person of [
    byRole,
    user?.teacher,
    user?.staffMember,
    user?.guardian,
    user?.student,
  ]) {
    const name = displayName(person ?? null, mode).trim()
    if (name) return name.slice(0, 80)
  }
  const username = user?.username?.trim()
  if (username && !isCredential(username)) return username.slice(0, 80)
  const words = ROLE_WORD[lang === "en" ? "en" : "ar"]
  return words[String(role)] ?? words.STAFF
}
