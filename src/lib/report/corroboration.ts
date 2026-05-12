/**
 * Wisdom-of-the-crowd: when independent reporters hit the same page bug,
 * upgrade the existing issue to verified-report regardless of the original
 * individual scores.
 *
 * Phase 1 implements this via:
 *   - adapter.getCorroborationCount(host, path, days): how many distinct
 *     reporters have submitted *bug* classifications for this URL recently
 *   - adapter.findExistingForUrl(host, path): the canonical issue number
 *
 * When a new report scores bug + corroborationCount >= 2 (so this is the 3rd),
 * we upgrade the existing issue's labels.
 */

import type { ReportAdapter } from "./adapters/adapter";
import { REPORT_LABELS } from "./labels";
import { addLabels } from "./github";

export interface CorroborationCheck {
  /** Number of distinct reporters who hit this URL in the corroboration window. */
  count: number;
  /** The existing issue to upgrade, if any. */
  existingIssue: number | null;
  /** True if this submission triggers the upgrade. */
  shouldUpgrade: boolean;
}

const WINDOW_DAYS = 7;
const UPGRADE_THRESHOLD = 2; // this report + 2 prior = 3 total

export async function checkCorroboration(
  pageUrl: string,
  adapter: ReportAdapter
): Promise<CorroborationCheck> {
  const url = new URL(pageUrl);
  const host = url.host;
  const path = url.pathname;

  const [count, existingIssue] = await Promise.all([
    adapter.getCorroborationCount(host, path, WINDOW_DAYS),
    adapter.findExistingForUrl(host, path),
  ]);

  return {
    count,
    existingIssue: existingIssue?.issueNumber ?? null,
    shouldUpgrade: count >= UPGRADE_THRESHOLD && existingIssue !== null,
  };
}

/**
 * Add verified-report + corroborated labels to an existing issue.
 */
export async function upgradeExisting(
  issueNumber: number,
  ctx: { repo: string; token: string }
): Promise<void> {
  await addLabels({
    ...ctx,
    issueNumber,
    labels: [REPORT_LABELS.verified.name, REPORT_LABELS.corroborated.name],
  }).catch((err) => {
    console.warn("[corroboration] failed to upgrade existing issue:", err);
  });
}
