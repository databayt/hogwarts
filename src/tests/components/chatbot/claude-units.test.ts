// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { describe, expect, it } from "vitest"

import { guideTagParser, type TagEvent } from "@/components/chatbot/claude/guide-tag"
import { costUsd } from "@/components/chatbot/claude/pricing"

const valid = new Set(["attendance", "fees", "finance", "add-student"])
const run = (pieces: string[]) => {
  const p = guideTagParser(valid)
  const out: TagEvent[] = pieces.flatMap((x) => p.feed(x))
  return [...out, ...p.flush()]
}
const text = (evs: TagEvent[]) =>
  evs.flatMap((e) => (e.kind === "text" ? [e.text] : [])).join("")

describe("guide tag", () => {
  it("reads a tag split across pieces and hides it", () => {
    const evs = run(["[[gui", "de:atten", "dance]]\n1. Open ", "**Attendance**"])
    expect(evs[0]).toEqual({ kind: "guide", slug: "attendance" })
    expect(text(evs)).toBe("1. Open **Attendance**")
  })

  it("offers two or three guides to choose from", () => {
    const evs = run(["[[choose:fees,finance]]\nFees for a grade, or the payment?"])
    expect(evs[0]).toEqual({ kind: "choose", slugs: ["fees", "finance"] })
  })

  it("drops a slug that isn't a guide", () => {
    const evs = run(["[[guide:made-up]]\nHello"])
    expect(evs).toEqual([{ kind: "text", text: "Hello" }])
  })

  it("passes an answer with no tag straight through", () => {
    expect(text(run(["Hi ", "there"]))).toBe("Hi there")
    expect(text(run(["[", "x] is a list"]))).toBe("[x] is a list")
  })

  it("never shows a tag the stream ended inside", () => {
    expect(run(["[[guide:attend"])).toEqual([])
  })
})

describe("costUsd", () => {
  it("prices each usage field at its own rate", () => {
    // warm desk turn: 14K cache reads, 2K new input, 350 output
    expect(costUsd({ input: 2000, read: 14000, write: 0, write1h: 0, output: 350 })).toBeCloseTo(0.000515, 6)
    // cold: the 14K written to the 5-minute cache
    expect(costUsd({ input: 2000, read: 0, write: 14000, write1h: 0, output: 350 })).toBeCloseTo(0.002125, 6)
    // 1-hour writes cost more than 5-minute ones
    const hour = costUsd({ input: 0, read: 0, write: 50_000, write1h: 50_000, output: 0 })
    const five = costUsd({ input: 0, read: 0, write: 50_000, write1h: 0, output: 0 })
    expect(hour).toBeCloseTo(0.01, 6)
    expect(five).toBeCloseTo(0.00625, 6)
  })

  it("bills 5x above 100K prompt tokens", () => {
    expect(costUsd({ input: 100_001, read: 0, write: 0, write1h: 0, output: 0 })).toBeCloseTo(0.05, 4)
  })
})
