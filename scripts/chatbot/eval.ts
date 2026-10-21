// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * The gate before the Claude lane goes on: 40 real questions (ar + en, three
 * bots, Sudanese and Saudi phrasing, two with no guide) through the real
 * request path, scored on the guide the answer names and the language it
 * answers in — against the keyword matcher it replaces.
 *
 *   npx tsx -r dotenv/config -r ./scripts/_server-only-shim.cjs \
 *     scripts/chatbot/eval.ts [--effort low|medium] [--limit N]
 *
 * Needs CHATBOT_ANTHROPIC_API_KEY. Costs about $0.10 a run. Pass: guide
 * accuracy ≥ 90 %, language match 100 %.
 */
import { claudeAnswer } from "@/components/chatbot/claude/request"
import {
  contextBlock,
  helpCenter,
  modeBlock,
} from "@/components/chatbot/claude/prompt"
import { costUsd } from "@/components/chatbot/claude/pricing"
import { buildSaasMarketingPrompt } from "@/components/chatbot/prompts"
import { matchTopics } from "@/components/chatbot/support"
import type { ChatbotDictionary, SupportRole } from "@/components/chatbot/type"
import ar from "@/components/internationalization/ar.json"
import en from "@/components/internationalization/en.json"
import { FALLBACK_RATES } from "@/components/saas-marketing/pricing/rates"

import set from "./eval-set.json"

type Case = {
  id: string
  mode: "saasMarketing" | "schoolSupport"
  lang: "ar" | "en"
  role?: SupportRole
  question: string
  guide: string | null
}

const arg = (name: string) => {
  const i = process.argv.indexOf(`--${name}`)
  return i === -1 ? undefined : process.argv[i + 1]
}
const effort = (arg("effort") as "low" | "medium" | undefined) ?? "low"
const limit = Number(arg("limit") ?? set.length)
const dict = { ar: ar.chatbot, en: en.chatbot } as unknown as Record<
  "ar" | "en",
  ChatbotDictionary
>

/** Mostly Arabic letters, or mostly Latin ones. */
const langOf = (text: string) => {
  const arabic = (text.match(/[؀-ۿ]/g) ?? []).length
  const latin = (text.match(/[A-Za-z]/g) ?? []).length
  return arabic >= latin ? "ar" : "en"
}

async function main() {
  if (!process.env.CHATBOT_ANTHROPIC_API_KEY) {
    console.error("CHATBOT_ANTHROPIC_API_KEY is not set")
    process.exit(2)
  }
  let guideHits = 0
  let langHits = 0
  let matcherHits = 0
  let spent = 0
  const misses: string[] = []

  for (const c of (set as Case[]).slice(0, limit)) {
    const mode =
      c.mode === "schoolSupport"
        ? modeBlock("schoolSupport", c.lang)
        : modeBlock(
            "saasMarketing",
            c.lang,
            buildSaasMarketingPrompt(c.lang, dict[c.lang], FALLBACK_RATES)
          )
    const guess = matchTopics([c.question], 3, c.role, {
      excludeSales: c.mode === "schoolSupport",
    })[0]?.slug
    let named: string | null = null
    let text = ""
    let cost = 0
    let first: number | null = null
    for await (const item of claudeAnswer({
      system: [
        helpCenter(c.lang),
        mode,
        contextBlock({
          now: new Date(),
          lang: c.lang,
          role: c.role,
          guess,
        }),
      ],
      messages: [{ role: "user", content: c.question }],
      userKey: "eval",
      signal: new AbortController().signal,
      effort,
      onDone: (run) => {
        cost = costUsd(run)
        first = run.firstTokenMs
      },
    })) {
      if (item.type === "guide") named = item.slug
      else if (item.type === "text") text += item.text
    }
    spent += cost
    const guideOk = named === c.guide
    const langOk = langOf(text) === c.lang
    guideHits += guideOk ? 1 : 0
    langHits += langOk ? 1 : 0
    matcherHits += (guess ?? null) === c.guide ? 1 : 0
    if (!guideOk || !langOk)
      misses.push(
        `${c.id}: guide ${named ?? "—"} (want ${c.guide ?? "—"}), lang ${langOf(text)}`
      )
    console.log(
      `${guideOk ? "✓" : "✗"}${langOk ? "" : " lang"} ${c.id}  ${named ?? "—"}  ${first ?? "?"}ms  $${cost.toFixed(5)}`
    )
  }

  const n = Math.min(limit, set.length)
  const pct = (x: number) => `${Math.round((100 * x) / n)}%`
  console.log(`\neffort ${effort}, ${n} questions, $${spent.toFixed(4)}`)
  console.log(`guide accuracy  ${pct(guideHits)}  (keyword matcher ${pct(matcherHits)})`)
  console.log(`language match  ${pct(langHits)}`)
  if (misses.length) console.log(`\nmisses:\n  ${misses.join("\n  ")}`)
  const pass = guideHits / n >= 0.9 && langHits === n
  console.log(pass ? "\nPASS — the lane may go on" : "\nFAIL — keep it off")
  process.exit(pass ? 0 : 1)
}

void main()
