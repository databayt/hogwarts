// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { describe, expect, it } from "vitest"

import type { ComplianceAttendanceRecord } from "../../../types"
import { buildAdekCsv, categorizeForAdek } from "../mapper"

function makeRecord(
  overrides: Partial<ComplianceAttendanceRecord> = {}
): ComplianceAttendanceRecord {
  return {
    studentId: "s1",
    externalStudentRef: "esis-001",
    fullName: "Ahmed Hassan",
    status: "PRESENT",
    hasApprovedExcuse: false,
    rolling30dAbsencePct: 0,
    ...overrides,
  }
}

describe("ADEK absence-category mapper", () => {
  describe("categorizeForAdek", () => {
    it("LATE → LATE category", () => {
      expect(categorizeForAdek(makeRecord({ status: "LATE" }))).toBe("LATE")
    })

    it("ABSENT + approved excuse → AUTHORIZED", () => {
      expect(
        categorizeForAdek(
          makeRecord({ status: "ABSENT", hasApprovedExcuse: true })
        )
      ).toBe("AUTHORIZED")
    })

    it("ABSENT + no excuse + rolling 30d > 5% → CAUSE_FOR_CONCERN", () => {
      expect(
        categorizeForAdek(
          makeRecord({
            status: "ABSENT",
            hasApprovedExcuse: false,
            rolling30dAbsencePct: 7,
          })
        )
      ).toBe("CAUSE_FOR_CONCERN")
    })

    it("ABSENT + no excuse + rolling 30d exactly 5% → UNAUTHORIZED (not > 5)", () => {
      expect(
        categorizeForAdek(
          makeRecord({
            status: "ABSENT",
            hasApprovedExcuse: false,
            rolling30dAbsencePct: 5,
          })
        )
      ).toBe("UNAUTHORIZED")
    })

    it("ABSENT + no excuse + low rolling pct → UNAUTHORIZED", () => {
      expect(
        categorizeForAdek(
          makeRecord({
            status: "ABSENT",
            hasApprovedExcuse: false,
            rolling30dAbsencePct: 2,
          })
        )
      ).toBe("UNAUTHORIZED")
    })

    it("PRESENT → PRESENT", () => {
      expect(categorizeForAdek(makeRecord({ status: "PRESENT" }))).toBe(
        "PRESENT"
      )
    })

    it("EXCUSED → PRESENT (not an absence per ADEK)", () => {
      expect(categorizeForAdek(makeRecord({ status: "EXCUSED" }))).toBe(
        "PRESENT"
      )
    })

    it("SICK → PRESENT", () => {
      expect(categorizeForAdek(makeRecord({ status: "SICK" }))).toBe("PRESENT")
    })

    it("HOLIDAY → PRESENT", () => {
      expect(categorizeForAdek(makeRecord({ status: "HOLIDAY" }))).toBe(
        "PRESENT"
      )
    })
  })

  describe("buildAdekCsv", () => {
    const baseDate = new Date("2026-05-28T00:00:00Z")

    it("produces header + rows", () => {
      const result = buildAdekCsv({
        schoolId: "school-1",
        schoolName: "Yasmina BA",
        schoolExternalRef: "YBA-001",
        submissionDate: baseDate,
        records: [makeRecord()],
      })

      const lines = result.csv.split("\n").filter(Boolean)
      expect(lines[0]).toBe(
        "school_code,submission_date,student_id,full_name,category,minutes_late,notes"
      )
      expect(lines).toHaveLength(2)
    })

    it("uses ISO 8601 date in submission_date column", () => {
      const result = buildAdekCsv({
        schoolId: "school-1",
        schoolName: "Yasmina BA",
        schoolExternalRef: null,
        submissionDate: baseDate,
        records: [makeRecord()],
      })

      expect(result.csv).toContain("2026-05-28")
    })

    it("escapes commas and quotes in notes", () => {
      const result = buildAdekCsv({
        schoolId: "school-1",
        schoolName: "Yasmina BA",
        schoolExternalRef: null,
        submissionDate: baseDate,
        records: [makeRecord({ notes: 'comma, "and" quotes' })],
      })

      // Should be wrapped in quotes with escaped inner quotes
      expect(result.csv).toContain('"comma, ""and"" quotes"')
    })

    it("counts categories correctly", () => {
      const result = buildAdekCsv({
        schoolId: "school-1",
        schoolName: "Yasmina BA",
        schoolExternalRef: null,
        submissionDate: baseDate,
        records: [
          makeRecord({ status: "PRESENT" }),
          makeRecord({ status: "LATE" }),
          makeRecord({ status: "ABSENT" }), // UNAUTHORIZED
          makeRecord({ status: "ABSENT", hasApprovedExcuse: true }), // AUTHORIZED
          makeRecord({ status: "ABSENT", rolling30dAbsencePct: 10 }), // CAUSE_FOR_CONCERN
        ],
      })

      expect(result.categorized.PRESENT).toBe(1)
      expect(result.categorized.LATE).toBe(1)
      expect(result.categorized.UNAUTHORIZED).toBe(1)
      expect(result.categorized.AUTHORIZED).toBe(1)
      expect(result.categorized.CAUSE_FOR_CONCERN).toBe(1)
      expect(result.studentCount).toBe(5)
      expect(result.absentCount).toBe(3) // AUTH + UNAUTH + CFC
    })

    it("uses schoolId as fallback when externalRef is null", () => {
      const result = buildAdekCsv({
        schoolId: "school-fallback",
        schoolName: "X",
        schoolExternalRef: null,
        submissionDate: baseDate,
        records: [makeRecord()],
      })

      expect(result.csv).toContain("school-fallback")
    })

    it("uses external student ref when present, falls back to studentId", () => {
      const result = buildAdekCsv({
        schoolId: "s",
        schoolName: "X",
        schoolExternalRef: null,
        submissionDate: baseDate,
        records: [
          makeRecord({
            externalStudentRef: "esis-99",
            studentId: "internal-1",
          }),
          makeRecord({ externalStudentRef: null, studentId: "internal-2" }),
        ],
      })

      expect(result.csv).toContain("esis-99")
      expect(result.csv).toContain("internal-2")
    })

    it("sets minutes_late=1 for LATE category, 0 otherwise", () => {
      const result = buildAdekCsv({
        schoolId: "s",
        schoolName: "X",
        schoolExternalRef: null,
        submissionDate: baseDate,
        records: [
          makeRecord({ status: "LATE" }),
          makeRecord({ status: "PRESENT" }),
        ],
      })

      const rows = result.csv.split("\n").slice(1, 3)
      expect(rows[0]).toContain(",LATE,1,")
      expect(rows[1]).toContain(",PRESENT,0,")
    })
  })
})
