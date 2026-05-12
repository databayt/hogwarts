"use server";

/**
 * Report-issue server action — thin wrapper around the shared pipeline.
 *
 * All quality gating (Zod, hard filters, captcha, dedup, AI triage, scoring)
 * lives in {@link runReportPipeline}. The client receives a symmetric success
 * shape so spammers can't probe the filter.
 */

import { headers } from "next/headers";

import { runReportPipeline } from "@/lib/report";
import { hogwartsReportAdapter } from "@/lib/report/adapter";

import type {
  ReportIssueSubmitInput,
  ReportIssueSubmitResult,
} from "@/components/report-issue/dialog";

export async function reportIssue(
  data: ReportIssueSubmitInput
): Promise<ReportIssueSubmitResult> {
  const h = await headers();
  const ip =
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip") ||
    h.get("cf-connecting-ip") ||
    "0.0.0.0";

  const result = await runReportPipeline(
    {
      description: data.description,
      pageUrl: data.pageUrl,
      category: data.category,
      reproSteps: data.reproSteps,
      expected: data.expected,
      actual: data.actual,
      severityHint: data.severityHint,
      viewport: data.viewport,
      direction: data.direction,
      browser: data.browser,
      hasScreenshot: data.hasScreenshot,
      captchaToken: data.captchaToken,
    },
    hogwartsReportAdapter,
    { ip }
  );

  if (result.ok && result.bucket === "verified-report" && result.issueNumber) {
    return { ok: true, issueNumber: result.issueNumber };
  }
  if (result.ok) {
    return { ok: true };
  }
  return { ok: false };
}
