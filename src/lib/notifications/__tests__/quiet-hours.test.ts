// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { describe, expect, it } from "vitest"

import { isInQuietHours } from "@/lib/dispatch-notification"

describe("isInQuietHours", () => {
  it("returns false when both endpoints are null (preference not set)", () => {
    expect(isInQuietHours(2, null, null)).toBe(false)
    expect(isInQuietHours(15, null, 8)).toBe(false)
    expect(isInQuietHours(15, 22, null)).toBe(false)
  })

  it("returns false when start === end (treated as disabled)", () => {
    expect(isInQuietHours(22, 22, 22)).toBe(false)
    expect(isInQuietHours(0, 0, 0)).toBe(false)
  })

  describe("forward window (start < end)", () => {
    it("includes the start hour", () => {
      expect(isInQuietHours(8, 8, 18)).toBe(true)
    })

    it("excludes the end hour", () => {
      expect(isInQuietHours(18, 8, 18)).toBe(false)
    })

    it("includes hours inside the window", () => {
      expect(isInQuietHours(12, 8, 18)).toBe(true)
    })

    it("excludes hours outside the window", () => {
      expect(isInQuietHours(7, 8, 18)).toBe(false)
      expect(isInQuietHours(20, 8, 18)).toBe(false)
    })
  })

  describe("wraparound window (start > end — common 22→8 case)", () => {
    it("includes hours at or after start", () => {
      expect(isInQuietHours(22, 22, 8)).toBe(true)
      expect(isInQuietHours(23, 22, 8)).toBe(true)
    })

    it("includes hours before end (early morning)", () => {
      expect(isInQuietHours(0, 22, 8)).toBe(true)
      expect(isInQuietHours(7, 22, 8)).toBe(true)
    })

    it("excludes the end hour itself (exclusive)", () => {
      expect(isInQuietHours(8, 22, 8)).toBe(false)
    })

    it("excludes daytime hours between end and start", () => {
      expect(isInQuietHours(9, 22, 8)).toBe(false)
      expect(isInQuietHours(15, 22, 8)).toBe(false)
      expect(isInQuietHours(21, 22, 8)).toBe(false)
    })
  })
})
