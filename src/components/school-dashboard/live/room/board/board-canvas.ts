// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * The board's drawing, with no React in it: page geometry, how each tool
 * paints, and what the eraser hits. Pure so the shapes are testable and so
 * the committed layer and the live layer paint with exactly the same code.
 */
import type { BoardTool, DraftStroke, Stroke } from "../class-channel"

/** The page is always 16:9 — the shape of a projector and of a laptop. */
export const PAGE_RATIO = 16 / 9

/** Eight inks that read on white. The first is the default. */
export const BOARD_COLORS = [
  "#1f2937",
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#3b82f6",
  "#a855f7",
  "#ec4899",
] as const

/** Stroke widths in thousandths of the page width: S · M · L. */
export const BOARD_WIDTHS = [3, 6, 12] as const

/** Strokes kept on the board — past this the oldest go. */
export const MAX_STROKES = 400

export interface PageRect {
  x: number
  y: number
  w: number
  h: number
}

/** The largest 16:9 page that fits the box, centred, with a margin. */
export function pageRect(boxW: number, boxH: number, margin = 8): PageRect {
  const availW = Math.max(0, boxW - margin * 2)
  const availH = Math.max(0, boxH - margin * 2)
  let w = availW
  let h = w / PAGE_RATIO
  if (h > availH) {
    h = availH
    w = h * PAGE_RATIO
  }
  return { x: (boxW - w) / 2, y: (boxH - h) / 2, w, h }
}

/** A point in the box → page coordinates, clamped onto the page. */
export function toPage(
  px: number,
  py: number,
  page: PageRect
): [number, number] {
  const x = page.w ? (px - page.x) / page.w : 0
  const y = page.h ? (py - page.y) / page.h : 0
  return [round(clamp01(x)), round(clamp01(y))]
}

function clamp01(v: number) {
  return v < 0 ? 0 : v > 1 ? 1 : v
}
/** Four decimals: a 10,000-step page, far finer than any screen. */
function round(v: number) {
  return Math.round(v * 10_000) / 10_000
}

/** Drop points closer than `min` (page units) to the last kept one. */
export function addPoint(
  points: Array<[number, number]>,
  p: [number, number],
  min = 0.0015
): boolean {
  const last = points[points.length - 1]
  if (last && Math.hypot(p[0] - last[0], (p[1] - last[1]) / PAGE_RATIO) < min)
    return false
  points.push(p)
  return true
}

const SHAPES: ReadonlySet<BoardTool> = new Set([
  "line",
  "arrow",
  "rect",
  "ellipse",
])
export const isShape = (tool: BoardTool) => SHAPES.has(tool)

/** The `text` tool's font size in px for a page `w` wide. */
export function textSize(width: number, w: number): number {
  // S/M/L → 18/28/44px on a 1000px page.
  const pt = width <= 3 ? 18 : width <= 6 ? 28 : 44
  return (pt * w) / 1000
}

const ARABIC = /[؀-ۿ]/

/**
 * Paint one stroke onto a context whose origin is the page's top-left and
 * whose unit is a CSS pixel (`w × h` is the page).
 */
export function drawStroke(
  ctx: CanvasRenderingContext2D,
  s: Stroke | DraftStroke,
  w: number,
  h: number
) {
  const tool: BoardTool = s.tool ?? "pen"
  const pts = s.points
  if (pts.length === 0) return
  const lw = Math.max(1, (s.width * w) / 1000)
  ctx.save()
  ctx.strokeStyle = s.color
  ctx.fillStyle = s.color
  ctx.lineCap = "round"
  ctx.lineJoin = "round"
  ctx.lineWidth = lw

  if (tool === "text") {
    const text = "text" in s ? s.text : undefined
    if (text) {
      const size = textSize(s.width, w)
      ctx.font = `600 ${size}px system-ui, -apple-system, "Segoe UI", sans-serif`
      ctx.textBaseline = "top"
      const rtl = ARABIC.test(text)
      ctx.direction = rtl ? "rtl" : "ltr"
      ctx.textAlign = rtl ? "right" : "left"
      const [x, y] = pts[0]
      ctx.fillText(text, x * w, y * h)
    }
    ctx.restore()
    return
  }

  if (tool === "highlighter") {
    ctx.globalAlpha = 0.35
    ctx.globalCompositeOperation = "multiply"
    ctx.lineWidth = lw * 4
    ctx.lineCap = "butt"
  }

  const a = pts[0]
  const b = pts[pts.length - 1]
  ctx.beginPath()
  if (tool === "line" || tool === "arrow") {
    ctx.moveTo(a[0] * w, a[1] * h)
    ctx.lineTo(b[0] * w, b[1] * h)
    if (tool === "arrow") {
      const ang = Math.atan2((b[1] - a[1]) * h, (b[0] - a[0]) * w)
      const head = Math.max(10, lw * 4)
      for (const d of [-0.45, 0.45]) {
        ctx.moveTo(b[0] * w, b[1] * h)
        ctx.lineTo(
          b[0] * w - head * Math.cos(ang + d),
          b[1] * h - head * Math.sin(ang + d)
        )
      }
    }
  } else if (tool === "rect") {
    ctx.rect(
      Math.min(a[0], b[0]) * w,
      Math.min(a[1], b[1]) * h,
      Math.abs(b[0] - a[0]) * w,
      Math.abs(b[1] - a[1]) * h
    )
  } else if (tool === "ellipse") {
    ctx.ellipse(
      ((a[0] + b[0]) / 2) * w,
      ((a[1] + b[1]) / 2) * h,
      (Math.abs(b[0] - a[0]) / 2) * w,
      (Math.abs(b[1] - a[1]) / 2) * h,
      0,
      0,
      Math.PI * 2
    )
  } else if (pts.length === 1) {
    // A tap is a dot.
    ctx.arc(a[0] * w, a[1] * h, ctx.lineWidth / 2, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
    return
  } else {
    // Smooth: a quadratic through each point, ending at the midpoints.
    ctx.moveTo(a[0] * w, a[1] * h)
    for (let i = 1; i < pts.length - 1; i++) {
      const [x0, y0] = pts[i]
      const [x1, y1] = pts[i + 1]
      ctx.quadraticCurveTo(
        x0 * w,
        y0 * h,
        ((x0 + x1) / 2) * w,
        ((y0 + y1) / 2) * h
      )
    }
    ctx.lineTo(b[0] * w, b[1] * h)
  }
  ctx.stroke()
  ctx.restore()
}

/** Distance from p to segment ab, in page-width units (y scaled to match). */
function segDist(
  p: [number, number],
  a: [number, number],
  b: [number, number]
): number {
  const k = 1 / PAGE_RATIO
  const px = p[0]
  const py = p[1] * k
  const ax = a[0]
  const ay = a[1] * k
  const bx = b[0]
  const by = b[1] * k
  const dx = bx - ax
  const dy = by - ay
  const len = dx * dx + dy * dy
  const t = len
    ? Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / len))
    : 0
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy))
}

