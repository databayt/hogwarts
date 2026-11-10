// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * "Someone is waiting for you" (actions/waiting-nudge.ts). The 2026-11-10 noon
 * class is the fixture in spirit: the teacher in at 12:05 and gone by 12:10, a
 * student alone at 12:17, the teacher alone again at 12:23.
 */

import { Prisma } from "@prisma/client"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { processPendingWebPushes } from "@/lib/notifications/push-web"
import { notifyClassWaiting } from "@/components/school-dashboard/live/actions/notifications"
import { nudgeWaiting } from "@/components/school-dashboard/live/actions/waiting-nudge"

vi.mock("@/lib/db", () => ({
  db: {
    conference: { findFirst: vi.fn() },
    conferenceParticipant: { findMany: vi.fn() },
    conferenceEvent: { findMany: vi.fn(), create: vi.fn() },
  },
}))
vi.mock("@/lib/notifications/push-web", () => ({
  processPendingWebPushes: vi.fn(async () => ({ succeeded: 1 })),
}))
vi.mock("@/components/school-dashboard/live/actions/notifications", () => ({
  notifyClassWaiting: vi.fn(async () => ({ created: 3 })),
}))

const m = <T>(fn: T) => fn as unknown as ReturnType<typeof vi.fn>
const mSession = m(db.conference.findFirst)
const mPresent = m(db.conferenceParticipant.findMany)
const mSent = m(db.conferenceEvent.findMany)
const mClaim = m(db.conferenceEvent.create)
const mNotify = m(notifyClassWaiting)
const mPush = m(processPendingWebPushes)

const NOON = new Date("2026-11-10T10:00:00Z")
const at = (min: number) => new Date(NOON.getTime() + min * 60_000)
const inRoom = { status: "joined", activeSince: NOON, joinedAt: NOON }
const TEACHER = { userId: "u-teacher", role: "HOST", ...inRoom }
const STUDENT = { userId: "u-student", role: "PARTICIPANT", ...inRoom }
const PARENT = { userId: "u-parent", role: "OBSERVER", ...inRoom }
/** A seat that exists but is not in the room right now. */
const out = <T extends object>(seat: T, everJoined = true) => ({
  ...seat,
  status: everJoined ? "left" : "invited",
  activeSince: null,
  joinedAt: everJoined ? NOON : null,
})

const nudge = (joinerUserId: string, now: Date) =>
  nudgeWaiting({ schoolId: "sch1", sessionId: "s1", joinerUserId, now })

beforeEach(() => {
  vi.clearAllMocks()
  mSession.mockResolvedValue({
    id: "s1",
    actualStart: at(5),
    scheduledEnd: at(50),
    visibility: "section",
  })
  mPresent.mockResolvedValue([STUDENT])
  mSent.mockResolvedValue([])
  mClaim.mockResolvedValue({ id: "ev1" })
  mNotify.mockResolvedValue({ created: 3 })
})

