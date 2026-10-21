// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import "server-only"

import Anthropic from "@anthropic-ai/sdk"

import { CLAUDE_MODEL, claudeClient } from "./client"
import { guideTagParser } from "./guide-tag"
import type { ClaudeUsage } from "./pricing"
import { GUIDE_SLUGS } from "./prompt"

/**
 * Claude could not answer and nothing has been sent yet: the caller falls
 * to the next provider. `breaker` says how hard to back off — `count` adds
 * to the three-strikes window, `open` stops trying for half an hour (a bad
 * key or model), `cap` until next month (the credits or the workspace limit
 * ran out), `none` doesn't touch the breaker.
 */
export class ClaudeFallback extends Error {
  constructor(
    readonly reason: string,
    readonly breaker: "count" | "open" | "cap" | "none"
  ) {
    super(reason)
  }
}

export type ClaudeItem =
  | { type: "text"; text: string }
  | { type: "guide"; slug: string }
  | { type: "choose"; slugs: string[] }

export interface ClaudeRun extends ClaudeUsage {
  stopReason: string | null
  firstTokenMs: number | null
  /** Characters of answer text sent — to estimate output when cut short. */
  chars: number
}

const FIRST_TOKEN_MS = 8_000
const TOTAL_MS = 30_000

function classify(error: unknown): ClaudeFallback {
  if (error instanceof Anthropic.APIUserAbortError)
    return new ClaudeFallback("timeout", "count")
  if (error instanceof Anthropic.APIError) {
    // The credits, or the workspace's $20 limit, are spent. Never overage.
    if (
      error.status === 402 ||
      /credit balance|billing|spend limit|usage limit/i.test(error.message)
    )
      return new ClaudeFallback("billing", "cap")
    if (
      error instanceof Anthropic.AuthenticationError ||
      error instanceof Anthropic.PermissionDeniedError
    )
      return new ClaudeFallback("auth", "open")
    if (error instanceof Anthropic.NotFoundError)
      return new ClaudeFallback("model", "open")
    if (error instanceof Anthropic.RateLimitError)
      return new ClaudeFallback("rate_limited", "count")
    if (error instanceof Anthropic.APIConnectionError)
      return new ClaudeFallback("network", "count")
    if (error instanceof Anthropic.BadRequestError)
      return new ClaudeFallback("bad_request", "count")
    if ((error.status ?? 0) >= 500)
      return new ClaudeFallback("overloaded", "count")
  }
  return new ClaudeFallback("error", "count")
}

/**
 * One answer from Claude Haiku 5.5, streamed: text pieces, and the guide
 * tag as an item of its own. System blocks 1 and 2 are cached (see
 * `prompt.ts`); thinking is off and effort low — short, direct answers.
 * No temperature (Haiku 5.5 rejects it), no prefill.
 *
 * Deadlines: 8 s to the first word, 30 s in all, and the visitor leaving
 * ends it too. Before the first word any failure is a `ClaudeFallback`;
 * after it, the error propagates and the stream reports the cut-off. A
 * refusal before any text goes to the code path, never to another model.
 * Usage — even for a failed or cut answer — is reported in `finally`.
 */
export async function* claudeAnswer(opts: {
  system: [string, string, string]
  messages: Array<{ role: "user" | "assistant"; content: string }>
  /** An opaque per-person id for Anthropic's abuse tooling. */
  userKey: string
  signal: AbortSignal
  /** Effort is eval-gated (scripts/chatbot/eval.ts); low unless it says otherwise. */
  effort?: "low" | "medium"
  onDone: (run: ClaudeRun) => void
}): AsyncGenerator<ClaudeItem> {
  const client = claudeClient()
  if (!client) throw new ClaudeFallback("no_key", "none")

  const ac = new AbortController()
  const stop = () => ac.abort()
  opts.signal.addEventListener("abort", stop)
  const firstTimer = setTimeout(stop, FIRST_TOKEN_MS)
  const totalTimer = setTimeout(stop, TOTAL_MS)
  const started = Date.now()
  const run: ClaudeRun = {
    input: 0,
    read: 0,
    write: 0,
    write1h: 0,
    output: 0,
    stopReason: null,
    firstTokenMs: null,
    chars: 0,
  }
  const tag = guideTagParser(GUIDE_SLUGS)
  // The API wants the conversation to open with the user.
  const messages = opts.messages.slice(
    Math.max(0, opts.messages.findIndex((m) => m.role === "user"))
  )

  try {
    const [helpCenter, mode, context] = opts.system
    const params = {
      model: CLAUDE_MODEL,
      max_tokens: 1024,
      system: [
        { type: "text", text: helpCenter, cache_control: { type: "ephemeral" } },
        { type: "text", text: mode, cache_control: { type: "ephemeral" } },
        { type: "text", text: context },
      ],
      messages,
      thinking: { type: "disabled" },
      // Not in SDK 0.68's types yet; the API reads it.
      output_config: { effort: opts.effort ?? "low" },
      metadata: { user_id: opts.userKey },
    }
    const stream = client.messages.stream(
      params as unknown as Anthropic.MessageStreamParams,
      { signal: ac.signal }
    )
    for await (const event of stream) {
      if (event.type === "message_start") {
        const u = event.message.usage
        run.input = u.input_tokens
        run.read = u.cache_read_input_tokens ?? 0
        run.write = u.cache_creation_input_tokens ?? 0
        run.write1h = u.cache_creation?.ephemeral_1h_input_tokens ?? 0
      } else if (
        event.type === "content_block_delta" &&
        event.delta.type === "text_delta"
      ) {
        if (run.firstTokenMs === null) {
          run.firstTokenMs = Date.now() - started
          clearTimeout(firstTimer)
        }
        for (const t of tag.feed(event.delta.text)) yield toItem(t, run)
      } else if (event.type === "message_delta") {
        run.stopReason = event.delta.stop_reason ?? null
        run.output = event.usage.output_tokens
      }
    }
    for (const t of tag.flush()) yield toItem(t, run)
    if (run.stopReason === "refusal" && !run.chars)
      throw new ClaudeFallback("refusal", "none")
  } catch (error) {
    if (error instanceof ClaudeFallback) throw error
    // The visitor left, or the answer broke mid-way: not a fallback.
    if (opts.signal.aborted || run.chars) throw error
    throw classify(error)
  } finally {
    clearTimeout(firstTimer)
    clearTimeout(totalTimer)
    opts.signal.removeEventListener("abort", stop)
    opts.onDone(run)
  }
}

function toItem(
  t: { kind: "text"; text: string } | { kind: "guide"; slug: string } | { kind: "choose"; slugs: string[] },
  run: ClaudeRun
): ClaudeItem {
  if (t.kind === "text") {
    run.chars += t.text.length
    return { type: "text", text: t.text }
  }
  return t.kind === "guide"
    ? { type: "guide", slug: t.slug }
    : { type: "choose", slugs: t.slugs }
}
