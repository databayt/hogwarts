"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useCallback, useEffect, useRef, useState } from "react"
import { useRoomContext } from "@livekit/components-react"

import type { BoardTool, DraftStroke, Stroke } from "../class-channel"
import type { RoomLabels } from "../labels"
import type { ClassChannel } from "../use-class-channel"
import {
  addPoint,
  BOARD_COLORS,
  BOARD_WIDTHS,
  drawStroke,
  fitCanvas,
  hitStroke,
  isShape,
  pageRect,
  textSize,
  toPage,
  type PageRect,
} from "./board-canvas"
import { BoardToolbar, type BoardMode } from "./board-toolbar"

/** One undoable step of this author's own. */
type Step =
  | { kind: "add"; stroke: Stroke }
  | { kind: "remove"; strokes: Stroke[] }

const DRAFT_EVERY_MS = 50
const DRAFT_TTL_MS = 2000
/** Points per lossy draft packet — keeps each one under a single MTU. */
const DRAFT_MAX_POINTS = 60

function newId() {
  return (
    Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
  ).slice(0, 16)
}

interface BoardProps {
  channel: ClassChannel
  labels: RoomLabels
}

/**
 * The class board. A 16:9 page that keeps its shape on every screen,
 * painted on two canvases: the committed strokes, redrawn only when they
 * change, and a live layer for what is being drawn right now — here and by
 * whoever else holds a pen, streamed as it forms.
 *
 * Hosts always draw; a student draws while the host has handed them the pen
 * (`wb.grant`). A tap on the page never reaches the room's show/hide toggle
 * while you can draw — every stroke would otherwise flash the controls.
 */
