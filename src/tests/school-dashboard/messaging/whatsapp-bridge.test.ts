// Copyright (c) 2025-present databayt

import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import {
  dispatchMessageToWhatsApp,
  retryFailedMessageDispatches,
  syncReadReceiptsToWhatsApp,
} from "@/components/school-dashboard/messaging/whatsapp-bridge"

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock("@/lib/db", () => ({
  db: {
    whatsAppSession: { findUnique: vi.fn() },
    message: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    conversationParticipant: {
      findMany: vi.fn(),
      update: vi.fn(),
    },
    whatsAppMessage: { create: vi.fn() },
    messageWhatsappDelivery: {
      upsert: vi.fn(),
      update: vi.fn(),
      findMany: vi.fn().mockResolvedValue([]),
    },
    conversation: { update: vi.fn(), findUnique: vi.fn() },
    guardian: { findUnique: vi.fn() },
    teacher: { findUnique: vi.fn() },
  },
}))

const mockSendText = vi.fn()
const mockSendMedia = vi.fn()
const mockReadMessages = vi.fn()

vi.mock("@/lib/whatsapp/evolution-client", () => ({
  sendText: mockSendText,
  sendMedia: mockSendMedia,
  readMessages: mockReadMessages,
}))

const mockCheckAndConsumeRateLimit = vi.fn().mockReturnValue({ allowed: true })

vi.mock("@/lib/whatsapp/rate-limiter", () => ({
  checkAndConsumeRateLimit: mockCheckAndConsumeRateLimit,
}))

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const SCHOOL_ID = "school-1"
const CONVERSATION_ID = "conv-1"
const MESSAGE_ID = "msg-1"
const SENDER_USER_ID = "user-sender"

const connectedSession = {
  id: "session-1",
  instanceName: "school1-instance",
  status: "connected",
}

const disconnectedSession = {
  id: "session-1",
  instanceName: "school1-instance",
  status: "disconnected",
}

const sendTextResult = { key: { id: "wa-msg-123" } }
const sendMediaResult = { key: { id: "wa-media-456" } }

// ---------------------------------------------------------------------------
// dispatchMessageToWhatsApp
// ---------------------------------------------------------------------------

