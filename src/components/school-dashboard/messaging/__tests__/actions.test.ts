import { auth } from "@/auth"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

import {
  createConversation,
  deleteMessage,
  markConversationAsRead,
  sendMessage,
} from "../actions"
import { getAuthContext } from "../authorization"
import {
  getConversation,
  getConversationParticipant,
  getMessage,
} from "../queries"

vi.mock("@/lib/db", () => ({
  db: {
    conversation: {
      create: vi.fn(),
      update: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
    message: {
      create: vi.fn(),
      update: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
    conversationParticipant: {
      create: vi.fn(),
      findFirst: vi.fn(),
      updateMany: vi.fn(),
      deleteMany: vi.fn(),
    },
    messageReadReceipt: {
      upsert: vi.fn(),
    },
    $transaction: vi.fn((callback) =>
      callback({
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

vi.mock("../authorization", () => ({
  getAuthContext: vi.fn(),
  assertMessagingPermission: vi.fn(),
  validateConversationType: vi.fn(),
  canSendMessage: vi.fn().mockReturnValue(true),
  canManageParticipants: vi.fn().mockReturnValue(true),
}))

vi.mock("../queries", () => ({
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
      expect(result.error).toBe("Not authenticated")
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
      expect(result.error).toBe("Conversation not found")
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
      expect(result.error).toBe("Message not found")
    })
  })

  describe("markConversationAsRead", () => {
    it("updates last read timestamp", async () => {
      vi.mocked(db.conversationParticipant.updateMany).mockResolvedValue({
        count: 1,
      })

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
})
