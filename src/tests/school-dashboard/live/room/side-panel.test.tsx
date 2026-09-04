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
 * without mocking `useChat`/`useParticipants`.
 */
import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { initialClassState } from "@/components/school-dashboard/live/room/class-channel"
import { resolveRoomLabels } from "@/components/school-dashboard/live/room/labels"
import { SidePanel } from "@/components/school-dashboard/live/room/side-panel"
import type { ClassChannel } from "@/components/school-dashboard/live/room/use-class-channel"
import type { RoomTools } from "@/components/school-dashboard/live/types"

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
    />
  )
}

describe("SidePanel hit targets (lr-05)", () => {
  it("every tab button carries the out-of-flow 44px hit area", () => {
    renderPanel()
    for (const name of [labels.chat, labels.questions, labels.poll]) {
      const btn = screen.getByRole("button", { name })
      expect(btn.className).toContain("after:absolute")
      expect(btn.className).toMatch(/after:-inset-y-2\.5/)
    }
  })

  it("the close button carries the out-of-flow 44px hit area", () => {
    renderPanel()
    const close = screen.getByRole("button", { name: labels.close })
    expect(close.className).toContain("after:absolute")
    expect(close.className).toMatch(/after:-inset-2\b/)
  })

  it("the visible pill/icon stay their original compact size", () => {
    renderPanel()
    // Still the pre-existing compact classes — only the hit area grew.
    expect(
      screen.getByRole("button", { name: labels.questions }).className
    ).toContain("px-2.5")
    expect(
      screen.getByRole("button", { name: labels.close }).className
    ).toContain("h-7")
  })
})
