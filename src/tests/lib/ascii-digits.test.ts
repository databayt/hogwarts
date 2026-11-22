// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import bcrypt from "bcryptjs"
import { describe, expect, it } from "vitest"

import { toAsciiDigits } from "@/lib/ascii-digits"
import { passwordMatches } from "@/lib/password-match"
import { createLoginSchema, LoginSchema } from "@/components/auth/validation"
import type { Dictionary } from "@/components/internationalization/dictionaries"

describe("toAsciiDigits", () => {
  it("folds Arabic-Indic digits", () => {
    expect(toAsciiDigits("٢٦٠٠٩٩")).toBe("260099")
  })
  it("folds Eastern Arabic-Indic digits", () => {
    expect(toAsciiDigits("۸۵۸۵")).toBe("8585")
  })
  it("leaves ASCII, letters and mixed text alone", () => {
    expect(toAsciiDigits("8585")).toBe("8585")
    expect(toAsciiDigits("abc.def")).toBe("abc.def")
    expect(toAsciiDigits("ab٢٦x۸")).toBe("ab26x8")
  })
  it("handles the empty string", () => {
    expect(toAsciiDigits("")).toBe("")
  })
})

describe("login schemas with Arabic digits", () => {
  const dict = { messages: { validation: {} } } as unknown as Dictionary
  it("LoginSchema accepts an Arabic-digit username", () => {
    expect(
      LoginSchema.safeParse({ identifier: "٢٦٠٠٩٩", password: "x" }).success
    ).toBe(true)
  })
  it("createLoginSchema accepts an Arabic-digit username", () => {
    expect(
      createLoginSchema(dict).safeParse({ identifier: "٢٦٠٠٩٩", password: "x" })
        .success
    ).toBe(true)
  })
  it("still rejects junk", () => {
    expect(
      LoginSchema.safeParse({ identifier: "a b", password: "x" }).success
    ).toBe(false)
  })
})

describe("passwordMatches", () => {
  it("matches an ASCII hash typed in Arabic digits", async () => {
    const hash = await bcrypt.hash("8585", 4)
    expect(await passwordMatches("٨٥٨٥", hash)).toBe(true)
    expect(await passwordMatches("8585", hash)).toBe(true)
    expect(await passwordMatches("٨٥٨٦", hash)).toBe(false)
  })
  it("falls back to the raw string for a hash set in Arabic digits", async () => {
    const hash = await bcrypt.hash("٨٥٨٥", 4)
    expect(await passwordMatches("٨٥٨٥", hash)).toBe(true)
    expect(await passwordMatches("8585", hash)).toBe(false)
  })
})
