import { describe, expect, it } from "vitest"
import { z } from "zod"

// Attendance validation schema tests
describe("Attendance Validation Schemas", () => {
  const attendanceStatusEnum = z.enum([
    "PRESENT",
    "ABSENT",
    "LATE",
    "EXCUSED",
    "HALF_DAY",
  ])

  const attendanceRecordSchema = z.object({
    studentId: z.string().min(1, "Student is required"),
    classId: z.string().min(1, "Class is required"),
    date: z.string().min(1, "Date is required"),
    status: attendanceStatusEnum,
    checkInTime: z.string().optional(),
    checkOutTime: z.string().optional(),
    remarks: z.string().optional(),
    recordedBy: z.string().optional(),
  })

  const bulkAttendanceSchema = z.object({
    classId: z.string().min(1, "Class is required"),
    date: z.string().min(1, "Date is required"),
    records: z
      .array(
        z.object({
          studentId: z.string().min(1),
          status: attendanceStatusEnum,
          remarks: z.string().optional(),
        })
      )
      .min(1, "At least one record is required"),
  })

  const getAttendanceSchema = z.object({
    page: z.number().int().positive().default(1),
    perPage: z.number().int().positive().max(100).default(20),
    studentId: z.string().optional(),
    classId: z.string().optional(),
    status: attendanceStatusEnum.optional(),
    dateFrom: z.string().optional(),
    dateTo: z.string().optional(),
  })

  const attendanceReportSchema = z.object({
    studentId: z.string().optional(),
    classId: z.string().optional(),
    startDate: z.string().min(1, "Start date is required"),
    endDate: z.string().min(1, "End date is required"),
    groupBy: z.enum(["DAY", "WEEK", "MONTH"]).default("DAY"),
  })

  describe("attendanceRecordSchema", () => {
    it("validates complete attendance record", () => {
      const validData = {
        studentId: "student-123",
        classId: "class-123",
        date: "2024-09-15",
        status: "PRESENT",
        checkInTime: "08:30",
        checkOutTime: "15:00",
        remarks: "On time",
        recordedBy: "teacher-123",
      }

      const result = attendanceRecordSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it("requires studentId, classId, date, and status", () => {
      const missingStudent = {
        classId: "class-123",
        date: "2024-09-15",
        status: "PRESENT",
      }

      const missingClass = {
        studentId: "student-123",
        date: "2024-09-15",
        status: "PRESENT",
      }

      const missingDate = {
        studentId: "student-123",
        classId: "class-123",
        status: "PRESENT",
      }

      const missingStatus = {
        studentId: "student-123",
        classId: "class-123",
        date: "2024-09-15",
      }

      expect(attendanceRecordSchema.safeParse(missingStudent).success).toBe(
        false
      )
      expect(attendanceRecordSchema.safeParse(missingClass).success).toBe(false)
      expect(attendanceRecordSchema.safeParse(missingDate).success).toBe(false)
      expect(attendanceRecordSchema.safeParse(missingStatus).success).toBe(
        false
      )
    })

    it("validates status enum", () => {
      const validStatuses = ["PRESENT", "ABSENT", "LATE", "EXCUSED", "HALF_DAY"]

      validStatuses.forEach((status) => {
        const data = {
          studentId: "s1",
          classId: "c1",
          date: "2024-09-15",
          status,
        }
        expect(attendanceRecordSchema.safeParse(data).success).toBe(true)
      })

      const invalidStatus = {
        studentId: "s1",
        classId: "c1",
        date: "2024-09-15",
        status: "INVALID",
      }
      expect(attendanceRecordSchema.safeParse(invalidStatus).success).toBe(
        false
      )
    })
  })

  describe("bulkAttendanceSchema", () => {
    it("validates bulk attendance data", () => {
      const validData = {
        classId: "class-123",
        date: "2024-09-15",
        records: [
          { studentId: "s1", status: "PRESENT" },
          { studentId: "s2", status: "ABSENT", remarks: "Sick" },
          { studentId: "s3", status: "LATE", remarks: "Traffic" },
        ],
      }

      const result = bulkAttendanceSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it("requires at least one record", () => {
      const emptyRecords = {
        classId: "class-123",
        date: "2024-09-15",
        records: [],
      }

      const result = bulkAttendanceSchema.safeParse(emptyRecords)
      expect(result.success).toBe(false)
    })

    it("validates each record in bulk", () => {
      const invalidRecord = {
        classId: "class-123",
        date: "2024-09-15",
        records: [
          { studentId: "s1", status: "PRESENT" },
          { studentId: "", status: "ABSENT" }, // Invalid: empty studentId
        ],
      }

      const result = bulkAttendanceSchema.safeParse(invalidRecord)
      expect(result.success).toBe(false)
    })
  })

  describe("getAttendanceSchema", () => {
    it("applies defaults for empty input", () => {
      const result = getAttendanceSchema.parse({})

      expect(result.page).toBe(1)
      expect(result.perPage).toBe(20)
    })

    it("accepts filter parameters", () => {
      const withFilters = {
        studentId: "student-123",
        classId: "class-123",
        status: "PRESENT",
        dateFrom: "2024-09-01",
        dateTo: "2024-09-30",
      }

      const result = getAttendanceSchema.safeParse(withFilters)
      expect(result.success).toBe(true)
    })

    it("validates pagination limits", () => {
      const tooMany = { perPage: 101 }
      const valid = { perPage: 50 }

      expect(getAttendanceSchema.safeParse(tooMany).success).toBe(false)
      expect(getAttendanceSchema.safeParse(valid).success).toBe(true)
    })
  })

  describe("attendanceReportSchema", () => {
    it("validates report parameters", () => {
      const validReport = {
        classId: "class-123",
        startDate: "2024-09-01",
        endDate: "2024-09-30",
        groupBy: "WEEK",
      }

      const result = attendanceReportSchema.safeParse(validReport)
      expect(result.success).toBe(true)
    })

    it("requires date range", () => {
      const missingStart = {
        classId: "class-123",
        endDate: "2024-09-30",
      }

      const missingEnd = {
        classId: "class-123",
        startDate: "2024-09-01",
      }

      expect(attendanceReportSchema.safeParse(missingStart).success).toBe(false)
      expect(attendanceReportSchema.safeParse(missingEnd).success).toBe(false)
    })

    it("validates groupBy enum", () => {
      const validGroups = ["DAY", "WEEK", "MONTH"]

      validGroups.forEach((groupBy) => {
        const data = {
          startDate: "2024-09-01",
          endDate: "2024-09-30",
          groupBy,
        }
        expect(attendanceReportSchema.safeParse(data).success).toBe(true)
      })
    })

    it("applies default groupBy", () => {
      const minimal = {
        startDate: "2024-09-01",
        endDate: "2024-09-30",
      }

      const result = attendanceReportSchema.parse(minimal)
      expect(result.groupBy).toBe("DAY")
    })
  })
})
