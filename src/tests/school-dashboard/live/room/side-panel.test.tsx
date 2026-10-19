// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * lr-05: the tab strip's buttons and the close button rendered well under the
 * 44px touch target the rest of the room's chrome uses (`room/glyph.ts`'s
 * `size-11`). The fix keeps the visually-compact pill but reaches 44px via an
 * out-of-flow `::after` — checked here as the presence of that hit-area
 * class, since jsdom has no layout engine to measure real pixels against.
 *
 * Rendered with `tab="questions"`: the one tab whose content
 * (`QuestionsTab`) reads only `channel.state`, so the strip is exercised
 * without mocking `useParticipants`. The chat tab stays mounted (hidden) and
 * takes its state as a prop, so a stub chat is enough.
 */
import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { initialClassState } from "@/components/school-dashboard/live/room/class-channel"
import { resolveRoomLabels } from "@/components/school-dashboard/live/room/labels"
import { SidePanel } from "@/components/school-dashboard/live/room/side-panel"
import type { ClassChannel } from "@/components/school-dashboard/live/room/use-class-channel"
import type { RoomTools } from "@/components/school-dashboard/live/types"

// The chat tab's header (the /messages WhatsApp group header) lists who is in
// the room through `useParticipants`, which needs a LiveKit Room context.
vi.mock("@livekit/components-react", async (orig) => ({
  ...(await orig<typeof import("@livekit/components-react")>()),
  useParticipants: () => [],
}))

const labels = resolveRoomLabels(undefined)
const tools: RoomTools = {
  chat: true,
  hands: true,
  polls: true,
  whiteboard: true,
  studentShare: false,
}

const channel: ClassChannel = {
  state: initialClassState(),
  isHost: true,
  hostIdentity: "host-1",
  send: async () => {},
  sendStroke: async () => {},
  hands: [],
  handUp: false,
  setHand: async () => {},
  clearHand: async () => {},
  handsSince: new Map(),
  clearAllHands: async () => {},
  canDraw: false,
  sendDraft: () => {},
  sendReaction: () => {},
  setGrant: async () => {},
  subscribe: () => () => {},
  localIdentity: "me",
}

const chat = {
  messages: [],
  send: () => {},
  retry: () => {},
  unread: 0,
  hasMore: false,
  loadOlder: async () => {},
}

function renderPanel() {
  return render(
    <SidePanel
      tab="questions"
      onTab={() => {}}
      onClose={() => {}}
      channel={channel}
      canAsk
      isHost
      tools={tools}
      localIdentity="me"
      labels={labels}
      chat={chat}
      locale="en"
      open
    />
  )
}

describe("SidePanel hit targets (lr-05)", () => {
  // Since 2026-10-19 the panel is the /messages WhatsApp chrome: 32px filter
  // chips for the tabs, a 44px glass back disc for close.
  it("every tab chip carries the out-of-flow 44px hit area", () => {
    renderPanel()
    for (const name of [labels.chat, labels.questions, labels.poll]) {
      const btn = screen.getByRole("button", { name })
      expect(btn.className).toContain("after:absolute")
      expect(btn.className).toMatch(/after:-inset-y-1\.5/)
      // The chip's own overflow-clip would swallow the ::after.
      expect(btn.className).toContain("overflow-visible")
      expect(btn.className).not.toContain("overflow-clip")
    }
  })

  it("the close button is itself a 44px target", () => {
    renderPanel()
    const close = screen.getByRole("button", { name: labels.close })
    expect(close.className).toContain("size-[44px]")
  })

  it("the visible chip stays its compact 32px", () => {
    renderPanel()
    expect(
      screen.getByRole("button", { name: labels.questions }).className
    ).toContain("h-[32px]")
  })
})
