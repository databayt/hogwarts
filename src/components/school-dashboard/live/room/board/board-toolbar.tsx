"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useEffect, useRef, useState, type ReactNode } from "react"

import { cn } from "@/lib/utils"
import {
  glassPanel,
  glassSurface,
} from "@/components/lumos/shared/video-player/glass"
import {
  arrowUpRight,
  arrowUturnBackward,
  arrowUturnForward,
  circle,
  eraser,
  highlighter,
  lineDiagonal,
  pencilTip,
  person2BadgeGearshapeFill,
  rectangle,
  SfSymbol,
  textformat,
  trash,
  type SfGlyph,
} from "@/components/lumos/shared/video-player/sf-symbols"

import type { BoardGrant, BoardTool } from "../class-channel"
import type { RoomLabels } from "../labels"
import { BOARD_COLORS, BOARD_WIDTHS } from "./board-canvas"

export type BoardMode = BoardTool | "eraser"

const TOOL_GLYPH: Record<BoardTool, SfGlyph> = {
  pen: pencilTip,
  highlighter,
  line: lineDiagonal,
  arrow: arrowUpRight,
  rect: rectangle,
  ellipse: circle,
  text: textformat,
}
const TOOLS: BoardTool[] = [
  "pen",
  "highlighter",
  "line",
  "arrow",
  "rect",
  "ellipse",
  "text",
]

function toolLabel(tool: BoardTool, labels: RoomLabels): string {
  switch (tool) {
    case "pen":
      return labels.boardPen
    case "highlighter":
      return labels.boardHighlighter
    case "line":
      return labels.boardLine
    case "arrow":
      return labels.boardArrow
    case "rect":
      return labels.boardRect
    case "ellipse":
      return labels.boardEllipse
    case "text":
      return labels.boardText
  }
}

/** One 44px rail button. `on` is the pressed state, drawn as a white chip. */
function RailButton({
  label,
  on,
  danger,
  disabled,
  onClick,
  children,
  expanded,
}: {
  label: string
  on?: boolean
  danger?: boolean
  disabled?: boolean
  onClick: () => void
  children: ReactNode
  expanded?: boolean
}) {
  return (
    <button
      type="button"
      className={cn(
        "relative flex size-11 shrink-0 items-center justify-center rounded-full text-white transition-colors active:opacity-60 disabled:opacity-35",
        on ? "bg-white text-black" : "hover:bg-white/15",
        danger && "bg-red-500 text-white hover:bg-red-500"
      )}
      aria-label={label}
      title={label}
      aria-pressed={expanded === undefined ? on : undefined}
      aria-expanded={expanded}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  )
}

/** A card that opens beside the rail, toward the page. */
function Flyout({
  children,
  label,
  vertical,
}: {
  children: ReactNode
  label: string
  vertical: boolean
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className={cn(
        glassPanel,
        // `w-max`: an absolute box inside a 44px button would otherwise
        // shrink to that width and stack its swatches on top of each other.
        "absolute z-10 flex w-max items-center gap-1 rounded-[22px] p-1",
        // Beside a vertical rail; above a horizontal one (it sits under the
        // page), centred on the whole rail — the positioned ancestor there —
        // so a wide flyout never runs off a phone's edge.
        vertical
          ? "start-full top-1/2 ms-2 -translate-y-1/2"
          : "bottom-full left-1/2 mb-2 -translate-x-1/2"
      )}
      style={{ ...glassSurface, background: "rgba(20, 20, 20, 0.72)" }}
    >
      {children}
    </div>
  )
}

type Open = "tool" | "ink" | "who" | null

export interface BoardToolbarProps {
  /** Down the reading edge, or across the top on an upright phone. */
  orientation: "vertical" | "horizontal"
  mode: BoardMode
  onMode: (mode: BoardMode) => void
  /** The last drawing tool — what the tool button shows while erasing. */
  tool: BoardTool
  color: string
  onColor: (color: string) => void
  width: number
  onWidth: (width: number) => void
  canUndo: boolean
  canRedo: boolean
  onUndo: () => void
  onRedo: () => void
  /** Hosts only: wipe the page. */
  onClear?: () => void
  /** Hosts only: who besides the teachers may draw. */
  grant?: BoardGrant
  grantName?: string | null
  onGrant?: (to: BoardGrant) => void
  labels: RoomLabels
}

