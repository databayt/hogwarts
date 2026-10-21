"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { ArrowDown } from "lucide-react"

import { Feedback, type NextStep } from "./feedback"
import { MessageRow } from "./message"
import type { QuickAsk } from "./starters"
import type {
  ChatbotDictionary,
  ChatMessage,
  ChatStatus,
  CtaChip,
  PromptType,
} from "./type"
import { useStickToBottom } from "./use-stick-to-bottom"

const NO_CHIPS: CtaChip[] = []

/**
 * The conversation. A `log` region, so a screen reader hears each answer
 * once it is complete (`aria-busy` holds it while it streams). Empty, it is
 * the welcome and the quick asks.
 */
export function MessageList({
  messages,
  status,
  dictionary,
  locale,
  chips,
  asks,
  welcome,
  onAsk,
  onRetry,
  onNavigate,
  keepOpenOnPage,
  promptType,
  onRate,
  onStep,
}: {
  messages: ChatMessage[]
  status: ChatStatus
  dictionary: ChatbotDictionary
  locale: "en" | "ar"
  chips: CtaChip[]
  asks: QuickAsk[]
  welcome: string
  onAsk: (question: string) => void
  onRetry: () => void
  onNavigate: () => void
  keepOpenOnPage: boolean
  promptType: PromptType
  onRate: (messageId: string, value: 1 | -1) => void
  onStep: (step: NextStep) => void
}) {
  const busy = status === "waiting" || status === "streaming"
  const last = messages.at(-1)
  const { ref, onScroll, away, scrollToBottom } = useStickToBottom(
    last
      ? `${messages.length}:${last.content.length}:${last.resources?.length ?? 0}`
      : 0,
    status === "streaming"
  )
  let lastAssistant = -1
  for (let i = messages.length - 1; i >= 0; i--)
    if (messages[i]!.role === "assistant") {
      lastAssistant = i
      break
    }

  return (
    <div className="relative min-h-0 flex-1">
      <div
        ref={ref}
        onScroll={onScroll}
        role="log"
        aria-busy={busy}
        className="h-full overflow-y-auto overscroll-contain px-4 py-3"
      >
        {messages.length === 0 ? (
          <div className="flex min-h-full flex-col justify-end gap-4 pb-2">
            <div className="text-center">
              <p className="mb-1 text-sm font-medium">{welcome}</p>
              <p className="text-muted-foreground text-xs">
                {dictionary.chooseQuestion}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {asks.map((a) => (
                <button
                  key={a.question}
                  type="button"
                  onClick={() => onAsk(a.question)}
                  className="bg-muted hover:bg-muted/80 focus-visible:ring-ring flex items-center gap-2 rounded-lg px-3 py-2.5 text-start text-xs outline-none focus-visible:ring-2"
                >
                  <a.icon size={15} />
                  <span>{a.label}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((m, i) => {
              const latest = i === messages.length - 1
              const row = (
                <MessageRow
                  key={m.id}
                  message={m}
                  dictionary={dictionary}
                  locale={locale}
                  pending={busy && latest && m.role === "assistant"}
                  chips={
                    i === lastAssistant && !busy && m.kind !== "error"
                      ? chips
                      : NO_CHIPS
                  }
                  onRetry={
                    latest && !busy && (m.partial || m.kind === "error")
                      ? onRetry
                      : undefined
                  }
                  onNavigate={onNavigate}
                  keepOpenOnPage={keepOpenOnPage}
                />
              )
              const rateable =
                latest &&
                !busy &&
                m.role === "assistant" &&
                m.kind !== "error" &&
                m.content.trim()
              return rateable ? (
                <div key={m.id} className="space-y-2">
                  {row}
                  <Feedback
                    message={m}
                    dictionary={dictionary}
                    promptType={promptType}
                    onRate={onRate}
                    onStep={onStep}
                  />
                </div>
              ) : (
                row
              )
            })}
          </div>
        )}
      </div>
      {away && (
        <button
          type="button"
          onClick={() => scrollToBottom()}
          aria-label={dictionary.scrollToLatest}
          className="bg-background hover:bg-accent absolute inset-x-0 bottom-2 mx-auto flex h-8 w-8 items-center justify-center rounded-full border shadow-sm"
        >
          <ArrowDown className="h-4 w-4" aria-hidden />
        </button>
      )}
    </div>
  )
}
