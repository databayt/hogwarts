/**
 * processDueNotificationBatches — the cron sweep behind
 * /api/cron/process-broadcast-batches.
 *
 * Guards the scheduled-broadcast gap: sendBroadcast only processes inline
 * when unscheduled, so scheduled batches depend ENTIRELY on this sweep.
 * Also verifies the atomic pending→processing claim that prevents
 * overlapping cron runs from double-sending a broadcast.
 */
import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { processDueNotificationBatches } from "@/components/school-dashboard/notifications/email-service"

vi.mock("@/lib/db", () => ({
  db: {
    notificationBatch: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    notification: {
      createMany: vi.fn(),
    },
    user: {
      findMany: vi.fn(),
    },
    studentClass: {
      findMany: vi.fn(),
    },
  },
}))

vi.mock("@/env.mjs", () => ({
  env: { RESEND_API_KEY: undefined },
}))

vi.mock("@/components/translation/prewarm", () => ({
  prewarm: vi.fn().mockResolvedValue(undefined),
}))

const BATCH = {
  id: "batch-1",
  schoolId: "school-1",
  createdBy: "user-admin",
}

// Full row as processNotificationBatch re-fetches it
const BATCH_ROW = {
  ...BATCH,
  type: "announcement",
  title: "Sports day",
  body: "Friday 9am",
  targetRole: null,
  targetClassId: null,
  targetUserIds: ["u1", "u2"],
  status: "processing",
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe("processDueNotificationBatches", () => {
  it("returns zeros when nothing is due", async () => {
    vi.mocked(db.notificationBatch.findMany).mockResolvedValue([] as never)

    const result = await processDueNotificationBatches()

    expect(result).toEqual({
      processed: 0,
      completed: 0,
      failed: 0,
      notificationsCreated: 0,
    })
    expect(db.notificationBatch.updateMany).not.toHaveBeenCalled()
  })

  it("sweeps due scheduled batches: pending + scheduledFor <= now (or stuck unscheduled past grace)", async () => {
    vi.mocked(db.notificationBatch.findMany).mockResolvedValue([] as never)

    await processDueNotificationBatches()

    const where = vi.mocked(db.notificationBatch.findMany).mock.calls[0][0]
      ?.where as Record<string, unknown>
    expect(where.status).toBe("pending")
    const or = where.OR as Array<Record<string, unknown>>
    expect(or[0]).toHaveProperty("scheduledFor")
    expect(or[1]).toMatchObject({ scheduledFor: null })
  })

  it("claims atomically and processes a due batch to completion", async () => {
    vi.mocked(db.notificationBatch.findMany).mockResolvedValue([BATCH] as never)
    // Claim succeeds
    vi.mocked(db.notificationBatch.updateMany).mockResolvedValue({
      count: 1,
    } as never)
    // processNotificationBatch internals
    vi.mocked(db.notificationBatch.findFirst).mockResolvedValue(
      BATCH_ROW as never
    )
    vi.mocked(db.notificationBatch.update).mockResolvedValue({} as never)
    vi.mocked(db.notification.createMany).mockResolvedValue({
      count: 2,
    } as never)

    const result = await processDueNotificationBatches()

    // Atomic claim: only flips pending rows
    expect(db.notificationBatch.updateMany).toHaveBeenCalledWith({
      where: { id: "batch-1", status: "pending" },
      data: { status: "processing" },
    })
    // One in-app+email notification per target user
    expect(db.notification.createMany).toHaveBeenCalledWith({
      data: [
        expect.objectContaining({ userId: "u1", schoolId: "school-1" }),
        expect.objectContaining({ userId: "u2", schoolId: "school-1" }),
      ],
    })
    // Batch marked completed
    expect(db.notificationBatch.update).toHaveBeenCalledWith({
      where: { id: "batch-1" },
      data: { status: "completed", processedAt: expect.any(Date) },
    })
    expect(result).toEqual({
      processed: 1,
      completed: 1,
      failed: 0,
      notificationsCreated: 2,
    })
  })

  it("skips a batch another cron run already claimed (count 0)", async () => {
    vi.mocked(db.notificationBatch.findMany).mockResolvedValue([BATCH] as never)
    vi.mocked(db.notificationBatch.updateMany).mockResolvedValue({
      count: 0,
    } as never)

    const result = await processDueNotificationBatches()

    // Never re-processed — no notification writes
    expect(db.notification.createMany).not.toHaveBeenCalled()
    expect(result.completed).toBe(0)
    expect(result.failed).toBe(0)
  })

  it("marks the batch failed and keeps sweeping when processing throws", async () => {
    const secondBatch = { ...BATCH, id: "batch-2" }
    vi.mocked(db.notificationBatch.findMany).mockResolvedValue([
      BATCH,
      secondBatch,
    ] as never)
    vi.mocked(db.notificationBatch.updateMany).mockResolvedValue({
      count: 1,
    } as never)
    // First batch: re-fetch explodes; second batch: processes fine
    vi.mocked(db.notificationBatch.findFirst)
      .mockRejectedValueOnce(new Error("db down"))
      .mockResolvedValueOnce({ ...BATCH_ROW, id: "batch-2" } as never)
    vi.mocked(db.notificationBatch.update).mockResolvedValue({} as never)
    vi.mocked(db.notification.createMany).mockResolvedValue({
      count: 2,
    } as never)

    const result = await processDueNotificationBatches()

    expect(result.processed).toBe(2)
    expect(result.failed).toBe(1)
    expect(result.completed).toBe(1)
    // Thrown batch flipped to failed with the error recorded
    expect(db.notificationBatch.updateMany).toHaveBeenCalledWith({
      where: { id: "batch-1" },
      data: { status: "failed", errors: ["db down"] },
    })
  })
})