/**
 * The board's tools: a vertical glass rail on the reading edge, centred, so
 * it never sits under the room's top row or its bottom controls. Every
 * target is 44px; the tool and ink buttons open a flyout toward the page
 * rather than growing the rail, which keeps it seven buttons tall — short
 * enough for a phone held upright.
 */
export function BoardToolbar(props: BoardToolbarProps) {
  const { mode, tool, color, width, labels } = props
  const [open, setOpen] = useState<Open>(null)
  const [confirmClear, setConfirmClear] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(null)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null)
    }
    document.addEventListener("pointerdown", onDown)
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("pointerdown", onDown)
      document.removeEventListener("keydown", onKey)
    }
  }, [open])

  // Clear asks twice: the first tap arms it for three seconds.
  useEffect(() => {
    if (!confirmClear) return
    const t = window.setTimeout(() => setConfirmClear(false), 3000)
    return () => window.clearTimeout(t)
  }, [confirmClear])

  const toggle = (o: Open) => setOpen((cur) => (cur === o ? null : o))
  const vertical = props.orientation === "vertical"
  // Flyouts anchor to their button down a vertical rail, to the rail itself
  // across a horizontal one.
  const anchor = vertical ? "relative" : undefined
  const drawing = mode !== "eraser"

  return (
    <div
      ref={rootRef}
      className={cn(
        glassPanel,
        "relative flex items-center gap-1 rounded-[26px] p-1",
        vertical ? "flex-col" : "flex-row"
      )}
      style={{ ...glassSurface, background: "rgba(20, 20, 20, 0.72)" }}
      role="toolbar"
      aria-orientation={props.orientation}
      aria-label={labels.boardTools}
    >
      <div className={anchor}>
        <RailButton
          label={toolLabel(tool, labels)}
          on={drawing}
          expanded={open === "tool"}
          onClick={() => {
            if (!drawing) props.onMode(tool)
            toggle("tool")
          }}
        >
          <SfSymbol glyph={TOOL_GLYPH[tool]} pt={22} />
        </RailButton>
        {open === "tool" && (
          <Flyout label={labels.boardTools} vertical={vertical}>
            {TOOLS.map((t) => (
              <RailButton
                key={t}
                label={toolLabel(t, labels)}
                on={mode === t}
                onClick={() => {
                  props.onMode(t)
                  setOpen(null)
                }}
              >
                <SfSymbol glyph={TOOL_GLYPH[t]} pt={22} />
              </RailButton>
            ))}
          </Flyout>
        )}
      </div>

      <RailButton
        label={labels.boardEraser}
        on={mode === "eraser"}
        onClick={() => props.onMode(mode === "eraser" ? tool : "eraser")}
      >
        <SfSymbol glyph={eraser} pt={22} />
      </RailButton>

      <div className={anchor}>
        <RailButton
          label={labels.penColor}
          expanded={open === "ink"}
          onClick={() => toggle("ink")}
        >
          <span
            className="block size-6 rounded-full ring-2 ring-white/90"
            style={{ backgroundColor: color }}
            aria-hidden
          />
        </RailButton>
        {open === "ink" && (
          <Flyout label={labels.penColor} vertical={vertical}>
            <div className="grid grid-cols-4 gap-1 sm:grid-cols-8">
              {BOARD_COLORS.map((c, i) => (
                <button
                  key={c}
                  type="button"
                  className="flex size-11 items-center justify-center rounded-full hover:bg-white/15"
                  aria-label={`${labels.penColor} ${i + 1}`}
                  aria-pressed={color === c}
                  onClick={() => {
                    props.onColor(c)
                    if (mode === "eraser") props.onMode(tool)
                  }}
                >
                  <span
                    className={cn(
                      "block size-7 rounded-full transition-transform",
                      color === c
                        ? "scale-110 ring-[3px] ring-white"
                        : "ring-1 ring-white/30"
                    )}
                    style={{ backgroundColor: c }}
                    aria-hidden
                  />
                </button>
              ))}
            </div>
            <span className="mx-1 h-8 w-px shrink-0 bg-white/20" aria-hidden />
            <div className="flex flex-col gap-1 sm:flex-row">
              {BOARD_WIDTHS.map((w, i) => (
                <button
                  key={w}
                  type="button"
                  className={cn(
                    "flex size-11 items-center justify-center rounded-full",
                    width === w ? "bg-white" : "hover:bg-white/15"
                  )}
                  aria-label={`${labels.penSize} ${i + 1}`}
                  aria-pressed={width === w}
                  onClick={() => props.onWidth(w)}
                >
                  <span
                    className="block rounded-full"
                    style={{
                      width: 4 + i * 5,
                      height: 4 + i * 5,
                      backgroundColor: width === w ? "#000" : "#fff",
                    }}
                    aria-hidden
                  />
                </button>
              ))}
            </div>
          </Flyout>
        )}
      </div>

      <span
        className={
          vertical
            ? "my-0.5 h-px w-7 bg-white/20"
            : "mx-0.5 h-7 w-px bg-white/20"
        }
        aria-hidden
      />

      <RailButton
        label={labels.boardUndo}
        disabled={!props.canUndo}
        onClick={props.onUndo}
      >
        <SfSymbol glyph={arrowUturnBackward} pt={20} />
      </RailButton>
      <RailButton
        label={labels.boardRedo}
        disabled={!props.canRedo}
        onClick={props.onRedo}
      >
        <SfSymbol glyph={arrowUturnForward} pt={20} />
      </RailButton>

      {props.onClear && (
        <RailButton
          label={confirmClear ? labels.clearBoardConfirm : labels.clearBoard}
          danger={confirmClear}
          onClick={() => {
            if (confirmClear) {
              setConfirmClear(false)
              props.onClear?.()
            } else {
              setConfirmClear(true)
            }
          }}
        >
          <SfSymbol glyph={trash} pt={20} />
          {confirmClear && (
            <span
              role="status"
              className={cn(
                "pointer-events-none absolute rounded-full bg-red-500 px-3 py-1.5 text-sm font-medium whitespace-nowrap text-white",
                vertical ? "start-full ms-3" : "bottom-full mb-3"
              )}
            >
              {labels.clearBoardConfirm}
            </span>
          )}
        </RailButton>
      )}

      {props.onGrant && (
        <div className={anchor}>
          <RailButton
            label={labels.boardWho}
            on={props.grant != null}
            expanded={open === "who"}
            onClick={() => toggle("who")}
          >
            <SfSymbol glyph={person2BadgeGearshapeFill} pt={20} />
          </RailButton>
          {open === "who" && (
            <Flyout label={labels.boardWho} vertical={vertical}>
              <div className="flex w-56 flex-col py-1">
                {(
                  [
                    [null, labels.boardOnlyHosts],
                    ["*", labels.boardEveryone],
                  ] as Array<[BoardGrant, string]>
                ).map(([to, text]) => (
                  <button
                    key={String(to)}
                    type="button"
                    className={cn(
                      "flex min-h-11 items-center rounded-2xl px-3 text-start text-[15px] text-white",
                      props.grant === to
                        ? "bg-white/20 font-semibold"
                        : "hover:bg-white/10"
                    )}
                    aria-pressed={props.grant === to}
                    onClick={() => {
                      props.onGrant?.(to)
                      setOpen(null)
                    }}
                  >
                    {text}
                  </button>
                ))}
                {props.grant && props.grant !== "*" && (
                  <p className="px-3 pt-1 pb-1.5 text-[13px] text-white/70">
                    {labels.boardStudentDrawing.replace(
                      "{name}",
                      props.grantName ?? ""
                    )}
                  </p>
                )}
              </div>
            </Flyout>
          )}
        </div>
      )}
    </div>
  )
}
