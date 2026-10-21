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
import { CLAUDE_MODEL } from "@/components/chatbot/claude/client"
import { costUsd, estimateOutputTokens, type ClaudeUsage } from "@/components/chatbot/claude/pricing"
import {
  claudeAnswer,
  ClaudeFallback,
  type ClaudeRun,
} from "@/components/chatbot/claude/request"
import { claudeAvailable, noteClaudeFailure } from "@/components/chatbot/provider"
import { CHAT_MODEL, prepareChat, type PlanTurn } from "@/components/chatbot/server"
import { reserve, settle } from "@/components/chatbot/spend"
import type { ChatProvider } from "@/components/chatbot/sse"
import {
  chatEventStream,
  type SourceItem,
  type StreamResult,
} from "@/components/chatbot/stream"
import { SUPPORT_TOPICS } from "@/components/chatbot/support"
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
    /** The page they asked from — the panel stays put across pages. */
    pathname: z
      .string()
      .max(200)
      .regex(/^\/[^\s?#]*$/)
      .optional(),
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
  // What the answer turned out to be — filled in as the ladder runs, read
  // when the stream ends.
  const report: AnswerReport = {
    provider: plan.kind === "reply" ? "code" : "groq",
    model: plan.kind === "reply" ? null : CHAT_MODEL,
    fallbackReason: null,
    usage: null,
    costUsd: null,
    firstTokenMs: null,
  }
  const finish = saveAnswer(plan.turn, plan.topicSlugs, started, report)

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
  const { system, messages, dropAsk, topicSlugs, claude, cardsFor, turn } =
    plan
  const locale = parsed.data.locale

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

  /**
   * The provider ladder: Claude (when on, keyed, within budget, breaker
   * closed) → Groq (only while nothing has been sent) → the guide's own
   * steps (the stream's fallback, no model at all).
   */
  const tryClaude =
    Boolean(claude) &&
    !fakeProviderEnabled() &&
    claudeAvailable() &&
    (await reserve(CLAUDE_ESTIMATE_USD))

  async function* answer(): AsyncGenerator<SourceItem> {
    if (tryClaude && claude) {
      report.provider = "anthropic"
      report.model = CLAUDE_MODEL
      let run: ClaudeRun | null = null
      try {
        for await (const item of claudeAnswer({
          system: claude.system,
          messages: messages.map((m) => ({
            role: m.role === "assistant" ? "assistant" : "user",
            content: String(m.content),
          })),
          userKey: claude.userKey,
          signal,
          onDone: (r) => {
            run = r
          },
        })) {
          if (item.type === "text") yield item.text
          else if (item.type === "guide")
            yield { resources: cardsFor(item.slug), topicSlugs: [item.slug] }
          else
            yield {
              choices: item.slugs.map((slug) => ({
                slug,
                label: guideTitle(slug, locale),
              })),
            }
        }
        return
      } catch (error) {
        if (!(error instanceof ClaudeFallback)) throw error
        noteClaudeFailure(error.breaker)
        console.error("[chatbot] claude fell back:", error.reason)
        report.provider = "groq"
        report.model = CHAT_MODEL
        report.fallbackReason = error.reason
      } finally {
        const done = run as ClaudeRun | null
        const usage = done && {
          ...done,
          output: done.output || estimateOutputTokens(done.chars),
        }
        const cost = usage ? costUsd(usage) : 0
        if (usage && report.provider === "anthropic") {
          report.usage = usage
          report.costUsd = cost
          report.firstTokenMs = usage.firstTokenMs
        }
        await settle(
          CLAUDE_ESTIMATE_USD,
          usage
            ? {
                costUsd: cost,
                model: CLAUDE_MODEL,
                inputTokens: usage.input + usage.read + usage.write,
                outputTokens: usage.output,
                jobType: "chatbot",
                jobId: turn?.assistantMessageId,
              }
            : null
        )
      }
    }
    // Groq answers from the keyword matcher's guides, so their cards go first.
    if (resources.length) yield { resources, topicSlugs }
    if (!process.env.GROQ_API_KEY) return
    yield* groqText()
  }

  const question = String(messages.at(-1)?.content ?? "")
  return new Response(
    chatEventStream({
      fallback,
      ids: plan.turn,
      // With Claude, the model's tag picks the cards; otherwise the
      // matcher's go out before the first word.
      resources: tryClaude || fakeProviderEnabled() ? [] : resources,
      source: fakeProviderEnabled()
        ? fakeAnswer(question, locale, signal)
        : tryClaude
          ? answer()
          : groqOnly(),
      provider: () => report.provider,
      dropAsk: dropAsk && !tryClaude,
      cutOffText: cutOff,
      onFinish: finish,
    }),
    { headers: HEADERS }
  )

  async function* groqOnly(): AsyncGenerator<SourceItem> {
    if (!process.env.GROQ_API_KEY) return
    yield* groqText()
  }
}

/** What reserving one Claude answer holds against the cap until it settles. */
const CLAUDE_ESTIMATE_USD = 0.003

interface AnswerReport {
  provider: ChatProvider
  model: string | null
  fallbackReason: string | null
  usage: ClaudeUsage | null
  costUsd: number | null
  firstTokenMs: number | null
}

const guideTitle = (slug: string, locale: "ar" | "en") =>
  SUPPORT_TOPICS.find((t) => t.slug === slug)?.title[locale] ?? slug

/** Write the answer into its saved turn once the stream ends — even cut short. */
function saveAnswer(
  turn: PlanTurn | null,
  topicSlugs: string[],
  started: number,
  report: AnswerReport
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
      fallbackReason: result.fallbackReason ?? report.fallbackReason,
      topicSlugs: result.topicSlugs ?? topicSlugs,
      latencyMs: Date.now() - started,
      model: report.model,
      usage: report.usage,
      costUsd: report.costUsd,
      firstTokenMs: report.firstTokenMs,
    })
}
