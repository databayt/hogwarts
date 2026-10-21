// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { finishTurn, startTurn } from "@/components/chatbot/threads"

vi.mock("@/lib/db", () => {
  const model = () => ({
    findFirst: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    updateMany: vi.fn(),
    deleteMany: vi.fn(),
  })
  const db = {
    chatbotThread: model(),
    chatbotMessage: model(),
    $transaction: vi.fn(),
  }
  db.$transaction.mockImplementation(async (fn: (tx: unknown) => unknown) =>
    fn(db)
  )
  return { db }
})

const thread = vi.mocked(db.chatbotThread)
const message = vi.mocked(db.chatbotMessage)
const profile = {
  id: "p1",
  schoolId: "s1",
  memoryEnabled: true,
  visitor: false,
}

/** Every query's where clause — each must carry the tenant. */
const wheres = () =>
  [thread, message].flatMap((m) =>
    [m.findFirst, m.findMany, m.updateMany, m.deleteMany].flatMap((fn) =>
      fn.mock.calls.map(
        (c) => (c[0] as { where: Record<string, unknown> }).where
      )
    )
  )

beforeEach(() => {
  vi.clearAllMocks()
  thread.create.mockResolvedValue({ id: "t1" } as never)
  message.create
    .mockResolvedValueOnce({ id: "u1" } as never)
    .mockResolvedValueOnce({ id: "a1" } as never)
  message.findMany.mockResolvedValue([
    { role: "USER", content: "How do I add a student?" },
  ] as never)
})

describe("startTurn", () => {
  it("opens a thread titled by the question and saves both rows first", async () => {
    const turn = await startTurn({
      profile,
      mode: "schoolSupport",
      lang: "en",
      message: "How do I add a student?",
    })
    expect(turn).toMatchObject({
      threadId: "t1",
      userMessageId: "u1",
      assistantMessageId: "a1",
      history: [{ role: "user", content: "How do I add a student?" }],
    })
    expect(thread.create.mock.calls[0]![0].data).toMatchObject({
      schoolId: "s1",
      profileId: "p1",
      title: "How do I add a student?",
    })
    const [user, answer] = message.create.mock.calls.map(
      (c) => c[0].data as { createdAt: Date; role: string }
    )
    expect(user!.role).toBe("USER")
    expect(answer!.role).toBe("ASSISTANT")
    expect(answer!.createdAt.getTime()).toBeGreaterThan(
      user!.createdAt.getTime()
    )
    for (const where of wheres()) expect(where).toHaveProperty("schoolId", "s1")
  })

  it("refuses a thread that isn't this profile's", async () => {
    thread.findFirst.mockResolvedValue(null as never)
    const turn = await startTurn({
      profile,
      mode: "schoolSupport",
      lang: "en",
      threadId: "someone-elses",
      message: "hi",
    })
    expect(turn).toBe("not_found")
    expect(thread.findFirst.mock.calls[0]![0].where).toMatchObject({
      id: "someone-elses",
      profileId: "p1",
      schoolId: "s1",
    })
    expect(message.create).not.toHaveBeenCalled()
  })

  it("retries by replacing the last answer, not repeating the question", async () => {
    thread.findFirst.mockResolvedValue({ id: "t1" } as never)
    message.findMany
      .mockResolvedValueOnce([
        { id: "a0", role: "ASSISTANT", content: "half" },
        { id: "u0", role: "USER", content: "the question" },
      ] as never)
      .mockResolvedValueOnce([
        { role: "USER", content: "the question" },
      ] as never)
    message.create.mockReset()
    message.create.mockResolvedValue({ id: "a1" } as never)
    const turn = await startTurn({
      profile,
      mode: "schoolSupport",
      lang: "en",
      threadId: "t1",
      message: "ignored on retry",
      retryOf: "a0",
    })
    expect(turn).toMatchObject({
      userMessageId: "u0",
      assistantMessageId: "a1",
    })
    expect(message.deleteMany).toHaveBeenCalledWith({
      where: { id: "a0", threadId: "t1", schoolId: "s1" },
    })
    expect(message.create).toHaveBeenCalledTimes(1) // the answer only
  })

  it("won't retry anything but the thread's last answer", async () => {
    thread.findFirst.mockResolvedValue({ id: "t1" } as never)
    message.findMany.mockResolvedValueOnce([
      { id: "u9", role: "USER", content: "newer question" },
      { id: "a0", role: "ASSISTANT", content: "old" },
    ] as never)
    const turn = await startTurn({
      profile,
      mode: "schoolSupport",
      lang: "en",
      threadId: "t1",
      message: "x",
      retryOf: "a0",
    })
    expect(turn).toBe("not_found")
    expect(message.deleteMany).not.toHaveBeenCalled()
  })
})

describe("finishTurn", () => {
  it("writes the answer into its own row only", async () => {
    await finishTurn({
      schoolId: "s1",
      threadId: "t1",
      assistantMessageId: "a1",
      text: "Done.",
      partial: false,
      provider: "groq",
      fallbackReason: null,
      topicSlugs: ["add-student"],
      latencyMs: 900,
    })
    expect(message.updateMany.mock.calls[0]![0]).toMatchObject({
      where: { id: "a1", threadId: "t1", schoolId: "s1" },
      data: { content: "Done.", provider: "groq", topicSlugs: ["add-student"] },
    })
    expect(thread.updateMany.mock.calls[0]![0]).toMatchObject({
      where: { id: "t1", schoolId: "s1" },
      data: { topicSlug: "add-student" },
    })
  })
})
