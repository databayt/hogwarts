// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { auth } from "@/auth"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { getTenantContext } from "@/lib/tenant-context"
import { presignUpload } from "@/lib/upload/presign"
import {
  presignSubmissionUpload,
  submitAssignment,
} from "@/components/school-dashboard/listings/assignments/submit-actions"
import { submitAssignmentCore } from "@/components/school-dashboard/listings/assignments/submit-core"

vi.mock("@/auth", () => ({ auth: vi.fn() }))
vi.mock("@/lib/tenant-context", () => ({ getTenantContext: vi.fn() }))
vi.mock("@/lib/upload/presign", () => ({ presignUpload: vi.fn() }))
vi.mock("@/lib/tenant-storage", () => ({
  isTenantStorageUrl: (url: string, schoolId: string) =>
    url.startsWith(`https://bucket.example/attachments/${schoolId}/`),
}))
vi.mock(
  "@/components/school-dashboard/listings/assignments/submit-core",
  async (orig) => ({
    ...(await orig<object>()),
    submitAssignmentCore: vi.fn(async () => ({
      status: "submitted",
      submissionStatus: "SUBMITTED",
    })),
  })
)

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

describe("submitAssignment — attachments", () => {
  it("accepts this school's stored files", async () => {
    signIn("STUDENT")
    const res = await submitAssignment({
      assignmentId: "a1",
      attachments: ["https://bucket.example/attachments/school1/x/work.jpg"],
    })
    expect(res.success).toBe(true)
    expect(submitAssignmentCore).toHaveBeenCalled()
  })

  // A bare .url() admitted a javascript: link or another school's object,
  // and the teacher is the one who opens it.
  it("refuses a link that is not this school's object", async () => {
    signIn("STUDENT")
    for (const url of [
      "javascript:alert(1)",
      "https://evil.example/x.pdf",
      "https://bucket.example/attachments/other-school/x/work.jpg",
    ]) {
      const res = await submitAssignment({
        assignmentId: "a1",
        attachments: [url],
      })
      expect(res.success).toBe(false)
    }
    expect(submitAssignmentCore).not.toHaveBeenCalled()
  })
})

describe("presignSubmissionUpload", () => {
  it("is for students only", async () => {
    signIn("TEACHER")
    const res = await presignSubmissionUpload({
      assignmentId: "a1",
      filename: "w.pdf",
      contentType: "application/pdf",
      size: 10,
    })
    expect(res.success).toBe(false)
    expect(presignUpload).not.toHaveBeenCalled()
  })

  it("presigns an attachment under the school and assignment", async () => {
    signIn("STUDENT")
    vi.mocked(presignUpload).mockResolvedValue({
      ok: true,
      presignedUrl: "https://put",
      finalUrl: "https://bucket.example/attachments/school1/x/w.pdf",
      key: "k",
      expiresIn: 900,
    })
    const res = await presignSubmissionUpload({
      assignmentId: "a1",
      filename: "w.pdf",
      contentType: "application/pdf",
      size: 10,
    })
    expect(res).toEqual({
      success: true,
      data: {
        uploadUrl: "https://put",
        fileUrl: "https://bucket.example/attachments/school1/x/w.pdf",
      },
    })
    expect(presignUpload).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: "attachment",
        schoolId: "school1",
        scope: "submissions-a1",
      })
    )
  })
})
