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
  db: {
    prospect: { findFirst: vi.fn(), create: vi.fn(), update: vi.fn() },
  },
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

describe("captureFromChat — one lead, one row, never regressed", () => {
  const msg = (...texts: string[]) =>
    texts.map((content) => ({ role: "user", content }))
  const findFirst = vi.mocked(db.prospect.findFirst)
  const create = vi.mocked(db.prospect.create)
  const update = vi.mocked(db.prospect.update)
  const mail = vi.mocked(sendEmail)
  const row = (over: Record<string, unknown> = {}) =>
    ({
      id: "p1",
      email: null,
      phone: null,
      status: "replied",
      notes: null,
      ...over,
    }) as never

  beforeEach(() => {
    vi.clearAllMocks()
    create.mockResolvedValue({ id: "new1" } as never)
    update.mockResolvedValue({} as never)
    mail.mockResolvedValue({ success: true } as never)
  })

  it("creates and notifies exactly once for a NEW lead", async () => {
    findFirst.mockResolvedValue(null as never)
    const id = await captureFromChat({
      messages: msg("رقمي ٠٩١٢٣٠٣٨٦٥"),
      locale: "ar",
    })
    expect(id).toBe("new1")
    expect(create).toHaveBeenCalledTimes(1)
    expect(create.mock.calls[0][0].data.gmapsPlaceId).toBe(
      "inbound:wa:+249912303865"
    )
    expect(mail).toHaveBeenCalledTimes(1)
    expect(mail.mock.calls[0][0].subject).toContain("+249912303865")
  })

  it("never regresses a promoted lead, and appends to its notes", async () => {
    findFirst.mockResolvedValue(
      row({ status: "promoted", notes: "met at the expo" })
    )
    await captureFromChat({ messages: msg("call +249912303865"), locale: "en" })
    const data = update.mock.calls[0][0].data
    expect(data).not.toHaveProperty("status")
    expect(String(data.notes)).toMatch(/^met at the expo\nchatbot \(en, /)
    expect(mail).not.toHaveBeenCalled()
  })

  it("moves a cold lead to replied", async () => {
    findFirst.mockResolvedValue(row({ status: "contacted" }))
    await captureFromChat({ messages: msg("info@school.sd"), locale: "en" })
    expect(update.mock.calls[0][0].data.status).toBe("replied")
  })

  it("keeps phone-then-email as ONE row, filling the empty email", async () => {
    findFirst.mockResolvedValue(row({ phone: "+249912303865" }))
    await captureFromChat({
      messages: msg("call +249912303865", "and info@school.sd"),
      locale: "en",
    })
    expect(create).not.toHaveBeenCalled()
    const data = update.mock.calls[0][0].data
    expect(data.email).toBe("info@school.sd")
    expect(data).not.toHaveProperty("phone")
  })

  it("reads only the newest message", async () => {
    await captureFromChat({
      messages: msg("info@school.sd", "and how much is it?"),
      locale: "en",
    })
    expect(findFirst).not.toHaveBeenCalled()
    expect(create).not.toHaveBeenCalled()
  })

  it("turns a lost create race into an update, with no second alert", async () => {
    findFirst
      .mockResolvedValueOnce(null as never)
      .mockResolvedValueOnce(row({ id: "winner" }))
    create.mockRejectedValue(Object.assign(new Error("dup"), { code: "P2002" }))
    const id = await captureFromChat({
      messages: msg("info@school.sd"),
      locale: "en",
    })
    expect(id).toBe("winner")
    expect(update).toHaveBeenCalledTimes(1)
    expect(mail).not.toHaveBeenCalled()
  })

  it("touches nothing when no identifier is present", async () => {
    await captureFromChat({ messages: msg("كم السعر؟"), locale: "ar" })
    expect(findFirst).not.toHaveBeenCalled()
    expect(create).not.toHaveBeenCalled()
    expect(mail).not.toHaveBeenCalled()
  })

  it("survives a mail failure — capture never throws", async () => {
    findFirst.mockResolvedValue(null as never)
    mail.mockRejectedValue(new Error("resend down"))
    await expect(
      captureFromChat({ messages: msg("info@school.sd"), locale: "en" })
    ).resolves.toBe("new1")
    expect(create).toHaveBeenCalledTimes(1)
  })
})
