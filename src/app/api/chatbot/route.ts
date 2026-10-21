// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * The chatbot's answer endpoint — every mode (SaaS sales, school site,
 * dashboard support desk). A route handler, not a Server Action, because
 * the reply streams: server-sent events (see `components/chatbot/sse`).
 * Auth, rate limit and prompt assembly live in `components/chatbot/server`.
 */
import { createGroq } from "@ai-sdk/groq"
import { streamText } from "ai"
import { z } from "zod"

import { MAX_MESSAGE_LENGTH } from "@/components/chatbot/constant"
import {
  fakeAnswer,
  fakeProviderEnabled,
} from "@/components/chatbot/fake-provider"
import { CHAT_MODEL, prepareChat, type PlanTurn } from "@/components/chatbot/server"
import { chatEventStream, type StreamResult } from "@/components/chatbot/stream"
import { finishTurn } from "@/components/chatbot/threads"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * One question, and which saved conversation it joins. Strict: a client
 * can no longer send a history — the model reads the thread's, from the
 * database, so nobody can put words in the assistant's mouth.
 */
const bodySchema = z
  .object({
    message: z.string().trim().min(1).max(MAX_MESSAGE_LENGTH),
    threadId: z.string().min(1).max(64).optional(),
    retryOf: z.string().min(1).max(64).optional(),
    promptType: z
      .enum(["saasMarketing", "schoolSite", "schoolSupport"])
      .default("saasMarketing"),
    subdomain: z.string().max(63).optional(),
    locale: z.enum(["en", "ar"]).default("en"),
  })
  .strict()

const HEADERS = {
  "content-type": "text/event-stream; charset=utf-8",
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

  const { resources, fallback, cutOff } = plan.meta
  const started = Date.now()
  const finish = saveAnswer(plan.turn, plan.topicSlugs, started)

  if (plan.kind === "reply") {
    return new Response(
      chatEventStream({
        fallback,
        ids: plan.turn,
        resources,
        source: [plan.text],
        provider: "code",
        cutOffText: cutOff,
        onFinish: finish,
      }),
      { headers: HEADERS }
    )
  }

  const signal = AbortSignal.any([
    request.signal,
    AbortSignal.timeout(MODEL_TIMEOUT_MS),
  ])
  const { system, messages, dropAsk } = plan

  async function* groqText() {
    const groq = createGroq({ apiKey: process.env.GROQ_API_KEY })
    const result = streamText({
      model: groq(CHAT_MODEL),
      messages,
      system,
      // Low temperature → factual, on-script answers (never invent prices).
      temperature: 0.3,
      // Caps replies at a short answer or a ≤6-step how-to list. gpt-oss is
      // a reasoning model and its reasoning tokens count against this cap,
      // so effort stays "low" (~60 reasoning tokens measured); 600 leaves a
      // numbered list room to finish.
      maxOutputTokens: 600,
      providerOptions: { groq: { reasoningEffort: "low" } },
      // No retries: the free tier's 429s are per-minute or per-day caps that
      // don't clear in seconds (a retried daily cap held a visitor 18 s for
      // nothing). Failing fast hands over to the guide's own steps.
      maxRetries: 0,
      abortSignal: signal,
    })
    for await (const part of result.fullStream) {
      if (part.type === "text-delta") yield part.text
      else if (part.type === "error") throw part.error
    }
  }

  const question = String(messages.at(-1)?.content ?? "")
  return new Response(
    chatEventStream({
      fallback,
      ids: plan.turn,
      resources,
      source: fakeProviderEnabled()
        ? fakeAnswer(question, parsed.data.locale, signal)
        : groqText(),
      provider: "groq",
      dropAsk,
      cutOffText: cutOff,
      onFinish: finish,
    }),
    { headers: HEADERS }
  )
}

/** Write the answer into its saved turn once the stream ends — even cut short. */
function saveAnswer(
  turn: PlanTurn | null,
  topicSlugs: string[],
  started: number
): ((result: StreamResult) => Promise<void>) | undefined {
  if (!turn) return undefined
  return (result) =>
    finishTurn({
      schoolId: turn.schoolId,
      threadId: turn.threadId,
      assistantMessageId: turn.assistantMessageId,
      text: result.text,
      partial: result.partial,
      provider: result.provider,
      fallbackReason: result.fallbackReason,
      topicSlugs,
      latencyMs: Date.now() - started,
    })
}
