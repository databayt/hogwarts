// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import {
  checkRateLimit,
  clearRateLimit,
  generateQRSignature,
  generateSecureQRPayload,
  parseSecureQRPayload,
  recordScanFailure,
  verifyQRSignature,
  withScanProtection,
} from "../security"

// Each test gets a fresh identifier — the in-memory rate limit store is module-scoped
// so we use unique IDs per test to avoid cross-test pollution.

describe("Attendance Security — Rate Limiting", () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe("checkRateLimit", () => {
    it("returns not blocked for an unknown identifier", () => {
      const result = checkRateLimit("rl-fresh-1")
      expect(result.isBlocked).toBe(false)
      expect(result.remainingSeconds).toBe(0)
      expect(result.failureCount).toBe(0)
    })

    it("returns failureCount after recording failures", () => {
      const id = "rl-count-1"
      clearRateLimit(id)
      recordScanFailure(id)
      recordScanFailure(id)
      const result = checkRateLimit(id)
      expect(result.isBlocked).toBe(false)
      expect(result.failureCount).toBe(2)
    })
  })

  describe("recordScanFailure", () => {
    it("records first failure with 4 remaining attempts", () => {
      const id = "rl-first-1"
      clearRateLimit(id)
      const result = recordScanFailure(id)
      expect(result.isBlocked).toBe(false)
      expect(result.remainingAttempts).toBe(4)
      expect(result.blockedUntil).toBeNull()
    })

    it("blocks after 5 failures", () => {
      const id = "rl-block-1"
      clearRateLimit(id)
      // Failures 1-4: not blocked
      for (let i = 0; i < 4; i++) {
        const r = recordScanFailure(id)
        expect(r.isBlocked).toBe(false)
      }
      // Failure 5: blocked
      const final = recordScanFailure(id)
      expect(final.isBlocked).toBe(true)
      expect(final.remainingAttempts).toBe(0)
      expect(final.blockedUntil).toBeInstanceOf(Date)
    })

    it("checkRateLimit reports blocked after 5 failures", () => {
      const id = "rl-check-blocked"
      clearRateLimit(id)
      for (let i = 0; i < 5; i++) recordScanFailure(id)
      const status = checkRateLimit(id)
      expect(status.isBlocked).toBe(true)
      expect(status.remainingSeconds).toBeGreaterThan(0)
    })

    it("unblocks after the block duration expires (5 minutes)", () => {
      const id = "rl-unblock-1"
      clearRateLimit(id)
      vi.setSystemTime(new Date("2025-01-01T10:00:00Z"))
      for (let i = 0; i < 5; i++) recordScanFailure(id)
      expect(checkRateLimit(id).isBlocked).toBe(true)
      // Advance past 5 minute block
      vi.setSystemTime(new Date("2025-01-01T10:06:00Z"))
      const status = checkRateLimit(id)
      expect(status.isBlocked).toBe(false)
    })

    it("resets counter when 10-minute window expires", () => {
      const id = "rl-window-1"
      clearRateLimit(id)
      vi.setSystemTime(new Date("2025-01-01T10:00:00Z"))
      recordScanFailure(id)
      recordScanFailure(id)
      // Advance past window
      vi.setSystemTime(new Date("2025-01-01T10:11:00Z"))
      const result = recordScanFailure(id)
      expect(result.remainingAttempts).toBe(4) // Counter reset to 1
    })
  })

  describe("clearRateLimit", () => {
    it("clears counter for an identifier", () => {
      const id = "rl-clear-1"
      recordScanFailure(id)
      recordScanFailure(id)
      clearRateLimit(id)
      const status = checkRateLimit(id)
      expect(status.failureCount).toBe(0)
    })
  })
})

