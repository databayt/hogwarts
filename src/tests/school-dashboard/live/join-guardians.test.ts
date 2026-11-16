// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * The school switch for guardians: they join as observers only where the
 * school allows it, and the ticket carries the room configuration.
 */

import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { performLiveClassJoin } from "@/components/school-dashboard/live/actions/join-core"
import { issueAccessToken } from "@/components/school-dashboard/live/livekit/token"

vi.mock("server-only", () => ({}))
vi.mock("@/auth", () => ({ auth: vi.fn() }))
vi.mock("@/lib/tenant-context", () => ({ getTenantContext: vi.fn() }))
vi.mock("@/components/school-dashboard/live/livekit/client", () => ({
  getLiveKitConfig: () => ({ wsUrl: "wss://sfu.test" }),
  // The ticket's `recording` flag is ANDed with the bucket being configured;
  // this spec is about the room config, so recording is simply "possible".
  isRecordingConfigured: () => true,
}))
vi.mock("@/components/school-dashboard/live/livekit/rooms", () => ({
  ensureRoom: vi.fn().mockResolvedValue(undefined),
}))
vi.mock("@/components/school-dashboard/live/livekit/token", () => ({
  issueAccessToken: vi.fn().mockResolvedValue("jwt"),
}))
const transitionToLive = vi.fn().mockResolvedValue({ transitioned: true })
vi.mock("@/components/school-dashboard/live/actions/went-live", () => ({
  transitionToLive: (...a: unknown[]) => transitionToLive(...a),
}))
vi.mock("@/components/school-dashboard/live/actions/helpers", () => ({
  concurrentCapError: vi.fn().mockResolvedValue(null),
}))
vi.mock("@/lib/db", () => ({
  db: {
    conference: { findFirst: vi.fn(), update: vi.fn() },
    user: { findUnique: vi.fn() },
    conferenceParticipant: { findUnique: vi.fn(), upsert: vi.fn() },
    guardian: { findFirst: vi.fn() },
    student: { findFirst: vi.fn() },
  },
}))

const m = <T>(fn: T) => fn as unknown as ReturnType<typeof vi.fn>

const liveClass = (school: Record<string, unknown> = {}) => ({
  id: "c1",
  roomName: "school-1__c1",
  sectionId: "sec-1",
  visibility: "section",
  maxParticipants: 50,
  status: "live",
  lang: "ar",
  provider: "livekit",
  recordingEnabled: true,
  studentsJoinMuted: null,
  teacher: { userId: "u-teacher" },
  school: {
    conferenceGuardiansObserve: true,
    conferenceStudentsJoinMuted: true,
    conferenceRecordingConsentNote: null,
    conferenceToolChat: true,
    conferenceToolHands: true,
    conferenceToolPolls: false,
    conferenceToolWhiteboard: true,
    conferenceToolStudentShare: false,
    ...school,
  },
})

beforeEach(() => {
  vi.clearAllMocks()
  m(db.conference.findFirst).mockResolvedValue(liveClass())
  m(db.user.findUnique).mockResolvedValue({
    username: "Parent",
    email: "p@x.com",
  })
  m(db.conferenceParticipant.findUnique).mockResolvedValue(null)
  m(db.conferenceParticipant.upsert).mockResolvedValue({})
  m(db.guardian.findFirst).mockResolvedValue({ id: "g1" })
  m(db.student.findFirst).mockResolvedValue({ id: "s1" })
})

const guardian = {
  userId: "u-guardian",
  role: "GUARDIAN" as const,
  schoolId: "school-1",
}
const student = {
  userId: "u-student",
  role: "STUDENT" as const,
  schoolId: "school-1",
}

describe("guardians and the room configuration on join", () => {
  it("lets a guardian observe when the school allows it, with the room config on the ticket", async () => {
    const r = await performLiveClassJoin("c1", { actor: guardian })
    expect(r.success).toBe(true)
    if (!r.success) return
    expect(r.data.role).toBe("OBSERVER")
    expect(r.data.roomConfig).toEqual({
      joinMuted: true,
      tools: {
        chat: true,
        hands: true,
        polls: false,
        whiteboard: true,
        studentShare: false,
      },
      consentNote: null,
      recording: true,
    })
  })

  it("refuses a guardian when the school switch is off", async () => {
    m(db.conference.findFirst).mockResolvedValue(
      liveClass({ conferenceGuardiansObserve: false })
    )
    const r = await performLiveClassJoin("c1", { actor: guardian })
    expect(r).toMatchObject({
      success: false,
      error: "LIVE_CLASS_PARTICIPANT_DENIED",
    })
    expect(issueAccessToken).not.toHaveBeenCalled()
  })

  it("a per-session override beats the school's join-muted default, and the share grant follows the tool", async () => {
    m(db.conference.findFirst).mockResolvedValue({
      ...liveClass({ conferenceToolStudentShare: true }),
      studentsJoinMuted: false,
    })
    const r = await performLiveClassJoin("c1", { actor: student })
    expect(r.success).toBe(true)
    if (!r.success) return
    expect(r.data.roomConfig.joinMuted).toBe(false)
    expect(issueAccessToken).toHaveBeenCalledWith(
      expect.objectContaining({ role: "PARTICIPANT", allowScreenShare: true })
    )
  })
})

