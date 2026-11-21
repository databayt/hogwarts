// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * The gate before the lesson-draft lane goes on: 8 invented Arabic lesson
 * excerpts (grammar, reading, maths, science, Islamic studies, history,
 * geography, ICT) through the real request path, each answer re-checked here
 * independently of the validator that shipped it.
 *
 *   npx tsx -r dotenv/config -r ./scripts/_server-only-shim.cjs \
 *     scripts/lesson-draft/eval.ts [--limit N]
 *
 * Needs CHATBOT_ANTHROPIC_API_KEY. About $0.02 a run. NOT run by CI.
 * Pass: 100 % structural, >= 90 % grounded (every correct option shares a
 * token of >= 4 characters with the excerpt).
 */
import { requestDraft } from "@/components/lesson-draft/claude"
import { systemPrompt, userPrompt } from "@/components/lesson-draft/prompt"
import {
  arabicRatio,
  normalizeText,
} from "@/components/lesson-draft/validate"

import set from "./eval-set.json"

type Sample = {
  id: string
  subject: string
  grade: string
  chapter: string
  lesson: string
  text: string
}

const arg = (name: string) => {
  const i = process.argv.indexOf(`--${name}`)
  return i === -1 ? undefined : process.argv[i + 1]
}
const limit = Number(arg("limit") ?? set.length)

const tokens = (s: string) =>
  normalizeText(s)
    .split(/[^\p{L}\p{N}]+/u)
    .filter((t) => t.length >= 4)

async function main() {
  if (!process.env.CHATBOT_ANTHROPIC_API_KEY) {
    console.error("CHATBOT_ANTHROPIC_API_KEY is not set")
    process.exit(2)
  }
  let structural = 0
  let grounded = 0
  let groundedTotal = 0
  let spent = 0
  const misses: string[] = []
  const samples = (set as Sample[]).slice(0, limit)

  for (const c of samples) {
    const problems: string[] = []
    try {
      const { draft, usage, firstTry } = await requestDraft({
        system: systemPrompt(),
        user: userPrompt({
          lang: "ar",
          gradeLabel: c.grade,
          subjectName: c.subject,
          chapterName: c.chapter,
          lessonName: c.lesson,
          text: c.text,
          topic: null,
          homeworkOnly: false,
        }),
        lang: "ar",
        homeworkOnly: false,
        userKey: "eval",
      })
      spent += usage.costUsd
      if (!firstTry) problems.push("needed a retry")

      const qs = draft.questions
      if (qs.length < 4 || qs.length > 8) problems.push(`${qs.length} questions`)
      const seen = new Set<string>()
      const excerpt = new Set(tokens(c.text))
      for (const q of qs) {
        const want = q.type === "MULTIPLE_CHOICE" ? 4 : 2
        if (q.options.length !== want) problems.push("option count")
        const correct = q.options.filter((o) => o.isCorrect)
        if (correct.length !== 1) problems.push("correct count")
        const norm = q.options.map((o) => normalizeText(o.text))
        if (new Set(norm).size !== norm.length) problems.push("duplicate option")
        if (correct[0] && !norm.includes(normalizeText(correct[0].text)))
          problems.push("correct not among options")
        const key = normalizeText(q.text)
        if (seen.has(key)) problems.push("duplicate question")
        seen.add(key)
        if (arabicRatio(q.text) < 0.7) problems.push("question not Arabic")
        if (arabicRatio(q.options.map((o) => o.text).join(" ")) < 0.7)
          problems.push("options not Arabic")
        // Grounding is its own score, not a structural failure
        groundedTotal++
        if (correct[0] && tokens(correct[0].text).some((t) => excerpt.has(t)))
          grounded++
      }
      const h = draft.homework
      if (h.points < 1 || h.points > 20) problems.push("homework points")
      if (h.dueInDays < 1 || h.dueInDays > 7) problems.push("homework due")
      if (!h.title || !h.instructions) problems.push("homework empty")
    } catch (error) {
      problems.push(error instanceof Error ? error.message : String(error))
    }
    if (problems.length === 0) structural++
    else misses.push(`${c.id}: ${[...new Set(problems)].join(", ")}`)
    console.log(`${problems.length === 0 ? "✓" : "✗"} ${c.id}`)
  }

  const n = samples.length
  const pctS = Math.round((100 * structural) / n)
  const pctG = groundedTotal ? Math.round((100 * grounded) / groundedTotal) : 0
  console.log(`\n${n} samples, $${spent.toFixed(4)} (${(spent / n).toFixed(4)} each)`)
  console.log(`structural  ${pctS}%  (target 100%)`)
  console.log(`grounded    ${pctG}%  (target >= 90%)`)
  if (misses.length) console.log(`\nmisses:\n  ${misses.join("\n  ")}`)
  const pass = structural === n && pctG >= 90
  console.log(pass ? "\nPASS — the lane may go on" : "\nFAIL — keep it off")
  process.exit(pass ? 0 : 1)
}

void main()
