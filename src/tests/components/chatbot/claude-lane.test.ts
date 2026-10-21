// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { readdirSync, readFileSync, statSync } from "node:fs"
import path from "node:path"
import Anthropic from "@anthropic-ai/sdk"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { laneSpendSince } from "@/lib/ai/budget"
import { db } from "@/lib/db"
import { claudeClient } from "@/components/chatbot/claude/client"
import {
  contextBlock,
  GUIDE_SLUGS,
  helpCenter,
  modeBlock,
} from "@/components/chatbot/claude/prompt"
import {
  claudeAnswer,
  ClaudeFallback,
  type ClaudeItem,
  type ClaudeRun,
} from "@/components/chatbot/claude/request"
import {
  __resetBreaker,
  claudeAvailable,
  noteClaudeFailure,
} from "@/components/chatbot/provider"
import { __resetSpend, reserve, settle } from "@/components/chatbot/spend"

vi.mock("@/lib/ai/budget", () => ({ laneSpendSince: vi.fn() }))
vi.mock("@/lib/platform-tenant", () => ({
  PLATFORM_SCHOOL_ID: "platform",
  ensurePlatformSchool: vi.fn(async () => {}),
}))
vi.mock("@/lib/db", () => ({ db: { aIUsageLog: { create: vi.fn() } } }))
vi.mock("@/components/chatbot/claude/client", () => ({
  CLAUDE_MODEL: "claude-haiku-5-5",
  claudeClient: vi.fn(),
  claudeEnabled: vi.fn(() => true),
}))

beforeEach(() => {
  vi.clearAllMocks()
  __resetSpend()
  __resetBreaker()
  process.env.CHATBOT_CLAUDE_CAP_USD = "18"
  process.env.CHATBOT_CLAUDE_DAILY_USD = "2"
})

describe("spend ledger", () => {
  it("fails closed when the ledger can't be read", async () => {
    vi.mocked(laneSpendSince).mockRejectedValue(new Error("db down"))
    expect(await reserve(0.003)).toBe(false)
  })

  it("stops at the monthly and the daily cap", async () => {
    vi.mocked(laneSpendSince)
      .mockResolvedValueOnce(17.999)
      .mockResolvedValueOnce(0)
    expect(await reserve(0.003)).toBe(false)
    __resetSpend()
    vi.mocked(laneSpendSince)
      .mockResolvedValueOnce(5)
      .mockResolvedValueOnce(1.999)
    expect(await reserve(0.003)).toBe(false)
  })

  it("holds what's reserved, so two answers can't both squeeze under", async () => {
    vi.mocked(laneSpendSince).mockResolvedValue(1.994)
    expect(await reserve(0.003)).toBe(true)
    expect(await reserve(0.003)).toBe(true)
    expect(await reserve(0.003)).toBe(false) // 1.994 + 0.006 + 0.003 > 2
  })

  it("records spend on the platform tenant, never a school", async () => {
    vi.mocked(laneSpendSince).mockResolvedValue(0)
    await reserve(0.003)
    await settle(0.003, {
      costUsd: 0.0005,
      model: "claude-haiku-5-5",
      inputTokens: 16000,
      outputTokens: 350,
      jobType: "chatbot",
      jobId: "a1",
    })
    expect(
      vi.mocked(db.aIUsageLog.create).mock.calls[0]![0].data
    ).toMatchObject({
      schoolId: "platform",
      jobType: "chatbot",
      provider: "anthropic",
      costUsd: 0.0005,
    })
  })
})

describe("breaker", () => {
  it("opens after three failures in a minute", () => {
    noteClaudeFailure("count")
    noteClaudeFailure("count")
    expect(claudeAvailable()).toBe(true)
    noteClaudeFailure("count")
    expect(claudeAvailable()).toBe(false)
  })

  it("opens at once for a bad key", () => {
    noteClaudeFailure("open")
    expect(claudeAvailable()).toBe(false)
  })

  it("caps the spend until next month for a billing error", async () => {
    noteClaudeFailure("cap")
    vi.mocked(laneSpendSince).mockResolvedValue(0)
    expect(await reserve(0.003)).toBe(false)
  })
})

describe("prompt blocks", () => {
  it("builds the cached blocks byte for byte the same, with no date", () => {
    expect(helpCenter("ar")).toBe(helpCenter("ar"))
    expect(modeBlock("schoolSupport", "en")).toBe(
      modeBlock("schoolSupport", "en")
    )
    expect(helpCenter("en")).not.toMatch(/20\d\d/)
    for (const slug of GUIDE_SLUGS)
      expect(helpCenter("en")).toContain(`slug="${slug}"`)
  })

  it("keeps the date and the person in the uncached block", () => {
    const block = contextBlock({
      now: new Date("2026-10-21T10:00:00Z"),
      lang: "en",
      role: "Teacher",
      school: "King Fahad",
      guess: "attendance",
    })
    expect(block).toContain("2026")
    expect(block).toContain("role: Teacher")
    expect(block).toContain("likely guide (a hint): attendance")
  })
})

