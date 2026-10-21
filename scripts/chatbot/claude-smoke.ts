// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Proves the prompt cache works: the same desk question twice. Run 1 writes
 * the help center to the cache (cache_creation ≈ the block's size); run 2,
 * within five minutes, reads it (cache_read ≈ the same, creation ≈ 0, new
 * input under 3K). Also prints each block's size in tokens.
 *
 *   npx tsx -r dotenv/config -r ./scripts/_server-only-shim.cjs \
 *     scripts/chatbot/claude-smoke.ts [--lang ar|en] [--runs 2]
 *
 * Needs CHATBOT_ANTHROPIC_API_KEY. Costs well under a cent.
 */
import Anthropic from "@anthropic-ai/sdk"

import { CLAUDE_MODEL, claudeClient } from "@/components/chatbot/claude/client"
import { costUsd } from "@/components/chatbot/claude/pricing"
import {
  contextBlock,
  helpCenter,
  modeBlock,
} from "@/components/chatbot/claude/prompt"
import { claudeAnswer } from "@/components/chatbot/claude/request"

const arg = (name: string) => {
  const i = process.argv.indexOf(`--${name}`)
  return i === -1 ? undefined : process.argv[i + 1]
}
const lang = (arg("lang") as "ar" | "en" | undefined) ?? "ar"
const runs = Number(arg("runs") ?? 2)
const question = lang === "ar" ? "كيف أسجل حضور فصلي؟" : "How do I take attendance for my class?"

async function main() {
  const client = claudeClient()
  if (!client) {
    console.error("CHATBOT_ANTHROPIC_API_KEY is not set")
    process.exit(2)
  }
  const system: [string, string, string] = [
    helpCenter(lang),
    modeBlock("schoolSupport", lang),
    contextBlock({ now: new Date(), lang, role: "teacher", guess: "attendance" }),
  ]
  for (const [i, block] of system.entries()) {
    const counted = await client.messages.countTokens({
      model: CLAUDE_MODEL,
      system: block,
      messages: [{ role: "user", content: "." }],
    } as Anthropic.MessageCountTokensParams)
    console.log(`block ${i + 1}: ${counted.input_tokens} tokens`)
  }
  for (let r = 1; r <= runs; r++) {
    let text = ""
    let guide = "—"
    for await (const item of claudeAnswer({
      system,
      messages: [{ role: "user", content: question }],
      userKey: "smoke",
      signal: new AbortController().signal,
      onDone: (run) =>
        console.log(
          `run ${r}: input ${run.input}, cache_creation ${run.write}, cache_read ${run.read}, output ${run.output}, first token ${run.firstTokenMs}ms, $${costUsd(run).toFixed(5)}`
        ),
    })) {
      if (item.type === "guide") guide = item.slug
      else if (item.type === "text") text += item.text
    }
    console.log(`  guide ${guide}: ${text.slice(0, 80).replace(/\n/g, " ")}…`)
  }
}

void main()
