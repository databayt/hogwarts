// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import "server-only"

import { cookies } from "next/headers"
import { auth } from "@/auth"

import { db } from "@/lib/db"

import {
  getActiveTerm,
  getChildTimetable,
  getChildTodaySchedule,
  getGuardianChildren,
  getPersonalizedTimetable,
  getRoomsForSelection,
  getTeachersForSelection,
  getTimetableByRoom,
  getTimetableByStudentGrade,
  getTimetableByTeacher,
  getTodaySchedule,
} from "./actions"
import { DRAFT_TERM_ID } from "./config"
import { getPermissionContext } from "./permissions"
import type {
  InitialAdmin,
  InitialGuardian,
  InitialTimetable,
  InitialToday,
  InitialWeekly,
} from "./views/role-router"

/** The admin toolbar's persisted selection (see `FILTER_COOKIE` in admin-view). */
const FILTER_COOKIE = "tt_filter"

/** A load that must never fail the whole stream: the view loads it itself. */
function settle<T>(p: Promise<T>): Promise<T | null> {
  return p.catch(() => null)
}

/**
 * The whole first screen the grid waits on, started by the page instead of
 * from the client's mount effects. The page passes the promise down
 * un-awaited: the skeleton streams at once and `RoleRouter` reads it under
 * Suspense, so the data arrives in the same response rather than behind a
 * chain of phone ↔ server round trips (each ~400 ms on a real phone, none of
 * which a faster database removes).
 *
 * What rides along, per role — exactly what that view used to fetch from its
 * mount effect, started in parallel with the term and the personalized read:
 *
 * - STUDENT / TEACHER: the viewer's week (`getTimetableByStudentGrade` /
 *   `getTimetableByTeacher`) + today's closure (`getTodaySchedule`).
 * - GUARDIAN: the children, the first child's week and day.
 * - ADMIN-like roles: both pickers' options, the selection the `tt_filter`
 *   cookie (or the first room) lands on, and that selection's grid.
 *
 * Every extra read is settled on its own: a failure leaves that field null and
 * the view loads it itself, errors and all, exactly as before. Any failure of
 * the term or the personalized read resolves to null and the router loads
 * them itself.
 *
 * A plain server module, not `actions.ts`: every export there is a public
 * HTTP endpoint.
 */
export async function loadInitialTimetable(): Promise<InitialTimetable | null> {
  try {
    // Wave A — the term, and the role-specific reads that do not need it.
    const [{ term }, plan] = await Promise.all([getActiveTerm(), planForRole()])
    if (!term) return null

    // Wave B — the personalized read beside the role's own first screen. The
    // draft term has no real rows, so nothing extra is loaded for it.
    const isDraft = term.id === DRAFT_TERM_ID
    const termId = term.id

    const gridP: Promise<InitialWeekly | null> =
      !isDraft && plan.role === "STUDENT"
        ? settle(getTimetableByStudentGrade({ termId }))
        : !isDraft && plan.role === "TEACHER" && plan.teacherId
          ? settle(getTimetableByTeacher({ termId, teacherId: plan.teacherId }))
          : Promise.resolve(null)

    const guardianP: Promise<InitialGuardian | null> =
      !isDraft && plan.guardian
        ? settle(
            plan.guardian.then(async (g) => {
              if (!g) throw new Error("GUARDIAN_UNAVAILABLE")
              const grid = g.childId
                ? await getChildTimetable({ termId, childId: g.childId })
                : null
              return { ...g, grid }
            })
          )
        : Promise.resolve(null)

    const adminP: Promise<InitialAdmin | null> =
      !isDraft && plan.isAdminLike
        ? settle(loadAdminSeed(termId))
        : Promise.resolve(null)

    const [data, grid, guardian, admin] = await Promise.all([
      getPersonalizedTimetable({ termId }),
      gridP,
      guardianP,
      adminP,
    ])
    // The viewer's week is only useful together with today's closure.
    const today = grid ? await plan.today : null
    return {
      termId,
      data,
      grid: today ? grid : null,
      today,
      guardian,
      admin,
    }
  } catch {
    return null
  }
}

