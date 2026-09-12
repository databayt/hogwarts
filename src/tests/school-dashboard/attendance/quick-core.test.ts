// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { describe, expect, it } from "vitest"

import {
  partitionRoster,
  quickSubmitSchema,
} from "@/components/school-dashboard/attendance/actions/quick-core"

// The pure half of quick attendance — shared by the online action and the
// offline sync replay. The DB half (ownership, stale check, markAttendance)
// is covered by actions.integration.test.ts against a real schema.

describe("partitionRoster", () => {
  const roster = ["s1", "s2", "s3", "s4"]

  it("marks everyone present except the listed absent and late students", () => {
    const { records, absentSet, lateSet } = partitionRoster(
      roster,
      ["s2"],
      ["s4"]
    )
    expect(records).toEqual([
      { studentId: "s1", status: "present" },
      { studentId: "s2", status: "absent" },
      { studentId: "s3", status: "present" },
      { studentId: "s4", status: "late" },
    ])
    expect([...absentSet]).toEqual(["s2"])
    expect([...lateSet]).toEqual(["s4"])
  })

  it("drops a studentId that is not on the section roster", () => {
    const { records, absentSet } = partitionRoster(roster, ["s2", "foreign"], [])
    expect(absentSet.has("foreign")).toBe(false)
    expect(records.map((r) => r.studentId)).toEqual(roster)
  })

  it("counts a student in both lists as absent, never late", () => {
    const { absentSet, lateSet, records } = partitionRoster(
      roster,
      ["s3"],
      ["s3"]
    )
    expect(absentSet.has("s3")).toBe(true)
    expect(lateSet.has("s3")).toBe(false)
    expect(records.find((r) => r.studentId === "s3")?.status).toBe("absent")
  })

  it("is idempotent — the same input always yields the same records", () => {
    const a = partitionRoster(roster, ["s1"], ["s2"])
    const b = partitionRoster(roster, ["s1"], ["s2"])
    expect(a.records).toEqual(b.records)
  })
})

describe("quickSubmitSchema — the outbox payload", () => {
  it("accepts the payload the quick surface enqueues offline", () => {
    const parsed = quickSubmitSchema.parse({
      sectionId: "sec1",
      date: "2026-09-12",
      absentStudentIds: ["s2"],
    })
    expect(parsed.lateStudentIds).toEqual([])
  })

  it("rejects a payload without a section", () => {
    expect(() =>
      quickSubmitSchema.parse({ date: "2026-09-12", absentStudentIds: [] })
    ).toThrow()
  })
})
