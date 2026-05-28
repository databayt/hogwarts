// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type {
  ComplianceAttendanceRecord,
  ComplianceSubmissionPayload,
} from "../../types"
import {
  ADEK_CSV_COLUMNS,
  type AdekAbsenceCode,
  type AdekCsvColumn,
} from "./csv-schema"

/**
 * Apply ADEK 2025/26 absence-category rules.
 *
 *   LATE              status === "LATE"
 *   AUTHORIZED        status === "ABSENT" AND excuse approved
 *   CAUSE_FOR_CONCERN status === "ABSENT" AND rolling-30d absence pct > 5%
 *   UNAUTHORIZED      status === "ABSENT" otherwise
 *   PRESENT           everything else (status PRESENT/EXCUSED/SICK/HOLIDAY)
 */
export function categorizeForAdek(
  record: ComplianceAttendanceRecord
): AdekAbsenceCode {
  if (record.status === "LATE") return "LATE"
  if (record.status === "ABSENT") {
    if (record.hasApprovedExcuse) return "AUTHORIZED"
    if (record.rolling30dAbsencePct > 5) return "CAUSE_FOR_CONCERN"
    return "UNAUTHORIZED"
  }
  return "PRESENT"
}

function escapeCsvField(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

export interface AdekCsvResult {
  csv: string
  categorized: Record<AdekAbsenceCode, number>
  absentCount: number
  studentCount: number
}

export function buildAdekCsv(
  payload: ComplianceSubmissionPayload
): AdekCsvResult {
  const categorized: Record<AdekAbsenceCode, number> = {
    AUTHORIZED: 0,
    UNAUTHORIZED: 0,
    CAUSE_FOR_CONCERN: 0,
    LATE: 0,
    PRESENT: 0,
  }
  const schoolCode = payload.schoolExternalRef ?? payload.schoolId
  const isoDate = payload.submissionDate.toISOString().slice(0, 10)

  const headerLine = ADEK_CSV_COLUMNS.join(",")
  const bodyLines: string[] = []

  let absentCount = 0
  for (const record of payload.records) {
    const category = categorizeForAdek(record)
    categorized[category] += 1
    if (
      category === "AUTHORIZED" ||
      category === "UNAUTHORIZED" ||
      category === "CAUSE_FOR_CONCERN"
    ) {
      absentCount += 1
    }
    const row: Record<AdekCsvColumn, string> = {
      school_code: schoolCode,
      submission_date: isoDate,
      student_id: record.externalStudentRef ?? record.studentId,
      full_name: record.fullName,
      category,
      minutes_late: category === "LATE" ? "1" : "0",
      notes: record.notes ?? "",
    }
    bodyLines.push(
      ADEK_CSV_COLUMNS.map((c) => escapeCsvField(row[c])).join(",")
    )
  }

  return {
    csv: [headerLine, ...bodyLines].join("\n") + "\n",
    categorized,
    absentCount,
    studentCount: payload.records.length,
  }
}
