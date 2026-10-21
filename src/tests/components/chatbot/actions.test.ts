// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import {
  deleteAllChats,
  deleteChat,
  listChats,
  loadChat,
  rateMessage,
  renameChat,
} from "@/components/chatbot/actions"
import { profileFor } from "@/components/chatbot/identity"
import { readThread } from "@/components/chatbot/threads"
import en from "@/components/internationalization/en.json"

vi.mock("next/headers", () => ({
  headers: async () => new Headers({ host: "kingfahd.balqalam.com" }),
}))
vi.mock("@/auth", () => ({ auth: vi.fn(async () => null) }))
vi.mock("@/lib/tenant-host", () => ({
  tenantForHost: vi.fn(async () => ({
    kind: "school",
    schoolId: "s1",
    subdomain: "kingfahd",
  })),
}))
vi.mock("@/components/chatbot/identity", () => ({
  profileFor: vi.fn(),
  forgetVisitor: vi.fn(),
}))
vi.mock("@/components/chatbot/threads", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/components/chatbot/threads")>()),
  listThreads: vi.fn(async () => ({ threads: [], nextCursor: null })),
  readThread: vi.fn(),
}))
vi.mock("@/components/internationalization/dictionaries", () => ({
  getDictionary: vi.fn(async () => ({ chatbot: en.chatbot })),
}))
vi.mock("@/lib/db", () => ({
  db: {
    chatbotThread: { updateMany: vi.fn(), deleteMany: vi.fn() },
    chatbotMessage: { findFirst: vi.fn(), updateMany: vi.fn() },
  },
}))

const profile = { id: "p1", schoolId: "s1", memoryEnabled: true, visitor: true }
const t = vi.mocked(db.chatbotThread)

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(profileFor).mockResolvedValue(profile)
  t.updateMany.mockResolvedValue({ count: 1 } as never)
  t.deleteMany.mockResolvedValue({ count: 1 } as never)
})

describe("ownership", () => {
  it("renames only this profile's chat, in this tenant", async () => {
    expect(await renameChat({ threadId: "t1", title: "Fees" })).toBe(true)
    expect(t.updateMany).toHaveBeenCalledWith({
      where: { id: "t1", profileId: "p1", schoolId: "s1" },
      data: { title: "Fees" },
    })
  })

  it("says no to someone else's chat", async () => {
    t.deleteMany.mockResolvedValue({ count: 0 } as never)
    expect(await deleteChat({ threadId: "not-mine" })).toBe(false)
    expect(t.deleteMany.mock.calls[0]![0].where).toMatchObject({
      profileId: "p1",
      schoolId: "s1",
    })
  })

  it("deletes all chats of one bot only", async () => {
    await deleteAllChats({ mode: "schoolSite" })
    expect(t.deleteMany).toHaveBeenCalledWith({
      where: { profileId: "p1", schoolId: "s1", mode: "schoolSite" },
    })
  })

  it("does nothing for someone with no profile", async () => {
    vi.mocked(profileFor).mockResolvedValue(null)
    expect(await deleteChat({ threadId: "t1" })).toBe(false)
    expect(await listChats({ mode: "schoolSite" })).toEqual({
      threads: [],
      nextCursor: null,
      visitor: true,
    })
    expect(t.deleteMany).not.toHaveBeenCalled()
  })

  it("never creates a profile to answer a read", async () => {
    await listChats({ mode: "schoolSite" })
    expect(vi.mocked(profileFor).mock.calls[0]![0]).toMatchObject({
      write: false,
    })
  })

  it("rejects bad input before touching the database", async () => {
    expect(await renameChat({ threadId: "t1", title: "x".repeat(81) })).toBe(
      false
    )
    expect(await deleteAllChats({ mode: "everything" })).toBe(0)
    expect(t.updateMany).not.toHaveBeenCalled()
    expect(t.deleteMany).not.toHaveBeenCalled()
  })
})

describe("loadChat", () => {
  it("rebuilds the cards and marks an answer that never finished", async () => {
    vi.mocked(readThread).mockResolvedValue({
      id: "t1",
      title: "Add a student",
      messages: [
        {
          id: "u1",
          role: "USER",
          content: "How do I add a student?",
          topicSlugs: [],
          partial: false,
          createdAt: new Date(),
        },
        {
          id: "a1",
          role: "ASSISTANT",
          content: "1. Open **Students**",
          topicSlugs: ["add-student"],
          partial: false,
          createdAt: new Date(),
        },
        {
          id: "a2",
          role: "ASSISTANT",
          content: "",
          topicSlugs: [],
          partial: false,
          createdAt: new Date(Date.now() - 10 * 60 * 1000),
        },
      ],
    } as never)
    const chat = await loadChat({
      mode: "schoolSupport",
      threadId: "t1",
      locale: "en",
    })
    expect(chat?.messages[1]).toMatchObject({
      serverId: "a1",
      role: "assistant",
    })
    expect(chat?.messages[1]!.resources?.some((r) => r.kind === "guide")).toBe(
      true
    )
    expect(chat?.messages[2]).toMatchObject({
      partial: true,
      notice: en.chatbot.answerCutOff,
    })
  })

  it("is null for a chat that isn't theirs", async () => {
    vi.mocked(readThread).mockResolvedValue(null)
    expect(
      await loadChat({ mode: "schoolSite", threadId: "x", locale: "ar" })
    ).toBeNull()
  })
})

describe("rateMessage", () => {
  const m = vi.mocked(db.chatbotMessage)
  it("rates only an answer in this profile's own chat", async () => {
    m.findFirst.mockResolvedValue(null as never)
    expect(await rateMessage({ messageId: "x", value: 1 })).toBe(false)
    expect(m.findFirst.mock.calls[0]![0].where).toMatchObject({
      id: "x",
      schoolId: "s1",
      role: "ASSISTANT",
      thread: { profileId: "p1" },
    })
    expect(m.updateMany).not.toHaveBeenCalled()
  })

  it("helpful resolves the chat; not helpful leaves its status alone", async () => {
    m.findFirst.mockResolvedValue({ id: "a1", threadId: "t1" } as never)
    await rateMessage({ messageId: "a1", value: 1 })
    expect(t.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: "RESOLVED" } })
    )
    t.updateMany.mockClear()
    await rateMessage({ messageId: "a1", value: -1 })
    expect(t.updateMany).not.toHaveBeenCalled()
    expect(await rateMessage({ messageId: "a1", value: 5 })).toBe(false)
  })
})
