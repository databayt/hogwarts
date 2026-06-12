// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { auth } from "@/auth"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import {
  createConversation,
  deleteMessage,
  forwardMessage,
  getStarredMessages,
  markConversationAsRead,
  markMessageAsRead,
  sendMessage,
  starMessage,
  unstarMessage,
} from "@/components/school-dashboard/messaging/actions"
import { getAuthContext } from "@/components/school-dashboard/messaging/authorization"
import {
  getConversation,
  getConversationParticipant,
  getMessage,
  isConversationParticipant,
} from "@/components/school-dashboard/messaging/queries"

vi.mock("@/lib/db", () => ({
  db: {
    conversation: {
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
    message: {
      create: vi.fn(),
      update: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
    starredMessage: {
      upsert: vi.fn(),
      deleteMany: vi.fn(),
      findMany: vi.fn(),
    },
    conversationParticipant: {
      create: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      updateMany: vi.fn(),
      deleteMany: vi.fn(),
    },
    messageReadReceipt: {
      upsert: vi.fn(),
    },
    messageAttachment: {
      createMany: vi.fn(),
    },
    user: {
      findUnique: vi.fn().mockResolvedValue({ username: "tester" }),
    },
    whatsAppSession: {
      findUnique: vi.fn().mockResolvedValue(null),
    },
    // Supports both forms: $transaction([promises]) and $transaction(cb)
    $transaction: vi.fn((arg) =>
      Array.isArray(arg)
        ? Promise.all(arg)
        : arg({
            conversation: {
              create: vi.fn(),
              update: vi.fn(),
            },
            message: {
              create: vi.fn(),
              update: vi.fn(),
            },
          })
    ),
  },
}))

vi.mock("@/lib/tenant-context", () => ({
  getTenantContext: vi.fn(),
}))

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}))

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}))

vi.mock("@/lib/rate-limit", () => ({
  checkMessageSendRateLimit: vi.fn().mockReturnValue({ allowed: true }),
  createRateLimitErrorMessage: vi.fn(),
}))

vi.mock("@/components/school-dashboard/messaging/authorization", () => ({
  getAuthContext: vi.fn(),
  assertMessagingPermission: vi.fn(),
  validateConversationType: vi.fn(),
  canSendMessage: vi.fn().mockReturnValue(true),
  canManageParticipants: vi.fn().mockReturnValue(true),
}))

vi.mock("@/components/school-dashboard/messaging/queries", () => ({
  getConversationParticipant: vi.fn(),
  isConversationParticipant: vi.fn().mockResolvedValue(true),
  getConversation: vi.fn(),
  getMessage: vi.fn(),
}))

