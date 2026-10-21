// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import "server-only"

import {
  encodeEvent,
  SSE_OPEN,
  SSE_PING,
  type ChatEvent,
  type ChatProvider,
} from "./sse"
import type { ChatResource } from "./type"

/**
 * The contact ask itself — "share your WhatsApp number", «أرسل رقم واتسابك»
 * — read by the possessive. Not every line that names WhatsApp: "turn on
 * WhatsApp notifications" is a step of a guide, and cutting it broke answers.
 */
export const ASK_RE =
  /\byour\s+(?:whatsapp|phone|mobile|e-?mail|number|contact)\b|رقمك|واتسابك|جوالك|هاتفك|بريدك|إيميلك|ايميلك/i

/** A delta goes out once it holds this much text, or has waited this long. */
const COALESCE_CHARS = 40
const COALESCE_MS = 25
/** A comment line every so often keeps proxies from closing a quiet stream. */
const PING_MS = 10_000

export interface StreamResult {
  text: string
  partial: boolean
  provider: ChatProvider
  fallbackReason: string | null
  /** The guide the answer named (a model's tag), when it named one. */
  topicSlugs?: string[]
}

/**
 * What an answer source yields: text, or — mid-answer — the cards for the
 * guide a model's tag named, or the guides it offers to choose between.
 */
export type SourceItem =
  | string
  | { resources: ChatResource[]; topicSlugs: string[] }
  | { choices: Array<{ slug: string; label: string }> }

/**
 * The response body for one answer, as server-sent events (see `sse.ts`).
 * `: open`, the meta and the cards go out before the model says a word, so
 * the visitor sees the cards at once.
 *
 * Text streams as it arrives, a few words at a time. With `dropAsk` (the
 * sales bot, once it has asked for a contact) it goes a line at a time
 * instead, so a line repeating the ask can be cut whole.
 *
 * An empty or failed answer never leaves an empty bubble: before any text
 * it becomes the fallback; after some text it ends with `error: cut_off`, so
 * the visitor sees the answer broke and can retry.
 */
export function chatEventStream(opts: {
  fallback: string
  /** The saved conversation's ids, for the `meta` event. */
  ids?: {
    threadId: string
    userMessageId: string
    assistantMessageId: string
  } | null
  resources: ChatResource[]
  source: AsyncIterable<SourceItem> | Iterable<SourceItem>
  /** Who answered — read at the end, so a source can change it (a fallback). */
  provider: ChatProvider | (() => ChatProvider)
  dropAsk?: boolean
  /** Localized "the answer was cut off". */
  cutOffText: string
  onFinish?: (result: StreamResult) => void | Promise<void>
}): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder()
  const providerOf = () =>
    typeof opts.provider === "function" ? opts.provider() : opts.provider
  let ping: ReturnType<typeof setInterval> | undefined
  let closed = false

  return new ReadableStream({
    async start(controller) {
      const write = (chunk: string) => {
        if (closed) return
        try {
          controller.enqueue(encoder.encode(chunk))
        } catch {
          closed = true // the visitor went away mid-answer
        }
      }
      const emit = (e: ChatEvent) => write(encodeEvent(e))

      write(SSE_OPEN)
      const ids = opts.ids
      emit({
        event: "meta",
        data: {
          fallback: opts.fallback,
          ...(ids && {
            threadId: ids.threadId,
            userMessageId: ids.userMessageId,
            assistantMessageId: ids.assistantMessageId,
          }),
        },
      })
      if (opts.resources.length)
        emit({ event: "resources", data: { resources: opts.resources } })
      ping = setInterval(() => write(SSE_PING), PING_MS)

      let text = ""
      let pending = ""
      let lastFlush = Date.now()
      let line = ""
      const dropped: string[] = []
      const send = (t: string) => {
        if (!t) return
        text += t
        emit({ event: "delta", data: { t } })
      }
      const flush = () => {
        send(pending)
        pending = ""
        lastFlush = Date.now()
      }
      const push = (chunk: string) => {
        // Leading blank space would open an empty bubble.
        const piece = text || pending ? chunk : chunk.trimStart()
        if (!piece) return
        pending += piece
        if (
          pending.length >= COALESCE_CHARS ||
          Date.now() - lastFlush >= COALESCE_MS
        )
          flush()
      }
      const pushLine = (l: string, newline: boolean) => {
        if (ASK_RE.test(l)) {
          dropped.push(l)
          return
        }
        if (!text && !l.trim()) return
        send(newline ? `${l}\n` : l)
      }

      let failed = false
      let topicSlugs: string[] | undefined
      try {
        for await (const chunk of opts.source) {
          if (closed) break
          if (typeof chunk !== "string") {
            if ("resources" in chunk) {
              topicSlugs = chunk.topicSlugs
              if (chunk.resources.length)
                emit({ event: "resources", data: { resources: chunk.resources } })
            } else {
              emit({ event: "choices", data: { options: chunk.choices } })
            }
            continue
          }
          if (!opts.dropAsk) {
            push(chunk)
            continue
          }
          line += chunk
          let nl = line.indexOf("\n")
          while (nl !== -1) {
            pushLine(line.slice(0, nl), true)
            line = line.slice(nl + 1)
            nl = line.indexOf("\n")
          }
        }
        if (opts.dropAsk && line) pushLine(line, false)
        flush()
      } catch (error) {
        failed = true
        flush()
        console.error("[chatbot] stream failed", error)
      }

      // The visitor closed the tab or pressed Stop: what was sent is kept as
      // a partial answer, and nobody is left to tell.
      const aborted = closed
      let result: StreamResult
      if (text && (failed || aborted)) {
        emit({
          event: "error",
          data: { code: "cut_off", message: opts.cutOffText, retryable: true },
        })
        result = {
          text,
          partial: true,
          provider: providerOf(),
          fallbackReason: aborted ? "aborted" : "error",
          topicSlugs,
        }
      } else if (text) {
        result = {
          text,
          partial: false,
          provider: providerOf(),
          fallbackReason: null,
          topicSlugs,
        }
      } else {
        // A reply that was nothing but the ask keeps it — cutting it all
        // would leave nothing to read.
        const reply = dropped.length ? dropped.join("\n") : opts.fallback
        send(reply)
        result = {
          text,
          partial: false,
          provider: dropped.length ? providerOf() : "code",
          fallbackReason: dropped.length ? null : failed ? "error" : "empty",
        }
      }
      emit({
        event: "done",
        data: {
          provider: result.provider,
          partial: result.partial,
          fallbackReason: result.fallbackReason,
        },
      })
      clearInterval(ping)
      try {
        await opts.onFinish?.(result)
      } catch (error) {
        console.error("[chatbot] finish failed", error)
      }
      if (!closed) {
        closed = true
        controller.close()
      }
    },
    cancel() {
      closed = true
      clearInterval(ping)
    },
  })
}