describe("dispatchMessageToWhatsApp", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockCheckAndConsumeRateLimit.mockReturnValue({ allowed: true })
  })

  it("returns early when no WhatsApp session found", async () => {
    vi.mocked(db.whatsAppSession.findUnique).mockResolvedValue(null)

    await dispatchMessageToWhatsApp(
      SCHOOL_ID,
      CONVERSATION_ID,
      MESSAGE_ID,
      "Hello",
      SENDER_USER_ID
    )

    expect(db.whatsAppSession.findUnique).toHaveBeenCalledWith({
      where: { schoolId: SCHOOL_ID },
      select: { id: true, instanceName: true, status: true },
    })
    expect(db.message.findUnique).not.toHaveBeenCalled()
    expect(mockSendText).not.toHaveBeenCalled()
  })

  it("returns early when session is disconnected", async () => {
    vi.mocked(db.whatsAppSession.findUnique).mockResolvedValue(
      disconnectedSession as any
    )

    await dispatchMessageToWhatsApp(
      SCHOOL_ID,
      CONVERSATION_ID,
      MESSAGE_ID,
      "Hello",
      SENDER_USER_ID
    )

    expect(db.message.findUnique).not.toHaveBeenCalled()
    expect(mockSendText).not.toHaveBeenCalled()
  })

  it("returns early when no participants have WhatsApp phones", async () => {
    vi.mocked(db.whatsAppSession.findUnique).mockResolvedValue(
      connectedSession as any
    )
    vi.mocked(db.message.findUnique).mockResolvedValue({
      attachments: [],
    } as any)
    vi.mocked(db.conversationParticipant.findMany).mockResolvedValue([])

    await dispatchMessageToWhatsApp(
      SCHOOL_ID,
      CONVERSATION_ID,
      MESSAGE_ID,
      "Hello",
      SENDER_USER_ID
    )

    expect(mockSendText).not.toHaveBeenCalled()
    expect(mockSendMedia).not.toHaveBeenCalled()
  })

  it("sends text messages via evolution.sendText for text-only messages", async () => {
    vi.mocked(db.whatsAppSession.findUnique).mockResolvedValue(
      connectedSession as any
    )
    vi.mocked(db.message.findUnique).mockResolvedValue({
      attachments: [],
    } as any)
    vi.mocked(db.conversationParticipant.findMany).mockResolvedValue([
      { whatsappPhone: "+966501234567" },
    ] as any)
    mockSendText.mockResolvedValue(sendTextResult)

    await dispatchMessageToWhatsApp(
      SCHOOL_ID,
      CONVERSATION_ID,
      MESSAGE_ID,
      "Hello world",
      SENDER_USER_ID
    )

    expect(mockSendText).toHaveBeenCalledWith(
      connectedSession.instanceName,
      "+966501234567",
      "Hello world"
    )
    expect(mockSendMedia).not.toHaveBeenCalled()
  })

  it("sends media via evolution.sendMedia when message has attachments", async () => {
    vi.mocked(db.whatsAppSession.findUnique).mockResolvedValue(
      connectedSession as any
    )
    vi.mocked(db.message.findUnique).mockResolvedValue({
      attachments: [
        {
          fileUrl: "https://cdn.example.com/photo.jpg",
          fileType: "image/jpeg",
          fileName: "photo.jpg",
        },
      ],
    } as any)
    vi.mocked(db.conversationParticipant.findMany).mockResolvedValue([
      { whatsappPhone: "+966501234567" },
    ] as any)
    mockSendMedia.mockResolvedValue(sendMediaResult)

    await dispatchMessageToWhatsApp(
      SCHOOL_ID,
      CONVERSATION_ID,
      MESSAGE_ID,
      "Check this out",
      SENDER_USER_ID
    )

    expect(mockSendMedia).toHaveBeenCalledWith(
      connectedSession.instanceName,
      "+966501234567",
      "https://cdn.example.com/photo.jpg",
      {
        mediatype: "image",
        caption: "Check this out",
        fileName: "photo.jpg",
      }
    )
    expect(mockSendText).not.toHaveBeenCalled()
  })

  describe("MIME type mapping", () => {
    beforeEach(() => {
      vi.mocked(db.whatsAppSession.findUnique).mockResolvedValue(
        connectedSession as any
      )
      vi.mocked(db.conversationParticipant.findMany).mockResolvedValue([
        { whatsappPhone: "+966501234567" },
      ] as any)
      mockSendMedia.mockResolvedValue(sendMediaResult)
    })

    it.each([
      ["image/jpeg", "image"],
      ["image/png", "image"],
      ["image/webp", "image"],
      ["video/mp4", "video"],
      ["video/quicktime", "video"],
      ["audio/mpeg", "audio"],
      ["audio/ogg", "audio"],
      ["application/pdf", "document"],
      ["application/msword", "document"],
      ["text/plain", "document"],
    ])("maps %s to %s", async (mime, expectedMediaType) => {
      vi.mocked(db.message.findUnique).mockResolvedValue({
        attachments: [
          {
            fileUrl: "https://cdn.example.com/file",
            fileType: mime,
            fileName: "file",
          },
        ],
      } as any)

      await dispatchMessageToWhatsApp(
        SCHOOL_ID,
        CONVERSATION_ID,
        MESSAGE_ID,
        "",
        SENDER_USER_ID
      )

      expect(mockSendMedia).toHaveBeenCalledWith(
        connectedSession.instanceName,
        "+966501234567",
        "https://cdn.example.com/file",
        expect.objectContaining({ mediatype: expectedMediaType })
      )
    })
  })

  it("updates message with whatsappMessageId and status sent on success", async () => {
    vi.mocked(db.whatsAppSession.findUnique).mockResolvedValue(
      connectedSession as any
    )
    vi.mocked(db.message.findUnique).mockResolvedValue({
      attachments: [],
    } as any)
    vi.mocked(db.conversationParticipant.findMany).mockResolvedValue([
      { whatsappPhone: "+966501234567" },
    ] as any)
    mockSendText.mockResolvedValue(sendTextResult)

    await dispatchMessageToWhatsApp(
      SCHOOL_ID,
      CONVERSATION_ID,
      MESSAGE_ID,
      "Hello",
      SENDER_USER_ID
    )

    expect(db.message.update).toHaveBeenCalledWith({
      where: { id: MESSAGE_ID },
      data: {
        whatsappMessageId: "wa-msg-123",
        whatsappStatus: "sent",
        whatsappPhone: "+966501234567",
      },
    })
  })

  it("updates message with status failed on error", async () => {
    vi.mocked(db.whatsAppSession.findUnique).mockResolvedValue(
      connectedSession as any
    )
    vi.mocked(db.message.findUnique).mockResolvedValue({
      attachments: [],
    } as any)
    vi.mocked(db.conversationParticipant.findMany).mockResolvedValue([
      { whatsappPhone: "+966501234567" },
    ] as any)
    mockSendText.mockRejectedValue(new Error("Network error"))

    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})

    await dispatchMessageToWhatsApp(
      SCHOOL_ID,
      CONVERSATION_ID,
      MESSAGE_ID,
      "Hello",
      SENDER_USER_ID
    )

    expect(db.message.update).toHaveBeenCalledWith({
      where: { id: MESSAGE_ID },
      data: {
        whatsappStatus: "failed",
        whatsappPhone: "+966501234567",
      },
    })

    consoleSpy.mockRestore()
  })

  it("creates WhatsAppMessage audit record on success", async () => {
    vi.mocked(db.whatsAppSession.findUnique).mockResolvedValue(
      connectedSession as any
    )
    vi.mocked(db.message.findUnique).mockResolvedValue({
      attachments: [],
    } as any)
    vi.mocked(db.conversationParticipant.findMany).mockResolvedValue([
      { whatsappPhone: "+966501234567" },
    ] as any)
    mockSendText.mockResolvedValue(sendTextResult)

    await dispatchMessageToWhatsApp(
      SCHOOL_ID,
      CONVERSATION_ID,
      MESSAGE_ID,
      "Hello",
      SENDER_USER_ID
    )

    expect(db.whatsAppMessage.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        schoolId: SCHOOL_ID,
        sessionId: connectedSession.id,
        waMessageId: "wa-msg-123",
        recipientPhone: "+966501234567",
        content: "Hello",
        contentType: "text",
        direction: "outgoing",
        status: "sent",
        triggerType: "messaging",
        triggerId: MESSAGE_ID,
      }),
    })
  })

  it("group fan-out writes a per-recipient delivery row and no Message scalars", async () => {
    vi.mocked(db.whatsAppSession.findUnique).mockResolvedValue(
      connectedSession as any
    )
    vi.mocked(db.message.findUnique).mockResolvedValue({
      attachments: [],
    } as any)
    // Two recipients → group fan-out
    vi.mocked(db.conversationParticipant.findMany).mockResolvedValue([
      { id: "part-1", userId: "u1", whatsappPhone: "+966500000001" },
      { id: "part-2", userId: "u2", whatsappPhone: "+966500000002" },
    ] as any)
    mockSendText.mockResolvedValue(sendTextResult)

    await dispatchMessageToWhatsApp(
      SCHOOL_ID,
      CONVERSATION_ID,
      MESSAGE_ID,
      "Hello group",
      SENDER_USER_ID
    )

    // One delivery row per recipient (the retry handle for group fan-out)
    expect(db.messageWhatsappDelivery.upsert).toHaveBeenCalledTimes(2)
    expect(db.messageWhatsappDelivery.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          schoolId: SCHOOL_ID,
          messageId: MESSAGE_ID,
          participantId: "part-1",
          phone: "+966500000001",
          status: "sent",
          providerMessageId: "wa-msg-123",
        }),
      })
    )
    // Group dispatch must NOT clobber the shared Message scalar columns
    expect(db.message.update).not.toHaveBeenCalled()
  })

  it("creates WhatsAppMessage audit record with media contentType for attachments", async () => {
    vi.mocked(db.whatsAppSession.findUnique).mockResolvedValue(
      connectedSession as any
    )
    vi.mocked(db.message.findUnique).mockResolvedValue({
      attachments: [
        {
          fileUrl: "https://cdn.example.com/video.mp4",
          fileType: "video/mp4",
          fileName: "video.mp4",
        },
      ],
    } as any)
    vi.mocked(db.conversationParticipant.findMany).mockResolvedValue([
      { whatsappPhone: "+966501234567" },
    ] as any)
    mockSendMedia.mockResolvedValue(sendMediaResult)

    await dispatchMessageToWhatsApp(
      SCHOOL_ID,
      CONVERSATION_ID,
      MESSAGE_ID,
      "",
      SENDER_USER_ID
    )

    expect(db.whatsAppMessage.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        contentType: "video",
        content: "video.mp4",
      }),
    })
  })

  it("skips participant when rate limit exceeded and sets status to pending", async () => {
    vi.mocked(db.whatsAppSession.findUnique).mockResolvedValue(
      connectedSession as any
    )
    vi.mocked(db.message.findUnique).mockResolvedValue({
      attachments: [],
    } as any)
    vi.mocked(db.conversationParticipant.findMany).mockResolvedValue([
      { whatsappPhone: "+966501234567" },
      { whatsappPhone: "+966509876543" },
    ] as any)
    mockCheckAndConsumeRateLimit.mockReturnValue({ allowed: false })

    await dispatchMessageToWhatsApp(
      SCHOOL_ID,
      CONVERSATION_ID,
      MESSAGE_ID,
      "Hello",
      SENDER_USER_ID
    )

    expect(mockSendText).not.toHaveBeenCalled()
    // Two participants = group dispatch. Per the 2026-04-22 fix, group recipients
    // log per-recipient pending WhatsAppMessage rows instead of clobbering the
    // Message scalar columns (which would last-writer-wins across recipients).
    expect(db.message.update).not.toHaveBeenCalled()
    expect(db.whatsAppMessage.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        recipientPhone: "+966501234567",
        status: "pending",
        triggerType: "messaging",
        triggerId: MESSAGE_ID,
      }),
    })
  })
})

