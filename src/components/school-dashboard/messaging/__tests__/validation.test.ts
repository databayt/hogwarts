import { describe, expect, it } from "vitest"

import {
  addReactionSchema,
  createConversationSchema,
  createMessageSchema,
  deleteMessageSchema,
  saveDraftSchema,
  updateMessageSchema,
} from "../validation"

describe("Messaging Validation", () => {
  describe("createConversationSchema", () => {
    it("validates direct conversation with one participant", () => {
      const data = {
        type: "direct",
        participantIds: ["user-456"],
      }

      const result = createConversationSchema.safeParse(data)

      expect(result.success).toBe(true)
    })

    it("rejects direct conversation with multiple participants", () => {
      const data = {
        type: "direct",
        participantIds: ["user-456", "user-789"],
      }

      const result = createConversationSchema.safeParse(data)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain(
          "exactly one other participant"
        )
      }
    })

    it("rejects direct conversation with title", () => {
      const data = {
        type: "direct",
        title: "Should not have title",
        participantIds: ["user-456"],
      }

      const result = createConversationSchema.safeParse(data)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("cannot have titles")
      }
    })

    it("requires title for group conversations", () => {
      const data = {
        type: "group",
        participantIds: ["user-456", "user-789"],
      }

      const result = createConversationSchema.safeParse(data)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("requires a title")
      }
    })

    it("validates group conversation with title", () => {
      const data = {
        type: "group",
        title: "Project Team",
        participantIds: ["user-456", "user-789"],
      }

      const result = createConversationSchema.safeParse(data)

      expect(result.success).toBe(true)
    })

    it("requires title for announcement conversations", () => {
      const data = {
        type: "announcement",
        participantIds: ["user-456"],
      }

      const result = createConversationSchema.safeParse(data)

      expect(result.success).toBe(false)
    })

    it("validates title length (max 255 chars)", () => {
      const data = {
        type: "group",
        title: "a".repeat(256),
        participantIds: ["user-456"],
      }

      const result = createConversationSchema.safeParse(data)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("255")
      }
    })

    it("requires at least one participant", () => {
      const data = {
        type: "group",
        title: "Empty Group",
        participantIds: [],
      }

      const result = createConversationSchema.safeParse(data)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("At least one")
      }
    })
  })

  describe("createMessageSchema", () => {
    it("validates basic message", () => {
      const data = {
        conversationId: "conv-123",
        content: "Hello, world!",
        contentType: "text",
      }

      const result = createMessageSchema.safeParse(data)

      expect(result.success).toBe(true)
    })

    it("requires conversationId", () => {
      const data = {
        content: "Hello, world!",
        contentType: "text",
      }

      const result = createMessageSchema.safeParse(data)

      expect(result.success).toBe(false)
    })

    it("requires message content", () => {
      const data = {
        conversationId: "conv-123",
        content: "",
        contentType: "text",
      }

      const result = createMessageSchema.safeParse(data)

      expect(result.success).toBe(false)
    })

    it("enforces message length limit (4000 chars)", () => {
      const data = {
        conversationId: "conv-123",
        content: "a".repeat(4001),
        contentType: "text",
      }

      const result = createMessageSchema.safeParse(data)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("too long")
      }
    })

    it("allows message with replyToId", () => {
      const data = {
        conversationId: "conv-123",
        content: "This is a reply",
        contentType: "text",
        replyToId: "msg-456",
      }

      const result = createMessageSchema.safeParse(data)

      expect(result.success).toBe(true)
    })

    it("allows message with metadata", () => {
      const data = {
        conversationId: "conv-123",
        content: "Message with metadata",
        contentType: "text",
        metadata: {
          customField: "value",
          anotherField: 123,
        },
      }

      const result = createMessageSchema.safeParse(data)

      expect(result.success).toBe(true)
    })
  })

  describe("updateMessageSchema", () => {
    it("validates message update", () => {
      const data = {
        messageId: "msg-123",
        content: "Updated content",
      }

      const result = updateMessageSchema.safeParse(data)

      expect(result.success).toBe(true)
    })

    it("requires messageId", () => {
      const data = {
        content: "Updated content",
      }

      const result = updateMessageSchema.safeParse(data)

      expect(result.success).toBe(false)
    })

    it("enforces updated content length limit", () => {
      const data = {
        messageId: "msg-123",
        content: "a".repeat(4001),
      }

      const result = updateMessageSchema.safeParse(data)

      expect(result.success).toBe(false)
    })
  })

  describe("deleteMessageSchema", () => {
    it("validates message deletion", () => {
      const data = {
        messageId: "msg-123",
      }

      const result = deleteMessageSchema.safeParse(data)

      expect(result.success).toBe(true)
    })

    it("requires messageId", () => {
      const data = {}

      const result = deleteMessageSchema.safeParse(data)

      expect(result.success).toBe(false)
    })
  })

  describe("addReactionSchema", () => {
    it("validates emoji reaction", () => {
      const data = {
        messageId: "msg-123",
        emoji: "👍",
      }

      const result = addReactionSchema.safeParse(data)

      expect(result.success).toBe(true)
    })

    it("requires messageId", () => {
      const data = {
        emoji: "👍",
      }

      const result = addReactionSchema.safeParse(data)

      expect(result.success).toBe(false)
    })

    it("requires emoji", () => {
      const data = {
        messageId: "msg-123",
      }

      const result = addReactionSchema.safeParse(data)

      expect(result.success).toBe(false)
    })

    it("enforces emoji length limit (10 chars)", () => {
      const data = {
        messageId: "msg-123",
        emoji: "a".repeat(11),
      }

      const result = addReactionSchema.safeParse(data)

      expect(result.success).toBe(false)
    })
  })

  describe("saveDraftSchema", () => {
    it("validates draft with content", () => {
      const data = {
        conversationId: "conv-123",
        content: "Draft message",
      }

      const result = saveDraftSchema.safeParse(data)

      expect(result.success).toBe(true)
    })

    it("allows empty content (clearing draft)", () => {
      const data = {
        conversationId: "conv-123",
        content: "",
      }

      const result = saveDraftSchema.safeParse(data)

      expect(result.success).toBe(true)
    })

    it("enforces draft length limit (4000 chars)", () => {
      const data = {
        conversationId: "conv-123",
        content: "a".repeat(4001),
      }

      const result = saveDraftSchema.safeParse(data)

      expect(result.success).toBe(false)
    })

    it("allows draft with replyToId", () => {
      const data = {
        conversationId: "conv-123",
        content: "Reply draft",
        replyToId: "msg-456",
      }

      const result = saveDraftSchema.safeParse(data)

      expect(result.success).toBe(true)
    })
  })
})