/** The stroke's outline as segments — what the eraser tests against. */
function outline(s: Stroke): Array<[[number, number], [number, number]]> {
  const tool = s.tool ?? "pen"
  const pts = s.points
  if (pts.length === 0) return []
  const a = pts[0]
  const b = pts[pts.length - 1]
  if (tool === "line" || tool === "arrow") return [[a, b]]
  if (tool === "rect") {
    const c: [number, number] = [b[0], a[1]]
    const d: [number, number] = [a[0], b[1]]
    return [
      [a, c],
      [c, b],
      [b, d],
      [d, a],
    ]
  }
  if (tool === "ellipse") {
    const cx = (a[0] + b[0]) / 2
    const cy = (a[1] + b[1]) / 2
    const rx = Math.abs(b[0] - a[0]) / 2
    const ry = Math.abs(b[1] - a[1]) / 2
    const ring: Array<[number, number]> = []
    for (let i = 0; i <= 32; i++) {
      const t = (i / 32) * Math.PI * 2
      ring.push([cx + rx * Math.cos(t), cy + ry * Math.sin(t)])
    }
    return ring.slice(1).map((p, i) => [ring[i], p])
  }
  if (tool === "text") {
    // A box the text roughly fills: 0.55em per character, one line tall.
    const em = textSize(s.width, 1000) / 1000
    const wPage = (s.text?.length ?? 1) * em * 0.55
    const hPage = em * PAGE_RATIO * 1.2
    const rtl = ARABIC.test(s.text ?? "")
    const x0 = rtl ? a[0] - wPage : a[0]
    const box: Stroke = {
      ...s,
      tool: "rect",
      points: [
        [x0, a[1]],
        [x0 + wPage, a[1] + hPage],
      ],
    }
    return outline(box)
  }
  if (pts.length === 1) return [[a, a]]
  return pts.slice(1).map((p, i) => [pts[i], p])
}

/**
 * Does the eraser at `p` (radius `r`, page-width units) touch the stroke?
 * Text also counts when the point is inside its box.
 */
export function hitStroke(s: Stroke, p: [number, number], r: number): boolean {
  const reach = r + (s.width / 1000) * (s.tool === "highlighter" ? 2 : 0.5)
  if (s.tool === "text") {
    const segs = outline(s)
    const xs = segs.map(([a]) => a[0])
    const ys = segs.map(([a]) => a[1])
    if (
      p[0] >= Math.min(...xs) &&
      p[0] <= Math.max(...xs) &&
      p[1] >= Math.min(...ys) &&
      p[1] <= Math.max(...ys)
    )
      return true
  }
  return outline(s).some(([a, b]) => segDist(p, a, b) <= reach)
}

/** Size a canvas's bitmap to its box at the device's pixel ratio. */
export function fitCanvas(
  canvas: HTMLCanvasElement,
  cssW: number,
  cssH: number
): CanvasRenderingContext2D | null {
  const dpr = typeof window === "undefined" ? 1 : window.devicePixelRatio || 1
  const bw = Math.round(cssW * dpr)
  const bh = Math.round(cssH * dpr)
  if (canvas.width !== bw || canvas.height !== bh) {
    canvas.width = bw
    canvas.height = bh
  }
  const ctx = canvas.getContext("2d")
  if (!ctx) return null
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  return ctx
}