// ---------------------------------------------------------------------------
// syncReadReceiptsToWhatsApp
// ---------------------------------------------------------------------------

describe("syncReadReceiptsToWhatsApp", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns early when no WhatsApp session", async () => {
    vi.mocked(db.whatsAppSession.findUnique).mockResolvedValue(null)

    await syncReadReceiptsToWhatsApp(SCHOOL_ID, CONVERSATION_ID, [MESSAGE_ID])

    expect(db.message.findMany).not.toHaveBeenCalled()
    expect(mockReadMessages).not.toHaveBeenCalled()
  })

  it("returns early when session is disconnected", async () => {
    vi.mocked(db.whatsAppSession.findUnique).mockResolvedValue(
      disconnectedSession as any
    )

    await syncReadReceiptsToWhatsApp(SCHOOL_ID, CONVERSATION_ID, [MESSAGE_ID])

    expect(db.message.findMany).not.toHaveBeenCalled()
    expect(mockReadMessages).not.toHaveBeenCalled()
  })

  it("calls evolution.readMessages for messages with whatsappMessageId", async () => {
    vi.mocked(db.whatsAppSession.findUnique).mockResolvedValue(
      connectedSession as any
    )
    vi.mocked(db.message.findMany).mockResolvedValue([
      { whatsappMessageId: "wa-msg-1", whatsappPhone: "+966501234567" },
      { whatsappMessageId: "wa-msg-2", whatsappPhone: "+966509876543" },
    ] as any)

    await syncReadReceiptsToWhatsApp(SCHOOL_ID, CONVERSATION_ID, [
      "msg-1",
      "msg-2",
    ])

    expect(mockReadMessages).toHaveBeenCalledTimes(2)
    expect(mockReadMessages).toHaveBeenCalledWith(
      connectedSession.instanceName,
      "+966501234567",
      ["wa-msg-1"]
    )
    expect(mockReadMessages).toHaveBeenCalledWith(
      connectedSession.instanceName,
      "+966509876543",
      ["wa-msg-2"]
    )
  })

  it("skips messages already marked as read", async () => {
    vi.mocked(db.whatsAppSession.findUnique).mockResolvedValue(
      connectedSession as any
    )
    // The query itself filters out read messages via whatsappStatus: { not: "read" }
    // so findMany returns only non-read messages
    vi.mocked(db.message.findMany).mockResolvedValue([])

    await syncReadReceiptsToWhatsApp(SCHOOL_ID, CONVERSATION_ID, [MESSAGE_ID])

    expect(db.message.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          whatsappStatus: { not: "read" },
        }),
      })
    )
    expect(mockReadMessages).not.toHaveBeenCalled()
  })

  it("handles errors gracefully without throwing", async () => {
    vi.mocked(db.whatsAppSession.findUnique).mockResolvedValue(
      connectedSession as any
    )
    vi.mocked(db.message.findMany).mockResolvedValue([
      { whatsappMessageId: "wa-msg-1", whatsappPhone: "+966501234567" },
    ] as any)
    mockReadMessages.mockRejectedValue(new Error("API timeout"))

    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})

    // Should not throw
    await expect(
      syncReadReceiptsToWhatsApp(SCHOOL_ID, CONVERSATION_ID, [MESSAGE_ID])
    ).resolves.toBeUndefined()

    expect(consoleSpy).toHaveBeenCalled()
    consoleSpy.mockRestore()
  })
})

