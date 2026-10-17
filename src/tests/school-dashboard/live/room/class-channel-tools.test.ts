// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { describe, expect, it } from "vitest"

import {
  applyMessage,
  initialClassState,
  snapshotOf,
  timerLeft,
  type ClassState,
  type Stroke,
} from "@/components/school-dashboard/live/room/class-channel"

const host = { identity: "t1", name: "Teacher", isHost: true }
const amira = { identity: "s1", name: "Amira", isHost: false }
const omar = { identity: "s2", name: "Omar", isHost: false }

const stroke = (id: string, by?: string): Stroke => ({
  id,
  points: [
    [0.1, 0.1],
    [0.2, 0.2],
  ],
  color: "#1f2937",
  width: 3,
  tool: "pen",
  ...(by ? { by } : {}),
})

function withBoard(over: Partial<ClassState> = {}): ClassState {
  return { ...initialClassState(), whiteboard: true, ...over }
}

describe("board permissions", () => {
  it("ignores a student's stroke until the host hands them the pen", () => {
    let s = applyMessage(
      withBoard(),
      { t: "wb.stroke", stroke: stroke("a") },
      amira
    )
    expect(s.strokes).toHaveLength(0)
    s = applyMessage(s, { t: "wb.grant", to: "s1" }, host)
    s = applyMessage(s, { t: "wb.stroke", stroke: stroke("a") }, amira)
    expect(s.strokes).toEqual([expect.objectContaining({ id: "a", by: "s1" })])
    // Another student is still not holding it.
    s = applyMessage(s, { t: "wb.stroke", stroke: stroke("b") }, omar)
    expect(s.strokes).toHaveLength(1)
  })

  it("only the host grants, and '*' lets everyone draw", () => {
    let s = applyMessage(withBoard(), { t: "wb.grant", to: "*" }, amira)
    expect(s.grant).toBeNull()
    s = applyMessage(s, { t: "wb.grant", to: "*" }, host)
    s = applyMessage(s, { t: "wb.stroke", stroke: stroke("b") }, omar)
    expect(s.strokes.map((x) => x.id)).toEqual(["b"])
  })

  it("a student cannot forge the author of a stroke", () => {
    let s = withBoard({ grant: "*" })
    s = applyMessage(s, { t: "wb.stroke", stroke: stroke("c", "t1") }, amira)
    expect(s.strokes[0].by).toBe("s1")
  })

  it("keeps the author on a host's replay to a late joiner", () => {
    const s = applyMessage(
      withBoard(),
      { t: "wb.stroke", stroke: stroke("d", "s1") },
      host
    )
    expect(s.strokes[0].by).toBe("s1")
  })
})

describe("wb.remove (eraser and undo)", () => {
  const board = withBoard({
    grant: "*",
    strokes: [stroke("mine", "s1"), stroke("theirs", "s2"), stroke("t", "t1")],
  })

  it("a student removes only their own strokes", () => {
    const s = applyMessage(
      board,
      { t: "wb.remove", ids: ["mine", "theirs", "t"] },
      amira
    )
    expect(s.strokes.map((x) => x.id)).toEqual(["theirs", "t"])
  })

  it("the host removes anything", () => {
    const s = applyMessage(board, { t: "wb.remove", ids: ["theirs"] }, host)
    expect(s.strokes.map((x) => x.id)).toEqual(["mine", "t"])
  })

  it("a student without the pen removes nothing", () => {
    const s = applyMessage(
      { ...board, grant: null },
      { t: "wb.remove", ids: ["mine"] },
      amira
    )
    expect(s.strokes).toHaveLength(3)
  })
})

describe("timer", () => {
  it("runs on the receiver's own clock", () => {
    const s = applyMessage(
      initialClassState(),
      { t: "timer", remainingMs: 60_000, totalMs: 60_000, running: true },
      host,
      1_000
    )
    expect(s.timer?.endsAt).toBe(61_000)
    expect(timerLeft(s.timer!, 31_000)).toBe(30_000)
    expect(timerLeft(s.timer!, 99_000)).toBe(0)
  })

  it("a paused timer holds its time; students cannot start one", () => {
    let s = applyMessage(
      initialClassState(),
      { t: "timer", remainingMs: 5_000, totalMs: 60_000, running: true },
      amira
    )
    expect(s.timer).toBeNull()
    s = applyMessage(
      s,
      { t: "timer", remainingMs: 5_000, totalMs: 60_000, running: false },
      host,
      0
    )
    expect(timerLeft(s.timer!, 1_000_000)).toBe(5_000)
    s = applyMessage(s, { t: "timer.stop" }, host)
    expect(s.timer).toBeNull()
  })

  it("travels in the late joiner's snapshot as time left, not a clock", () => {
    const s = applyMessage(
      initialClassState(),
      { t: "timer", remainingMs: 60_000, totalMs: 60_000, running: true },
      host,
      0
    )
    const snap = snapshotOf({ ...s, spotlight: "s1", grant: "s1" }, 20_000)
    expect(snap.timer).toEqual({
      remainingMs: 40_000,
      totalMs: 60_000,
      running: true,
    })
    const joined = applyMessage(initialClassState(), snap, host, 500_000)
    expect(joined.timer?.endsAt).toBe(540_000)
    expect(joined.spotlight).toBe("s1")
    expect(joined.grant).toBe("s1")
  })
})

describe("spotlight and ephemeral messages", () => {
  it("only the host spotlights", () => {
    let s = applyMessage(
      initialClassState(),
      { t: "spotlight", identity: "s1" },
      amira
    )
    expect(s.spotlight).toBeNull()
    s = applyMessage(s, { t: "spotlight", identity: "s1" }, host)
    expect(s.spotlight).toBe("s1")
  })

  it("reactions, drafts and hand.clearAll leave the state untouched", () => {
    const s0 = initialClassState()
    expect(applyMessage(s0, { t: "react", emoji: "👍" }, amira)).toBe(s0)
    expect(applyMessage(s0, { t: "hand.clearAll" }, host)).toBe(s0)
    expect(
      applyMessage(
        s0,
        {
          t: "wb.draft",
          draft: {
            id: "x",
            points: [],
            color: "#000000",
            width: 3,
            tool: "pen",
          },
        },
        host
      )
    ).toBe(s0)
  })
})
