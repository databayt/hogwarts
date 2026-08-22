// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { describe, expect, it } from "vitest"

import {
  extractIdentifiers,
  normalizeDigits,
  toE164,
} from "@/components/chatbot/capture"

describe("normalizeDigits", () => {
  it("converts Arabic-Indic and Eastern Arabic-Indic digits", () => {
    expect(normalizeDigits("٠٩١٢٣٠٣٨٦٥")).toBe("0912303865")
    expect(normalizeDigits("۰۹۱۲")).toBe("0912")
    expect(normalizeDigits("no digits")).toBe("no digits")
  })
})

describe("toE164", () => {
  it("accepts international forms", () => {
    expect(toE164("+249 91 230 3865")).toBe("+249912303865")
    expect(toE164("00966557411272")).toBe("+966557411272")
    expect(toE164("249912303865")).toBe("+249912303865")
  })
  it("expands the local mobile forms it knows", () => {
    expect(toE164("0912303865")).toBe("+249912303865")
    expect(toE164("0557411272")).toBe("+966557411272")
  })
  it("returns null rather than guess", () => {
    // Khartoum landline in local form — country unknown, not guessable
    expect(toE164("0183215000")).toBeNull()
    expect(toE164("12345")).toBeNull()
  })
})

describe("extractIdentifiers", () => {
  it("finds an email and lowercases it", () => {
    expect(extractIdentifiers("راسلوني على Principal@School.SD شكراً").email).toBe(
      "principal@school.sd"
    )
  })
  it("finds a phone written in Arabic-Indic digits", () => {
    const found = extractIdentifiers("رقمي ٠٩١٢٣٠٣٨٦٥ اتصلوا بي")
    expect(found.phone).toBe("+249912303865")
  })
  it("finds a phone with separators", () => {
    expect(extractIdentifiers("call +966 55-741-1272 please").phone).toBe(
      "+966557411272"
    )
  })
  it("returns nulls on plain questions", () => {
    const found = extractIdentifiers("كم سعر المنصة لمدرسة فيها ٢٠٠ طالب؟")
    expect(found.email).toBeNull()
    expect(found.phone).toBeNull()
  })
})