describe("nudgeWaiting", () => {
  it("tells the teacher when a student is in and no teacher is", async () => {
    expect(await nudge("u-student", at(17))).toBe("teacher")
    expect(mSession).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "s1", schoolId: "sch1", status: "live", deletedAt: null },
      })
    )
    expect(mClaim).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          schoolId: "sch1",
          sessionId: "s1",
          eventType: "waiting_nudge_teacher",
          actorUserId: "u-student",
        }),
      })
    )
    expect(mNotify).toHaveBeenCalledWith("sch1", "s1", "teacher", ["u-student"])
    expect(mPush).toHaveBeenCalledTimes(1)
  })

  it("tells the roster when the teacher is in and no student is", async () => {
    mPresent.mockResolvedValue([TEACHER, PARENT])
    expect(await nudge("u-teacher", at(23))).toBe("roster")
    expect(mNotify).toHaveBeenCalledWith("sch1", "s1", "roster", [
      "u-teacher",
      "u-parent",
    ])
  })

  it("says nothing when both sides are in", async () => {
    mPresent.mockResolvedValue([TEACHER, STUDENT])
    expect(await nudge("u-student", at(38))).toBeNull()
    expect(await nudge("u-teacher", at(38))).toBeNull()
    expect(mClaim).not.toHaveBeenCalled()
    expect(mNotify).not.toHaveBeenCalled()
  })

  it("says nothing for a watching parent, or for someone already gone", async () => {
    mPresent.mockResolvedValue([PARENT])
    expect(await nudge("u-parent", at(17))).toBeNull()
    mPresent.mockResolvedValue([])
    expect(await nudge("u-student", at(17))).toBeNull()
    expect(mNotify).not.toHaveBeenCalled()
  })

  it("leaves the first two minutes to the class-is-live notice", async () => {
    // A student opened the room: the teacher was just told the class is live.
    mPresent.mockResolvedValue([STUDENT, out(TEACHER, false)])
    expect(await nudge("u-student", at(6))).toBeNull()
    expect(await nudge("u-student", at(7))).toBe("teacher")
    // The teacher opened it: the roster was just told.
    mPresent.mockResolvedValue([TEACHER])
    expect(await nudge("u-teacher", at(6))).toBeNull()
  })

  it("tells a teacher who opened the room and stepped out at once", async () => {
    // 12:05 the teacher walks in (class is live goes to the roster, not to
    // her), 12:05:30 she leaves, 12:06 a student arrives.
    mPresent.mockResolvedValue([STUDENT, out(TEACHER)])
    expect(await nudge("u-student", at(6))).toBe("teacher")
  })

  it("counts only people in the room now", async () => {
    mPresent.mockResolvedValue([STUDENT, out(TEACHER)])
    expect(await nudge("u-student", at(17))).toBe("teacher")
    expect(mNotify).toHaveBeenLastCalledWith("sch1", "s1", "teacher", [
      "u-student",
    ])
    mPresent.mockResolvedValue([TEACHER, out(STUDENT)])
    expect(await nudge("u-teacher", at(23))).toBe("roster")
    mPresent.mockResolvedValue([out(STUDENT)])
    expect(await nudge("u-student", at(30))).toBeNull()
  })

  it("stops at the bell, and for a class that is not live or is school-wide", async () => {
    expect(await nudge("u-student", at(50))).toBeNull()
    mSession.mockResolvedValueOnce(null)
    expect(await nudge("u-student", at(17))).toBeNull()
    mSession.mockResolvedValueOnce({
      id: "s1",
      actualStart: at(5),
      scheduledEnd: at(50),
      visibility: "school",
    })
    expect(await nudge("u-student", at(17))).toBeNull()
    expect(mNotify).not.toHaveBeenCalled()
  })

  it("waits five minutes between notices to a teacher, ten to a roster", async () => {
    mSent.mockResolvedValue([{ occurredAt: at(14) }])
    expect(await nudge("u-student", at(17))).toBeNull()
    expect(await nudge("u-student", at(19))).toBe("teacher")

    mPresent.mockResolvedValue([TEACHER])
    mSent.mockResolvedValue([{ occurredAt: at(14) }])
    expect(await nudge("u-teacher", at(23))).toBeNull()
    expect(await nudge("u-teacher", at(24))).toBe("roster")
  })

  it("tells a teacher at most four times a class, a roster twice", async () => {
    mSent.mockResolvedValue([10, 16, 22, 28].map((x) => ({ occurredAt: at(x) })))
    expect(await nudge("u-student", at(40))).toBeNull()
    expect(mSent).toHaveBeenLastCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ eventType: "waiting_nudge_teacher" }),
        take: 4,
      })
    )

    mPresent.mockResolvedValue([TEACHER])
    mSent.mockResolvedValue([10, 22].map((x) => ({ occurredAt: at(x) })))
    expect(await nudge("u-teacher", at(40))).toBeNull()
    expect(mNotify).not.toHaveBeenCalled()
  })

  it("lets one of two simultaneous arrivals send", async () => {
    mClaim.mockRejectedValueOnce(
      new Prisma.PrismaClientKnownRequestError("dup", {
        code: "P2002",
        clientVersion: "test",
      })
    )
    expect(await nudge("u-student", at(17))).toBeNull()
    expect(mNotify).not.toHaveBeenCalled()
    // The claim's id is the same for the whole minute.
    const id = (n: number) => mClaim.mock.calls[n][0].data.eventId
    await nudge("u-student", new Date(at(17).getTime() + 20_000))
    expect(id(1)).toBe(id(0))
    expect(id(0)).toMatch(/^nudge:s1:teacher:\d+$/)
  })

  it("does not drain the push queue when nobody was reachable, and survives a push failure", async () => {
    mNotify.mockResolvedValueOnce({ created: 0 })
    expect(await nudge("u-student", at(17))).toBe("teacher")
    expect(mPush).not.toHaveBeenCalled()
    mPush.mockRejectedValueOnce(new Error("vapid"))
    await expect(nudge("u-student", at(25))).resolves.toBe("teacher")
  })

  it("lets a real database failure reach the caller", async () => {
    mClaim.mockRejectedValueOnce(new Error("connection reset"))
    await expect(nudge("u-student", at(17))).rejects.toThrow("connection reset")
  })
})
