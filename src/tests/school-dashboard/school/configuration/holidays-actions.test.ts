// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { auth } from "@/auth"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import {
  createHoliday,
  deleteHoliday,
} from "@/components/school-dashboard/school/configuration/holidays-actions"

vi.mock("@/auth", () => ({ auth: vi.fn() }))
vi.mock("@/lib/tenant-context", () => ({ getTenantContext: vi.fn() }))
vi.mock("@/lib/refresh-page", () => ({ refreshPage: vi.fn() }))
vi.mock("@/lib/db", () => ({
  db: {
    school: {
      findUnique: vi.fn(async () => ({ timezone: "Africa/Khartoum" })),
    },
    scheduleException: {
      create: vi.fn(async () => ({ id: "h1" })),
      deleteMany: vi.fn(async () => ({ count: 1 })),
      findMany: vi.fn(async () => []),
    },
  },
}))

function signIn(role: string) {
  vi.mocked(auth).mockResolvedValue({
    user: { id: "u1", role, schoolId: "school1" },
  } as never)
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(getTenantContext).mockResolvedValue({
    schoolId: "school1",
  } as never)
})

describe("createHoliday", () => {
  it("stores both ends at noon school time, so each covers its whole day", async () => {
    signIn("ADMIN")
    const res = await createHoliday({
      title: "Eid al-Fitr",
      type: "HOLIDAY",
      from: "2026-03-20",
      until: "2026-03-22",
    })
    expect(res.success).toBe(true)
    const data = vi.mocked(db.scheduleException.create).mock.calls[0][0].data
    // Khartoum is UTC+2: noon local is 10:00Z on the same calendar day.
    expect(data.startDate).toEqual(new Date("2026-03-20T10:00:00Z"))
    expect(data.endDate).toEqual(new Date("2026-03-22T10:00:00Z"))
    expect(data).toMatchObject({
      schoolId: "school1",
      exceptionType: "HOLIDAY",
      isAllDay: true,
      affectsAllClasses: true,
    })
  })

  it("refuses an end before the start", async () => {
    signIn("ADMIN")
    const res = await createHoliday({
      title: "x",
      type: "HOLIDAY",
      from: "2026-03-22",
      until: "2026-03-20",
    })
    expect(res.success).toBe(false)
    expect(db.scheduleException.create).not.toHaveBeenCalled()
  })

  it("is for administrators only", async () => {
    signIn("TEACHER")
    const res = await createHoliday({
      title: "x",
      type: "HOLIDAY",
      from: "2026-03-20",
      until: "2026-03-20",
    })
    expect(res.success).toBe(false)
  })
})

describe("deleteHoliday", () => {
  it("only deletes this school's holiday rows", async () => {
    signIn("ADMIN")
    await deleteHoliday({ id: "h1" })
    expect(db.scheduleException.deleteMany).toHaveBeenCalledWith({
      where: {
        id: "h1",
        schoolId: "school1",
        exceptionType: { in: ["HOLIDAY", "CANCELLED"] },
      },
    })
  })
})
