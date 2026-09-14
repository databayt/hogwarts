// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { NextRequest, NextResponse } from "next/server"
import { beforeEach, describe, expect, it, vi } from "vitest"

const { presignUpload } = vi.hoisted(() => ({ presignUpload: vi.fn() }))

vi.mock("@/lib/upload/presign", () => ({ presignUpload }))
vi.mock("@/app/api/mobile/lib/authenticate", () => ({
  authenticate: vi.fn(),
  isAuthError: (r: unknown) => r instanceof NextResponse,
}))

async function authAs(role: string) {
  const auth = await import("@/app/api/mobile/lib/authenticate")
  vi.mocked(auth.authenticate).mockResolvedValue({
    userId: "user-1",
    email: "u@e.com",
    schoolId: "school-1",
    role,
  })
}

const post = (body: unknown) =>
  new NextRequest("http://localhost/api/mobile/upload/presign", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { Authorization: "Bearer test" },
  })

beforeEach(() => {
  vi.clearAllMocks()
})

describe("POST /api/mobile/upload/presign", () => {
  it("401 when unauthenticated", async () => {
    const auth = await import("@/app/api/mobile/lib/authenticate")
    vi.mocked(auth.authenticate).mockResolvedValue(
      NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    )
    const { POST } = await import("@/app/api/mobile/upload/presign/route")
    expect((await POST(post({}))).status).toBe(401)
  })

  it("400 for an unknown purpose; 403 for a student uploading video", async () => {
    await authAs("STUDENT")
    const { POST } = await import("@/app/api/mobile/upload/presign/route")
    expect((await POST(post({ purpose: "avatar" }))).status).toBe(400)
    expect((await POST(post({ purpose: "video" }))).status).toBe(403)
    expect(presignUpload).not.toHaveBeenCalled()
  })

  it("attachment is scoped to the bearer school and user", async () => {
    await authAs("STUDENT")
    presignUpload.mockResolvedValue({
      ok: true,
      presignedUrl: "https://put",
      finalUrl: "https://bucket.s3/attachments/school-1/user-1/1_a.pdf",
      key: "attachments/school-1/user-1/1_a.pdf",
      expiresIn: 900,
    })
    const { POST } = await import("@/app/api/mobile/upload/presign/route")
    const res = await POST(
      post({
        purpose: "attachment",
        filename: "a.pdf",
        content_type: "application/pdf",
        size: 100,
        scope: "someone-else",
      })
    )
    expect(presignUpload).toHaveBeenCalledWith({
      kind: "attachment",
      schoolId: "school-1",
      filename: "a.pdf",
      contentType: "application/pdf",
      size: 100,
      scope: "user-1",
    })
    expect(await res.json()).toEqual({
      upload_url: "https://put",
      file_url: "https://bucket.s3/attachments/school-1/user-1/1_a.pdf",
      key: "attachments/school-1/user-1/1_a.pdf",
      expires_in: 900,
      method: "PUT",
      headers: { "Content-Type": "application/pdf" },
    })
  })

  it("passes the core's refusal through", async () => {
    await authAs("GUARDIAN")
    presignUpload.mockResolvedValue({
      ok: false,
      status: 400,
      error: "Invalid content type: text/html",
    })
    const { POST } = await import("@/app/api/mobile/upload/presign/route")
    const res = await POST(
      post({
        purpose: "payment_proof",
        filename: "x.html",
        content_type: "text/html",
        size: 1,
      })
    )
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({
      error: "Invalid content type: text/html",
    })
  })
})
