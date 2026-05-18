// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Prospect enrichment via Anthropic Claude.
 *
 * Given a raw Prospect row (name + website + phone + country), returns the
 * best email guess, language, tier, decision-maker role, pitch hook, and
 * student-count estimate. Scoring is computed locally from these inputs.
 *
 * Cost: ~$0.005 per prospect with claude-haiku-4-5 (sync). Use the Batch API
 * variant in `scripts/enrich-prospects.ts` for large jobs.
 */

import Anthropic from "@anthropic-ai/sdk"

const MODEL = process.env.ANTHROPIC_ENRICH_MODEL ?? "claude-haiku-4-5-20251001"

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY ?? "",
})

export type EnrichmentInput = {
  name: string
  country: string
  city: string | null
  website: string | null
  address: string | null
  phone: string | null
  social?: {
    instagram?: string | null
    facebook?: string | null
  }
  gmapsRating?: number | null
}

export type EnrichmentOutput = {
  bestEmailGuess: string | null
  emailConfidence: number // 0-100
  studentCountEstimate: number | null
  primaryLanguage: "ar" | "en" | "fr" | "bilingual"
  tier: "FREE" | "PRO" | "ENTERPRISE"
  tierLikelihood: number // 0-100
  decisionMakerRole: "owner" | "principal" | "adminDirector"
  pitchHook: string
}

const SYSTEM = `You enrich school records for a MENA SaaS sales pipeline.
Return STRICT JSON ONLY -- no prose, no markdown fences, no commentary.
Use the schema described in the user message. If a field cannot be
determined, use null (for strings/numbers) or your best conservative guess.`

const USER_TEMPLATE = (p: EnrichmentInput) => `Given this school record:
${JSON.stringify(p, null, 2)}

Return this JSON object:
{
  "bestEmailGuess": string|null,         // role-pattern guess from domain (info@, admissions@, principal@); null if no website
  "emailConfidence": 0-100,              // higher if domain + role-pattern is conventional
  "studentCountEstimate": number|null,   // from public info or rule-of-thumb (15-20 students/grade × grades)
  "primaryLanguage": "ar"|"en"|"fr"|"bilingual",
  "tier": "FREE"|"PRO"|"ENTERPRISE",     // <100 students → FREE; 100-500 → PRO; 500+ → ENTERPRISE
  "tierLikelihood": 0-100,               // private + good rating + English/bilingual medium → higher
  "decisionMakerRole": "owner"|"principal"|"adminDirector",
  "pitchHook": string                    // 1 sentence, school-specific opener for cold email
}`

export async function enrichProspect(
  input: EnrichmentInput
): Promise<EnrichmentOutput> {
  const resp = await client.messages.create({
    model: MODEL,
    max_tokens: 600,
    system: SYSTEM,
    messages: [{ role: "user", content: USER_TEMPLATE(input) }],
  })

  const text = resp.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("")

  // Be defensive: strip ```json fences if the model added them anyway.
  const cleaned = text
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/i, "")
    .trim()

  const parsed = JSON.parse(cleaned) as EnrichmentOutput
  return normalizeEnrichment(parsed)
}

function normalizeEnrichment(raw: EnrichmentOutput): EnrichmentOutput {
  const lang =
    raw.primaryLanguage === "ar" ||
    raw.primaryLanguage === "en" ||
    raw.primaryLanguage === "fr" ||
    raw.primaryLanguage === "bilingual"
      ? raw.primaryLanguage
      : "ar"
  const tier =
    raw.tier === "FREE" || raw.tier === "PRO" || raw.tier === "ENTERPRISE"
      ? raw.tier
      : "FREE"
  const role =
    raw.decisionMakerRole === "owner" ||
    raw.decisionMakerRole === "principal" ||
    raw.decisionMakerRole === "adminDirector"
      ? raw.decisionMakerRole
      : "principal"
  const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)))
  return {
    bestEmailGuess: raw.bestEmailGuess?.trim() || null,
    emailConfidence: clamp(raw.emailConfidence ?? 0),
    studentCountEstimate: raw.studentCountEstimate ?? null,
    primaryLanguage: lang,
    tier,
    tierLikelihood: clamp(raw.tierLikelihood ?? 0),
    decisionMakerRole: role,
    pitchHook: raw.pitchHook?.trim() || "",
  }
}

/**
 * Deterministic enrichment-score formula matching the sales plan (Section A6).
 * Inputs come partly from enrichProspect output, partly from the raw row.
 */
export function computeEnrichmentScore(args: {
  studentCount: number | null
  language: "ar" | "en" | "fr" | "bilingual"
  reachability: "email" | "phone" | "social"
  country: string // ISO-2
  tierLikelihood: number // 0-100
}): number {
  const sizeFactor =
    args.studentCount == null
      ? 0.3
      : args.studentCount < 100
        ? 0
        : args.studentCount < 300
          ? 0.5
          : args.studentCount < 800
            ? 1.0
            : 0.8

  const languageFactor =
    args.language === "ar" || args.language === "bilingual"
      ? 1.0
      : args.language === "en"
        ? 0.8
        : 0.6

  const reachability =
    args.reachability === "email"
      ? 1.0
      : args.reachability === "phone"
        ? 0.6
        : 0.3

  const geo: Record<string, number> = {
    SD: 1.0,
    SA: 0.9,
    AE: 0.7,
    EG: 0.7,
    JO: 0.7,
    MA: 0.5,
  }
  const geographyFactor = geo[args.country] ?? 0.5

  const tierLikelihood = args.tierLikelihood / 100

  const score =
    35 * sizeFactor +
    25 * languageFactor +
    20 * reachability +
    10 * geographyFactor +
    10 * tierLikelihood

  return Math.round(score)
}
