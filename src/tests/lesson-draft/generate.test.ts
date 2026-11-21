// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { claudeClient } from "@/components/chatbot/claude/client"
import { generateLessonDrafts } from "@/components/lesson-draft/generate"

vi.mock("@/components/chatbot/claude/client", () => ({
  CLAUDE_MODEL: "claude-haiku-5-5",
  claudeClient: vi.fn(),
}))
vi.mock("@/lib/db", () => ({
  db: { conference: { findFirst: vi.fn() }, schoolAssignment: { findFirst: vi.fn() } },
}))
vi.mock("@/components/school-dashboard/live/actions/host-seat", () => ({
  holdsHostSeat: vi.fn(),
}))
vi.mock("@/components/school-dashboard/live/queries", () => ({
  lessonVisibilityFilter: vi.fn(() => ({})),
  verifyLessonAnchor: vi.fn(),
}))
vi.mock("@/components/school-dashboard/teaching-scope/resolve", () => ({
  resolveTeachingScope: vi.fn(),
}))
vi.mock("@/components/lesson-draft/lesson-text", () => ({ getLessonText: vi.fn() }))
vi.mock("@/components/lesson-draft/spend", () => ({
  reserve: vi.fn(),
  settle: vi.fn(),
  jobIdFor: vi.fn(),
  estimateDraftCost: vi.fn(() => 0.001),
}))

const actor = { userId: "u1", role: "TEACHER", schoolId: "school-1" }

afterEach(() => {
  delete process.env.LESSON_DRAFT_ENABLED
  delete process.env.CHATBOT_ANTHROPIC_API_KEY
})

describe("generateLessonDrafts gates", () => {
  beforeEach(() => vi.clearAllMocks())

  it("flag unset: refuses and never builds a Claude client", async () => {
    process.env.CHATBOT_ANTHROPIC_API_KEY = "k"
    await expect(
      generateLessonDrafts(actor, { sessionId: "sess1" })
    ).rejects.toMatchObject({ code: "LESSON_DRAFT_DISABLED" })
    expect(claudeClient).not.toHaveBeenCalled()
  })

  it("flag on but no chatbot key: still disabled, no client", async () => {
    process.env.LESSON_DRAFT_ENABLED = "1"
    await expect(
      generateLessonDrafts(actor, { sessionId: "sess1" })
    ).rejects.toMatchObject({ code: "LESSON_DRAFT_DISABLED" })
    expect(claudeClient).not.toHaveBeenCalled()
  })

  it("a role outside the author roles is refused before any read", async () => {
    process.env.LESSON_DRAFT_ENABLED = "1"
    process.env.CHATBOT_ANTHROPIC_API_KEY = "k"
    await expect(
      generateLessonDrafts({ ...actor, role: "STUDENT" }, { sessionId: "sess1" })
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" })
    expect(claudeClient).not.toHaveBeenCalled()
  })

  it("needs a class or a draft homework", async () => {
    process.env.LESSON_DRAFT_ENABLED = "1"
    process.env.CHATBOT_ANTHROPIC_API_KEY = "k"
    await expect(generateLessonDrafts(actor, {})).rejects.toMatchObject({
      code: "VALIDATION_ERROR",
    })
  })
})
