// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import "server-only"

import Anthropic from "@anthropic-ai/sdk"

/**
 * The chatbot's Claude client, on its own key. It never reads
 * ANTHROPIC_API_KEY, ANTHROPIC_AUTH_TOKEN or ANTHROPIC_BASE_URL: five dormant
 * callers in this app read the plain key (admission classify, receipts, the
 * document extractor, prospect enrichment, report triage), and setting it
 * would switch all of them on with no cap
 * (D-20261021-included-api-credits-for-hogwarts-chatbot).
 */
let client: Anthropic | null = null

const key = () => process.env.CHATBOT_ANTHROPIC_API_KEY?.trim() || ""

export const CLAUDE_MODEL =
  process.env.CHATBOT_CLAUDE_MODEL?.trim() || "claude-haiku-5-5"

/** On only when switched on AND keyed — it ships dark until the eval passes. */
export function claudeEnabled(): boolean {
  return process.env.CHATBOT_CLAUDE_ENABLED === "1" && Boolean(key())
}

export function claudeClient(): Anthropic | null {
  const apiKey = key()
  if (!apiKey) return null
  client ??= new Anthropic({
    apiKey,
    authToken: null,
    baseURL: "https://api.anthropic.com",
    // The ladder is the retry: a failed call falls to Groq at once.
    maxRetries: 0,
    timeout: 30_000,
  })
  return client
}
