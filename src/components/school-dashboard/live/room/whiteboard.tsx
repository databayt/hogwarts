"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useCallback, useEffect, useRef, useState } from "react"
import { Eraser } from "lucide-react"

import { Button } from "@/components/ui/button"

import type { Stroke } from "./class-channel"
import type { RoomLabels } from "./labels"

const COLORS = ["#111827", "#dc2626", "#2563eb", "#16a34a", "#f59e0b"]

interface WhiteboardProps {
  strokes: Stroke[]
  canDraw: boolean
  onStroke: (stroke: Stroke) => void
  onClear: () => void
  labels: RoomLabels
}

/**
 * A shared board: the host draws, everyone sees the strokes as they are
 * committed. Coordinates are normalised so a phone and a projector show the
 * same picture; the in-progress stroke is drawn locally and broadcast on
 * pointer-up as one message.
 */
export function Whiteboard({
  strokes,
  canDraw,
  onStroke,
  onClear,
  labels,
}: WhiteboardProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const drawingRef = useRef<Array<[number, number]> | null>(null)
  const [color, setColor] = useState(COLORS[0])
  const [width, setWidth] = useState(3)

  const paint = useCallback(
    (live?: Array<[number, number]>) => {
      const canvas = canvasRef.current
      if (!canvas) return
      const ctx = canvas.getContext("2d")
      if (!ctx) return
      const { width: w, height: h } = canvas
      ctx.clearRect(0, 0, w, h)
      ctx.fillStyle = "#ffffff"
      ctx.fillRect(0, 0, w, h)
      ctx.lineCap = "round"
      ctx.lineJoin = "round"
      const draw = (pts: Array<[number, number]>, c: string, lw: number) => {
        if (pts.length === 0) return
        ctx.strokeStyle = c
        ctx.lineWidth = lw * (w / 1000)
        ctx.beginPath()
        ctx.moveTo(pts[0][0] * w, pts[0][1] * h)
        for (const [x, y] of pts.slice(1)) ctx.lineTo(x * w, y * h)
        if (pts.length === 1) ctx.lineTo(pts[0][0] * w + 0.1, pts[0][1] * h)
        ctx.stroke()
      }
      for (const s of strokes) draw(s.points, s.color, s.width)
      if (live) draw(live, color, width)
    },
    [strokes, color, width]
  )

  // Keep the bitmap at the element's size (device pixels) and repaint.
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ro = new ResizeObserver(() => {
      const dpr = window.devicePixelRatio || 1
      canvas.width = Math.max(1, Math.floor(canvas.clientWidth * dpr))
      canvas.height = Math.max(1, Math.floor(canvas.clientHeight * dpr))
      paint(drawingRef.current ?? undefined)
    })
    ro.observe(canvas)
    return () => ro.disconnect()
  }, [paint])

  useEffect(() => {
    paint(drawingRef.current ?? undefined)
  }, [paint])

  const pointOf = (
    e: React.PointerEvent<HTMLCanvasElement>
  ): [number, number] => {
    const rect = e.currentTarget.getBoundingClientRect()
    return [
      Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width)),
      Math.min(1, Math.max(0, (e.clientY - rect.top) / rect.height)),
    ]
  }

  const onDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!canDraw) return
    e.currentTarget.setPointerCapture(e.pointerId)
    drawingRef.current = [pointOf(e)]
    paint(drawingRef.current)
  }
  const onMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!canDraw || !drawingRef.current) return
    drawingRef.current.push(pointOf(e))
    paint(drawingRef.current)
  }
  const onUp = () => {
    if (!canDraw || !drawingRef.current) return
    const points = drawingRef.current
    drawingRef.current = null
    onStroke({
      id: crypto.randomUUID(),
      points: points.map(([x, y]) => [
        Math.round(x * 1000) / 1000,
        Math.round(y * 1000) / 1000,
      ]),
      color,
      width,
    })
  }

  return (
    <div className="relative h-full w-full">
      <canvas
        ref={canvasRef}
        className="h-full w-full touch-none rounded-lg bg-white"
        role="img"
        aria-label={labels.whiteboard}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
      />
      {canDraw && (
        <div className="absolute start-3 top-3 flex items-center gap-2 rounded-full bg-black/70 px-3 py-1.5">
          {COLORS.map((c, i) => (
            <button
              key={c}
              type="button"
              aria-label={`${labels.penColor} ${i + 1}`}
              aria-pressed={color === c}
              onClick={() => setColor(c)}
              className={
                "h-5 w-5 rounded-full border-2 " +
                (color === c ? "border-white" : "border-transparent")
              }
              style={{ backgroundColor: c }}
            />
          ))}
          <input
            type="range"
            min={1}
            max={12}
            value={width}
            onChange={(e) => setWidth(Number(e.target.value))}
            className="w-20"
            aria-label={labels.penSize}
          />
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-7 text-white hover:bg-white/20 hover:text-white"
            onClick={onClear}
          >
            <Eraser className="h-4 w-4" aria-hidden />
            {labels.clearBoard}
          </Button>
        </div>
      )}
    </div>
  )
}
