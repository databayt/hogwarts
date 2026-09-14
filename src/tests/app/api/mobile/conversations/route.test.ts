// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { NextRequest, NextResponse } from "next/server"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"

vi.mock("@/lib/db", () => ({
  db: {
    conversationParticipant: { findMany: vi.fn() },
    conversation: { findMany: vi.fn() },
  },
}))
vi.mock("@/app/api/mobile/lib/authenticate", () => ({
  authenticate: vi.fn(),
  isAuthError: (r: unknown) => r instanceof NextResponse,
}))

const SCHOOL = "school-1"
const USER = "user-1"

async function authAs(role: string) {
  const auth = await import("@/app/api/mobile/lib/authenticate")
  vi.mocked(auth.authenticate).mockResolvedValue({
    userId: USER,
    email: "u@e.com",
    schoolId: SCHOOL,
    role,
  })
}

const get = () =>
  new NextRequest("http://localhost/api/mobile/conversations", {
    headers: { Authorization: "Bearer test" },
  })

const participantUser = (
  id: string,
  username: string,
  image: string | null
) => ({
  user: { id, username, image },
})

beforeEach(() => {
  vi.clearAllMocks()
})

describe("GET /api/mobile/conversations", () => {
  it("401 when unauthenticated", async () => {
    const auth = await import("@/app/api/mobile/lib/authenticate")
    vi.mocked(auth.authenticate).mockResolvedValue(
      NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    )
    const { GET } = await import("@/app/api/mobile/conversations/route")
    expect((await GET(get())).status).toBe(401)
  })

  // Any authenticated role may list its own conversations; there is no role
  // gate to refuse, so the access rule under test is membership + tenant.
  it("empty when the user is in no conversation", async () => {
    await authAs("STUDENT")
    vi.mocked(db.conversationParticipant.findMany).mockResolvedValue([])
    const { GET } = await import("@/app/api/mobile/conversations/route")
    expect(await (await GET(get())).json()).toEqual({ data: [], total: 0 })
    expect(db.conversation.findMany).not.toHaveBeenCalled()
  })

  it("membership in another school's conversation lists nothing — conversations are school-scoped", async () => {
    await authAs("TEACHER")
    vi.mocked(db.conversationParticipant.findMany).mockResolvedValue([
      {
        conversationId: "other-school-convo",
        unreadCount: 3,
        isPinned: false,
        isMuted: false,
      },
    ] as never)
    vi.mocked(db.conversation.findMany).mockResolvedValue([])
    const { GET } = await import("@/app/api/mobile/conversations/route")
    expect(await (await GET(get())).json()).toEqual({ data: [], total: 0 })
    expect(vi.mocked(db.conversation.findMany).mock.calls[0][0]).toMatchObject({
      where: { id: { in: ["other-school-convo"] }, schoolId: SCHOOL },
    })
  })

  it("rows carry lastMessage.senderId/contentType, participantCount and the direct peer's image", async () => {
    await authAs("TEACHER")
    const sentAt = new Date("2026-09-14T08:00:00.000Z")
    vi.mocked(db.conversationParticipant.findMany).mockResolvedValue([
      { conversationId: "d1", unreadCount: 2, isPinned: true, isMuted: false },
      { conversationId: "g1", unreadCount: 0, isPinned: false, isMuted: true },
    ] as never)
    vi.mocked(db.conversation.findMany).mockResolvedValue([
      {
        id: "d1",
        type: "direct",
        title: null,
        avatar: null,
        lastMessageAt: sentAt,
        whatsappEnabled: false,
        messages: [
          {
            id: "m1",
            content: "photo.jpg",
            contentType: "image",
            senderId: "user-2",
            status: "sent",
            createdAt: sentAt,
            sender: { username: "Huda" },
          },
        ],
        participants: [
          participantUser(USER, "Me", "https://cdn/me.png"),
          participantUser("user-2", "Huda", "https://cdn/huda.png"),
        ],
      },
      {
        id: "g1",
        type: "group",
        title: "Grade 10 staff",
        avatar: "https://cdn/g.png",
        lastMessageAt: null,
        whatsappEnabled: true,
        messages: [],
        participants: [
          participantUser(USER, "Me", null),
          participantUser("user-2", "Huda", null),
          participantUser("user-3", "Omar", null),
        ],
      },
    ] as never)

    const { GET } = await import("@/app/api/mobile/conversations/route")
    const res = await GET(get())
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({
      total: 2,
      data: [
        {
          id: "d1",
          type: "direct",
          title: "Huda",
          avatarUrl: null,
          unreadCount: 2,
          isPinned: true,
          isMuted: false,
          whatsappEnabled: false,
          participantCount: 2,
          otherParticipant: {
            id: "user-2",
            name: "Huda",
            image: "https://cdn/huda.png",
          },
          updatedAt: sentAt.toISOString(),
          lastMessage: {
            id: "m1",
            content: "photo.jpg",
            senderId: "user-2",
            senderName: "Huda",
            contentType: "image",
            status: "sent",
            sentAt: sentAt.toISOString(),
          },
        },
        {
          id: "g1",
          type: "group",
          title: "Grade 10 staff",
          avatarUrl: "https://cdn/g.png",
          unreadCount: 0,
          isPinned: false,
          isMuted: true,
          whatsappEnabled: true,
          participantCount: 3,
          otherParticipant: null,
          updatedAt: "",
          lastMessage: null,
        },
      ],
    })
  })
})
