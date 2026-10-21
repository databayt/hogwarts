// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { describe, expect, it, vi } from "vitest"

import {
  encodeEvent,
  readEvents,
  type ChatEvent,
} from "@/components/chatbot/sse"
import { chatEventStream } from "@/components/chatbot/stream"

/** A body that arrives in the given byte-sized pieces. */
function chunked(text: string, size: number): ReadableStream<Uint8Array> {
  const bytes = new TextEncoder().encode(text)
  return new ReadableStream({
    start(controller) {
      for (let i = 0; i < bytes.length; i += size)
        controller.enqueue(bytes.slice(i, i + size))
      controller.close()
    },
  })
}

async function events(body: ReadableStream<Uint8Array>): Promise<ChatEvent[]> {
  const out: ChatEvent[] = []
  for await (const e of readEvents(body)) out.push(e)
  return out
}

const text = (evs: ChatEvent[]) =>
  evs.flatMap((e) => (e.event === "delta" ? [e.data.t] : [])).join("")

describe("readEvents", () => {
  it("decodes Arabic split mid-letter across chunks", async () => {
    const wire =
      ": open\n\n" +
      encodeEvent({ event: "delta", data: { t: "افتح **الطلاب**" } }) +
      ": ping\n\n" +
      encodeEvent({
        event: "done",
        data: { provider: "groq", partial: false, fallbackReason: null },
      })
    for (const size of [1, 3, 7, 64]) {
      const evs = await events(chunked(wire, size))
      expect(evs.map((e) => e.event)).toEqual(["delta", "done"])
      expect(text(evs)).toBe("افتح **الطلاب**")
    }
  })
})

describe("chatEventStream", () => {
  async function* pieces(parts: string[], failAfter?: number) {
    let i = 0
    for (const p of parts) {
      if (failAfter !== undefined && i++ === failAfter) throw new Error("boom")
      yield p
    }
  }
  const base = {
    fallback: "FALLBACK",
    resources: [],
    provider: "groq" as const,
    cutOffText: "CUT",
  }

  it("streams meta, then the answer, then done", async () => {
    const evs = await events(
      chatEventStream({ ...base, source: pieces(["  Hello", " world"]) })
    )
    expect(evs[0]).toEqual({ event: "meta", data: { fallback: "FALLBACK" } })
    expect(text(evs)).toBe("Hello world")
    expect(evs.at(-1)).toEqual({
      event: "done",
      data: { provider: "groq", partial: false, fallbackReason: null },
    })
  })

  it("sends the cards before the answer", async () => {
    const card = { kind: "guide" as const, title: "Guide", href: "/en/docs" }
    const evs = await events(
      chatEventStream({ ...base, resources: [card], source: pieces(["Hi"]) })
    )
    expect(evs.map((e) => e.event).slice(0, 3)).toEqual([
      "meta",
      "resources",
      "delta",
    ])
  })

  it("cuts only the ask lines in line mode", async () => {
    const evs = await events(
      chatEventStream({
        ...base,
        dropAsk: true,
        source: pieces([
          "Turn on WhatsApp notifications.\n",
          "Share your WhatsApp number with us.\n",
          "Done.",
        ]),
      })
    )
    expect(text(evs)).toBe("Turn on WhatsApp notifications.\nDone.")
  })

  it("marks an answer that broke off as cut off", async () => {
    const onFinish = vi.fn()
    const evs = await events(
      chatEventStream({
        ...base,
        source: pieces(["First part. ", "second"], 1),
        onFinish,
      })
    )
    expect(evs.find((e) => e.event === "error")).toEqual({
      event: "error",
      data: { code: "cut_off", message: "CUT", retryable: true },
    })
    expect(evs.at(-1)).toMatchObject({ data: { partial: true } })
    expect(onFinish).toHaveBeenCalledWith(
      expect.objectContaining({ text: "First part. ", partial: true })
    )
  })

  it("answers with the fallback when nothing came back", async () => {
    const empty = await events(chatEventStream({ ...base, source: pieces([]) }))
    expect(text(empty)).toBe("FALLBACK")
    expect(empty.at(-1)).toMatchObject({
      data: { provider: "code", fallbackReason: "empty" },
    })

    const failed = await events(
      chatEventStream({ ...base, source: pieces(["x"], 0) })
    )
    expect(text(failed)).toBe("FALLBACK")
    expect(failed.at(-1)).toMatchObject({
      data: { provider: "code", fallbackReason: "error" },
    })
  })
})
