// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { auth } from "@/auth"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { checkUserRateLimit } from "@/lib/rate-limit"
import { tenantForHost } from "@/lib/tenant-host"
import { prepareChat } from "@/components/chatbot/server"
import en from "@/components/internationalization/en.json"

vi.mock("@/auth", () => ({ auth: vi.fn() }))
vi.mock("@/lib/tenant-host", () => ({ tenantForHost: vi.fn() }))
vi.mock("@/lib/db", () => ({
  db: {
    school: {
      findUnique: vi
        .fn()
        .mockResolvedValue({ name: "مدرسة", nameEn: "School" }),
    },
  },
}))
vi.mock("@/lib/rate-limit", () => ({
  checkUserRateLimit: vi.fn().mockResolvedValue({ allowed: true }),
  RATE_LIMITS: { CHATBOT: {}, CHATBOT_HOURLY: {}, CHATBOT_TENANT: {} },
}))
vi.mock("next/server", () => ({ after: vi.fn() }))
vi.mock("@/components/internationalization/dictionaries", () => ({
  getDictionary: vi.fn(async () => ({ chatbot: en.chatbot })),
}))
vi.mock("@/components/saas-marketing/pricing/exchange-rates", () => ({
  getExchangeRates: vi.fn(async () => ({ rates: {} })),
}))
vi.mock("@/components/chatbot/capture", () => ({ captureFromChat: vi.fn() }))
vi.mock("@/components/chatbot/identity", () => ({
  profileFor: vi.fn(async () => ({
    id: "p1",
    schoolId: "s1",
    memoryEnabled: true,
    visitor: false,
  })),
}))
vi.mock("@/components/chatbot/threads", () => ({
  startTurn: vi.fn(async (opts: { message?: string }) => ({
    threadId: "t1",
    userMessageId: "u1",
    assistantMessageId: "a1",
    history: [{ role: "user", content: opts.message ?? "" }],
  })),
}))

const SCHOOL = { kind: "school", schoolId: "s1", subdomain: "kingfahd" }
const PLATFORM = { kind: "platform", schoolId: "platform" }

const ask = (
  promptType: "saasMarketing" | "schoolSite" | "schoolSupport",
  text = "how do I add a student?",
  headers: Record<string, string> = {},
  subdomain?: string
) =>
  prepareChat({
    message: text,
    promptType,
    subdomain,
    locale: "en",
    headers: new Headers({ host: "kingfahd.balqalam.com", ...headers }),
  })

const session = (user: Record<string, unknown> | null) =>
  vi.mocked(auth).mockResolvedValue((user ? { user } : null) as never)

beforeEach(() => {
  vi.clearAllMocks()
  process.env.GROQ_API_KEY = "test"
  vi.mocked(tenantForHost).mockResolvedValue(SCHOOL as never)
  vi.mocked(checkUserRateLimit).mockResolvedValue({ allowed: true } as never)
})

describe("support desk — members of this school only", () => {
  it("asks a signed-out visitor to sign in", async () => {
    session(null)
    expect(await ask("schoolSupport")).toMatchObject({
      kind: "error",
      status: 401,
    })
  })

  it("answers a member of the school the Host names", async () => {
    session({ id: "u1", role: "ADMIN", schoolId: "s1" })
    expect((await ask("schoolSupport")).kind).toBe("model")
  })

  it("answers a DEVELOPER of no school", async () => {
    session({ id: "d1", role: "DEVELOPER" })
    expect((await ask("schoolSupport")).kind).toBe("model")
  })

  it.each([
    [{ id: "u2", role: "ADMIN", schoolId: "other" }],
    [{ id: "u3", role: "USER" }],
  ])("refuses %o", async (user) => {
    session(user)
    expect(await ask("schoolSupport")).toMatchObject({
      kind: "error",
      status: 403,
      error: en.chatbot.replyNoAccess,
    })
  })

  it("never cuts a line from a desk answer", async () => {
    session({ id: "u1", role: "ADMIN", schoolId: "s1" })
    const plan = await ask("schoolSupport", "how do I add a student?")
    expect(plan).toMatchObject({ kind: "model", dropAsk: false })
  })
})

describe("mode follows the Host", () => {
  it("refuses the desk on the main domain", async () => {
    vi.mocked(tenantForHost).mockResolvedValue(PLATFORM as never)
    session({ id: "d1", role: "DEVELOPER" })
    expect(await ask("schoolSupport")).toMatchObject({
      kind: "error",
      status: 400,
    })
  })

  it("refuses the sales bot on a school host", async () => {
    expect(await ask("saasMarketing")).toMatchObject({
      kind: "error",
      status: 400,
    })
  })

  it("refuses a school site whose body names another school", async () => {
    expect(
      await ask("schoolSite", "fees?", {}, "another-school")
    ).toMatchObject({ kind: "error", status: 400 })
  })
})

describe("rate limit key", () => {
  it("is Cloudflare's client IP, not the forwarded header the caller wrote", async () => {
    session(null)
    vi.mocked(tenantForHost).mockResolvedValue(PLATFORM as never)
    await ask("saasMarketing", "what are the plans?", {
      "cf-connecting-ip": "203.0.113.7",
      "x-forwarded-for": "1.1.1.1, 203.0.113.7",
      "user-agent": "test-agent",
    })
    const keys = vi.mocked(checkUserRateLimit).mock.calls.map((c) => c[0])
    expect(keys[0]).toBe("203.0.113.7:test-agent")
    expect(keys.join()).not.toContain("1.1.1.1")
  })
})

describe("help index", () => {
  it("answers the chip in code", async () => {
    vi.mocked(tenantForHost).mockResolvedValue(PLATFORM as never)
    const plan = await ask("saasMarketing", en.chatbot.saasSupportQuestion)
    expect(plan.kind).toBe("reply")
  })

  it("sends a real question to the model", async () => {
    vi.mocked(tenantForHost).mockResolvedValue(PLATFORM as never)
    const plan = await ask("saasMarketing", "Can you help me add a student?")
    expect(plan.kind).toBe("model")
  })
})

describe("the saved conversation", () => {
  it("answers inside the thread it saved, never a client history", async () => {
    session({ id: "u1", role: "ADMIN", schoolId: "s1" })
    const plan = await ask("schoolSupport", "how do I add a student?")
    expect(plan).toMatchObject({
      kind: "model",
      turn: { threadId: "t1", assistantMessageId: "a1", schoolId: "s1" },
      messages: [{ role: "user", content: "how do I add a student?" }],
    })
  })

  it("tells the client a chat that isn't theirs is gone", async () => {
    const { startTurn } = await import("@/components/chatbot/threads")
    vi.mocked(startTurn).mockResolvedValueOnce("not_found")
    session({ id: "u1", role: "ADMIN", schoolId: "s1" })
    expect(await ask("schoolSupport")).toMatchObject({
      kind: "error",
      status: 404,
      error: en.chatbot.replyChatNotFound,
    })
  })
})
