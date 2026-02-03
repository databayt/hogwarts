import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import {
  getAttendanceReportCsv,
  markAttendance,
} from "@/components/school-dashboard/attendance/actions"

// Mock dependencies - must be inside vi.mock factory to avoid hoisting issues
vi.mock("@/lib/db", () => ({
  db: {
    attendance: {
      create: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      upsert: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
      count: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}))

vi.mock("@/lib/tenant-context", () => ({
  getTenantContext: vi.fn(),
}))

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}))

describe("Attendance Actions", () => {
  const mockSchoolId = "school-123"

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getTenantContext).mockResolvedValue({
      schoolId: mockSchoolId,
      subdomain: "test-school",
      role: "TEACHER",
      locale: "en",
    })
  })

  describe("markAttendance", () => {
    it("maps present|absent|late to enum and upserts per record", async () => {
      vi.mocked(db.attendance.upsert).mockResolvedValue({} as any)

      await markAttendance({
        classId: "c1",
        date: new Date().toISOString(),
        records: [
          { studentId: "a", status: "present" },
          { studentId: "b", status: "late" },
        ],
      })

      expect(db.attendance.upsert).toHaveBeenCalledTimes(2)
      const calls = vi.mocked(db.attendance.upsert).mock.calls
      expect(calls[0][0].where.schoolId_studentId_classId_date.schoolId).toBe(
        mockSchoolId
      )
      expect(calls[0][0].create.status).toBe("PRESENT")
      expect(calls[1][0].create.status).toBe("LATE")
    })
  })

  describe("getAttendanceReportCsv", () => {
    it("generates CSV string from rows", async () => {
      vi.mocked(db.attendance.findMany).mockResolvedValue([
        {
          date: new Date("2024-01-01"),
          studentId: "stu1",
          classId: "c1",
          status: "PRESENT",
        },
      ] as any)

      const csv = await getAttendanceReportCsv({ classId: "c1" })

      expect(csv).toContain("date")
      expect(csv).toContain("studentId")
      expect(csv).toContain("stu1")
    })
  })
})
