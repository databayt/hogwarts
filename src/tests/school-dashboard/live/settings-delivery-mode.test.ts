// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * The delivery mode is the source of truth; the legacy school switch and the
 * go-online window are derived from it on every save so the stored row can
 * never say two things.
 */

import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { requireContext } from "@/components/school-dashboard/live/actions/helpers"
import { updateLiveSettings } from "@/components/school-dashboard/live/actions/settings"

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))
vi.mock("next/server", () => ({ after: (fn: () => unknown) => void fn() }))
vi.mock("@/components/school-dashboard/live/actions/helpers", () => ({
  requireContext: vi.fn(),
  liveRevalidatePath: (s: string) => `/x/${s}`,
  liveListRevalidatePaths: () => [],
}))
vi.mock(
  "@/components/school-dashboard/live/actions/materialize-day",
  () => ({
    materializeSchoolDay: vi.fn().mockResolvedValue({ materialized: 0 }),
  })
)
vi.mock("@/components/school-dashboard/live/livekit/client", () => ({
  isLiveKitConfigured: () => true,
  isRecordingConfigured: () => true,
}))
vi.mock("@/lib/term-resolver", () => ({ resolveActiveTerm: vi.fn() }))
vi.mock("@/lib/db", () => ({
  db: { school: { findUnique: vi.fn(), update: vi.fn() } },
}))

const m = <T>(fn: T) => fn as unknown as ReturnType<typeof vi.fn>
const mCtx = m(requireContext)
const mFind = m(db.school.findUnique)
const mUpdate = m(db.school.update)

const base = {
  conferenceRetentionDays: 90,
  conferenceMaxConcurrent: 50,
  conferenceMaxDuration: 120,
  conferenceRecordingDefault: true,
  conferenceAttendanceSync: true,
  conferenceProviderDefault: "livekit" as const,
  conferenceOnlineMode: "timetable" as const,
  conferenceOnlineFrom: "2026-09-01",
  conferenceOnlineUntil: "2026-09-10",
  conferenceOnlineNote: "storm",
  conferenceFallbackUrl: "",
}

beforeEach(() => {
  vi.clearAllMocks()
  mCtx.mockResolvedValue({
    ok: true,
    schoolId: "school-1",
    userId: "u1",
    role: "ADMIN",
  })
  mFind.mockResolvedValue({ timezone: "Africa/Khartoum" })
  mUpdate.mockResolvedValue({})
})

describe("updateLiveSettings — delivery mode as the source of truth", () => {
  it("physical clears the window and forces the school switch off, whatever the form sent", async () => {
    const r = await updateLiveSettings({
      ...base,
      conferenceDeliveryMode: "physical",
      conferenceOnlineDefault: true,
    })
    expect(r).toMatchObject({ success: true })
    const data = mUpdate.mock.calls[0][0].data
    expect(data).toMatchObject({
      conferenceDeliveryMode: "physical",
      conferenceOnlineDefault: false,
      conferenceOnlineFrom: null,
      conferenceOnlineUntil: null,
      conferenceOnlineNote: null,
    })
  })

  it("online forces the school switch on", async () => {
    await updateLiveSettings({
      ...base,
      conferenceDeliveryMode: "online",
      conferenceOnlineDefault: false,
    })
    expect(mUpdate.mock.calls[0][0].data).toMatchObject({
      conferenceDeliveryMode: "online",
      conferenceOnlineDefault: true,
    })
  })

  it("hybrid keeps the admin's default and the window, converted through the school timezone", async () => {
    await updateLiveSettings({
      ...base,
      conferenceDeliveryMode: "hybrid",
      conferenceOnlineDefault: false,
    })
    const data = mUpdate.mock.calls[0][0].data
    expect(data.conferenceDeliveryMode).toBe("hybrid")
    expect(data.conferenceOnlineDefault).toBe(false)
    expect(data.conferenceOnlineFrom).toBeInstanceOf(Date)
    expect(data.conferenceOnlineUntil).toBeInstanceOf(Date)
    expect(data.conferenceOnlineNote).toBe("storm")
  })

  it("stores the attendance thresholds and rejects an absurd one", async () => {
    await updateLiveSettings({
      ...base,
      conferenceDeliveryMode: "hybrid",
      conferenceLateGraceMinutes: 15,
      conferenceMinPresenceMinutes: 8,
      conferenceEarlyLeaveMinutes: 5,
    })
    expect(mUpdate.mock.calls[0][0].data).toMatchObject({
      conferenceLateGraceMinutes: 15,
      conferenceMinPresenceMinutes: 8,
      conferenceEarlyLeaveMinutes: 5,
    })
    const bad = await updateLiveSettings({
      ...base,
      conferenceDeliveryMode: "hybrid",
      conferenceLateGraceMinutes: 999,
    })
    expect(bad).toMatchObject({ success: false })
  })

  it("stores the configuration options and trims the consent note", async () => {
    await updateLiveSettings({
      ...base,
      conferenceDeliveryMode: "hybrid",
      conferenceRecordingConsentNote: "  يُسجَّل هذا الدرس  ",
      conferenceAutoPublishRecordings: false,
      conferenceGuardiansObserve: false,
      conferenceStudentsJoinMuted: false,
      conferenceToolChat: false,
      conferenceToolStudentShare: true,
      conferenceReminderLeadMinutes: 30,
    })
    expect(mUpdate.mock.calls[0][0].data).toMatchObject({
      conferenceRecordingConsentNote: "يُسجَّل هذا الدرس",
      conferenceAutoPublishRecordings: false,
      conferenceGuardiansObserve: false,
      conferenceStudentsJoinMuted: false,
      conferenceToolChat: false,
      conferenceToolStudentShare: true,
      conferenceReminderLeadMinutes: 30,
    })
    const bad = await updateLiveSettings({
      ...base,
      conferenceDeliveryMode: "hybrid",
      conferenceReminderLeadMinutes: 0,
    })
    expect(bad).toMatchObject({ success: false })
  })
})
