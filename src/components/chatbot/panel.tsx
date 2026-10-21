"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { memo, useCallback, useMemo, useRef, useSyncExternalStore } from "react"
import { Dialog as DialogPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

import { Composer, type ComposerHandle } from "./composer"
import { ChatHeader } from "./header"
import { MessageList } from "./message-list"
import { ctaChips, panelTitle, quickAsks, welcomeText } from "./starters"
import type { PanelProps } from "./type"
import { useVisualViewport } from "./use-visual-viewport"

const PHONE = "(max-width: 639px)"

function subscribePhone(onChange: () => void) {
  const query = window.matchMedia(PHONE)
  query.addEventListener("change", onChange)
  return () => query.removeEventListener("change", onChange)
}

/** A phone gets the full-screen modal; anything wider, the floating panel. */
function usePhone(): boolean {
  return useSyncExternalStore(
    subscribePhone,
    () => window.matchMedia(PHONE).matches,
    () => false
  )
}

/**
 * The chat panel — a real dialog (title, description, Escape, focus
 * management) rendered in place, not portaled: it stacks over the page the
 * way the old window did.
 *
 * On a phone it is modal and full screen: focus stays inside, the page
 * behind is hidden from screen readers, it never scrolls under the panel,
 * and the panel follows the visual viewport so the keyboard never covers the
 * composer. On a wider screen it is non-modal and stays open while the
 * member clicks around the page behind it — following the steps there is
 * the point — and closes only with ✕, Escape or the floating button.
 */
export const Panel = memo(function Panel({
  open,
  onOpenChange,
  messages,
  status,
  onSend,
  onStop,
  onRetry,
  onNewChat,
  locale,
  dictionary,
  promptType,
  schoolContext,
  supportRole,
}: PanelProps) {
  const phone = usePhone()
  const frame = useVisualViewport(open && phone)
  const composer = useRef<ComposerHandle>(null)
  const dir = locale === "ar" ? "rtl" : "ltr"
  const busy = status === "waiting" || status === "streaming"

  const asks = useMemo(
    () => quickAsks(promptType, dictionary, supportRole, schoolContext),
    [promptType, dictionary, supportRole, schoolContext]
  )
  const chips = useMemo(
    () => ctaChips(promptType, dictionary, locale, schoolContext),
    [promptType, dictionary, locale, schoolContext]
  )
  const title = panelTitle(promptType, dictionary, locale, schoolContext)
  const welcome = welcomeText(promptType, dictionary, locale, schoolContext)

  const close = useCallback(() => onOpenChange(false), [onOpenChange])
  const newChat = useCallback(() => {
    onNewChat()
    composer.current?.focus()
  }, [onNewChat])

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange} modal={phone}>
      <DialogPrimitive.Content
        data-chatbot-panel
        dir={dir}
        onInteractOutside={(e) => {
          if (!phone) e.preventDefault()
        }}
        onOpenAutoFocus={(e) => {
          e.preventDefault()
          // A phone keyboard popping up on open hides half the welcome.
          if (!phone) composer.current?.focus()
        }}
        onCloseAutoFocus={(e) => {
          e.preventDefault()
          // The floating button remounts once the panel is gone.
          requestAnimationFrame(() =>
            document.querySelector<HTMLElement>("[data-chat-button]")?.focus()
          )
        }}
        className={cn(
          // `transform-gpu` makes the panel a containing block, so the chats
          // sheet's `fixed` overlay stays inside it. Keep it.
          "bg-background flex transform-gpu flex-col overflow-hidden outline-none",
          "data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 motion-reduce:animate-none",
          phone
            ? "fixed inset-x-0 top-0 z-[10000] h-dvh"
            : cn(
                "fixed end-2 bottom-4 z-[9999] h-[min(600px,calc(100dvh-2rem))] w-[400px] rounded-xl border shadow-2xl",
                dir === "rtl" ? "origin-bottom-left" : "origin-bottom-right"
              )
        )}
        style={
          phone && frame ? { top: frame.top, height: frame.height } : undefined
        }
      >
        <ChatHeader
          title={title}
          showNewChat={messages.length > 0}
          onNewChat={newChat}
          onClose={close}
          newChatLabel={dictionary.newChat}
          closeLabel={dictionary.closeChat}
        />
        <DialogPrimitive.Description className="sr-only">
          {dictionary.chatDescription}
        </DialogPrimitive.Description>
        <MessageList
          messages={messages}
          status={status}
          dictionary={dictionary}
          locale={locale}
          chips={chips}
          asks={asks}
          welcome={welcome}
          onAsk={onSend}
          onRetry={onRetry}
          onNavigate={close}
        />
        <div className="shrink-0 px-3 pt-1 pb-3">
          <Composer
            ref={composer}
            onSend={onSend}
            onStop={onStop}
            busy={busy}
            placeholder={dictionary.placeholder}
            inputLabel={dictionary.placeholder}
            sendLabel={dictionary.sendMessage}
            stopLabel={dictionary.stopAnswer}
            counterTemplate={dictionary.charactersLeft}
            dir={dir}
            large={phone}
          />
        </div>
      </DialogPrimitive.Content>
    </DialogPrimitive.Root>
  )
})
