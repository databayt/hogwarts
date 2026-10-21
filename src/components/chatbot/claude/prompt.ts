// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import "server-only"

import { SUPPORT_TOPICS } from "../support"
import { DESK_RULES, HELP_CENTER_HEAD, PROTOCOL } from "./prompt-text"

type Lang = "ar" | "en"

/**
 * The Claude lane's system prompt, in three blocks ordered for the cache:
 *
 * 1. the whole help center — the same bytes for every bot, school and
 *    member, so one cached copy per language serves everyone;
 * 2. the mode's rules and data (sales pricing, a school's public facts, the
 *    desk's rules) — cached per mode and school;
 * 3. the volatile context (date, role, school, the matcher's guess) — never
 *    cached, a few hundred tokens re-read each turn.
 *
 * Blocks 1 and 2 must be byte-stable: no dates, no ids, a fixed guide order.
 * A test builds them twice and compares.
 */

const escape = (s: string) => s.replace(/[<>]/g, "")

const helpCenterCache = new Map<Lang, string>()

/** Every guide's answer, in the index's fixed order. */
export function helpCenter(lang: Lang): string {
  const hit = helpCenterCache.get(lang)
  if (hit) return hit
  const guides = SUPPORT_TOPICS.map(
    (t) =>
      `<guide slug="${t.slug}" title="${escape(t.title[lang])}" for="${(t.roles ?? []).join(",")}">\n${t.answer[lang]}\n</guide>`
  ).join("\n\n")
  const block = `${HELP_CENTER_HEAD[lang]}\n\n${guides}`
  helpCenterCache.set(lang, block)
  return block
}

/** The slugs a guide tag may name. */
export const GUIDE_SLUGS: ReadonlySet<string> = new Set(
  SUPPORT_TOPICS.map((t) => t.slug)
)

/**
 * Block 2. `modeText` is the mode's existing rules + data (the sales prompt
 * with live pricing, or the school site's fenced data); the desk has its own
 * rules here. The answer protocol closes every mode.
 */
export function modeBlock(
  mode: "saasMarketing" | "schoolSite" | "schoolSupport",
  lang: Lang,
  modeText = ""
): string {
  const rules = mode === "schoolSupport" ? DESK_RULES[lang] : modeText
  return `${rules}\n\n${PROTOCOL[lang]}`
}

/** Block 3 — what changes every turn. Never cached. */
export function contextBlock(ctx: {
  now: Date
  lang: Lang
  role?: string
  school?: string
  /** The keyword matcher's best guide — a hint, not a rule. */
  guess?: string
  /** The guide about the page they are on — "how do I do this here?". */
  page?: string
  /** The sales bot's contact-ask state, worded by `askState`. */
  extra?: string
}): string {
  const day = ctx.now.toLocaleDateString(
    ctx.lang === "ar" ? "ar-u-nu-latn" : "en",
    {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: "UTC",
    }
  )
  const lines = [
    `today: ${day}`,
    ctx.role && `role: ${escape(ctx.role)}`,
    ctx.school && `school: ${escape(ctx.school)}`,
    ctx.guess && `likely guide (a hint): ${ctx.guess}`,
    ctx.page && `they are on the page of the guide: ${ctx.page}`,
  ].filter(Boolean)
  return `<context>\n${lines.join("\n")}\n</context>${ctx.extra ?? ""}`
}
