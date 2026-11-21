// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * The room's Quiz tab offers the lesson-draft button only when the SERVER says
 * the host may suggest: `getRoomQuizzes(...).suggest` is `null` with the flag
 * off (and then costs no extra query), for a non-host role, and for a class
 * with no section + subject; present for a host with the flag on.
 */
import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { lessonDraftEnabled } from "@/components/lesson-draft/claude"
import {
  suggestNextLessonFor,
  visibleLessons,
} from "@/components/lesson-draft/suggest"
import { requireContext } from "@/components/school-dashboard/live/actions/helpers"
import { holdsHostSeat } from "@/components/school-dashboard/live/actions/host-seat"
import { getRoomQuizzes } from "@/components/school-dashboard/live/actions/resources"
import { resolveRoomLabels } from "@/components/school-dashboard/live/room/labels"

vi.mock("@/components/school-dashboard/live/actions/helpers", () => ({
  requireContext: vi.fn(),
}))
vi.mock("@/components/school-dashboard/live/actions/host-seat", () => ({
  holdsHostSeat: vi.fn(),
}))
vi.mock("@/components/lesson-draft/claude", () => ({
  lessonDraftEnabled: vi.fn(() => false),
}))
vi.mock("@/components/lesson-draft/suggest", () => ({
  visibleLessons: vi.fn(),
  suggestNextLessonFor: vi.fn(),
}))
vi.mock("@/lib/term-resolver", () => ({ resolveActiveTerm: vi.fn() }))
vi.mock("@/lib/refresh-page", () => ({ refreshPage: vi.fn() }))
vi.mock("@/components/translation/prewarm", () => ({ prewarm: vi.fn() }))
vi.mock("next/server", () => ({ after: vi.fn() }))
vi.mock("@/lib/db", () => ({
  db: {
    conference: { findFirst: vi.fn() },
    conferenceResource: { findMany: vi.fn() },
    quickAssessment: { findMany: vi.fn() },
  },
}))

const m = <T>(fn: T) => fn as unknown as ReturnType<typeof vi.fn>

function setup(opts: {
  role?: string
  enabled?: boolean
  sectionId?: string | null
  subjectId?: string | null
}) {
  m(requireContext).mockResolvedValue({
    ok: true,
    schoolId: "school-1",
    userId: "u-teacher",
    role: opts.role ?? "TEACHER",
  })
  m(lessonDraftEnabled).mockReturnValue(opts.enabled ?? false)
  m(db.conference.findFirst).mockResolvedValue({
    id: "s1",
    title: "Algebra",
    subjectId: opts.subjectId === undefined ? "sub-1" : opts.subjectId,
    sectionId: opts.sectionId === undefined ? "sec-1" : opts.sectionId,
    teacherId: "t1",
    catalogLessonId: "les-1",
    teacher: { userId: "u-teacher" },
    section: { gradeId: "g-7" },
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  m(holdsHostSeat).mockResolvedValue(true)
  m(db.conferenceResource.findMany).mockResolvedValue([])
  m(db.quickAssessment.findMany).mockResolvedValue([])
  m(visibleLessons).mockResolvedValue([{ id: "les-1", name: "Fractions" }])
  m(suggestNextLessonFor).mockResolvedValue("les-2")
})

describe("getRoomQuizzes suggest", () => {
  it("is null with the flag off, and runs no lesson query", async () => {
    setup({ enabled: false })
    const r = await getRoomQuizzes("s1")
    expect(r).toMatchObject({ success: true, suggest: null })
    expect(visibleLessons).not.toHaveBeenCalled()
    expect(suggestNextLessonFor).not.toHaveBeenCalled()
  })

  it("is null for a non-host role even with the flag on", async () => {
    // A co-host seat can be held by a non-host role; the class page's rule
    // (a host ROLE) is the gate, so the button stays off for them.
    setup({ enabled: true, role: "STUDENT" })
    const r = await getRoomQuizzes("s1")
    expect(r).toMatchObject({ success: true, suggest: null })
    expect(visibleLessons).not.toHaveBeenCalled()
  })

  it("is null for a class with no section or no subject", async () => {
    setup({ enabled: true, sectionId: null })
    expect(await getRoomQuizzes("s1")).toMatchObject({ suggest: null })
    setup({ enabled: true, subjectId: null })
    expect(await getRoomQuizzes("s1")).toMatchObject({ suggest: null })
    expect(visibleLessons).not.toHaveBeenCalled()
  })

  it("is null when the subject has no lesson to pick", async () => {
    setup({ enabled: true })
    m(visibleLessons).mockResolvedValue([])
    expect(await getRoomQuizzes("s1")).toMatchObject({ suggest: null })
  })

  it("carries lessons, the saved lesson and the suggestion for a host", async () => {
    setup({ enabled: true })
    const r = await getRoomQuizzes("s1")
    expect(r).toMatchObject({
      success: true,
      suggest: {
        lessons: [{ id: "les-1", name: "Fractions" }],
        currentId: "les-1",
        suggestedId: "les-2",
      },
    })
    expect(visibleLessons).toHaveBeenCalledWith("school-1", "sub-1")
    expect(suggestNextLessonFor).toHaveBeenCalledWith("school-1", {
      sectionId: "sec-1",
      subjectId: "sub-1",
    })
  })

  it("refuses a caller with no host seat (no suggest at all)", async () => {
    setup({ enabled: true })
    m(holdsHostSeat).mockResolvedValue(false)
    const r = await getRoomQuizzes("s1")
    expect(r).toMatchObject({ success: false })
    expect(r).not.toHaveProperty("suggest")
  })
})

describe("RoomLabels lessonDraft member", () => {
  it("is absent unless the page passes it", () => {
    expect(resolveRoomLabels({}).lessonDraft).toBeUndefined()
    const ld = { button: "Suggest" } as never
    expect(resolveRoomLabels({}, ld).lessonDraft).toBe(ld)
  })
})