/** A fake `messages.stream` that replays events, or throws. */
function fakeClient(events: unknown[], fail?: unknown) {
  return {
    messages: {
      stream: vi.fn(() => ({
        async *[Symbol.asyncIterator]() {
          for (const e of events) yield e
          if (fail) throw fail
        },
      })),
    },
  } as unknown as Anthropic
}

const start = {
  type: "message_start",
  message: {
    usage: {
      input_tokens: 2000,
      cache_read_input_tokens: 14000,
      cache_creation_input_tokens: 0,
      cache_creation: null,
    },
  },
}
const delta = (text: string) => ({
  type: "content_block_delta",
  delta: { type: "text_delta", text },
})
const end = (stop = "end_turn") => ({
  type: "message_delta",
  delta: { stop_reason: stop },
  usage: { output_tokens: 120 },
})

async function drain(signal = new AbortController().signal) {
  const items: ClaudeItem[] = []
  let run: ClaudeRun | null = null
  const gen = claudeAnswer({
    system: ["a", "b", "c"],
    messages: [{ role: "user", content: "How do I take attendance?" }],
    userKey: "u",
    signal,
    onDone: (r) => {
      run = r
    },
  })
  for await (const i of gen) items.push(i)
  return { items, run: run as ClaudeRun | null }
}

describe("claudeAnswer", () => {
  it("reads the guide tag, streams the text, reports the usage", async () => {
    vi.mocked(claudeClient).mockReturnValue(
      fakeClient([
        start,
        delta("[[guide:attendance]]\n1. Open "),
        delta("**Attendance**"),
        end(),
      ])
    )
    const { items, run } = await drain()
    expect(items[0]).toEqual({ type: "guide", slug: "attendance" })
    expect(
      items
        .slice(1)
        .map((i) => (i.type === "text" ? i.text : ""))
        .join("")
    ).toBe("1. Open **Attendance**")
    expect(run).toMatchObject({ input: 2000, read: 14000, output: 120 })
  })

  it.each([
    [
      new Anthropic.AuthenticationError(401, {}, "bad key", new Headers()),
      "auth",
      "open",
    ],
    [
      new Anthropic.NotFoundError(404, {}, "no such model", new Headers()),
      "model",
      "open",
    ],
    [
      new Anthropic.RateLimitError(429, {}, "slow down", new Headers()),
      "rate_limited",
      "count",
    ],
    [
      new Anthropic.BadRequestError(
        400,
        {
          type: "error",
          error: {
            type: "invalid_request_error",
            message: "Your credit balance is too low to access the Anthropic API.",
          },
        },
        undefined,
        new Headers()
      ),
      "billing",
      "cap",
    ],
    [
      new Anthropic.InternalServerError(529, {}, "overloaded", new Headers()),
      "overloaded",
      "count",
    ],
  ])(
    "falls back before the first word on %s",
    async (error, reason, breaker) => {
      vi.mocked(claudeClient).mockReturnValue(fakeClient([], error))
      await expect(drain()).rejects.toMatchObject({ reason, breaker })
    }
  )

  it("never hands a refusal to another model", async () => {
    vi.mocked(claudeClient).mockReturnValue(fakeClient([start, end("refusal")]))
    await expect(drain()).rejects.toMatchObject({
      reason: "refusal",
      breaker: "none",
    })
  })

  it("lets a break after the first word through as a cut-off, not a fallback", async () => {
    const boom = new Error("socket hang up")
    vi.mocked(claudeClient).mockReturnValue(
      fakeClient([start, delta("Half an ")], boom)
    )
    await expect(drain()).rejects.toBe(boom)
  })

  it("has nothing to try without a key", async () => {
    vi.mocked(claudeClient).mockReturnValue(null)
    await expect(drain()).rejects.toBeInstanceOf(ClaudeFallback)
  })
})

describe("the plain ANTHROPIC_API_KEY", () => {
  it("is never read by the chatbot (five dormant callers read it)", () => {
    const root = path.resolve(__dirname, "../../../components/chatbot")
    const files: string[] = []
    const walk = (dir: string) => {
      for (const f of readdirSync(dir)) {
        const p = path.join(dir, f)
        if (statSync(p).isDirectory()) walk(p)
        else if (/\.(ts|tsx)$/.test(f)) files.push(p)
      }
    }
    walk(root)
    for (const f of files)
      expect(readFileSync(f, "utf8")).not.toMatch(
        /process\.env\.ANTHROPIC_API_KEY/
      )
  })
})
