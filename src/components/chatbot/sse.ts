// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * The chat wire format: server-sent events, one JSON object per event.
 * Shared by the route (encode) and the hook (decode), so both sides read
 * one definition.
 *
 *   : open                      sent at once — flushes the headers
 *   event: meta                 ids + the localized fallback, before any text
 *   event: resources            the guide, video and screenshot cards
 *   event: delta                a piece of the answer, as it arrives
 *   : ping                      every 10 s while the model is silent
 *   event: done                 which provider answered, and whether it's whole
 *   event: error                the answer broke off — localized, retryable
 */
import type { ChatResource } from "./type"

export type ChatProvider = "anthropic" | "groq" | "code"

export type ChatEvent =
  | { event: "meta"; data: { fallback: string } }
  | { event: "resources"; data: { resources: ChatResource[] } }
  | { event: "delta"; data: { t: string } }
  | {
      event: "done"
      data: {
        provider: ChatProvider
        partial: boolean
        fallbackReason: string | null
      }
    }
  | {
      event: "error"
      data: {
        code: "cut_off" | "unavailable"
        message: string
        retryable: boolean
      }
    }

export const SSE_OPEN = ": open\n\n"
export const SSE_PING = ": ping\n\n"

export function encodeEvent(e: ChatEvent): string {
  return `event: ${e.event}\ndata: ${JSON.stringify(e.data)}\n\n`
}

/** One `event:` / `data:` block, or null for a comment or a malformed block. */
function parseBlock(block: string): ChatEvent | null {
  let event = ""
  let data = ""
  for (const line of block.split("\n")) {
    if (line.startsWith("event:")) event = line.slice(6).trim()
    else if (line.startsWith("data:")) data += line.slice(5).trim()
  }
  if (!event || !data) return null
  try {
    return { event, data: JSON.parse(data) } as ChatEvent
  } catch {
    return null
  }
}

/**
 * The events of a response body, in order. The body is decoded as one text
 * stream, so a multibyte Arabic letter split across two network chunks
 * arrives whole.
 */
export async function* readEvents(
  body: ReadableStream<Uint8Array>
): AsyncGenerator<ChatEvent> {
  const reader = body.pipeThrough(new TextDecoderStream()).getReader()
  let buffer = ""
  try {
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += value
      let end = buffer.indexOf("\n\n")
      while (end !== -1) {
        const parsed = parseBlock(buffer.slice(0, end))
        buffer = buffer.slice(end + 2)
        if (parsed) yield parsed
        end = buffer.indexOf("\n\n")
      }
    }
    const tail = parseBlock(buffer)
    if (tail) yield tail
  } finally {
    reader.releaseLock()
  }
}
