// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * uploadFile tenant-scoping tests.
 *
 * The upload action must NEVER trust a client-supplied schoolId. Applicants
 * (User.schoolId = null) upload to the school resolved server-side from the
 * request subdomain via getTenantContext(); a forged options.schoolId must be
 * ignored. The onboarding fallback (school owned via createdByUserId) and the
 * session-schoolId path must keep working unchanged.
 */
import { auth } from "@/auth"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import {
  getProvider,
  selectProvider,
} from "@/components/file/providers/factory"
import { uploadFile } from "@/components/file/upload/actions"

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}))

vi.mock("@/lib/db", () => ({
  db: {
    user: { findUnique: vi.fn() },
    school: { findFirst: vi.fn() },
    fileRecord: { create: vi.fn() },
  },
}))

vi.mock("@/lib/tenant-context", () => ({
  getTenantContext: vi.fn(),
}))

vi.mock("@/components/file/providers/factory", () => ({
  selectProvider: vi.fn(),
  getProvider: vi.fn(),
}))

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}))

const USER_ID = "user-1"

function makeFormData() {
  const formData = new FormData()
  formData.set(
    "file",
    new File(["dummy-content"], "transcript.pdf", { type: "application/pdf" })
  )
  return formData
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(auth).mockResolvedValue({
    user: { id: USER_ID, schoolId: null, role: "USER" },
  } as never)
  vi.mocked(selectProvider).mockReturnValue("s3" as never)
  vi.mocked(getProvider).mockReturnValue({
    upload: vi.fn().mockResolvedValue("https://cdn.example.com/key"),
  } as never)
  vi.mocked(db.fileRecord.create).mockResolvedValue({ id: "file-1" } as never)
  // Defaults: no session school, no owned school, no tenant context
  vi.mocked(db.user.findUnique).mockResolvedValue({ schoolId: null } as never)
  vi.mocked(db.school.findFirst).mockResolvedValue(null as never)
  vi.mocked(getTenantContext).mockResolvedValue({
    schoolId: null,
    requestId: "req-1",
    role: undefined,
    isPlatformAdmin: false,
  } as never)
})

describe("uploadFile tenant scoping", () => {
  it("ignores a client-supplied schoolId and uses the tenant context instead", async () => {
    vi.mocked(getTenantContext).mockResolvedValue({
      schoolId: "tenant-school",
      requestId: "req-1",
      role: undefined,
      isPlatformAdmin: false,
    } as never)

    const result = await uploadFile(makeFormData(), {
      category: "document",
      // Forged value a malicious client could send — must be ignored
      schoolId: "attacker-school",
    } as never)

    expect(result.success).toBe(true)
    expect(db.fileRecord.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ schoolId: "tenant-school" }),
    })
  })

  it("uses the session user's schoolId when present (no tenant lookup)", async () => {
    vi.mocked(db.user.findUnique).mockResolvedValue({
      schoolId: "session-school",
    } as never)

    const result = await uploadFile(makeFormData(), { category: "document" })

    expect(result.success).toBe(true)
    expect(getTenantContext).not.toHaveBeenCalled()
    expect(db.fileRecord.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ schoolId: "session-school" }),
    })
  })

  it("keeps the onboarding fallback (school owned via createdByUserId)", async () => {
    vi.mocked(db.school.findFirst).mockResolvedValue({
      id: "owned-school",
    } as never)

    const result = await uploadFile(makeFormData(), { category: "document" })

    expect(result.success).toBe(true)
    expect(getTenantContext).not.toHaveBeenCalled()
    expect(db.fileRecord.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ schoolId: "owned-school" }),
    })
  })

  it("fails when no school context can be resolved server-side", async () => {
    const result = await uploadFile(makeFormData(), { category: "document" })

    expect(result.success).toBe(false)
    expect(db.fileRecord.create).not.toHaveBeenCalled()
  })

  it("rejects unauthenticated callers", async () => {
    vi.mocked(auth).mockResolvedValue(null as never)

    const result = await uploadFile(makeFormData(), { category: "document" })

    expect(result.success).toBe(false)
    expect(db.fileRecord.create).not.toHaveBeenCalled()
  })
})
