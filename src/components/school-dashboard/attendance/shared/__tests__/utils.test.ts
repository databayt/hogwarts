// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { describe, expect, it } from "vitest"

import type { AttendanceRecord } from "../types"
import {
  calculateAttendancePercentage,
  calculateAttendanceStats,
  calculateDistance,
  calculateDuration,
  canEditAttendance,
  determineAttendanceStatus,
  formatDuration,
  generateAttendanceCSV,
  generateQRPayload,
  groupByMethod,
  groupByStatus,
  isLocationAccurate,
  isToday,
  sanitizeMacAddress,
  validateQRPayload,
} from "../utils"

const makeRecord = (
  overrides: Partial<AttendanceRecord> = {}
): AttendanceRecord => ({
  schoolId: "school-1",
  studentId: "stu-1",
  classId: "class-1",
  date: new Date("2025-01-15"),
  status: "PRESENT",
  method: "MANUAL",
  ...overrides,
})

describe("Attendance Shared Utils", () => {
  describe("calculateAttendanceStats", () => {
    it("returns zero stats for empty input", () => {
      const stats = calculateAttendanceStats([])
      expect(stats.total).toBe(0)
      expect(stats.attendanceRate).toBe(0)
    })

    it("counts each status correctly", () => {
      const records = [
        makeRecord({ status: "PRESENT" }),
        makeRecord({ status: "PRESENT" }),
        makeRecord({ status: "ABSENT" }),
        makeRecord({ status: "LATE" }),
        makeRecord({ status: "EXCUSED" }),
        makeRecord({ status: "SICK" }),
        makeRecord({ status: "HOLIDAY" }),
      ]
      const stats = calculateAttendanceStats(records)
      expect(stats.total).toBe(7)
      expect(stats.present).toBe(2)
      expect(stats.absent).toBe(1)
      expect(stats.late).toBe(1)
      expect(stats.excused).toBe(1)
      expect(stats.sick).toBe(1)
      expect(stats.holiday).toBe(1)
    })

    it("attendance rate counts present + late as 'attended'", () => {
      const records = [
        makeRecord({ status: "PRESENT" }),
        makeRecord({ status: "PRESENT" }),
        makeRecord({ status: "LATE" }),
        makeRecord({ status: "ABSENT" }),
      ]
      const stats = calculateAttendanceStats(records)
      // (2 present + 1 late) / 4 = 75%
      expect(stats.attendanceRate).toBe(75)
    })
  })

  describe("calculateDistance (Haversine)", () => {
    it("returns 0 for identical coordinates", () => {
      const d = calculateDistance(24.7136, 46.6753, 24.7136, 46.6753)
      expect(d).toBe(0)
    })

    it("calculates ~110.6km from Riyadh to Dirab", () => {
      // Riyadh to Dirab (~50km south)
      const d = calculateDistance(24.7136, 46.6753, 24.2876, 46.5847)
      expect(d).toBeGreaterThan(45_000)
      expect(d).toBeLessThan(60_000)
    })

    it("is symmetric: d(A,B) === d(B,A)", () => {
      const d1 = calculateDistance(24.7136, 46.6753, 24.72, 46.68)
      const d2 = calculateDistance(24.72, 46.68, 24.7136, 46.6753)
      expect(Math.abs(d1 - d2)).toBeLessThan(0.0001)
    })

    it("returns positive distance for any non-identical pair", () => {
      const d = calculateDistance(0, 0, 0, 1)
      expect(d).toBeGreaterThan(0)
    })
  })

  describe("calculateAttendancePercentage", () => {
    it("returns 0 when totalDays is 0 (avoid divide-by-zero)", () => {
      expect(calculateAttendancePercentage(5, 0)).toBe(0)
    })

    it("returns 100 when present === total", () => {
      expect(calculateAttendancePercentage(10, 10)).toBe(100)
    })

    it("rounds to nearest integer", () => {
      expect(calculateAttendancePercentage(2, 3)).toBe(67) // 66.66 → 67
    })
  })

  describe("calculateDuration", () => {
    it("returns null when checkOut undefined", () => {
      expect(calculateDuration(new Date())).toBeNull()
    })

    it("computes minutes diff", () => {
      const checkIn = new Date("2025-01-15T08:00:00Z")
      const checkOut = new Date("2025-01-15T14:30:00Z")
      expect(calculateDuration(checkIn, checkOut)).toBe(390)
    })

    it("accepts ISO strings", () => {
      expect(
        calculateDuration("2025-01-15T08:00:00Z", "2025-01-15T08:30:00Z")
      ).toBe(30)
    })
  })

  describe("determineAttendanceStatus", () => {
    const start = new Date("2025-01-15T08:00:00Z")

    it("returns PRESENT when on time or early", () => {
      expect(
        determineAttendanceStatus(new Date("2025-01-15T07:55:00Z"), start)
      ).toBe("PRESENT")
      expect(
        determineAttendanceStatus(new Date("2025-01-15T08:00:00Z"), start)
      ).toBe("PRESENT")
    })

    it("returns LATE within threshold", () => {
      expect(
        determineAttendanceStatus(new Date("2025-01-15T08:10:00Z"), start, 15)
      ).toBe("LATE")
    })

    it("returns ABSENT past threshold", () => {
      expect(
        determineAttendanceStatus(new Date("2025-01-15T08:30:00Z"), start, 15)
      ).toBe("ABSENT")
    })

    it("uses default threshold of 15 minutes", () => {
      expect(
        determineAttendanceStatus(new Date("2025-01-15T08:14:00Z"), start)
      ).toBe("LATE")
      expect(
        determineAttendanceStatus(new Date("2025-01-15T08:16:00Z"), start)
      ).toBe("ABSENT")
    })
  })

  describe("validateQRPayload", () => {
    it("validates a fresh payload", () => {
      const payload = generateQRPayload("class-1", 60)
      const result = validateQRPayload(payload)
      expect(result.valid).toBe(true)
      expect(result.classId).toBe("class-1")
    })

    it("rejects expired payload", () => {
      const payload = generateQRPayload("class-1", -1) // already expired
      const result = validateQRPayload(payload)
      expect(result.valid).toBe(false)
      expect(result.error).toContain("expired")
    })

    it("rejects malformed payload", () => {
      const result = validateQRPayload("not-base64!@#")
      expect(result.valid).toBe(false)
    })

    it("rejects payload missing classId", () => {
      const payload = btoa(JSON.stringify({ expiresAt: Date.now() + 60_000 }))
      const result = validateQRPayload(payload)
      expect(result.valid).toBe(false)
    })
  })

  describe("sanitizeMacAddress", () => {
    it("formats raw 12-char MAC", () => {
      expect(sanitizeMacAddress("aabbccddeeff")).toBe("AA:BB:CC:DD:EE:FF")
    })

    it("formats colon-separated MAC", () => {
      expect(sanitizeMacAddress("aa:bb:cc:dd:ee:ff")).toBe("AA:BB:CC:DD:EE:FF")
    })

    it("formats hyphen-separated MAC", () => {
      expect(sanitizeMacAddress("aa-bb-cc-dd-ee-ff")).toBe("AA:BB:CC:DD:EE:FF")
    })

    it("returns null when too few hex chars", () => {
      expect(sanitizeMacAddress("aabbcc")).toBeNull()
    })

    it("returns null when too many hex chars", () => {
      // 14 hex chars (non-hex stripped first, so all 14 here are hex)
      expect(sanitizeMacAddress("aabbccddeeff11")).toBeNull()
    })

    it("strips trailing non-hex and accepts when exactly 12 hex remain", () => {
      // "aabbccddeeffgg" — gg gets stripped, leaving 12 valid hex chars
      expect(sanitizeMacAddress("aabbccddeeffgg")).toBe("AA:BB:CC:DD:EE:FF")
    })

    it("strips non-hex characters before validating", () => {
      expect(sanitizeMacAddress("aa.bb.cc.dd.ee.ff")).toBe("AA:BB:CC:DD:EE:FF")
    })
  })

  describe("isLocationAccurate", () => {
    it("returns false for undefined", () => {
      expect(isLocationAccurate(undefined)).toBe(false)
    })

    it("returns true within 50m default threshold", () => {
      expect(isLocationAccurate(30)).toBe(true)
      expect(isLocationAccurate(50)).toBe(true)
    })

    it("returns false above default threshold", () => {
      expect(isLocationAccurate(100)).toBe(false)
    })

    it("respects custom threshold", () => {
      expect(isLocationAccurate(75, 100)).toBe(true)
      expect(isLocationAccurate(75, 50)).toBe(false)
    })
  })

  describe("canEditAttendance", () => {
    it("allows edit within 7 days by default", () => {
      const recent = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
      expect(canEditAttendance(recent)).toBe(true)
    })

    it("denies edit after 7 days", () => {
      const old = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)
      expect(canEditAttendance(old)).toBe(false)
    })

    it("respects custom maxEditDays", () => {
      const middle = new Date(Date.now() - 4 * 24 * 60 * 60 * 1000)
      expect(canEditAttendance(middle, 3)).toBe(false)
      expect(canEditAttendance(middle, 5)).toBe(true)
    })
  })

  describe("groupByStatus / groupByMethod", () => {
    it("groups records by status", () => {
      const records = [
        makeRecord({ studentId: "s1", status: "PRESENT" }),
        makeRecord({ studentId: "s2", status: "PRESENT" }),
        makeRecord({ studentId: "s3", status: "ABSENT" }),
      ]
      const groups = groupByStatus(records)
      expect(groups.PRESENT).toHaveLength(2)
      expect(groups.ABSENT).toHaveLength(1)
    })

    it("groups records by method", () => {
      const records = [
        makeRecord({ studentId: "s1", method: "MANUAL" }),
        makeRecord({ studentId: "s2", method: "QR_CODE" }),
        makeRecord({ studentId: "s3", method: "MANUAL" }),
      ]
      const groups = groupByMethod(records)
      expect(groups.MANUAL).toHaveLength(2)
      expect(groups.QR_CODE).toHaveLength(1)
    })
  })

  describe("formatDuration", () => {
    it("returns dash for null", () => {
      expect(formatDuration(null)).toBe("-")
    })

    it("formats minutes only", () => {
      expect(formatDuration(45)).toBe("45m")
    })

    it("formats hours and minutes", () => {
      expect(formatDuration(125)).toBe("2h 5m")
    })

    it("formats exact hours", () => {
      expect(formatDuration(120)).toBe("2h 0m")
    })
  })

  describe("isToday", () => {
    it("returns true for today's date", () => {
      expect(isToday(new Date())).toBe(true)
    })

    it("returns false for yesterday", () => {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)
      expect(isToday(yesterday)).toBe(false)
    })
  })

  describe("generateAttendanceCSV", () => {
    it("includes headers", () => {
      const csv = generateAttendanceCSV([])
      expect(csv).toContain("Student ID")
      expect(csv).toContain("Status")
      expect(csv).toContain("Method")
    })

    it("includes a row per record", () => {
      const csv = generateAttendanceCSV([
        makeRecord({ studentId: "s1", studentName: "Ali" }),
        makeRecord({ studentId: "s2", studentName: "Ben" }),
      ])
      expect(csv.split("\n")).toHaveLength(3) // header + 2 rows
      expect(csv).toContain("s1")
      expect(csv).toContain("s2")
    })
  })
})
