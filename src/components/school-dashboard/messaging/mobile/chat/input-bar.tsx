"use client"

import { useState } from "react"

import { cn } from "@/lib/utils"

import { IosHomeIndicator } from "../ios-home-indicator"
import { WaIcon } from "../wa-icon"

export type ReplyDraft = {
  senderName: string
  text: string
  onClose: () => void
}

type Props = {
  value?: string
  onChange?: (v: string) => void
  onSend?: (v: string) => void
  onAttach?: () => void
  onSticker?: () => void
  onCamera?: () => void
  onMic?: () => void
  replyDraft?: ReplyDraft | null
  placeholder?: string
  className?: string
}

export function InputBar({
  value: controlled,
  onChange,
  onSend,
  onAttach,
  onSticker,
  onCamera,
  onMic,
  replyDraft,
  placeholder = "Message",
  className,
}: Props) {
  const [local, setLocal] = useState(controlled ?? "")
  const isControlled = controlled !== undefined
  const value = isControlled ? controlled : local
  const setValue = (v: string) => {
    if (!isControlled) setLocal(v)
    onChange?.(v)
  }
  const hasText = value.trim().length > 0

  return (
    <div
      className={cn(
        "flex w-full flex-col items-center bg-[color:var(--wa-surface-panel)] backdrop-blur-[25px]",
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
              <p className="w-full truncate text-[12px] leading-[16px] text-[color:var(--wa-text-primary)]">
                {replyDraft.text}
              </p>
            </div>
            <button
              type="button"
              onClick={replyDraft.onClose}
              aria-label="Cancel reply"
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
          aria-label="Attach"
          className="size-[32px]"
        >
          <WaIcon
            name="ic-wa-plus-input-32"
            className="size-[32px] text-[color:var(--wa-surface-product)]"
            tint={false}
          />
        </button>

        <div className="flex flex-1 items-end gap-[16px] overflow-clip rounded-[15px] border-[0.33px] border-[color:var(--wa-border-input-chat)] bg-[color:var(--wa-surface-input-chat)] ps-[10px] pe-[9px] pt-[3px] pb-[2px]">
          <textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                if (hasText) {
                  onSend?.(value)
                  setValue("")
                }
              }
            }}
            placeholder={placeholder}
            rows={1}
            className="max-h-[105px] min-h-[25px] min-w-0 flex-1 resize-none bg-transparent pb-[3px] text-[16px] leading-[21px] tracking-[-0.32px] text-[color:var(--wa-text-primary)] placeholder:text-[color:var(--wa-text-secondary-alpha)] focus:outline-none"
          />
          <button
            type="button"
            onClick={onSticker}
            aria-label="Stickers"
            className="size-[24px] self-center"
          >
            <WaIcon
              name="ic-wa-sticker-24"
              className="size-[24px] text-[color:var(--wa-text-secondary)]"
              tint={false}
            />
          </button>
        </div>

        <div className="flex items-start gap-[7px] ps-[6px]">
          {hasText ? (
            <button
              type="button"
              onClick={() => {
                onSend?.(value)
                setValue("")
              }}
              aria-label="Send"
              className="flex size-[32px] items-center justify-center rounded-full bg-[color:var(--wa-surface-product)]"
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
                aria-label="Camera"
                className="size-[32px]"
              >
                <WaIcon
                  name="ic-wa-camera-small-32"
                  className="size-[32px] text-[color:var(--wa-surface-product)]"
                  tint={false}
                />
              </button>
              <button
                type="button"
                onClick={onMic}
                aria-label="Voice message"
                className="size-[32px]"
              >
                <WaIcon
                  name="ic-wa-mic-32"
                  className="size-[32px] text-[color:var(--wa-surface-product)]"
                  tint={false}
                />
              </button>
            </>
          )}
        </div>
      </div>
      <IosHomeIndicator />
    </div>
  )
}
