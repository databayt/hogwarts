// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { beforeEach, describe, expect, it, vi } from "vitest"

import { presignUpload } from "@/lib/upload/presign"
import { checkSchoolVideoQuota } from "@/components/lumos/lib/quota"

vi.mock("@/lib/s3", () => ({ getS3Client: vi.fn(() => ({})) }))
vi.mock("@aws-sdk/s3-request-presigner", () => ({
  getSignedUrl: vi.fn(async () => "https://signed.example/put"),
}))
vi.mock("@aws-sdk/client-s3", () => ({
  PutObjectCommand: class {
    constructor(public input: unknown) {}
  },
}))
vi.mock("@/components/lumos/lib/quota", () => ({
  checkSchoolVideoQuota: vi.fn(async () => ({ allowed: true })),
}))

beforeEach(() => {
  vi.clearAllMocks()
  vi.stubEnv("AWS_S3_BUCKET", "bucket")
  vi.stubEnv("AWS_REGION", "me-south-1")
  vi.stubEnv("CLOUDFRONT_DOMAIN", "cdn.example.com")
})

describe("presignUpload", () => {
  it("attachment: tenant + scope prefixed key, raw S3 file URL", async () => {
    const out = await presignUpload({
      kind: "attachment",
      schoolId: "school-1",
      filename: "my homework (1).pdf",
      contentType: "application/pdf",
      size: 1024,
      scope: "user-1",
    })
    expect(out.ok).toBe(true)
    if (!out.ok) return
    expect(out.key).toMatch(
      /^attachments\/school-1\/user-1\/\d+_my_homework__1_\.pdf$/
    )
    expect(out.finalUrl).toBe(
      `https://bucket.s3.me-south-1.amazonaws.com/${out.key}`
    )
    expect(out.presignedUrl).toBe("https://signed.example/put")
  })

  it("payment_proof keeps its CDN file URL shape", async () => {
    const out = await presignUpload({
      kind: "payment_proof",
      schoolId: "school-1",
      filename: "r.png",
      contentType: "image/png",
      size: 10,
      scope: "fa-1",
    })
    expect(out.ok && out.finalUrl).toMatch(
      /^https:\/\/cdn\.example\.com\/payment-proof\/school-1\/fa-1\//
    )
  })

  it("refuses a type outside the kind's allowlist and an oversize file", async () => {
    expect(
      await presignUpload({
        kind: "attachment",
        schoolId: "s",
        filename: "x.exe",
        contentType: "application/x-msdownload",
        size: 10,
      })
    ).toMatchObject({ ok: false, status: 400 })
    expect(
      await presignUpload({
        kind: "payment_proof",
        schoolId: "s",
        filename: "x.pdf",
        contentType: "application/pdf",
        size: 11 * 1024 * 1024,
      })
    ).toMatchObject({ ok: false, status: 400 })
  })

  it("needs a school for non-video kinds; 400 on missing fields", async () => {
    expect(
      await presignUpload({
        kind: "attachment",
        schoolId: null,
        filename: "a.pdf",
        contentType: "application/pdf",
        size: 1,
      })
    ).toMatchObject({ ok: false, status: 400 })
    expect(
      await presignUpload({
        kind: "attachment",
        schoolId: "s",
        filename: undefined,
        contentType: "application/pdf",
        size: 1,
      })
    ).toMatchObject({ ok: false, status: 400 })
  })

  it("video: quota pre-check refuses with 413", async () => {
    vi.mocked(checkSchoolVideoQuota).mockResolvedValueOnce({
      allowed: false,
    } as never)
    expect(
      await presignUpload({
        kind: "video",
        schoolId: "school-1",
        filename: "v.mp4",
        contentType: "video/mp4",
        size: 100,
      })
    ).toMatchObject({ ok: false, status: 413 })
  })
})
