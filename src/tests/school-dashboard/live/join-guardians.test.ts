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
}))
vi.mock("@/components/school-dashboard/live/livekit/rooms", () => ({
  ensureRoom: vi.fn().mockResolvedValue(undefined),
}))
vi.mock("@/components/school-dashboard/live/livekit/token", () => ({
  issueAccessToken: vi.fn().mockResolvedValue("jwt"),
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
