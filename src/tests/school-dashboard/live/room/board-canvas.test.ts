// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { describe, expect, it } from "vitest"

import {
  addPoint,
  hitStroke,
  pageRect,
  toPage,
} from "@/components/school-dashboard/live/room/board/board-canvas"
import type { Stroke } from "@/components/school-dashboard/live/room/class-channel"

describe("pageRect", () => {
  it("letterboxes a 16:9 page inside a tall phone box", () => {
    const r = pageRect(390, 600, 0)
    expect(r.w).toBe(390)
    expect(r.h).toBeCloseTo(390 / (16 / 9))
    expect(r.y).toBeCloseTo((600 - r.h) / 2)
  })

  it("pillarboxes inside a wide box", () => {
    const r = pageRect(2000, 900, 0)
    expect(r.h).toBe(900)
    expect(r.w).toBeCloseTo(1600)
    expect(r.x).toBeCloseTo(200)
  })
})

describe("toPage", () => {
  it("maps into 0..1 and clamps off-page points", () => {
    const page = { x: 10, y: 20, w: 160, h: 90 }
    expect(toPage(90, 65, page)).toEqual([0.5, 0.5])
    expect(toPage(-50, 500, page)).toEqual([0, 1])
  })
})

describe("addPoint", () => {
  it("drops jitter closer than the minimum step", () => {
    const pts: Array<[number, number]> = [[0.5, 0.5]]
    expect(addPoint(pts, [0.5001, 0.5])).toBe(false)
    expect(addPoint(pts, [0.51, 0.5])).toBe(true)
    expect(pts).toHaveLength(2)
  })
})

describe("hitStroke", () => {
  const line: Stroke = {
    id: "l",
    color: "#000000",
    width: 3,
    tool: "line",
    points: [
      [0.1, 0.5],
      [0.9, 0.5],
    ],
  }

  it("hits on the line and misses away from it", () => {
    expect(hitStroke(line, [0.5, 0.505], 0.01)).toBe(true)
    expect(hitStroke(line, [0.5, 0.7], 0.01)).toBe(false)
  })

  it("hits a rectangle on its edge, not its empty middle", () => {
    const rect: Stroke = {
      ...line,
      id: "r",
      tool: "rect",
      points: [
        [0.2, 0.2],
        [0.6, 0.8],
      ],
    }
    expect(hitStroke(rect, [0.2, 0.5], 0.01)).toBe(true)
    expect(hitStroke(rect, [0.4, 0.5], 0.01)).toBe(false)
  })

  it("hits anywhere inside a text box", () => {
    const text: Stroke = {
      ...line,
      id: "t",
      tool: "text",
      text: "Hello world",
      points: [[0.3, 0.3]],
    }
    expect(hitStroke(text, [0.33, 0.32], 0.005)).toBe(true)
    expect(hitStroke(text, [0.9, 0.9], 0.005)).toBe(false)
  })
})
