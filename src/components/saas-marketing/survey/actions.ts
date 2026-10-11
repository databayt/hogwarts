// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

"use server"

import { headers } from "next/headers"

import { db } from "@/lib/db"
import { checkUserRateLimit, RATE_LIMITS } from "@/lib/rate-limit"
import { isTurnstileConfigured, verifyTurnstile } from "@/lib/report/turnstile"

import { notifySales, upsertInboundProspect } from "../inbound"
import {
  isAnswered,
  otherKey,
  STUDENT_BAND_ESTIMATE,
  SURVEY_ID,
  visibleQuestions,
  type Answers,
} from "./config"

export interface SubmitSurveyInput {
  answers: Answers
  locale: string
  /** Honeypot — a hidden field people never fill. */
  website?: string
  captchaToken?: string
}

export type SubmitSurveyResult =
  | { ok: true }
  | { ok: false; error: "invalid" | "rateLimited" | "captcha" | "generic" }

const MAX_TEXT = 1000

async function clientIp() {
  const h = await headers()
  const fwd = h.get("x-forwarded-for")
  if (fwd) return fwd.split(",")[0]!.trim()
  return h.get("x-real-ip") || "0.0.0.0"
}

/** Keep only the visible questions' answers (+ their "أخرى" text), trimmed. */
function clean(answers: Answers): Answers | null {
  const out: Answers = {}
  for (const q of visibleQuestions(answers)) {
    if (!isAnswered(q, answers)) return null
    const value = answers[q.id]
    if (value === undefined || value === "") continue
    out[q.id] =
      typeof value === "string" ? value.trim().slice(0, MAX_TEXT) : value
    const other = answers[otherKey(q.id)]
    const picked = Array.isArray(value) ? value : [value]
    if (q.other && picked.includes(q.other) && typeof other === "string") {
      out[otherKey(q.id)] = other.trim().slice(0, MAX_TEXT)
    }
  }
  return out
}

export async function submitSurvey(
  input: SubmitSurveyInput
): Promise<SubmitSurveyResult> {
  // A bot filled the hidden field: pretend it worked, store nothing.
  if (input.website) return { ok: true }

  const ip = await clientIp()
  const limit = await checkUserRateLimit(ip, RATE_LIMITS.PUBLIC, "survey")
  if (!limit.allowed) return { ok: false, error: "rateLimited" }

  if (
    isTurnstileConfigured() &&
    !(await verifyTurnstile(input.captchaToken, ip))
  ) {
    return { ok: false, error: "captcha" }
  }

  const answers = clean(input.answers ?? {})
  if (!answers) return { ok: false, error: "invalid" }
  const locale = input.locale === "en" ? "en" : "ar"
  const email =
    typeof answers.email === "string" ? answers.email.toLowerCase() : undefined

  try {
    let prospectId: string | undefined
    if (email) {
      const tags = [
        "survey",
        answers.institution,
        answers.role,
        answers.students,
      ].filter((t): t is string => typeof t === "string")
      const prospect = await upsertInboundProspect({
        email,
        source: "survey",
        tags,
        studentCountEstimate:
          STUDENT_BAND_ESTIMATE[answers.students as string] ?? undefined,
        notes: [
          answers.currentSystem && `Current system: ${answers.currentSystem}`,
          answers.wish && `Wish: ${answers.wish}`,
          answers.change && `Change in 12 months: ${answers.change}`,
        ]
          .filter(Boolean)
          .join("\n"),
      })
      prospectId = prospect.id
    }

    await db.surveyResponse.create({
      data: { survey: SURVEY_ID, locale, answers, email, prospectId },
    })

    if (email) {
      await notifySales(`Survey: ${email}`, { survey: SURVEY_ID, ...answers })
    }
    return { ok: true }
  } catch (err) {
    console.error("[survey] submit failed", err)
    return { ok: false, error: "generic" }
  }
}
