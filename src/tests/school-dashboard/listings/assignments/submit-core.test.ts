// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * The first student-side assignment write the block has had. Every gate is a
 * real leak if skipped: a student handing in for a class they are not in, a
 * re-submission erasing a grade, a replay of old work overwriting new.
 */

import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { submitAssignmentCore } from "@/components/school-dashboard/listings/assignments/submit-core"

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))
vi.mock("@/lib/db", () => ({
  db: {
    student: { findFirst: vi.fn() },
    schoolAssignment: { findFirst: vi.fn() },
    studentClass: { findFirst: vi.fn() },
    assignmentSubmission: { findUnique: vi.fn(), upsert: vi.fn() },
  },
}))

const m = <T>(fn: T) => fn as unknown as ReturnType<typeof vi.fn>
const mStudent = m(db.student.findFirst)
const mAssignment = m(db.schoolAssignment.findFirst)
const mMember = m(db.studentClass.findFirst)
const mExisting = m(db.assignmentSubmission.findUnique)
const mUpsert = m(db.assignmentSubmission.upsert)

const DUE = new Date("2026-09-01T12:00:00Z")

const base = {
  userId: "u1",
  schoolId: "school-1",
  assignmentId: "a1",
  content: "my essay",
  attachments: [] as string[],
}

beforeEach(() => {
  vi.clearAllMocks()
  mStudent.mockResolvedValue({ id: "stu-1" })
  mAssignment.mockResolvedValue({
    id: "a1",
    classId: "class-1",
    dueDate: DUE,
    status: "PUBLISHED",
  })
  mMember.mockResolvedValue({ id: "sc-1" })
  mExisting.mockResolvedValue(null)
  mUpsert.mockResolvedValue({ id: "sub-1" })
})

describe("submitAssignmentCore", () => {
  it("gates on student record, assignment in this school, publication, and class membership", async () => {
    mStudent.mockResolvedValueOnce(null)
    expect(
      await submitAssignmentCore({ ...base, submittedAt: new Date() })
    ).toEqual({ status: "notStudent" })

    mAssignment.mockResolvedValueOnce(null)
    expect(
      await submitAssignmentCore({ ...base, submittedAt: new Date() })
    ).toEqual({ status: "notFound" })
    expect(mAssignment).toHaveBeenLastCalledWith(
      expect.objectContaining({ where: { id: "a1", schoolId: "school-1" } })
    )

    mAssignment.mockResolvedValueOnce({
      id: "a1",
      classId: "class-1",
      dueDate: DUE,
      status: "DRAFT",
    })
    expect(
      await submitAssignmentCore({ ...base, submittedAt: new Date() })
    ).toEqual({ status: "notOpen" })

    mMember.mockResolvedValueOnce(null)
    expect(
      await submitAssignmentCore({ ...base, submittedAt: new Date() })
    ).toEqual({ status: "notInClass" })

    expect(mUpsert).not.toHaveBeenCalled()
  })

  it("never overwrites graded work", async () => {
    mExisting.mockResolvedValueOnce({
      status: "GRADED",
      submittedAt: new Date("2026-08-20T00:00:00Z"),
    })
    expect(
      await submitAssignmentCore({ ...base, submittedAt: new Date() })
    ).toEqual({ status: "alreadyGraded" })
    expect(mUpsert).not.toHaveBeenCalled()
  })

  it("ignores a replay older than the submission on file", async () => {
    mExisting.mockResolvedValueOnce({
      status: "SUBMITTED",
      submittedAt: new Date("2026-08-29T10:00:00Z"),
    })
    expect(
      await submitAssignmentCore({
        ...base,
        submittedAt: new Date("2026-08-28T10:00:00Z"),
      })
    ).toEqual({ status: "stale" })
    expect(mUpsert).not.toHaveBeenCalled()
  })

  it("marks SUBMITTED before the due date and LATE_SUBMITTED after it, scoped by school", async () => {
    let r = await submitAssignmentCore({
      ...base,
      submittedAt: new Date("2026-08-30T00:00:00Z"),
    })
    expect(r).toEqual({ status: "submitted", submissionStatus: "SUBMITTED" })

    r = await submitAssignmentCore({
      ...base,
      submittedAt: new Date("2026-09-02T00:00:00Z"),
    })
    expect(r).toEqual({
      status: "submitted",
      submissionStatus: "LATE_SUBMITTED",
    })

    const call = mUpsert.mock.calls[1][0]
    expect(call.where).toEqual({
      schoolId_assignmentId_studentId: {
        schoolId: "school-1",
        assignmentId: "a1",
        studentId: "stu-1",
      },
    })
    expect(call.create).toMatchObject({
      schoolId: "school-1",
      status: "LATE_SUBMITTED",
      content: "my essay",
    })
    expect(call.select).toEqual({ id: true })
  })
})