describe("Attendance Security — QR HMAC Signatures", () => {
  const data = {
    sessionId: "sess-1",
    schoolId: "school-1",
    classId: "class-1",
    expiresAt: Date.now() + 60_000,
  }

  beforeEach(() => {
    process.env.QR_CODE_SECRET = "test-secret-do-not-use-in-production"
  })

  afterEach(() => {
    delete process.env.QR_CODE_SECRET
  })

  describe("generateQRSignature", () => {
    it("generates a 64-character hex SHA-256 signature", () => {
      const sig = generateQRSignature(data)
      expect(sig).toMatch(/^[0-9a-f]{64}$/)
    })

    it("is deterministic for the same input", () => {
      expect(generateQRSignature(data)).toBe(generateQRSignature(data))
    })

    it("produces different signatures for different sessionId", () => {
      const a = generateQRSignature(data)
      const b = generateQRSignature({ ...data, sessionId: "other" })
      expect(a).not.toBe(b)
    })

    it("produces different signatures for different schoolId (tenant isolation)", () => {
      const a = generateQRSignature(data)
      const b = generateQRSignature({ ...data, schoolId: "other-school" })
      expect(a).not.toBe(b)
    })

    it("throws when QR_CODE_SECRET env var is missing", () => {
      delete process.env.QR_CODE_SECRET
      expect(() => generateQRSignature(data)).toThrow(/QR_CODE_SECRET/)
    })
  })

  describe("verifyQRSignature", () => {
    it("verifies a valid signature", () => {
      const sig = generateQRSignature(data)
      expect(verifyQRSignature(data, sig)).toBe(true)
    })

    it("rejects a tampered signature", () => {
      const sig = generateQRSignature(data)
      const tampered = sig.slice(0, -2) + "00"
      expect(verifyQRSignature(data, tampered)).toBe(false)
    })

    it("rejects when classId differs (cross-class spoof)", () => {
      const sig = generateQRSignature(data)
      expect(verifyQRSignature({ ...data, classId: "wrong-class" }, sig)).toBe(
        false
      )
    })

    it("rejects when schoolId differs (cross-tenant spoof)", () => {
      const sig = generateQRSignature(data)
      expect(
        verifyQRSignature({ ...data, schoolId: "other-school" }, sig)
      ).toBe(false)
    })
  })

  describe("generateSecureQRPayload + parseSecureQRPayload", () => {
    it("round-trips a valid payload", () => {
      const future = Date.now() + 60_000
      const payload = generateSecureQRPayload(
        "sess-2",
        "school-1",
        "class-1",
        future
      )
      const parsed = parseSecureQRPayload(payload)
      expect(parsed).toEqual({
        sessionId: "sess-2",
        schoolId: "school-1",
        classId: "class-1",
        expiresAt: future,
      })
    })

    it("returns null for malformed JSON", () => {
      expect(parseSecureQRPayload("not-json")).toBeNull()
    })

    it("returns null when signature is missing", () => {
      const payload = JSON.stringify({
        sessionId: "x",
        schoolId: "x",
        classId: "x",
        expiresAt: Date.now() + 1000,
      })
      expect(parseSecureQRPayload(payload)).toBeNull()
    })

    it("returns null when signature is forged", () => {
      const payload = JSON.stringify({
        sessionId: "x",
        schoolId: "x",
        classId: "x",
        expiresAt: Date.now() + 1000,
        sig: "0".repeat(64),
      })
      expect(parseSecureQRPayload(payload)).toBeNull()
    })

    it("returns null when payload is expired", () => {
      const past = Date.now() - 1000
      const payload = generateSecureQRPayload("s", "school", "class", past)
      expect(parseSecureQRPayload(payload)).toBeNull()
    })

    it("returns null when payload is tampered after signing", () => {
      const future = Date.now() + 60_000
      const payload = generateSecureQRPayload("s", "school", "class", future)
      const obj = JSON.parse(payload)
      obj.classId = "wrong-class" // Tamper
      expect(parseSecureQRPayload(JSON.stringify(obj))).toBeNull()
    })
  })
})

describe("Attendance Security — withScanProtection", () => {
  it("returns the operation result on success and clears rate limit", async () => {
    const id = "scan-success-1"
    clearRateLimit(id)
    recordScanFailure(id) // pre-existing failure
    const result = await withScanProtection(id, async () => ({
      success: true as const,
      data: { foo: "bar" },
    }))
    expect(result.success).toBe(true)
    // Failure should be cleared
    expect(checkRateLimit(id).failureCount).toBe(0)
  })

  it("records failure on operation failure", async () => {
    const id = "scan-fail-1"
    clearRateLimit(id)
    const result = await withScanProtection(id, async () => ({
      success: false as const,
      error: "bad",
    }))
    expect(result.success).toBe(false)
    expect(checkRateLimit(id).failureCount).toBe(1)
  })

  it("returns rateLimited:true when blocked", async () => {
    const id = "scan-blocked-1"
    clearRateLimit(id)
    for (let i = 0; i < 5; i++) recordScanFailure(id)

    const result = await withScanProtection(id, async () => ({
      success: true as const,
    }))
    expect(result.success).toBe(false)
    expect(result.rateLimited).toBe(true)
  })

  it("triggers block after 5 cumulative failures", async () => {
    const id = "scan-cumulative-1"
    clearRateLimit(id)
    for (let i = 0; i < 4; i++) {
      await withScanProtection(id, async () => ({
        success: false as const,
        error: "x",
      }))
    }
    // 5th failure → blocked in result
    const fifth = await withScanProtection(id, async () => ({
      success: false as const,
      error: "x",
    }))
    expect(fifth.rateLimited).toBe(true)
  })
})