describe("the practice room", () => {
  const practiceRow = (
    over: Record<string, unknown> = {},
    school: Record<string, unknown> = {}
  ) => ({
    ...liveClass({
      conferencePracticeRoom: true,
      conferenceGuardiansObserve: false,
      conferenceToolStudentShare: false,
      ...school,
    }),
    isPractice: true,
    sectionId: null,
    visibility: "school",
    status: "scheduled",
    recordingEnabled: false,
    ...over,
  })
  const as = (role: string, userId = `u-${role}`) => ({
    userId,
    role: role as never,
    schoolId: "school-1",
  })

  it("admits every role of the school — staff roles as CO_HOST, students and guardians as PARTICIPANT", async () => {
    m(db.conference.findFirst).mockResolvedValue(practiceRow())
    const expected: Record<string, string> = {
      ADMIN: "CO_HOST",
      TEACHER: "CO_HOST",
      STAFF: "CO_HOST",
      ACCOUNTANT: "CO_HOST",
      STUDENT: "PARTICIPANT",
      GUARDIAN: "PARTICIPANT",
    }
    for (const [role, want] of Object.entries(expected)) {
      const r = await performLiveClassJoin("c1", { actor: as(role) })
      expect(r.success, role).toBe(true)
      if (r.success) expect(r.data.role, role).toBe(want)
    }
  })

  it("lets ANY of them open it: no host needed first, no join-window check", async () => {
    // Scheduled start far in the future would be TOO_EARLY for an ad-hoc class.
    m(db.conference.findFirst).mockResolvedValue(
      practiceRow({ scheduledStart: new Date(Date.now() + 86_400_000) })
    )
    const r = await performLiveClassJoin("c1", { actor: as("STUDENT") })
    expect(r.success).toBe(true)
    expect(transitionToLive).toHaveBeenCalledTimes(1)
  })

  it("a guardian is not an observer here, whatever the observe switch says", async () => {
    m(db.conference.findFirst).mockResolvedValue(
      practiceRow({}, { conferenceGuardiansObserve: false })
    )
    const r = await performLiveClassJoin("c1", { actor: guardian })
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.role).toBe("PARTICIPANT")
  })

  it("lets a student share their screen even when the school's share tool is off, and opens unmuted", async () => {
    m(db.conference.findFirst).mockResolvedValue(practiceRow())
    const r = await performLiveClassJoin("c1", { actor: student })
    expect(r.success).toBe(true)
    if (!r.success) return
    expect(issueAccessToken).toHaveBeenCalledWith(
      expect.objectContaining({ role: "PARTICIPANT", allowScreenShare: true })
    )
    expect(r.data.roomConfig.tools.studentShare).toBe(true)
    expect(r.data.roomConfig.joinMuted).toBe(false)
  })

  it("nobody enters while the school switch is off", async () => {
    m(db.conference.findFirst).mockResolvedValue(
      practiceRow({}, { conferencePracticeRoom: false })
    )
    for (const role of ["ADMIN", "TEACHER", "STAFF", "STUDENT", "GUARDIAN"]) {
      const r = await performLiveClassJoin("c1", { actor: as(role) })
      expect(r, role).toMatchObject({
        success: false,
        error: "LIVE_CLASS_INVALID_STATE",
      })
    }
    expect(issueAccessToken).not.toHaveBeenCalled()
  })

  it("refuses a student or guardian who is not a member of THIS school", async () => {
    m(db.conference.findFirst).mockResolvedValue(practiceRow())
    m(db.student.findFirst).mockResolvedValue(null)
    m(db.guardian.findFirst).mockResolvedValue(null)
    for (const actor of [student, guardian]) {
      const r = await performLiveClassJoin("c1", { actor })
      expect(r).toMatchObject({
        success: false,
        error: "LIVE_CLASS_PARTICIPANT_DENIED",
      })
    }
    // The membership lookup is scoped by the actor's school.
    expect(db.student.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ schoolId: "school-1" }),
      })
    )
  })

  it("another school's room is not found at all (tenant scope on the read)", async () => {
    m(db.conference.findFirst).mockResolvedValue(null)
    const r = await performLiveClassJoin("c1", {
      actor: { ...student, schoolId: "school-2" },
    })
    expect(r).toMatchObject({ success: false, error: "LIVE_CLASS_NOT_FOUND" })
  })

  it("a class that is not the practice room keeps the old matrix (a staff member is refused a section class)", async () => {
    const r = await performLiveClassJoin("c1", { actor: as("STAFF") })
    expect(r).toMatchObject({
      success: false,
      error: "LIVE_CLASS_PARTICIPANT_DENIED",
    })
  })
})
