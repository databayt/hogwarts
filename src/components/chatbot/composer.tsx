"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import {
  forwardRef,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
} from "react"

import { cn } from "@/lib/utils"

import { MAX_MESSAGE_LENGTH } from "./constant"
import { SendIcon } from "./icons"

/** About six lines before the box scrolls. */
const MAX_HEIGHT_PX = 144
/** The counter appears once this few characters are left. */
const COUNTER_FROM = 100

export interface ComposerHandle {
  focus: () => void
}

/**
 * One pill: a textarea that grows to six lines, and at the end Send — or
 * Stop while an answer is coming. The box stays editable while it streams,
 * so the next question can be typed; only sending waits. Enter sends,
 * Shift+Enter breaks a line, and an IME composition (Arabic keyboards on
 * some platforms) never sends half a word.
 */
export const Composer = forwardRef<
  ComposerHandle,
  {
    onSend: (text: string) => void
    onStop: () => void
    /** An answer is pending or streaming: Stop replaces Send. */
    busy: boolean
    placeholder: string
    inputLabel: string
    sendLabel: string
    stopLabel: string
    /** "{n} characters left". */
    counterTemplate: string
    dir: "rtl" | "ltr"
    /** Phone sizing: 16px text, so iOS doesn't zoom into the box. */
    large: boolean
  }
>(function Composer(
  {
    onSend,
    onStop,
    busy,
    placeholder,
    inputLabel,
    sendLabel,
    stopLabel,
    counterTemplate,
    dir,
    large,
  },
  ref
) {
  const [text, setText] = useState("")
  const box = useRef<HTMLTextAreaElement>(null)
  useImperativeHandle(ref, () => ({ focus: () => box.current?.focus() }), [])

  useLayoutEffect(() => {
    const el = box.current
    if (!el) return
    el.style.height = "auto"
    el.style.height = `${Math.min(el.scrollHeight, MAX_HEIGHT_PX)}px`
  }, [text])

  const submit = () => {
    const question = text.trim()
    if (!question || busy) return
    onSend(question)
    setText("")
  }

  const left = MAX_MESSAGE_LENGTH - text.length

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        submit()
      }}
    >
      <div className="border-muted-foreground/40 bg-background focus-within:border-muted-foreground flex items-end gap-1 rounded-3xl border py-1 ps-4 pe-1 transition-colors">
        <textarea
          ref={box}
          value={text}
          rows={1}
          maxLength={MAX_MESSAGE_LENGTH}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (
              e.key === "Enter" &&
              !e.shiftKey &&
              !e.nativeEvent.isComposing
            ) {
              e.preventDefault()
              submit()
            }
          }}
          placeholder={placeholder}
          aria-label={inputLabel}
          dir={dir}
          enterKeyHint="send"
          autoComplete="off"
          className={cn(
            "placeholder:text-muted-foreground/60 min-w-0 flex-1 resize-none border-none bg-transparent py-1.5 outline-none",
            large ? "text-[16px]" : "text-sm"
          )}
        />
        {busy ? (
          <button
            type="button"
            onClick={onStop}
            aria-label={stopLabel}
            title={stopLabel}
            className="bg-foreground text-background focus-visible:ring-ring flex h-8 w-8 shrink-0 items-center justify-center rounded-full outline-none focus-visible:ring-2"
          >
            <span
              aria-hidden
              className="block h-3 w-3 rounded-[2px] bg-current"
            />
          </button>
        ) : (
          <button
            type="submit"
            disabled={!text.trim()}
            aria-label={sendLabel}
            title={sendLabel}
            className="bg-primary text-primary-foreground focus-visible:ring-ring flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-transform outline-none hover:scale-105 focus-visible:ring-2 disabled:opacity-40 disabled:hover:scale-100"
          >
            <SendIcon
              size={15}
              className={cn(dir === "rtl" && "scale-x-[-1]")}
            />
          </button>
        )}
      </div>
      {left < COUNTER_FROM && (
        <p
          aria-live="polite"
          className="text-muted-foreground px-4 pt-1 text-xs"
        >
          {counterTemplate.replace("{n}", String(left))}
        </p>
      )}
    </form>
  )
})
