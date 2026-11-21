// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import "server-only"

import Anthropic from "@anthropic-ai/sdk"

import { CLAUDE_MODEL, claudeClient } from "@/components/chatbot/claude/client"
import { costUsd, type ClaudeUsage } from "@/components/chatbot/claude/pricing"

import { draftJsonSchema, TOOL_NAME } from "./schema"
import type { LessonDraftErrorCode, ValidDraft } from "./types"
import { LessonDraftError } from "./types"
import { validateDraft } from "./validate"

/**
 * The lesson-draft lane's one Claude call. It reuses the chatbot's client
 * (its own key CHATBOT_ANTHROPIC_API_KEY — NEVER the plain ANTHROPIC_API_KEY,
 * which dormant uncapped callers hang off), its model and its price table.
 *
 * One non-streaming `messages.create`, a forced tool call (the SDK's
 * zodOutputFormat silently drops `enum`), thinking off (Haiku 5.5 thinks by
 * default), no sampling parameters, 45 s a call, and ONE retry — only when
 * validation leaves fewer than four questions.
 */

export { CLAUDE_MODEL }

export const MAX_TOKENS = 3000
export const CALL_TIMEOUT_MS = 45_000

/** On only when switched on AND keyed. Ships dark. */
export function lessonDraftEnabled(): boolean {
  return (
    process.env.LESSON_DRAFT_ENABLED === "1" &&
    Boolean(process.env.CHATBOT_ANTHROPIC_API_KEY?.trim())
  )
}

export interface DraftUsage {
  inputTokens: number
  outputTokens: number
  costUsd: number
  calls: number
}

/** A failure that still carries what the calls so far cost. */
export class DraftCallError extends LessonDraftError {
  constructor(
    code: LessonDraftErrorCode,
    readonly usage: DraftUsage
  ) {
    super(code)
  }
}

function classify(error: unknown): LessonDraftErrorCode {
  if (error instanceof Anthropic.APIUserAbortError) return "LESSON_DRAFT_TIMEOUT"
  if (error instanceof Anthropic.APIConnectionTimeoutError)
    return "LESSON_DRAFT_TIMEOUT"
  if (error instanceof Anthropic.APIError) {
    // The credits, or the workspace's limit, ran out
    if (
      error.status === 402 ||
      /credit balance|billing|spend limit|usage limit/i.test(error.message)
    )
      return "LESSON_DRAFT_CAP"
  }
  return "UNKNOWN"
}

function usageOf(u: Anthropic.Usage): ClaudeUsage {
  const extra = u as Anthropic.Usage & {
    cache_creation?: { ephemeral_1h_input_tokens?: number } | null
  }
  return {
    input: u.input_tokens ?? 0,
    read: u.cache_read_input_tokens ?? 0,
    write: u.cache_creation_input_tokens ?? 0,
    write1h: extra.cache_creation?.ephemeral_1h_input_tokens ?? 0,
    output: u.output_tokens ?? 0,
  }
}

export interface DraftRequest {
  system: string
  user: string
  /** The lesson's language: validation checks the Arabic-letter ratio. */
  lang: "ar" | "en"
  homeworkOnly: boolean
  /** An opaque per-person id for Anthropic's abuse tooling. */
  userKey: string
}

/**
 * Ask for a draft, validate it, and retry once when fewer than four
 * questions survive. Returns the valid draft with the summed usage; throws
 * a `DraftCallError` (code + usage so far) otherwise.
 */
export async function requestDraft(
  req: DraftRequest
): Promise<{ draft: ValidDraft; usage: DraftUsage; firstTry: boolean }> {
  const client = claudeClient()
  if (!client) throw new LessonDraftError("LESSON_DRAFT_DISABLED")

  const usage: DraftUsage = {
    inputTokens: 0,
    outputTokens: 0,
    costUsd: 0,
    calls: 0,
  }
  const attempts = req.homeworkOnly ? 1 : 2

  for (let attempt = 1; attempt <= attempts; attempt++) {
    const ac = new AbortController()
    const timer = setTimeout(() => ac.abort(), CALL_TIMEOUT_MS)
    let message: Anthropic.Message
    try {
      const params = {
        model: CLAUDE_MODEL,
        max_tokens: MAX_TOKENS,
        system: req.system,
        messages: [{ role: "user", content: req.user }],
        tools: [
          {
            name: TOOL_NAME,
            description:
              "Submit the drafted quick-check questions and the homework task.",
            input_schema: draftJsonSchema({ homeworkOnly: req.homeworkOnly }),
          },
        ],
        tool_choice: { type: "tool", name: TOOL_NAME },
        thinking: { type: "disabled" },
        metadata: { user_id: req.userKey },
      }
      message = await client.messages.create(
        params as unknown as Anthropic.MessageCreateParamsNonStreaming,
        { signal: ac.signal, timeout: CALL_TIMEOUT_MS }
      )
    } catch (error) {
      throw new DraftCallError(classify(error), usage)
    } finally {
      clearTimeout(timer)
    }

    const u = usageOf(message.usage)
    usage.calls += 1
    usage.inputTokens += u.input + u.read + u.write
    usage.outputTokens += u.output
    usage.costUsd += costUsd(u)

    const block = message.content.find(
      (b): b is Anthropic.ToolUseBlock => b.type === "tool_use"
    )
    const checked = validateDraft(block?.input, req.lang, {
      needQuestions: !req.homeworkOnly,
    })
    if (checked.ok)
      return { draft: checked.draft, usage, firstTry: attempt === 1 }
    // Retry only when it was the questions that came up short
    if (checked.valid >= 4) break
  }
  throw new DraftCallError("LESSON_DRAFT_INCOMPLETE", usage)
}
