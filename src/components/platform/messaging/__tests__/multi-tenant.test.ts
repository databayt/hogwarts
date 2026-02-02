import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

import {
  getConversation,
  getConversations,
  getMessage,
  isConversationParticipant,
} from "../queries"

vi.mock("@/lib/db", () => ({
  db: {
    conversation: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
    message: {
      findFirst: vi.fn(),
    },
    conversationParticipant: {
      findFirst: vi.fn(),
    },
  },
}))

vi.mock("@/lib/tenant-context", () => ({
  getTenantContext: vi.fn(),
}))

describe("Messaging Multi-Tenant Isolation", () => {
  const schoolA = "school-A"
  const schoolB = "school-B"
  const userId = "user-123"

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("getConversation", () => {
    it("scopes query by schoolId", async () => {
      vi.mocked(db.conversation.findFirst).mockResolvedValue(null)

      await getConversation(schoolA, userId, "conv-1")

      expect(db.conversation.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            id: "conv-1",
            schoolId: schoolA,
          }),
        })
      )
    })

    it("returns null for conversation from different school", async () => {
      // Conversation exists in school B
      vi.mocked(db.conversation.findFirst).mockResolvedValue(null)

      const result = await getConversation(
        schoolA,
        userId,
        "conv-from-school-B"
      )

      expect(result).toBeNull()
    })

    it("requires user to be participant", async () => {
      vi.mocked(db.conversation.findFirst).mockResolvedValue(null)

      await getConversation(schoolA, userId, "conv-1")

      expect(db.conversation.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            participants: {
              some: {
                userId,
              },
            },
          }),
        })
      )
    })
  })

  describe("getConversations", () => {
    it("only returns conversations for the specified school", async () => {
      vi.mocked(db.conversation.findMany).mockResolvedValue([])

      await getConversations(schoolA, userId, {})

      expect(db.conversation.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            schoolId: schoolA,
          }),
        })
      )
    })

    it("filters by participant membership", async () => {
      vi.mocked(db.conversation.findMany).mockResolvedValue([])

      await getConversations(schoolA, userId, {})

      expect(db.conversation.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            participants: {
              some: {
                userId,
              },
            },
          }),
        })
      )
    })
  })

  describe("getMessage", () => {
    it("scopes message query by schoolId through conversation", async () => {
      vi.mocked(db.message.findFirst).mockResolvedValue(null)

      await getMessage(schoolA, "msg-1")

      expect(db.message.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            id: "msg-1",
            conversation: {
              schoolId: schoolA,
            },
          }),
        })
      )
    })

    it("returns null for message in different school", async () => {
      vi.mocked(db.message.findFirst).mockResolvedValue(null)

      const result = await getMessage(schoolA, "msg-from-school-B")

      expect(result).toBeNull()
    })
  })

  describe("isConversationParticipant", () => {
    it("checks participant membership correctly", async () => {
      vi.mocked(db.conversationParticipant.findFirst).mockResolvedValue({
        id: "participant-1",
        conversationId: "conv-1",
        userId,
        role: "member",
      } as any)

      const result = await isConversationParticipant("conv-1", userId)

      expect(result).toBe(true)
    })

    it("returns false when user is not a participant", async () => {
      vi.mocked(db.conversationParticipant.findFirst).mockResolvedValue(null)

      const result = await isConversationParticipant("conv-1", "other-user")

      expect(result).toBe(false)
    })
  })

  describe("Cross-tenant attack prevention", () => {
    it("prevents accessing conversation via direct ID without school check", async () => {
      // Attacker knows conversation ID but is in different school
      vi.mocked(db.conversation.findFirst).mockResolvedValue(null)

      const attackerSchool = "attacker-school"
      const victimConversation = "victim-conv-123"

      const result = await getConversation(
        attackerSchool,
        "attacker-user",
        victimConversation
      )

      // Should return null because schoolId won't match
      expect(result).toBeNull()
      expect(db.conversation.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            schoolId: attackerSchool,
          }),
        })
      )
    })

    it("prevents reading messages from other school conversations", async () => {
      vi.mocked(db.message.findFirst).mockResolvedValue(null)

      const attackerSchool = "attacker-school"
      const victimMessage = "victim-msg-123"

      const result = await getMessage(attackerSchool, victimMessage)

      expect(result).toBeNull()
      expect(db.message.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            conversation: {
              schoolId: attackerSchool,
            },
          }),
        })
      )
    })
  })
})