export function Board({ channel, labels }: BoardProps) {
  const { state, isHost, canDraw, localIdentity } = channel
  const strokes = state.strokes

  const rootRef = useRef<HTMLDivElement>(null)
  const boxRef = useRef<HTMLDivElement>(null)
  const baseRef = useRef<HTMLCanvasElement>(null)
  const liveRef = useRef<HTMLCanvasElement>(null)
  const [page, setPage] = useState<PageRect>({ x: 0, y: 0, w: 0, h: 0 })
  // A phone held upright has room above and below the page, none beside it:
  // the rail runs across the top there, down the reading edge elsewhere.
  const [portrait, setPortrait] = useState(false)

  const [tool, setTool] = useState<BoardTool>("pen")
  const [mode, setMode] = useState<BoardMode>("pen")
  const [color, setColor] = useState<string>(BOARD_COLORS[0])
  const [width, setWidth] = useState<number>(BOARD_WIDTHS[0])
  const [undo, setUndo] = useState<Step[]>([])
  const [redo, setRedo] = useState<Step[]>([])
  const [textAt, setTextAt] = useState<[number, number] | null>(null)
  const [textValue, setTextValue] = useState("")

  const onMode = useCallback((m: BoardMode) => {
    setMode(m)
    if (m !== "eraser") setTool(m)
  }, [])

  // ---- page geometry
  useEffect(() => {
    const box = boxRef.current
    if (!box) return
    const measure = () => {
      const r = box.getBoundingClientRect()
      setPage(pageRect(r.width, r.height))
      const root = rootRef.current?.getBoundingClientRect()
      if (root) setPortrait(root.height > root.width)
    }
    measure()
    if (typeof ResizeObserver === "undefined") return
    const ro = new ResizeObserver(measure)
    ro.observe(box)
    if (rootRef.current) ro.observe(rootRef.current)
    return () => ro.disconnect()
  }, [])

  // ---- committed layer: only when the strokes or the page change
  useEffect(() => {
    const c = baseRef.current
    if (!c || !page.w) return
    const ctx = fitCanvas(c, page.w, page.h)
    if (!ctx) return
    ctx.clearRect(0, 0, page.w, page.h)
    for (const s of strokes) drawStroke(ctx, s, page.w, page.h)
  }, [strokes, page])

  // ---- live layer: my stroke in progress + everyone else's drafts
  const mineRef = useRef<DraftStroke | null>(null)
  const remoteRef = useRef(
    new Map<string, { draft: DraftStroke; at: number }>()
  )
  const frameRef = useRef(0)
  const pageRef = useRef(page)
  const strokeIdsRef = useRef(new Set<string>())
  useEffect(() => {
    pageRef.current = page
    strokeIdsRef.current = new Set(strokes.map((s) => s.id))
  }, [page, strokes])

  const paintLive = useCallback(() => {
    frameRef.current = 0
    const c = liveRef.current
    const p = pageRef.current
    if (!c || !p.w) return
    const ctx = fitCanvas(c, p.w, p.h)
    if (!ctx) return
    ctx.clearRect(0, 0, p.w, p.h)
    const now = Date.now()
    for (const [id, d] of remoteRef.current) {
      if (now - d.at > DRAFT_TTL_MS || strokeIdsRef.current.has(id)) {
        remoteRef.current.delete(id)
        continue
      }
      drawStroke(ctx, d.draft, p.w, p.h)
    }
    if (mineRef.current) drawStroke(ctx, mineRef.current, p.w, p.h)
  }, [])
  const schedule = useCallback(() => {
    if (!frameRef.current) frameRef.current = requestAnimationFrame(paintLive)
  }, [paintLive])
  useEffect(() => () => cancelAnimationFrame(frameRef.current), [])
  // A landed stroke replaces its draft.
  useEffect(() => schedule(), [strokes, page, schedule])

  const { subscribe } = channel
  useEffect(
    () =>
      subscribe((e) => {
        if (e.kind !== "draft") return
        const d = e.draft
        const cur = remoteRef.current.get(d.id)
        const appends = !isShape(d.tool) && cur
        remoteRef.current.set(d.id, {
          draft: appends
            ? { ...cur.draft, points: [...cur.draft.points, ...d.points] }
            : d,
          at: Date.now(),
        })
        schedule()
      }),
    [subscribe, schedule]
  )

  // ---- committing, erasing, undo
  const commit = useCallback(
    (stroke: Stroke) => {
      void channel.sendStroke(stroke)
      setUndo((u) => [...u.slice(-49), { kind: "add", stroke }])
      setRedo([])
    },
    [channel]
  )
  const removeStrokes = useCallback(
    (gone: Stroke[], record = true) => {
      if (gone.length === 0) return
      void channel.send({ t: "wb.remove", ids: gone.map((s) => s.id) })
      if (record) {
        setUndo((u) => [...u.slice(-49), { kind: "remove", strokes: gone }])
        setRedo([])
      }
    },
    [channel]
  )
  const apply = useCallback(
    (step: Step, inverse: boolean) => {
      const adding = (step.kind === "add") !== inverse
      const list = step.kind === "add" ? [step.stroke] : step.strokes
      if (adding) for (const s of list) void channel.sendStroke(s)
      else void channel.send({ t: "wb.remove", ids: list.map((s) => s.id) })
    },
    [channel]
  )
  const onUndo = useCallback(() => {
    const step = undo[undo.length - 1]
    if (!step) return
    apply(step, true)
    setUndo(undo.slice(0, -1))
    setRedo([...redo, step])
  }, [undo, redo, apply])
  const onRedo = useCallback(() => {
    const step = redo[redo.length - 1]
    if (!step) return
    apply(step, false)
    setRedo(redo.slice(0, -1))
    setUndo([...undo, step])
  }, [undo, redo, apply])

  // ⌘Z / ⇧⌘Z (Ctrl elsewhere), unless typing.
  useEffect(() => {
    if (!canDraw) return
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null
      if (t && (t.isContentEditable || /^(INPUT|TEXTAREA)$/.test(t.tagName)))
        return
      if (!(e.metaKey || e.ctrlKey) || e.key.toLowerCase() !== "z") return
      e.preventDefault()
      if (e.shiftKey) onRedo()
      else onUndo()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [canDraw, onUndo, onRedo])

  // ---- pointer
  const lastSentRef = useRef(0)
  const sentUpToRef = useRef(0)
  const erasedRef = useRef(new Set<string>())

  const pointOf = (e: React.PointerEvent | PointerEvent): [number, number] => {
    const r = liveRef.current!.getBoundingClientRect()
    return toPage(e.clientX - r.left, e.clientY - r.top, {
      x: 0,
      y: 0,
      w: r.width,
      h: r.height,
    })
  }

  const eraseAt = (p: [number, number]) => {
    const hits = strokes.filter(
      (s) =>
        !erasedRef.current.has(s.id) &&
        (isHost || s.by === localIdentity) &&
        hitStroke(s, p, 0.012)
    )
    if (hits.length === 0) return
    for (const s of hits) erasedRef.current.add(s.id)
    removeStrokes(hits)
  }

  const streamDraft = (force = false) => {
    const d = mineRef.current
    if (!d) return
    const now = Date.now()
    if (!force && now - lastSentRef.current < DRAFT_EVERY_MS) return
    lastSentRef.current = now
    if (isShape(d.tool)) {
      channel.sendDraft(d)
      return
    }
    // Overlap one point so the receiver's line has no gap.
    const from = Math.max(0, sentUpToRef.current - 1)
    const pts = d.points.slice(from, from + DRAFT_MAX_POINTS)
    if (pts.length === 0) return
    sentUpToRef.current = from + pts.length
    channel.sendDraft({ ...d, points: pts })
  }

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!canDraw || e.button > 0) return
    e.currentTarget.setPointerCapture(e.pointerId)
    const p = pointOf(e)
    if (mode === "eraser") {
      erasedRef.current = new Set()
      eraseAt(p)
      return
    }
    if (mode === "text") return
    mineRef.current = {
      id: newId(),
      tool: mode,
      color,
      width,
      points: isShape(mode) ? [p, p] : [p],
    }
    sentUpToRef.current = 0
    lastSentRef.current = 0
    schedule()
  }

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!canDraw || !e.currentTarget.hasPointerCapture(e.pointerId)) return
    if (mode === "eraser") {
      eraseAt(pointOf(e))
      return
    }
    const d = mineRef.current
    if (!d) return
    if (isShape(d.tool)) {
      d.points = [d.points[0], pointOf(e)]
    } else {
      const events = e.nativeEvent.getCoalescedEvents?.() ?? [e.nativeEvent]
      for (const ev of events.length ? events : [e.nativeEvent])
        addPoint(d.points, pointOf(ev))
    }
    schedule()
    streamDraft()
  }

  const onPointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!canDraw) return
    if (mode === "text") {
      setTextAt(pointOf(e))
      setTextValue("")
      return
    }
    const d = mineRef.current
    mineRef.current = null
    if (!d) return
    const [a, b] = [d.points[0], d.points[d.points.length - 1]]
    // A shape with no size is a stray tap.
    if (isShape(d.tool) && Math.hypot(b[0] - a[0], b[1] - a[1]) < 0.004) {
      schedule()
      return
    }
    streamDraft(true)
    commit({
      id: d.id,
      tool: d.tool,
      color: d.color,
      width: d.width,
      points: d.points,
    })
    schedule()
  }

  const commitText = () => {
    const text = textValue.trim()
    if (textAt && text) {
      commit({
        id: newId(),
        tool: "text",
        color,
        width,
        points: [textAt],
        text: text.slice(0, 200),
      })
    }
    setTextAt(null)
    setTextValue("")
  }

  // Read, not subscribed: a participants hook would re-render the board on
  // every speaking/quality event in the room.
  const room = useRoomContext()
  const grantName =
    state.grant && state.grant !== "*"
      ? (room.remoteParticipants.get(state.grant)?.name ?? state.grant)
      : null

  const cursor = !canDraw
    ? "default"
    : mode === "eraser"
      ? "cell"
      : mode === "text"
        ? "text"
        : "crosshair"

  const rail = canDraw && (
    <BoardToolbar
      orientation={portrait ? "horizontal" : "vertical"}
      mode={mode}
      onMode={onMode}
      tool={tool}
      color={color}
      onColor={setColor}
      width={width}
      onWidth={setWidth}
      canUndo={undo.length > 0}
      canRedo={redo.length > 0}
      onUndo={onUndo}
      onRedo={onRedo}
      onClear={
        isHost
          ? () => {
              void channel.send({ t: "wb.clear" })
              setUndo([])
              setRedo([])
            }
          : undefined
      }
      grant={state.grant}
      grantName={grantName}
      onGrant={isHost ? (to) => void channel.setGrant(to) : undefined}
      labels={labels}
    />
  )

  return (
    // The dark surround still toggles the room's controls; the page and the
    // rail swallow their taps, so drawing never flashes them.
    <div
      ref={rootRef}
      className={
        portrait
          ? "flex h-full w-full flex-col items-center justify-center bg-neutral-900"
          : "flex h-full w-full items-center bg-neutral-900 ps-2 sm:ps-3"
      }
    >
      {rail && (
        <div
          // Upright phone: under the page, where a thumb reaches and the
          // top row and the teacher's picture are not.
          className={
            portrait
              ? "relative z-10 order-last mt-3 shrink-0"
              : "relative z-10 shrink-0"
          }
          onClick={(e) => e.stopPropagation()}
        >
          {rail}
        </div>
      )}
      <div
        // Wide: clear of the top row and the bottom controls, so the page is
        // never under the chrome.
        className={
          portrait
            ? "aspect-video w-full shrink-0"
            : "h-full min-w-0 flex-1 sm:pt-16 sm:pb-40"
        }
      >
        <div ref={boxRef} className="relative h-full w-full">
          <PageBox page={page}>
            <canvas
              ref={baseRef}
              className="absolute inset-0 h-full w-full"
              role="img"
              aria-label={labels.whiteboard}
            />
            <canvas
              ref={liveRef}
              className="absolute inset-0 h-full w-full touch-none"
              style={{ cursor }}
              onClick={canDraw ? (e) => e.stopPropagation() : undefined}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
              aria-hidden
            />
            {textAt && (
              <input
                autoFocus
                dir="auto"
                value={textValue}
                maxLength={200}
                placeholder={labels.boardTextPlaceholder}
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => setTextValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") commitText()
                  if (e.key === "Escape") {
                    setTextAt(null)
                    setTextValue("")
                  }
                }}
                onBlur={commitText}
                className="absolute min-w-40 rounded-md border border-sky-500 bg-white/90 px-1 font-semibold outline-none"
                style={{
                  left: `${textAt[0] * 100}%`,
                  top: `${textAt[1] * 100}%`,
                  color,
                  fontSize: textSize(width, page.w),
                  lineHeight: 1.1,
                }}
              />
            )}
          </PageBox>
        </div>
      </div>
    </div>
  )
}

/** The white page itself, placed at its fitted rect inside the box. */
function PageBox({
  page,
  children,
}: {
  page: PageRect
  children: React.ReactNode
}) {
  return (
    <div
      className="absolute overflow-hidden rounded-xl bg-white shadow-[0_8px_40px_rgba(0,0,0,0.5)]"
      style={{ left: page.x, top: page.y, width: page.w, height: page.h }}
    >
      {children}
    </div>
  )
}
