/**
 * Pure scoring function — no I/O, deterministic, fully unit-testable.
 *
 * Composition (plan §1):
 *   score = clamp(R + Q + C + A + P, 0, 100)
 *
 *   R 0..30  Reputation     role base + account-age + prior history
 *   Q 0..25  Content        length + structure + category + URL + screenshot
 *   C 0..10  Context        viewport + dir/lang + UA + prod host
 *   A 0..35  AI triage      quality*0.2 + clarity*0.1 + hasRepro*3 + hasExpected*2
 *   P -10..+10 Pattern       corroboration bonus / coordinated-noise penalty
 *
 * Buckets (strict thresholds, locked in plan §0):
 *   <30   silent-reject       no GitHub issue
 *   30-54 low-confidence      issue + label, agent skips, 14d auto-close
 *   55-74 needs-human         issue + label, human review
 *   ≥75   verified-report     issue + label, auto-fix
 *
 * Overrides:
 *   classification = destructive  → force needs-human + destructive label
 *   classification = feature      → force at least needs-human
 *   classification = question     → force at most low-confidence
 *   classification = spam         → total × 0.2 (usually silent-rejects)
 *   classification = duplicate    → handled in pipeline before score
 *   severityHint = critical && score ≥ 60 → force verified
 *   AI failure → caller passes triage=null → A and P dropped → cap at needs-human
 */

import {
  REPORT_LABELS,
  languageLabel,
  severityLabel,
} from "./labels";
import type { ReportInputParsed } from "./schema";
import type {
  AITriageResult,
  Bucket,
  ReporterContext,
  ScoringBreakdown,
  ScoringResult,
} from "./types";

export const THRESHOLDS = {
  verified: 75,
  needsHuman: 55,
  lowConfidence: 30,
} as const;

const ROLE_BASE: Record<string, number> = {
  DEVELOPER: 22,
  ADMIN: 22,
  TEACHER: 16,
  STAFF: 16,
  ACCOUNTANT: 16,
  HOST: 14, // mkan host
  GUEST: 10, // mkan guest
  STUDENT: 10,
  GUARDIAN: 10,
  USER: 8,
};

export interface ScoreContext {
  reporter: ReporterContext;
  triage: AITriageResult | null; // null when AI call failed
  corroborationCount: number; // distinct reporters on same URL within 7d
  ipDailyNoise: number; // # of spam/feature/question reports from this IP in 24h
  hostIsProd: boolean;
}

/**
 * Pure scorer. Returns score + breakdown + bucket + labels to apply.
 */
export function computeScore(
  input: ReportInputParsed,
  ctx: ScoreContext
): ScoringResult {
  const R = reputationScore(ctx.reporter);
  const Q = contentQualityScore(input, ctx.hostIsProd);
  const C = contextScore(input, ctx.hostIsProd);
  const A = ctx.triage ? aiScore(ctx.triage) : 0;
  const P = ctx.triage ? patternScore(ctx) : 0;

  // Spam classification gets heavily discounted before bucketing.
  let total = R + Q + C + A + P;
  if (ctx.triage?.classification === "spam") {
    total = total * 0.2;
  }
  total = Math.max(0, Math.min(100, Math.round(total)));

  const breakdown: ScoringBreakdown = { R, Q, C, A, P };
  let bucket = bucketFor(total);

  // Triage-driven overrides
  if (ctx.triage?.classification === "destructive") {
    bucket = "needs-human";
  } else if (ctx.triage?.classification === "feature") {
    if (bucket === "verified-report") bucket = "needs-human";
    if (bucket === "silent-reject") bucket = "low-confidence";
  } else if (ctx.triage?.classification === "question") {
    if (bucket === "verified-report" || bucket === "needs-human") {
      bucket = "low-confidence";
    }
  }

  // AI failure cap
  if (ctx.triage === null && bucket === "verified-report") {
    bucket = "needs-human";
  }

  // Severity escalation
  if (
    input.severityHint === "critical" &&
    total >= 60 &&
    ctx.triage?.classification !== "destructive" &&
    ctx.triage?.classification !== "feature" &&
    ctx.triage?.classification !== "spam"
  ) {
    bucket = "verified-report";
  }

  return {
    score: total,
    breakdown,
    bucket,
    labels: labelsFor(bucket, ctx.triage),
  };
}

