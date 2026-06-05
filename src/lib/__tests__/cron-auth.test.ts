// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { afterEach, describe, expect, it } from "vitest"

import { verifyCronSecret } from "../cron-auth"

function reqWith(authorization?: string): Request {
  const headers = new Headers()
  if (authorization !== undefined) headers.set("authorization", authorization)
  return new Request("https://example.com/api/cron/x", { headers })
}

describe("verifyCronSecret", () => {
  const original = process.env.CRON_SECRET

  afterEach(() => {
    if (original === undefined) delete process.env.CRON_SECRET
    else process.env.CRON_SECRET = original
  })

  it("fails CLOSED when CRON_SECRET is unset — the live hole (CRON_SECRET empty in .env)", () => {
    delete process.env.CRON_SECRET
    // The old bare check `authHeader !== \`Bearer ${process.env.CRON_SECRET}\``
    // accepted exactly this request when the env var was missing.
    expect(verifyCronSecret(reqWith("Bearer undefined"))).toBe(false)
    expect(verifyCronSecret(reqWith("Bearer "))).toBe(false)
    expect(verifyCronSecret(reqWith())).toBe(false)
  })

  it("rejects 'Bearer undefined', wrong secrets, and a missing Bearer prefix when set", () => {
    process.env.CRON_SECRET = "s3cr3t-value"
    expect(verifyCronSecret(reqWith("Bearer undefined"))).toBe(false)
    expect(verifyCronSecret(reqWith("Bearer wrong-value-xx"))).toBe(false)
    expect(verifyCronSecret(reqWith("s3cr3t-value"))).toBe(false) // no "Bearer " prefix
    expect(verifyCronSecret(reqWith())).toBe(false)
  })

  it("accepts the correct Bearer secret", () => {
    process.env.CRON_SECRET = "s3cr3t-value"
    expect(verifyCronSecret(reqWith("Bearer s3cr3t-value"))).toBe(true)
  })
})
