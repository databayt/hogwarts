// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Tests for the pure poll-merge helper that reconciles a polled server
 * snapshot with the in-memory bell list. The contract:
 *   1. Fresh (unseen) items are prepended and reported as toast candidates.
 *   2. Read-state sync is FORWARD-ONLY: server read=true wins over a local
 *      unread row, but server read=false never downgrades a local optimistic
 *      read (unreadCount reconciles the badge instead).
 *   3. Unchanged polls return the SAME array reference (no re-render).
 *   4. The merged list is capped.
 */

import { describe, expect, it } from "vitest"

import { mergePolledNotifications } from "@/components/school-dashboard/notifications/poll-merge"
import type { NotificationDTO } from "@/components/school-dashboard/notifications/types"

function makeNotification(
  id: string,
  overrides: Partial<NotificationDTO> = {}
): NotificationDTO {
  return {
    id,
    schoolId: "school-1",
    userId: "user-1",
    type: "announcement",
    priority: "normal",
    title: `Title ${id}`,
    body: `Body ${id}`,
    lang: "ar",
    metadata: null,
    actorId: null,
    actor: null,
    read: false,
    readAt: null,
    channels: ["in_app"],
    emailSent: false,
    emailSentAt: null,
    createdAt: "2026-08-11T00:00:00.000Z",
    updatedAt: "2026-08-11T00:00:00.000Z",
    ...overrides,
  } as NotificationDTO
}

describe("mergePolledNotifications", () => {
  it("prepends unseen incoming items and reports them as fresh", () => {
    const prev = [makeNotification("a")]
    const incoming = [makeNotification("b"), makeNotification("a")]

    const { merged, fresh, changed } = mergePolledNotifications(prev, incoming)

    expect(changed).toBe(true)
    expect(fresh.map((n) => n.id)).toEqual(["b"])
    expect(merged.map((n) => n.id)).toEqual(["b", "a"])
  })

  it("syncs server read=true onto a locally-unread row (cross-tab read)", () => {
    const prev = [makeNotification("a", { read: false })]
    const incoming = [
      makeNotification("a", {
        read: true,
        readAt: "2026-08-11T01:00:00.000Z",
      }),
    ]

    const { merged, fresh, changed } = mergePolledNotifications(prev, incoming)

    expect(changed).toBe(true)
    expect(fresh).toHaveLength(0)
    expect(merged[0]?.read).toBe(true)
    expect(merged[0]?.readAt).toBe("2026-08-11T01:00:00.000Z")
  })

  it("never downgrades a local optimistic read when the server still says unread", () => {
    const prev = [
      makeNotification("a", {
        read: true,
        readAt: "2026-08-11T01:00:00.000Z",
      }),
    ]
    const incoming = [makeNotification("a", { read: false })]

    const { merged, changed } = mergePolledNotifications(prev, incoming)

    expect(changed).toBe(false)
    expect(merged[0]?.read).toBe(true)
  })

  it("returns the same array reference when nothing changed", () => {
    const prev = [makeNotification("a"), makeNotification("b")]
    const incoming = [makeNotification("a"), makeNotification("b")]

    const { merged, fresh, changed } = mergePolledNotifications(prev, incoming)

    expect(changed).toBe(false)
    expect(fresh).toHaveLength(0)
    expect(merged).toBe(prev)
  })

  it("caps the merged list at max", () => {
    const prev = Array.from({ length: 9 }, (_, i) => makeNotification(`p${i}`))
    const incoming = [makeNotification("n1"), makeNotification("n2")]

    const { merged } = mergePolledNotifications(prev, incoming, 10)

    expect(merged).toHaveLength(10)
    expect(merged[0]?.id).toBe("n1")
    expect(merged[1]?.id).toBe("n2")
  })

  it("handles an empty previous list (first poll)", () => {
    const incoming = [makeNotification("a"), makeNotification("b")]

    const { merged, fresh, changed } = mergePolledNotifications([], incoming)

    expect(changed).toBe(true)
    expect(fresh).toHaveLength(2)
    expect(merged.map((n) => n.id)).toEqual(["a", "b"])
  })
})