/**
 * Everything that needs the viewer but not the term, started at once so it
 * overlaps `getActiveTerm`: the role, a teacher's own id, today's closure, and
 * a guardian's children + first child's day. Each started read is settled, so
 * a rejection nobody awaits yet is never an unhandled one.
 */
async function planForRole(): Promise<{
  role: string | null | undefined
  teacherId: string | null
  isAdminLike: boolean
  today: Promise<InitialToday | null>
  guardian: Promise<Omit<InitialGuardian, "grid"> | null> | null
}> {
  const { schoolId, role } = await getPermissionContext()
  const none = Promise.resolve(null)
  if (!schoolId) {
    return {
      role,
      teacherId: null,
      isAdminLike: false,
      today: none,
      guardian: null,
    }
  }

  const isAdminLike =
    role === "ADMIN" ||
    role === "DEVELOPER" ||
    role === "ACCOUNTANT" ||
    role === "STAFF"

  // Today's closure + weekday is what StudentView reads off getTodaySchedule.
  const today: Promise<InitialToday | null> =
    role === "STUDENT" || role === "TEACHER"
      ? settle(
          getTodaySchedule().then((r) => ({
            closure: r.closure ?? null,
            dayOfWeek: r.dayOfWeek,
            upcomingMakeups: r.upcomingMakeups,
          }))
        )
      : none

  let teacherId: string | null = null
  if (role === "TEACHER") {
    const session = await auth()
    const userId = session?.user?.id
    if (userId) {
      const teacher = await db.teacher
        .findFirst({
          where: { userId, schoolId },
          select: { id: true },
        })
        .catch(() => null)
      teacherId = teacher?.id ?? null
    }
  }

  const guardian: Promise<Omit<InitialGuardian, "grid"> | null> | null =
    role === "GUARDIAN"
      ? settle(
          getGuardianChildren().then(async ({ children }) => {
            const childId = children[0]?.id ?? null
            const todayResult = childId
              ? await getChildTodaySchedule({ childId })
              : null
            return { children, childId, today: todayResult }
          })
        )
      : null

  return { role, teacherId, isAdminLike, today, guardian }
}

/** The saved admin selection, if the cookie holds a readable one. */
async function readFilterCookie(): Promise<{
  viewMode?: "classroom" | "teacher"
  roomId?: string
  teacherId?: string
} | null> {
  try {
    const raw = (await cookies()).get(FILTER_COOKIE)?.value
    if (!raw) return null
    let text = raw
    try {
      return JSON.parse(text)
    } catch {
      text = decodeURIComponent(raw)
    }
    return JSON.parse(text)
  } catch {
    return null
  }
}

/**
 * AdminView's first screen, resolved the way its mount effect resolves it:
 * the saved teacher/room if it still exists in this school's options,
 * otherwise the first room; no rooms, no selection and no grid.
 */
async function loadAdminSeed(termId: string): Promise<InitialAdmin> {
  const [{ rooms }, { teachers }, saved] = await Promise.all([
    getRoomsForSelection(),
    getTeachersForSelection({ termId }),
    readFilterCookie(),
  ])

  const savedTeacher =
    saved?.viewMode === "teacher" &&
    saved.teacherId &&
    teachers.some((t) => t.id === saved.teacherId)
      ? saved.teacherId
      : null
  const savedRoom =
    saved?.viewMode === "classroom" &&
    saved.roomId &&
    rooms.some((r) => r.id === saved.roomId)
      ? saved.roomId
      : null

  if (savedTeacher) {
    const grid = await settle(
      getTimetableByTeacher({ termId, teacherId: savedTeacher })
    )
    return {
      rooms,
      teachers,
      selection: { viewMode: "teacher", teacherId: savedTeacher },
      grid,
    }
  }
  const roomId = savedRoom ?? rooms[0]?.id
  if (!roomId) return { rooms, teachers, selection: null, grid: null }
  const grid = await settle(getTimetableByRoom({ termId, roomId }))
  return {
    rooms,
    teachers,
    selection: { viewMode: "classroom", roomId },
    grid,
  }
}
