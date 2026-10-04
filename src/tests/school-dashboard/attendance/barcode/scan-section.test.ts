// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { auth } from "@/auth"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import { processBarcodeScan } from "@/components/school-dashboard/attendance/barcode/actions"

vi.mock("@/lib/db", () => ({
  db: {
    studentIdentifier: { findFirst: vi.fn(), update: vi.fn() },
    attendance: { findFirst: vi.fn(), create: vi.fn(), update: vi.fn() },
    attendanceEvent: { create: vi.fn() },
  },
}))
vi.mock("@/auth", () => ({ auth: vi.fn() }))
vi.mock("@/lib/tenant-context", () => ({ getTenantContext: vi.fn() }))
vi.mock("@/lib/refresh-page", () => ({ refreshPage: vi.fn() }))

const SCHOOL = "school-1"

const scan = (sectionId?: string) =>
  processBarcodeScan({
    barcode: "BC-0001",
    sectionId,
    scannedAt: new Date().toISOString(),
    deviceId: `desk-${Math.random()}`,
  })

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(auth).mockResolvedValue({
    user: { id: "user-1", schoolId: SCHOOL, role: "STAFF" },
  } as never)
  vi.mocked(getTenantContext).mockResolvedValue({
    schoolId: SCHOOL,
    subdomain: "demo",
    role: "STAFF",
    locale: "en",
  } as never)
  vi.mocked(db.studentIdentifier.findFirst).mockResolvedValue({
    id: "ident-1",
    studentId: "stu-1",
    expiresAt: null,
    student: { firstName: "Sara", lastName: "Ali", sectionId: "7a" },
  } as never)
  vi.mocked(db.attendance.findFirst).mockResolvedValue(null)
  vi.mocked(db.attendance.create).mockResolvedValue({
    id: "att-1",
    status: "PRESENT",
  } as never)
})

describe("processBarcodeScan", () => {
  it("records the day on the student's own section, with no section picked", async () => {
    const result = await scan()

    expect(result.success).toBe(true)
    expect(
      vi.mocked(db.attendance.findFirst).mock.calls[0][0]!.where
    ).toMatchObject({
      schoolId: SCHOOL,
      studentId: "stu-1",
      sectionId: "7a",
      periodId: null,
    })
    const data = vi.mocked(db.attendance.create).mock.calls[0][0].data
    expect(data).toMatchObject({
      schoolId: SCHOOL,
      studentId: "stu-1",
      sectionId: "7a",
      method: "BARCODE",
    })
    expect(data).not.toHaveProperty("classId")
  })

  it("takes a student of the section the scanner is set to", async () => {
    expect((await scan("7a")).success).toBe(true)
  })

  it("refuses a student of another section", async () => {
    const result = await scan("7b")

    expect(result.success).toBe(false)
    expect(db.attendance.create).not.toHaveBeenCalled()
  })
})
