/**
 * Types for the report-an-issue credibility pipeline.
 *
 * Shared across hogwarts, mkan, kun. Each repo writes a thin adapter that
 * satisfies the {@link ReportAdapter} contract — auth, rate-limit, history.
 */

export type ReportCategory =
  | "visual"
  | "broken"
  | "data"
  | "slow"
  | "confusing"
  | "auth"
  | "i18n"
  | "other";

export type Severity = "low" | "medium" | "high" | "critical";

export type Language = "ar" | "en" | "mixed" | "other";

export type Classification =
  | "bug"
  | "feature"
  | "question"
  | "spam"
  | "destructive"
  | "duplicate";

export type Bucket =
  | "silent-reject"
  | "low-confidence"
  | "needs-human"
  | "verified-report";

/**
 * Raw input from the client dialog. Validated by {@link reportSchema}.
 */
export interface ReportInput {
  description: string;
  pageUrl: string;
  category: ReportCategory;
  reproSteps?: string;
  expected?: string;
  actual?: string;
  severityHint?: Severity;
  viewport?: string; // "WxH"
  direction?: "ltr" | "rtl";
  browser?: string;
  hasScreenshot: boolean;
  captchaToken?: string;
}

/**
 * Resolved reporter, supplied by the adapter from session + Prisma (or anonymous).
 */
export type ReporterContext =
  | {
      kind: "anonymous";
      ipHash: string; // sha256(ip + tenant-salt), 16 hex chars
    }
  | {
      kind: "authenticated";
      userId: string;
      role: string;
      emailVerified: boolean;
      accountAgeDays: number;
      isSuspended: boolean;
      ipHash: string;
      priorAccepted?: number;
      priorRejected?: number;
    };

/**
 * Result of the AI triage call. Shape mirrors the classify_report tool schema.
 */
export interface AITriageResult {
  classification: Classification;
  severity: Severity;
  qualityScore: number; // 0..100
  clarity: number; // 0..100
  hasRepro: boolean;
  hasExpected: boolean;
  destructiveSignals: string[];
  language: Language;
  rationale: string;
}

export type DuplicateMatch =
  | { found: false }
  | { found: true; issueNumber: number; similarity: number; existingScore?: number };

export interface ScoringBreakdown {
  R: number; // reputation 0..30
  Q: number; // content quality 0..25
  C: number; // context 0..10
  A: number; // AI triage 0..35
  P: number; // pattern / corroboration -10..+10
}

export interface ScoringResult {
  score: number; // 0..100, clamped
  breakdown: ScoringBreakdown;
  bucket: Bucket;
  labels: string[]; // labels to apply to the GitHub issue (or empty for silent-reject)
}

export type RejectReasonCode =
  | "HF1_too_short"
  | "HF2_too_long"
  | "HF3_no_captcha"
  | "HF4_suspended"
  | "HF5_host_mismatch"
  | "HF6_few_tokens"
  | "HF7_gibberish"
  | "HF8_rate_limited"
  | "HF9_self_duplicate"
  | "HF10_banned";

export interface RejectReason {
  code: RejectReasonCode;
  detail: string;
}

/**
 * Final result returned by the pipeline. UI always shows the same success toast
 * to deny feedback to spammers (see plan §10 "symmetric success").
 */
export type PipelineResult =
  | {
      ok: true;
      bucket: Bucket;
      issueNumber?: number; // only present when an issue was created
      score?: number;
    }
  | {
      ok: false;
      error: "rate_limited" | "internal" | "config";
    };

/**
 * Event emitted by the pipeline for observability / future DB persistence.
 */
export interface PipelineEvent {
  at: string; // ISO timestamp
  repo: string;
  outcome: Bucket | "silent-reject" | "duplicate-corroborated";
  rejectReason?: RejectReasonCode;
  score?: number;
  classification?: Classification;
  issueNumber?: number;
  reporterKind: "anonymous" | "authenticated";
  reporterRole?: string;
  ipHash: string;
  host: string;
  path: string;
}
