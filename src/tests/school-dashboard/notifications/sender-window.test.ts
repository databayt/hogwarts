/**
 * The email and WhatsApp workers only look at the last 48 hours of the
 * notifications table, so the scan can use the createdAt index instead of
 * walking 255k rows every run.
 */
import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { processWhatsAppNotifications } from "@/lib/whatsapp/dispatch"
import {
  EMAIL_QUEUE_MAX_AGE_DAYS,
  processPendingEmailNotifications,
} from "@/components/school-dashboard/notifications/email-service"

vi.mock("@/lib/db", () => ({
  db: {
    notification: {
      findMany: vi.fn(),
      updateMany: vi.fn(),
    },
  },
}))
vi.mock("@/env.mjs", () => ({ env: { RESEND_API_KEY: undefined } }))
vi.mock("@/components/translation/prewarm", () => ({
  prewarm: vi.fn().mockResolvedValue(undefined),
}))
vi.mock("@/lib/whatsapp/evolution-client", () => ({}))
vi.mock("@/lib/whatsapp/rate-limiter", () => ({
  checkAndConsumeRateLimit: vi.fn(),
}))

const H48 = 48 * 60 * 60 * 1000

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(db.notification.findMany).mockResolvedValue([])
  vi.mocked(db.notification.updateMany).mockResolvedValue({ count: 0 })
})

describe("notification sender window", () => {
  it("email age gate is 48 hours", () => {
    expect(EMAIL_QUEUE_MAX_AGE_DAYS * 24 * 60 * 60 * 1000).toBe(H48)
  })

  it("email pending read is bounded to the last 48h", async () => {
    const before = Date.now()
    await processPendingEmailNotifications(10)
    const call = vi.mocked(db.notification.findMany).mock.calls[0][0] as {
      where: { emailSent: boolean; createdAt: { gte: Date } }
    }
    expect(call.where.emailSent).toBe(false)
    const gte = call.where.createdAt.gte.getTime()
    expect(gte).toBeGreaterThanOrEqual(before - H48)
    expect(gte).toBeLessThanOrEqual(Date.now() - H48 + 1)
  })

  it("whatsapp sweep is bounded to the last 48h and keeps its other filters", async () => {
    const before = Date.now()
    await processWhatsAppNotifications()
    const call = vi.mocked(db.notification.findMany).mock.calls[0][0] as {
      where: Record<string, unknown> & { createdAt: { gte: Date } }
      orderBy: unknown
      take: number
    }
    const gte = call.where.createdAt.gte.getTime()
    expect(gte).toBeGreaterThanOrEqual(before - H48)
    expect(gte).toBeLessThanOrEqual(Date.now() - H48 + 1)
    expect(call.where.whatsappSent).toBe(false)
    expect(call.where.channels).toEqual({ has: "whatsapp" })
    expect(call.where.NOT).toBeDefined()
    expect(call.take).toBe(50)
  })
})
