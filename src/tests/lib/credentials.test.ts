// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { describe, expect, it } from "vitest"

import {
  generateTempPassword,
  hashToken,
  makeUniqueUsername,
  sanitizeUsername,
} from "@/lib/credentials"

// The login username schema (USERNAME_LOGIN_RE in auth/validation.ts).
const LOGIN_USERNAME_RE = /^[A-Za-z0-9._-]{3,64}$/

describe("generateTempPassword", () => {
  it("defaults to a 12-char password", () => {
    expect(generateTempPassword()).toHaveLength(12)
  })

  it("enforces a minimum length of 8", () => {
    expect(generateTempPassword(4).length).toBeGreaterThanOrEqual(8)
  })

  it("only uses the unambiguous alphabet (no 0/O/1/l/I)", () => {
    const pw = generateTempPassword(200)
    expect(pw).toMatch(/^[a-zA-Z0-9]+$/)
    expect(pw).not.toMatch(/[0O1lI]/)
  })

  it("is non-deterministic (crypto-random, not derivable)", () => {
    const set = new Set(
      Array.from({ length: 200 }, () => generateTempPassword())
    )
    // Collisions across 200 12-char draws are astronomically unlikely.
    expect(set.size).toBe(200)
  })
})

describe("sanitizeUsername", () => {
  it("strips spaces so the result passes the login schema", () => {
    const u = sanitizeUsername("Alice Johnson")
    expect(u).toBe("alice.johnson")
    expect(u).toMatch(LOGIN_USERNAME_RE)
  })

  it("returns '' for non-Latin (Arabic) names", () => {
    expect(sanitizeUsername("محمد أحمد")).toBe("")
  })

  it("returns '' for too-short input", () => {
    expect(sanitizeUsername("ab")).toBe("")
  })

  it("collapses invalid runs and trims separators", () => {
    expect(sanitizeUsername("  John   Q. Doe!! ")).toMatch(LOGIN_USERNAME_RE)
  })
})

describe("makeUniqueUsername", () => {
  it("produces a login-valid handle and reserves it", () => {
    const taken = new Set<string>()
    const u = makeUniqueUsername("Bob Wilson", taken, "t")
    expect(u).toMatch(LOGIN_USERNAME_RE)
    expect(taken.has(u)).toBe(true)
  })

  it("disambiguates collisions", () => {
    const taken = new Set<string>(["alice.johnson"])
    const u = makeUniqueUsername("Alice Johnson", taken, "t")
    expect(u).not.toBe("alice.johnson")
    expect(u).toMatch(LOGIN_USERNAME_RE)
  })

  it("falls back to a prefixed code for non-Latin names", () => {
    const taken = new Set<string>()
    const u = makeUniqueUsername("محمد أحمد", taken, "g")
    expect(u).toMatch(/^g\d{6}$/)
    expect(u).toMatch(LOGIN_USERNAME_RE)
  })
})

describe("hashToken", () => {
  it("is a deterministic 64-char sha256 hex", () => {
    const h = hashToken("mock-uuid-token")
    expect(h).toMatch(/^[a-f0-9]{64}$/)
    expect(hashToken("mock-uuid-token")).toBe(h)
  })

  it("never returns the raw token", () => {
    expect(hashToken("secret")).not.toBe("secret")
  })
})
