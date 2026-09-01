// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { sendEmail } from "@/lib/email"
import {
  captureFromChat,
  extractIdentifiers,
  normalizeDigits,
  toE164,
} from "@/components/chatbot/capture"

vi.mock("@/lib/db", () => ({
  db: { prospect: { findUnique: vi.fn(), upsert: vi.fn() } },
}))
vi.mock("@/lib/email", () => ({ sendEmail: vi.fn() }))

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
    expect(
      extractIdentifiers("راسلوني على Principal@School.SD شكراً").email
    ).toBe("principal@school.sd")
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

describe("captureFromChat — create-only alert dedup", () => {
  const msg = (text: string) => [{ role: "user", content: text }]
  const findUnique = vi.mocked(db.prospect.findUnique)
  const upsert = vi.mocked(db.prospect.upsert)
  const mail = vi.mocked(sendEmail)

  beforeEach(() => {
    vi.clearAllMocks()
    upsert.mockResolvedValue({} as never)
    mail.mockResolvedValue({ success: true } as never)
  })

  it("notifies exactly once for a NEW lead", async () => {
    findUnique.mockResolvedValue(null as never)
    await captureFromChat({ messages: msg("رقمي ٠٩١٢٣٠٣٨٦٥"), locale: "ar" })
    expect(upsert).toHaveBeenCalledTimes(1)
    expect(mail).toHaveBeenCalledTimes(1)
    expect(mail.mock.calls[0][0].subject).toContain("+249912303865")
  })

  it("does NOT notify again when the lead already exists", async () => {
    findUnique.mockResolvedValue({ id: "p1" } as never)
    await captureFromChat({ messages: msg("call +249912303865"), locale: "en" })
    expect(upsert).toHaveBeenCalledTimes(1) // context still lands on the row
    expect(mail).not.toHaveBeenCalled()
  })

  it("touches nothing when no identifier is present", async () => {
    await captureFromChat({ messages: msg("كم السعر؟"), locale: "ar" })
    expect(findUnique).not.toHaveBeenCalled()
    expect(upsert).not.toHaveBeenCalled()
    expect(mail).not.toHaveBeenCalled()
  })

  it("survives a mail failure — capture never throws", async () => {
    findUnique.mockResolvedValue(null as never)
    mail.mockRejectedValue(new Error("resend down"))
    await expect(
      captureFromChat({ messages: msg("info@school.sd"), locale: "en" })
    ).resolves.toBeUndefined()
    expect(upsert).toHaveBeenCalledTimes(1)
  })
})
