"use client"

import { memo, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react"

import { cn } from "@/lib/utils"

import { WaIcon } from "../wa-icon"

export type ReplyDraft = {
  senderName: string
  text: string
  onClose: () => void
}

type Props = {
  /** Controlled value. Leave undefined for an uncontrolled field. */
  value?: string
  /** First value of an uncontrolled field — a draft restored on reopen. */
  initialValue?: string
  onChange?: (v: string) => void
  onSend?: (v: string) => void
  onAttach?: () => void
  onSticker?: () => void
  onCamera?: () => void
  onMic?: () => void
  /** Fired on the first keystroke of a burst and again after a pause. */
  onTypingStart?: () => void
  /** Fired when the field empties, on send, and 3s after the last keystroke. */
  onTypingStop?: () => void
  replyDraft?: ReplyDraft | null
  placeholder?: string
  labels?: {
    attach?: string
    stickers?: string
    camera?: string
    mic?: string
    send?: string
    cancelReply?: string
  }
  className?: string
}

/** WhatsApp grows the field to about five lines, then scrolls inside it. */
const MAX_FIELD_PX = 105
const TYPING_IDLE_MS = 3_000

/**
 * Keep the keyboard up when a toolbar button is tapped. A tap on a button
 * moves focus off the field on most browsers, and on iOS losing focus
 * dismisses the keyboard — one tap on Send and the keys would slide away.
 * Cancelling the pointer-down cancels the focus change and nothing else.
 */
const keepFocus = (e: React.PointerEvent) => e.preventDefault()

export const InputBar = memo(function InputBar({
  value: controlled,
  initialValue,
  onChange,
  onSend,
  onAttach,
  onSticker,
  onCamera,
  onMic,
  onTypingStart,
  onTypingStop,
  replyDraft,
  placeholder = "Message",
  labels,
  className,
}: Props) {
  const [local, setLocal] = useState(controlled ?? "")
  const isControlled = controlled !== undefined
  const value = isControlled ? controlled : local
  const fieldRef = useRef<HTMLTextAreaElement>(null)

  // A restored draft is applied after mount. The server rendered an empty
  // field (it has no session storage to read), so seeding state with the
  // draft would make the first client render disagree with the markup.
  useEffect(() => {
    if (!isControlled && initialValue) setLocal(initialValue)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const typingRef = useRef<{ active: boolean; timer: ReturnType<typeof setTimeout> | null }>({
    active: false,
    timer: null,
  })

  const stopTyping = useCallback(() => {
    const t = typingRef.current
    if (t.timer) clearTimeout(t.timer)
    t.timer = null
    if (t.active) {
      t.active = false
      onTypingStop?.()
    }
  }, [onTypingStop])

  const noteTyping = useCallback(
    (text: string) => {
      const t = typingRef.current
      if (!text.trim()) {
        stopTyping()
        return
      }
      if (!t.active) {
        t.active = true
        onTypingStart?.()
      }
      if (t.timer) clearTimeout(t.timer)
      t.timer = setTimeout(stopTyping, TYPING_IDLE_MS)
    },
    [onTypingStart, stopTyping]
  )

  // Leaving the thread ends the indicator for the other side.
  useEffect(() => stopTyping, [stopTyping])

  const setValue = useCallback(
    (v: string) => {
      if (!isControlled) setLocal(v)
      onChange?.(v)
    },
    [isControlled, onChange]
  )

  // Grow with the text up to MAX_FIELD_PX, then scroll inside. `rows={1}`
  // alone never grows; the capture's field is one line until it is not.
  const fit = useCallback(() => {
    const el = fieldRef.current
    if (!el) return
    el.style.height = "0px"
    const next = Math.min(el.scrollHeight, MAX_FIELD_PX)
    el.style.height = `${next}px`
    el.style.overflowY = el.scrollHeight > MAX_FIELD_PX ? "auto" : "hidden"
  }, [])
  useLayoutEffect(fit, [value, fit])

  const hasText = value.trim().length > 0

  const send = useCallback(() => {
    const text = value
    if (!text.trim()) return
    onSend?.(text)
    setValue("")
    stopTyping()
    // The field keeps focus, so the keyboard stays where it is — the next
    // message starts straight away, as it does in the app.
    fieldRef.current?.focus()
  }, [value, onSend, setValue, stopTyping])

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key !== "Enter" || e.shiftKey || e.nativeEvent.isComposing) return
      // A hardware keyboard sends on Enter, as WhatsApp Desktop does. On a
      // touch keyboard Return inserts a line, as it does in the iPhone app,
      // and the green button is the way to send.
      const touch =
        typeof window !== "undefined" &&
        window.matchMedia?.("(pointer: coarse)").matches
      if (touch) return
      e.preventDefault()
      send()
    },
    [send]
  )

  return (
    <div
      className={cn(
        "flex w-full flex-col items-center bg-[color:var(--wa-surface-panel)] backdrop-blur-[25px]",
        // The real home indicator is drawn by iOS over the safe-area strip;
        // a browser has none, and the inset is 0 there. The keyboard zeroes
        // it too, so the bar sits straight on the keys.
        "pb-[env(safe-area-inset-bottom,0px)]",
        className
      )}
    >
      {replyDraft && (
        <div className="flex w-full items-start overflow-clip">
          <span
            aria-hidden
            className="w-[4px] shrink-0 self-stretch bg-[color:var(--wa-border-quote)]"
          />
          <div className="flex min-w-0 flex-1 items-center gap-[16px] overflow-clip ps-[8px] pe-[7.5px] pt-[8px] pb-[7.5px]">
            <div className="flex min-w-0 flex-1 flex-col items-start gap-[1.5px]">
              <p className="w-full truncate text-[14px] leading-[19px] font-semibold tracking-[-0.14px] text-[color:var(--wa-text-quote-title)]">
                {replyDraft.senderName}
              </p>
              <p
                dir="auto"
                className="w-full truncate text-[12px] leading-[16px] text-[color:var(--wa-text-primary)]"
              >
                {replyDraft.text}
              </p>
            </div>
            <button
              type="button"
              onClick={replyDraft.onClose}
              onPointerDown={keepFocus}
              aria-label={labels?.cancelReply ?? "Cancel reply"}
              className="size-[24px] shrink-0"
            >
              <WaIcon
                name="ic-wa-close-circular-24"
                className="size-[24px] text-[color:var(--wa-text-secondary)]"
                tint={false}
              />
            </button>
          </div>
        </div>
      )}

      <div className="flex w-full items-end gap-[8px] py-[5.5px] ps-[7px] pe-[9px]">
        <button
          type="button"
          onClick={onAttach}
          onPointerDown={keepFocus}
          aria-label={labels?.attach ?? "Attach"}
          className="size-[32px] shrink-0"
        >
          <WaIcon
            name="ic-wa-plus-input-32"
            className="size-[32px] text-[color:var(--wa-text-primary)]"
          />
        </button>

        <div className="flex min-w-0 flex-1 items-end gap-[16px] overflow-clip rounded-[15px] border-[0.33px] border-[color:var(--wa-border-input-chat)] bg-[color:var(--wa-surface-input-chat)] ps-[10px] pe-[9px] pt-[3px] pb-[2px]">
          <textarea
            ref={fieldRef}
            value={value}
            onChange={(e) => {
              setValue(e.target.value)
              noteTyping(e.target.value)
            }}
            onKeyDown={onKeyDown}
            placeholder={placeholder}
            rows={1}
            autoCapitalize="sentences"
            autoCorrect="on"
            enterKeyHint="enter"
            className="min-h-[25px] min-w-0 flex-1 resize-none bg-transparent pb-[3px] text-[16px] leading-[21px] tracking-[-0.32px] text-[color:var(--wa-text-primary)] caret-[color:var(--wa-surface-product)] placeholder:text-[color:var(--wa-text-secondary-alpha)] focus:outline-none"
          />
          <button
            type="button"
            onClick={onSticker}
            onPointerDown={keepFocus}
            aria-label={labels?.stickers ?? "Stickers"}
            className="size-[24px] self-center"
          >
            <WaIcon
              name="ic-wa-sticker-24"
              className="size-[24px] text-[color:var(--wa-text-secondary)]"
            />
          </button>
        </div>

        <div className="flex shrink-0 items-start gap-[7px] ps-[6px]">
          {hasText ? (
            <button
              type="button"
              onClick={send}
              onPointerDown={keepFocus}
              aria-label={labels?.send ?? "Send"}
              className="flex size-[32px] items-center justify-center rounded-full bg-[color:var(--wa-surface-product)] active:opacity-80"
            >
              <WaIcon
                name="ic-wa-send-24"
                className="size-[24px] text-[color:var(--wa-text-invert)]"
                tint={false}
              />
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={onCamera}
                onPointerDown={keepFocus}
                aria-label={labels?.camera ?? "Camera"}
                className="size-[32px]"
              >
                <WaIcon
                  name="ic-wa-camera-small-32"
                  className="size-[32px] text-[color:var(--wa-text-primary)]"
                />
              </button>
              {/* The mic is a filled product-green disc, not a bare glyph —
                  32px with a ~17px white mic inside, measured off
                  public/whatsapp/IMG_2634..2637. The capture's own pixels read
                  as a muted green because iOS writes Display P3; the brand
                  token is the right sRGB value for it. */}
              <button
                type="button"
                onClick={onMic}
                onPointerDown={keepFocus}
                aria-label={labels?.mic ?? "Voice message"}
                className="flex size-[32px] items-center justify-center rounded-full bg-[color:var(--wa-surface-product)]"
              >
                <WaIcon
                  name="ic-wa-mic-32"
                  className="size-[23px] text-[color:var(--wa-text-invert)]"
                />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
})