// ---------------------------------------------------------------------------
// retryFailedMessageDispatches
// ---------------------------------------------------------------------------

describe("retryFailedMessageDispatches", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockCheckAndConsumeRateLimit.mockReturnValue({ allowed: true })
  })

  it("returns zeros when no failed messages", async () => {
    vi.mocked(db.message.findMany).mockResolvedValue([])

    const result = await retryFailedMessageDispatches()

    expect(result).toEqual({
      processed: 0,
      sent: 0,
      failed: 0,
      skipped: 0,
    })
  })

  it("retries messages with status failed or pending", async () => {
    vi.mocked(db.message.findMany).mockResolvedValue([
      {
        id: "msg-failed",
        conversationId: CONVERSATION_ID,
        senderId: SENDER_USER_ID,
        content: "Retry me",
        whatsappPhone: "+966501234567",
        metadata: {},
        conversation: { schoolId: SCHOOL_ID },
      },
    ] as any)

    // Mock the dispatchMessageToWhatsApp call chain
    vi.mocked(db.whatsAppSession.findUnique).mockResolvedValue(
      connectedSession as any
    )
    vi.mocked(db.message.findUnique).mockResolvedValue({
      attachments: [],
    } as any)
    vi.mocked(db.conversationParticipant.findMany).mockResolvedValue([
      { whatsappPhone: "+966501234567" },
    ] as any)
    mockSendText.mockResolvedValue(sendTextResult)

    const result = await retryFailedMessageDispatches()

    expect(db.message.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          whatsappStatus: { in: ["failed", "pending"] },
          whatsappPhone: { not: null },
          conversation: { whatsappEnabled: true },
        },
      })
    )
    expect(result.processed).toBe(1)
    expect(result.sent).toBe(1)
  })

  it("skips messages that exceed MAX_RETRY_ATTEMPTS (5)", async () => {
    vi.mocked(db.message.findMany).mockResolvedValue([
      {
        id: "msg-exhausted",
        conversationId: CONVERSATION_ID,
        senderId: SENDER_USER_ID,
        content: "Too many retries",
        whatsappPhone: "+966501234567",
        metadata: { waRetryCount: 5 },
        conversation: { schoolId: SCHOOL_ID },
      },
    ] as any)

    const result = await retryFailedMessageDispatches()

    expect(result.skipped).toBe(1)
    expect(result.sent).toBe(0)
    // Should not attempt update for retry metadata
    expect(db.message.update).not.toHaveBeenCalled()
  })

  it("respects exponential backoff delay", async () => {
    // Message was attempted 100ms ago with retryCount=2 → backoff is 4000ms
    // So it should be skipped because not enough time has passed
    const recentAttempt = new Date(Date.now() - 100).toISOString()

    vi.mocked(db.message.findMany).mockResolvedValue([
      {
        id: "msg-backoff",
        conversationId: CONVERSATION_ID,
        senderId: SENDER_USER_ID,
        content: "Too soon",
        whatsappPhone: "+966501234567",
        metadata: {
          waRetryCount: 2,
          waLastAttempt: recentAttempt,
        },
        conversation: { schoolId: SCHOOL_ID },
      },
    ] as any)

    const result = await retryFailedMessageDispatches()

    expect(result.skipped).toBe(1)
    expect(result.sent).toBe(0)
    expect(db.message.update).not.toHaveBeenCalled()
  })

  it("proceeds when backoff delay has elapsed", async () => {
    // Message was attempted 10 seconds ago with retryCount=1 → backoff is 2000ms
    // 10000ms > 2000ms so it should proceed
    const oldAttempt = new Date(Date.now() - 10000).toISOString()

    vi.mocked(db.message.findMany).mockResolvedValue([
      {
        id: "msg-ready",
        conversationId: CONVERSATION_ID,
        senderId: SENDER_USER_ID,
        content: "Ready to retry",
        whatsappPhone: "+966501234567",
        metadata: {
          waRetryCount: 1,
          waLastAttempt: oldAttempt,
        },
        conversation: { schoolId: SCHOOL_ID },
      },
    ] as any)

    // Mock the dispatchMessageToWhatsApp call chain
    vi.mocked(db.whatsAppSession.findUnique).mockResolvedValue(
      connectedSession as any
    )
    vi.mocked(db.message.findUnique).mockResolvedValue({
      attachments: [],
    } as any)
    vi.mocked(db.conversationParticipant.findMany).mockResolvedValue([
      { whatsappPhone: "+966501234567" },
    ] as any)
    mockSendText.mockResolvedValue(sendTextResult)

    const result = await retryFailedMessageDispatches()

    expect(result.sent).toBe(1)
  })

  it("increments waRetryCount in metadata before retrying", async () => {
    vi.mocked(db.message.findMany).mockResolvedValue([
      {
        id: "msg-retry",
        conversationId: CONVERSATION_ID,
        senderId: SENDER_USER_ID,
        content: "Retry me",
        whatsappPhone: "+966501234567",
        metadata: { waRetryCount: 2 },
        conversation: { schoolId: SCHOOL_ID },
      },
    ] as any)

    // Mock the dispatchMessageToWhatsApp call chain
    vi.mocked(db.whatsAppSession.findUnique).mockResolvedValue(
      connectedSession as any
    )
    vi.mocked(db.message.findUnique).mockResolvedValue({
      attachments: [],
    } as any)
    vi.mocked(db.conversationParticipant.findMany).mockResolvedValue([
      { whatsappPhone: "+966501234567" },
    ] as any)
    mockSendText.mockResolvedValue(sendTextResult)

    await retryFailedMessageDispatches()

    // The first db.message.update call is the retry metadata update
    expect(db.message.update).toHaveBeenCalledWith({
      where: { id: "msg-retry" },
      data: {
        metadata: expect.objectContaining({
          waRetryCount: 3,
          waLastAttempt: expect.any(String),
        }),
      },
    })
  })

  it("counts failed retries correctly", async () => {
    vi.mocked(db.message.findMany).mockResolvedValue([
      {
        id: "msg-will-fail",
        conversationId: CONVERSATION_ID,
        senderId: SENDER_USER_ID,
        content: "Will fail again",
        whatsappPhone: "+966501234567",
        metadata: {},
        conversation: { schoolId: SCHOOL_ID },
      },
    ] as any)

    // Mock the dispatchMessageToWhatsApp to throw
    vi.mocked(db.whatsAppSession.findUnique).mockResolvedValue(
      connectedSession as any
    )
    vi.mocked(db.message.findUnique).mockRejectedValue(
      new Error("DB connection lost")
    )

    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})

    const result = await retryFailedMessageDispatches()

    expect(result.failed).toBe(1)
    expect(result.sent).toBe(0)

    consoleSpy.mockRestore()
  })
})
