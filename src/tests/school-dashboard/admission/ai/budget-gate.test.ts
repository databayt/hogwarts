// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Tests for AI budget enforcement in the classify path.
 * Verifies canUseAI is consulted before every generateObject call and
 * that trackAIUsage is called with real token/cost numbers on success.
 */

import { generateObject } from "ai"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { canUseAI, trackAIUsage } from "@/lib/ai/budget"
import { classifyAdmissionDocument } from "@/components/school-dashboard/admission/ai/classify"

// ── Mocks ──────────────────────────────────────────────────────────────────

vi.mock("@/lib/ai/budget", () => ({
  canUseAI: vi.fn(),
  trackAIUsage: vi.fn().mockResolvedValue(undefined),
}))

vi.mock("ai", () => ({
  generateObject: vi.fn(),
}))

vi.mock("@ai-sdk/anthropic", () => ({
  anthropic: vi.fn().mockReturnValue("mock-model"),
}))

vi.mock("@/lib/logger", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}))

const SCHOOL_ID = "school-budget-test-001"
const FILE_URL = "https://example.com/doc.jpg"

beforeEach(() => {
  vi.clearAllMocks()
})

// ── Budget gate blocks the call ─────────────────────────────────────────────

describe("classifyAdmissionDocument — budget gate", () => {
  it("returns BUDGET_EXCEEDED and skips generateObject when budget is exhausted", async () => {
    vi.mocked(canUseAI).mockResolvedValue({
      allowed: false,
      remaining: 0,
      spent: 10,
      limit: 10,
      errorCode: "AI_BUDGET_EXCEEDED",
    })

    const result = await classifyAdmissionDocument(FILE_URL, SCHOOL_ID)

    expect(result.success).toBe(false)
    expect(result.errorCode).toBe("AI_BUDGET_EXCEEDED")
    expect(generateObject).not.toHaveBeenCalled()
    expect(trackAIUsage).not.toHaveBeenCalled()
  })

  it("returns SCHOOL_NOT_FOUND error code when school is missing", async () => {
    vi.mocked(canUseAI).mockResolvedValue({
      allowed: false,
      remaining: null,
      spent: 0,
      limit: null,
      errorCode: "SCHOOL_NOT_FOUND",
    })

    const result = await classifyAdmissionDocument(FILE_URL, SCHOOL_ID)

    expect(result.success).toBe(false)
    expect(result.errorCode).toBe("SCHOOL_NOT_FOUND")
    expect(generateObject).not.toHaveBeenCalled()
  })
})

// ── Happy path: real token numbers recorded ─────────────────────────────────

describe("classifyAdmissionDocument — usage tracking on success", () => {
  it("calls trackAIUsage with real input/output token counts and computed cost", async () => {
    vi.mocked(canUseAI).mockResolvedValue({
      allowed: true,
      remaining: 5,
      spent: 0,
      limit: 5,
    })

    vi.mocked(generateObject).mockResolvedValue({
      object: {
        type: "id_document",
        confidence: 0.95,
        reasoning: "Looks like a national ID",
      },
      // Vercel AI SDK GenerateObjectResult.usage uses inputTokens/outputTokens
      usage: {
        inputTokens: 800,
        outputTokens: 120,
      },
    } as any)

    const result = await classifyAdmissionDocument(FILE_URL, SCHOOL_ID)

    expect(result.success).toBe(true)
    expect(result.data?.type).toBe("id_document")
    expect(result.data?.confidence).toBe(0.95)

    expect(trackAIUsage).toHaveBeenCalledOnce()
    const call = vi.mocked(trackAIUsage).mock.calls[0][0]
    expect(call.schoolId).toBe(SCHOOL_ID)
    expect(call.inputTokens).toBe(800)
    expect(call.outputTokens).toBe(120)
    // $3/M input + $15/M output
    expect(call.costUsd).toBeCloseTo(
      (800 / 1_000_000) * 3.0 + (120 / 1_000_000) * 15.0,
      8
    )
    expect(call.model).toBe("claude-3-5-sonnet-20241022")
    expect(call.provider).toBe("anthropic")
    expect(call.jobType).toBe("admission_classify")
  })

  it("still calls trackAIUsage with zero tokens when usage is absent from SDK response", async () => {
    vi.mocked(canUseAI).mockResolvedValue({
      allowed: true,
      remaining: null,
      spent: 0,
      limit: null,
    })

    vi.mocked(generateObject).mockResolvedValue({
      object: { type: "other", confidence: 0.3 },
      usage: undefined,
    } as any)

    await classifyAdmissionDocument(FILE_URL, SCHOOL_ID)

    expect(trackAIUsage).toHaveBeenCalledOnce()
    const call = vi.mocked(trackAIUsage).mock.calls[0][0]
    expect(call.inputTokens).toBe(0)
    expect(call.outputTokens).toBe(0)
    expect(call.costUsd).toBe(0)
  })
})