describe("Messaging Actions", () => {
  const mockSchoolId = "school-123"
  const mockUserId = "user-123"

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getTenantContext).mockResolvedValue({
      schoolId: mockSchoolId,
      subdomain: "test-school",
      role: "TEACHER",
      locale: "en",
    })
    vi.mocked(auth).mockResolvedValue({
      user: { id: mockUserId, schoolId: mockSchoolId, role: "TEACHER" },
    } as any)
    vi.mocked(getAuthContext).mockReturnValue({
      userId: mockUserId,
      schoolId: mockSchoolId,
      role: "TEACHER",
    })
  })

  describe("createConversation", () => {
    it("creates conversation with schoolId for multi-tenant isolation", async () => {
      const mockConversation = {
        id: "conv-1",
        schoolId: mockSchoolId,
        type: "direct",
        title: null,
      }

      vi.mocked(db.conversation.create).mockResolvedValue(
        mockConversation as any
      )

      const result = await createConversation({
        type: "direct",
        participantIds: ["user-456"],
      })

      expect(result.success).toBe(true)
    })

    it("returns error when not authenticated", async () => {
      vi.mocked(getAuthContext).mockReturnValue(null)

      const result = await createConversation({
        type: "direct",
        participantIds: ["user-456"],
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe("NOT_AUTHENTICATED")
    })

    it("returns existing conversation for direct type if exists", async () => {
      const existingConv = {
        id: "existing-conv",
        schoolId: mockSchoolId,
        type: "direct",
      }

      vi.mocked(db.conversation.findFirst).mockResolvedValue(
        existingConv as any
      )

      const result = await createConversation({
        type: "direct",
        participantIds: ["user-456"],
      })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.id).toBe("existing-conv")
      }
    })
  })

  describe("sendMessage", () => {
    it("sends message with tenant isolation", async () => {
      const mockMessage = {
        id: "msg-1",
        conversationId: "conv-1",
        senderId: mockUserId,
        content: "Hello",
        createdAt: new Date(),
      }

      vi.mocked(getConversation).mockResolvedValue({
        id: "conv-1",
        schoolId: mockSchoolId,
        type: "direct",
        participants: [{ userId: mockUserId, role: "member" }],
      } as any)
      vi.mocked(getConversationParticipant).mockResolvedValue({
        userId: mockUserId,
        role: "member",
      } as any)
      vi.mocked(db.message.create).mockResolvedValue(mockMessage as any)
      vi.mocked(db.conversation.update).mockResolvedValue({} as any)

      const result = await sendMessage({
        conversationId: "conv-1",
        content: "Hello",
        contentType: "text",
      })

      expect(result.success).toBe(true)
    })

    it("returns error when conversation not found", async () => {
      vi.mocked(getConversation).mockResolvedValue(null)

      const result = await sendMessage({
        conversationId: "nonexistent",
        content: "Hello",
        contentType: "text",
      })

      expect(result.success).toBe(false)
      // sendMessage maps a missing conversation to the generic send-failed code
      expect(result.error).toBe("MESSAGE_SEND_FAILED")
    })
  })

  describe("deleteMessage", () => {
    it("soft deletes message when user is sender", async () => {
      vi.mocked(getMessage).mockResolvedValue({
        id: "msg-1",
        senderId: mockUserId,
        conversationId: "conv-1",
        createdAt: new Date(),
      } as any)
      vi.mocked(getConversationParticipant).mockResolvedValue({
        userId: mockUserId,
        role: "member",
      } as any)
      vi.mocked(db.message.update).mockResolvedValue({} as any)

      const result = await deleteMessage({
        messageId: "msg-1",
      })

      expect(result.success).toBe(true)
    })

    it("returns error when message not found", async () => {
      vi.mocked(getMessage).mockResolvedValue(null)

      const result = await deleteMessage({
        messageId: "nonexistent",
      })

      expect(result.success).toBe(false)
      // deleteMessage maps a missing message to the generic send-failed code
      expect(result.error).toBe("MESSAGE_SEND_FAILED")
    })
  })

  describe("markConversationAsRead", () => {
    it("updates last read timestamp", async () => {
      vi.mocked(db.conversationParticipant.updateMany).mockResolvedValue({
        count: 1,
      })
      vi.mocked(db.conversation.findUnique).mockResolvedValue({
        whatsappEnabled: false,
      } as any)

      const result = await markConversationAsRead({
        conversationId: "conv-1",
      })

      expect(result.success).toBe(true)
      expect(db.conversationParticipant.updateMany).toHaveBeenCalledWith({
        where: {
          conversationId: "conv-1",
          userId: mockUserId,
        },
        data: {
          lastReadAt: expect.any(Date),
        },
      })
    })
  })

  describe("forwardMessage", () => {
    const mockOriginalMessage = {
      id: "msg-original",
      conversationId: "conv-source",
      senderId: "other-user",
      content: "Hello world",
      contentType: "text",
      attachments: [],
      conversation: { schoolId: mockSchoolId },
    }

    it("returns NOT_AUTHENTICATED when no session", async () => {
      vi.mocked(getAuthContext).mockReturnValue(null)

      const result = await forwardMessage({
        messageId: "msg-original",
        targetConversationIds: ["conv-target"],
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe("NOT_AUTHENTICATED")
    })

    it("returns MISSING_SCHOOL when no school", async () => {
      vi.mocked(getTenantContext).mockResolvedValue({
        schoolId: "",
        subdomain: "",
        role: "TEACHER",
        locale: "en",
      })

      const result = await forwardMessage({
        messageId: "msg-original",
        targetConversationIds: ["conv-target"],
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe("MISSING_SCHOOL")
    })

    it("returns error when original message not found", async () => {
      vi.mocked(db.message.findUnique).mockResolvedValue(null)

      const result = await forwardMessage({
        messageId: "msg-nonexistent",
        targetConversationIds: ["conv-target"],
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe("MESSAGE_NOT_FOUND")
    })

    it("returns MESSAGE_NOT_FOUND when source message is soft-deleted", async () => {
      vi.mocked(db.message.findUnique).mockResolvedValue({
        ...mockOriginalMessage,
        isDeleted: true,
      } as any)

      const result = await forwardMessage({
        messageId: "msg-original",
        targetConversationIds: ["conv-target"],
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe("MESSAGE_NOT_FOUND")
      // Tombstoned content must never be copied into a new message
      expect(db.message.create).not.toHaveBeenCalled()
    })

    it("returns error when user not participant of source conversation", async () => {
      vi.mocked(db.message.findUnique).mockResolvedValue(
        mockOriginalMessage as any
      )
      vi.mocked(isConversationParticipant).mockResolvedValueOnce(false)

      const result = await forwardMessage({
        messageId: "msg-original",
        targetConversationIds: ["conv-target"],
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe("UNAUTHORIZED")
    })

    it("skips target conversations where user is not participant", async () => {
      vi.mocked(db.message.findUnique).mockResolvedValue(
        mockOriginalMessage as any
      )
      // Source conversation: user IS participant
      vi.mocked(isConversationParticipant).mockResolvedValueOnce(true)
      // Target participation is batch-verified in ONE findMany — only
      // conv-target-2 comes back (user is not a participant of conv-target-1)
      vi.mocked(db.conversationParticipant.findMany).mockResolvedValue([
        { conversationId: "conv-target-2" },
      ] as any)

      vi.mocked(db.message.create).mockResolvedValue({
        id: "msg-forwarded-2",
      } as any)
      vi.mocked(db.conversation.updateMany).mockResolvedValue({
        count: 1,
      } as any)

      const result = await forwardMessage({
        messageId: "msg-original",
        targetConversationIds: ["conv-target-1", "conv-target-2"],
      })

      expect(result.success).toBe(true)
      if (result.success) {
        // Only one message created (skipped conv-target-1)
        expect(result.data.messageIds).toEqual(["msg-forwarded-2"])
      }
      expect(db.message.create).toHaveBeenCalledTimes(1)
    })

    it("successfully creates forwarded messages with forwardedFromId set", async () => {
      vi.mocked(db.message.findUnique).mockResolvedValue(
        mockOriginalMessage as any
      )
      vi.mocked(isConversationParticipant).mockResolvedValue(true)
      vi.mocked(db.conversationParticipant.findMany).mockResolvedValue([
        { conversationId: "conv-target" },
      ] as any)
      vi.mocked(db.message.create).mockResolvedValue({
        id: "msg-forwarded",
      } as any)
      vi.mocked(db.conversation.updateMany).mockResolvedValue({
        count: 1,
      } as any)

      const result = await forwardMessage({
        messageId: "msg-original",
        targetConversationIds: ["conv-target"],
      })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.messageIds).toEqual(["msg-forwarded"])
      }
      expect(db.message.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          conversationId: "conv-target",
          senderId: mockUserId,
          content: "Hello world",
          contentType: "text",
          forwardedFromId: "msg-original",
          status: "sent",
        }),
        select: { id: true },
      })
    })

    it("copies attachments to forwarded messages", async () => {
      const messageWithAttachments = {
        ...mockOriginalMessage,
        attachments: [
          {
            fileName: "doc.pdf",
            fileUrl: "https://example.com/doc.pdf",
            fileSize: 1024,
            fileType: "application/pdf",
            width: null,
            height: null,
            thumbnail: null,
          },
        ],
      }
      vi.mocked(db.message.findUnique).mockResolvedValue(
        messageWithAttachments as any
      )
      vi.mocked(isConversationParticipant).mockResolvedValue(true)
      vi.mocked(db.conversationParticipant.findMany).mockResolvedValue([
        { conversationId: "conv-target" },
      ] as any)
      vi.mocked(db.message.create).mockResolvedValue({
        id: "msg-forwarded",
      } as any)
      vi.mocked(db.conversation.updateMany).mockResolvedValue({
        count: 1,
      } as any)

      const result = await forwardMessage({
        messageId: "msg-original",
        targetConversationIds: ["conv-target"],
      })

      expect(result.success).toBe(true)
      expect(db.message.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          forwardedFromId: "msg-original",
          attachments: {
            create: [
              {
                fileName: "doc.pdf",
                fileUrl: "https://example.com/doc.pdf",
                fileSize: 1024,
                fileType: "application/pdf",
                width: null,
                height: null,
                thumbnail: null,
                uploaded: true,
              },
            ],
          },
        }),
        select: { id: true },
      })
    })

    it("updates lastMessageAt on target conversations", async () => {
      vi.mocked(db.message.findUnique).mockResolvedValue(
        mockOriginalMessage as any
      )
      vi.mocked(isConversationParticipant).mockResolvedValue(true)
      vi.mocked(db.conversationParticipant.findMany).mockResolvedValue([
        { conversationId: "conv-target" },
      ] as any)
      vi.mocked(db.message.create).mockResolvedValue({
        id: "msg-forwarded",
      } as any)
      vi.mocked(db.conversation.updateMany).mockResolvedValue({
        count: 1,
      } as any)

      await forwardMessage({
        messageId: "msg-original",
        targetConversationIds: ["conv-target"],
      })

      // One updateMany for ALL verified targets (was one update per target)
      expect(db.conversation.updateMany).toHaveBeenCalledWith({
        where: { id: { in: ["conv-target"] } },
        data: { lastMessageAt: expect.any(Date) },
      })
    })
  })

  describe("starMessage", () => {
    it("returns NOT_AUTHENTICATED when no session", async () => {
      vi.mocked(getAuthContext).mockReturnValue(null)

      const result = await starMessage({
        messageId: "msg-1",
        conversationId: "conv-1",
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe("NOT_AUTHENTICATED")
    })

    it("upserts starred message without failing if already starred", async () => {
      vi.mocked(isConversationParticipant).mockResolvedValue(true)
      vi.mocked(db.starredMessage.upsert).mockResolvedValue({
        id: "starred-1",
        userId: mockUserId,
        messageId: "msg-1",
        conversationId: "conv-1",
      } as any)

      const result = await starMessage({
        messageId: "msg-1",
        conversationId: "conv-1",
      })

      expect(result.success).toBe(true)
      expect(db.starredMessage.upsert).toHaveBeenCalledWith({
        where: {
          userId_messageId: {
            userId: mockUserId,
            messageId: "msg-1",
          },
        },
        create: {
          userId: mockUserId,
          messageId: "msg-1",
          conversationId: "conv-1",
        },
        update: {},
      })
    })

    it("returns the starred message id", async () => {
      vi.mocked(isConversationParticipant).mockResolvedValue(true)
      vi.mocked(db.starredMessage.upsert).mockResolvedValue({
        id: "starred-1",
        userId: mockUserId,
        messageId: "msg-1",
        conversationId: "conv-1",
      } as any)

      const result = await starMessage({
        messageId: "msg-1",
        conversationId: "conv-1",
      })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.id).toBe("starred-1")
      }
    })
  })

  describe("unstarMessage", () => {
    it("returns NOT_AUTHENTICATED when no session", async () => {
      vi.mocked(getAuthContext).mockReturnValue(null)

      const result = await unstarMessage({
        messageId: "msg-1",
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe("NOT_AUTHENTICATED")
    })

    it("deletes starred message records matching userId and messageId", async () => {
      vi.mocked(db.starredMessage.deleteMany).mockResolvedValue({ count: 1 })

      const result = await unstarMessage({
        messageId: "msg-1",
      })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.success).toBe(true)
      }
      expect(db.starredMessage.deleteMany).toHaveBeenCalledWith({
        where: {
          userId: mockUserId,
          messageId: "msg-1",
        },
      })
    })

    it("scopes the delete to the verified conversation (no cross-conversation unstar)", async () => {
      vi.mocked(db.starredMessage.deleteMany).mockResolvedValue({ count: 1 })

      const result = await unstarMessage({
        messageId: "msg-1",
        conversationId: "conv-1",
      })

      expect(result.success).toBe(true)
      expect(db.starredMessage.deleteMany).toHaveBeenCalledWith({
        where: {
          userId: mockUserId,
          messageId: "msg-1",
          conversationId: "conv-1",
        },
      })
    })
  })

  describe("markMessageAsRead", () => {
    it("rejects a same-school non-participant marking a message read", async () => {
      vi.mocked(getMessage).mockResolvedValue({
        id: "msg-1",
        conversationId: "conv-1",
      } as any)
      // getMessage is schoolId-scoped (no cross-tenant), but a non-participant
      // of the conversation must still not be able to mark it read.
      vi.mocked(isConversationParticipant).mockResolvedValueOnce(false)

      const result = await markMessageAsRead({ messageId: "msg-1" })

      expect(result.success).toBe(false)
      expect(result.error).toBe("UNAUTHORIZED")
      expect(db.messageReadReceipt.upsert).not.toHaveBeenCalled()
    })

    it("writes a read receipt for a participant", async () => {
      vi.mocked(getMessage).mockResolvedValue({
        id: "msg-1",
        conversationId: "conv-1",
      } as any)
      vi.mocked(isConversationParticipant).mockResolvedValueOnce(true)
      vi.mocked(db.messageReadReceipt.upsert).mockResolvedValue({} as any)

      const result = await markMessageAsRead({ messageId: "msg-1" })

      expect(result.success).toBe(true)
      expect(db.messageReadReceipt.upsert).toHaveBeenCalled()
    })
  })

  describe("getStarredMessages", () => {
    it("returns NOT_AUTHENTICATED when no session", async () => {
      vi.mocked(getAuthContext).mockReturnValue(null)

      const result = await getStarredMessages({})

      expect(result.success).toBe(false)
      expect(result.error).toBe("NOT_AUTHENTICATED")
    })

    it("returns messageIds for current user", async () => {
      vi.mocked(db.starredMessage.findMany).mockResolvedValue([
        { id: "starred-1", messageId: "msg-1" },
        { id: "starred-2", messageId: "msg-2" },
      ] as any)

      const result = await getStarredMessages({})

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.messageIds).toEqual(["msg-1", "msg-2"])
      }
      expect(db.starredMessage.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            userId: mockUserId,
            message: { conversation: { schoolId: mockSchoolId } },
          },
          orderBy: { createdAt: "desc" },
          select: { id: true, messageId: true },
        })
      )
    })

    it("supports cursor-based pagination", async () => {
      // Return limit+1 items to indicate hasMore
      const items = Array.from({ length: 51 }, (_, i) => ({
        id: `starred-${i}`,
        messageId: `msg-${i}`,
      }))
      vi.mocked(db.starredMessage.findMany).mockResolvedValue(items as any)

      const result = await getStarredMessages({
        limit: 50,
        cursor: "starred-0",
      })

      expect(result.success).toBe(true)
      if (result.success) {
        // Should return exactly 50 items (not 51)
        expect(result.data.messageIds).toHaveLength(50)
        // nextCursor should be the id of the last returned item
        expect(result.data.nextCursor).toBe("starred-49")
      }
      expect(db.starredMessage.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 51,
          cursor: { id: "starred-0" },
          skip: 1,
        })
      )
    })

    it("filters by conversationId when provided", async () => {
      vi.mocked(db.starredMessage.findMany).mockResolvedValue([
        { id: "starred-1", messageId: "msg-1" },
      ] as any)

      const result = await getStarredMessages({ conversationId: "conv-1" })

      expect(result.success).toBe(true)
      expect(db.starredMessage.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            userId: mockUserId,
            conversationId: "conv-1",
            message: { conversation: { schoolId: mockSchoolId } },
          },
        })
      )
    })
  })
})