function reputationScore(reporter: ReporterContext): number {
  if (reporter.kind === "anonymous") {
    return 4; // base, only present if captcha already validated
  }

  const base = ROLE_BASE[reporter.role.toUpperCase()] ?? ROLE_BASE.USER ?? 8;

  let bonus = 0;
  if (reporter.accountAgeDays >= 90) bonus += 3;
  else if (reporter.accountAgeDays >= 14) bonus += 1;

  if (!reporter.emailVerified) bonus -= 2;

  if ((reporter.priorAccepted ?? 0) >= 3 && (reporter.priorRejected ?? 0) === 0) {
    bonus += 5;
  } else if ((reporter.priorRejected ?? 0) >= 3 && (reporter.priorAccepted ?? 0) <= 1) {
    bonus -= 10; // shadow-ban the noisemaker
  }

  return clamp(base + bonus, 0, 30);
}

function contentQualityScore(input: ReportInputParsed, hostIsProd: boolean): number {
  // length: reward up to ~110 chars (every 10 chars past 30 = 1 point, capped 8)
  const len = input.description.trim().length;
  const lenScore = clamp(Math.floor((len - 30) / 10), 0, 8);

  let structureScore = 0;
  if (input.reproSteps?.trim()) structureScore += 2;
  if (input.expected?.trim()) structureScore += 2;
  if (input.actual?.trim()) structureScore += 2;

  const categoryScore = input.category === "other" ? 0 : 3;
  const urlScore = hostIsProd ? 5 : 2; // give partial credit to localhost
  const screenshotScore = input.hasScreenshot ? 3 : 0;

  return clamp(
    lenScore + structureScore + categoryScore + urlScore + screenshotScore,
    0,
    25
  );
}

function contextScore(input: ReportInputParsed, hostIsProd: boolean): number {
  let score = 0;

  if (input.viewport && /^\d{2,5}x\d{2,5}$/.test(input.viewport)) {
    const [wStr, hStr] = input.viewport.split("x");
    const w = Number(wStr);
    const h = Number(hStr);
    if (Number.isFinite(w) && Number.isFinite(h) && w >= 320 && w <= 7680 && h >= 240 && h <= 4320) {
      score += 3;
    }
  }

  if (input.direction) {
    const isArabic = /\p{Script=Arabic}/u.test(input.description);
    if (
      (isArabic && input.direction === "rtl") ||
      (!isArabic && input.direction === "ltr")
    ) {
      score += 2;
    }
  }

  if (input.browser && isPlausibleBrowser(input.browser)) score += 2;
  if (hostIsProd) score += 3;

  return clamp(score, 0, 10);
}

function aiScore(triage: AITriageResult): number {
  const raw =
    triage.qualityScore * 0.2 +
    triage.clarity * 0.1 +
    (triage.hasRepro ? 3 : 0) +
    (triage.hasExpected ? 2 : 0);
  return clamp(Math.round(raw), 0, 35);
}

function patternScore(ctx: ScoreContext): number {
  let p = 0;
  // Corroboration bonus — only for bug classification, and only if other
  // distinct reporters have hit the same page recently.
  if (ctx.triage?.classification === "bug" && ctx.corroborationCount >= 2) {
    p += 10;
  }
  // Coordinated-noise penalty — IP is producing spam/feature/question repeatedly.
  if (ctx.ipDailyNoise >= 5) {
    p -= 10;
  }
  return clamp(p, -10, 10);
}

export function bucketFor(score: number): Bucket {
  if (score >= THRESHOLDS.verified) return "verified-report";
  if (score >= THRESHOLDS.needsHuman) return "needs-human";
  if (score >= THRESHOLDS.lowConfidence) return "low-confidence";
  return "silent-reject";
}

function labelsFor(bucket: Bucket, triage: AITriageResult | null): string[] {
  if (bucket === "silent-reject") return [];

  const labels: string[] = [REPORT_LABELS.report.name];
  if (bucket === "verified-report") labels.push(REPORT_LABELS.verified.name);
  else if (bucket === "needs-human") labels.push(REPORT_LABELS.needsHuman.name);
  else if (bucket === "low-confidence") labels.push(REPORT_LABELS.lowConfidence.name);

  if (triage) {
    labels.push(severityLabel(triage.severity));
    const lang = languageLabel(triage.language);
    if (lang) labels.push(lang);
  }

  return labels;
}

function isPlausibleBrowser(ua: string): boolean {
  // Major engine markers + non-empty version number. Bot UAs often lack version
  // or use "curl/X". Real browsers have at least one of these tokens with a digit.
  return /(Chrome|Firefox|Safari|Edge|OPR|Opera|Vivaldi)\/\d+/.test(ua);
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}
