// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * The chatbot's answer endpoint — every mode (SaaS sales, school site,
 * dashboard support desk). A route handler, not a Server Action, because
 * the reply streams: the body is one JSON line of `ChatMeta`, then text.
 * Auth, rate limit and prompt assembly live in `components/chatbot/server`.
 */
import { createGroq } from "@ai-sdk/groq"
import { streamText } from "ai"
import { z } from "zod"

import { MAX_MESSAGE_LENGTH } from "@/components/chatbot/constant"
import {
  CHAT_MODEL,
  prepareChat,
  replyStream,
} from "@/components/chatbot/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const bodySchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().max(MAX_MESSAGE_LENGTH * 4),
      })
    )
    .min(1)
    .max(50),
  promptType: z
    .enum(["saasMarketing", "schoolSite", "schoolSupport"])
    .default("saasMarketing"),
  subdomain: z.string().max(63).optional(),
  locale: z.enum(["en", "ar"]).default("en"),
})

const HEADERS = {
  "content-type": "text/plain; charset=utf-8",
  // `no-transform` keeps Next's own gzip off this response: compression
  // holds bytes back to fill a block, which turns a stream into a burst.
  "cache-control": "no-store, no-transform",
  // Tell any proxy in front of the container not to buffer the stream.
  "x-accel-buffering": "no",
}

/**
 * The model call's own deadline. `maxDuration` means nothing on the
 * standalone container, so without one a hung provider held the visitor's
 * input disabled until they reloaded.
 */
const MODEL_TIMEOUT_MS = 25_000

export async function POST(request: Request): Promise<Response> {
  const parsed = bodySchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return Response.json({}, { status: 400 })
  }

  const plan = await prepareChat({ ...parsed.data, headers: request.headers })

  if (plan.kind === "error") {
    return Response.json({ error: plan.error }, { status: plan.status })
  }

  if (plan.kind === "reply") {
    return new Response(replyStream(plan.meta, [plan.text]), {
      headers: HEADERS,
    })
  }

  const groq = createGroq({ apiKey: process.env.GROQ_API_KEY })
  const result = streamText({
    model: groq(CHAT_MODEL),
    messages: plan.messages,
    system: plan.system,
    // Low temperature → factual, on-script answers (never invent prices).
    temperature: 0.3,
    // Caps replies at a short answer or a ≤6-step how-to list. gpt-oss is a
    // reasoning model and its reasoning tokens count against this cap, so
    // effort stays "low" (~60 reasoning tokens measured); 600 leaves a
    // numbered list room to finish.
    maxOutputTokens: 600,
    providerOptions: { groq: { reasoningEffort: "low" } },
    // One retry, not the SDK's two: the free tier's 429s don't clear in
    // seconds, and every retry is time the visitor watches nothing.
    maxRetries: 1,
    abortSignal: AbortSignal.any([
      request.signal,
      AbortSignal.timeout(MODEL_TIMEOUT_MS),
    ]),
  })

  async function* text() {
    for await (const part of result.fullStream) {
      if (part.type === "text-delta") yield part.text
      else if (part.type === "error") throw part.error
    }
  }

  return new Response(replyStream(plan.meta, text(), plan.dropAsk), {
    headers: HEADERS,
  })
}
