// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * GitHub label taxonomy. Source of truth.
 *
 * The bootstrap script /Users/abdout/codebase/scripts/bootstrap-report-labels.sh
 * creates these in every product repo. The pipeline's github.ts::ensureLabels
 * also creates them lazily on first 422 from issue creation.
 */

export interface LabelSpec {
  name: string
  color: string // hex without leading #
  description: string
}

export const REPORT_LABELS = {
  /** Base label — every dialog-created issue carries this. Hook + agent query on it. */
  report: {
    name: "report",
    color: "d93f0b",
    description: "User-reported issue via Report an Issue dialog",
  },
  /** Score >= 75 AND classification = bug. Auto-fix candidates. */
  verified: {
    name: "verified-report",
    color: "0e8a16",
    description: "Pre-validated bug, eligible for auto-fix",
  },
  /** Score 30..54. Created but agent skips. 14d auto-close unless human overrides. */
  lowConfidence: {
    name: "low-confidence",
    color: "fbca04",
    description: "Borderline report, not auto-processed",
  },
  /** Score 55..74 OR classification ∈ {feature, destructive}. Human review required. */
  needsHuman: {
    name: "needs-human",
    color: "b60205",
    description: "Requires human triage before auto-fix",
  },
  /** Existing issue reached 3 +1 confirmations from independent reporters. */
  corroborated: {
    name: "corroborated",
    color: "5319e7",
    description: "Multiple independent reports on same page",
  },
  severityCritical: {
    name: "severity/critical",
    color: "b60205",
    description: "Data loss, security, total outage",
  },
  severityHigh: {
    name: "severity/high",
    color: "d93f0b",
    description: "Core feature broken for many users",
  },
  severityMedium: {
    name: "severity/medium",
    color: "fbca04",
    description: "Noticeable bug, workaround exists",
  },
  severityLow: {
    name: "severity/low",
    color: "c2e0c6",
    description: "Cosmetic, edge case",
  },
  langAr: {
    name: "lang/ar",
    color: "1d76db",
    description: "Report written in Arabic",
  },
  langEn: {
    name: "lang/en",
    color: "0052cc",
    description: "Report written in English",
  },
} as const satisfies Record<string, LabelSpec>

export const ALL_REPORT_LABELS: readonly LabelSpec[] =
  Object.values(REPORT_LABELS)

export function severityLabel(
  sev: "critical" | "high" | "medium" | "low"
): string {
  switch (sev) {
    case "critical":
      return REPORT_LABELS.severityCritical.name
    case "high":
      return REPORT_LABELS.severityHigh.name
    case "medium":
      return REPORT_LABELS.severityMedium.name
    case "low":
      return REPORT_LABELS.severityLow.name
  }
}

export function languageLabel(
  lang: "ar" | "en" | "mixed" | "other"
): string | null {
  if (lang === "ar") return REPORT_LABELS.langAr.name
  if (lang === "en") return REPORT_LABELS.langEn.name
  return null
}
