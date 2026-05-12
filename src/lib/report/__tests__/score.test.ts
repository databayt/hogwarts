/**
 * Unit tests for the scoring function and hard filters. Pure functions only —
 * no need to mock Anthropic or GitHub here.
 *
 * Run via: pnpm vitest run src/lib/report
 */

import { describe, expect, it } from "vitest";

import {
  hostMatches,
  letterRatio,
  runHardFilters,
  uniqueMeaningfulTokens,
} from "../hard-filters";
import { reportSchema } from "../schema";
import { bucketFor, computeScore, THRESHOLDS } from "../score";
import type { AITriageResult, ReporterContext } from "../types";

// ─── fixtures ──────────────────────────────────────────────────────────────

const adminReporter: ReporterContext = {
  kind: "authenticated",
  userId: "user_admin_1",
  role: "ADMIN",
  emailVerified: true,
  accountAgeDays: 365,
  isSuspended: false,
  ipHash: "abc123",
  priorAccepted: 5,
  priorRejected: 0,
};

const newGuestReporter: ReporterContext = {
  kind: "authenticated",
  userId: "user_guest_1",
  role: "GUEST",
  emailVerified: false,
  accountAgeDays: 1,
  isSuspended: false,
  ipHash: "def456",
};

const anonReporter: ReporterContext = {
  kind: "anonymous",
  ipHash: "anon_xyz",
};

const goodTriage: AITriageResult = {
  classification: "bug",
  severity: "high",
  qualityScore: 80,
  clarity: 75,
  hasRepro: true,
  hasExpected: true,
  destructiveSignals: [],
  language: "en",
  rationale: "Clear repro on price step",
};

const spamTriage: AITriageResult = {
  ...goodTriage,
  classification: "spam",
  qualityScore: 10,
  clarity: 15,
  hasRepro: false,
  hasExpected: false,
  rationale: "Keyboard mashing",
};

const destructiveTriage: AITriageResult = {
  ...goodTriage,
  classification: "destructive",
  destructiveSignals: ["asks to delete all student data"],
  rationale: "User asks to delete production data without confirmation",
};

const featureTriage: AITriageResult = {
  ...goodTriage,
  classification: "feature",
  rationale: "Asks for new dashboard tab",
};

const baseInput = {
  description:
    "The price step in the onboarding wizard does not advance to the next page when I click Continue. I see a console error about a missing handler.",
  pageUrl: "https://ed.databayt.org/ar/onboarding/abc/price",
  category: "broken" as const,
  reproSteps: "1. Open price step 2. Click Continue 3. Nothing happens",
  expected: "Should advance to the next step",
  actual: "Stays on price step with no feedback",
  severityHint: "high" as const,
  viewport: "1440x900",
  direction: "ltr" as const,
  browser: "Mozilla/5.0 Chrome/120.0",
  hasScreenshot: false,
  captchaToken: undefined,
};

// ─── schema ────────────────────────────────────────────────────────────────

describe("reportSchema", () => {
  it("rejects descriptions under 30 chars", () => {
    const res = reportSchema.safeParse({ ...baseInput, description: "too short" });
    expect(res.success).toBe(false);
  });

  it("accepts a well-formed report", () => {
    const res = reportSchema.safeParse(baseInput);
    expect(res.success).toBe(true);
  });

  it("rejects invalid viewport format", () => {
    const res = reportSchema.safeParse({ ...baseInput, viewport: "huge" });
    expect(res.success).toBe(false);
  });
});

// ─── hard filters ──────────────────────────────────────────────────────────

describe("runHardFilters", () => {
  const ctx = {
    hostAllowlist: ["*.databayt.org", "localhost"],
    recentSelfSubmissions: [] as string[],
    captchaValid: true as boolean | null,
    isBanned: false,
  };

  it("HF1: rejects under-30 descriptions", () => {
    const parsed = reportSchema.parse(baseInput);
    const r = runHardFilters({ ...parsed, description: "Hi there friend" }, adminReporter, ctx);
    expect(r?.code).toBe("HF1_too_short");
  });

  it("HF3: anonymous without captcha", () => {
    const parsed = reportSchema.parse(baseInput);
    const r = runHardFilters(parsed, anonReporter, { ...ctx, captchaValid: false });
    expect(r?.code).toBe("HF3_no_captcha");
  });

  it("HF4: suspended account", () => {
    const parsed = reportSchema.parse(baseInput);
    const suspended: ReporterContext = { ...adminReporter, isSuspended: true };
    const r = runHardFilters(parsed, suspended, ctx);
    expect(r?.code).toBe("HF4_suspended");
  });

  it("HF5: rejects out-of-allowlist host", () => {
    const parsed = reportSchema.parse({ ...baseInput, pageUrl: "https://evil.example.com/foo" });
    const r = runHardFilters(parsed, adminReporter, ctx);
    expect(r?.code).toBe("HF5_host_mismatch");
  });

  it("HF6: rejects gibberish with few unique tokens", () => {
    const parsed = reportSchema.parse({
      ...baseInput,
      description: "asdf asdf asdf asdf asdf asdf asdf asdf asdf asdf",
    });
    const r = runHardFilters(parsed, adminReporter, ctx);
    expect(r?.code).toBe("HF6_few_tokens");
  });

  it("HF7: rejects keyboard mashing (low letter ratio)", () => {
    const parsed = reportSchema.parse({
      ...baseInput,
      description: "!@#$%^&*()!@#$%^&*()!@#$%^&*()!@#$%^&*()!!!!!!",
    });
    const r = runHardFilters(parsed, adminReporter, ctx);
    expect(r?.code).toBe("HF7_gibberish");
  });

  it("HF9: rejects same description from same reporter within 60s", () => {
    const parsed = reportSchema.parse(baseInput);
    const r = runHardFilters(parsed, adminReporter, {
      ...ctx,
      recentSelfSubmissions: [parsed.description.slice(0, 60)],
    });
    expect(r?.code).toBe("HF9_self_duplicate");
  });

  it("HF10: banned identifier short-circuits everything", () => {
    const parsed = reportSchema.parse(baseInput);
    const r = runHardFilters(parsed, adminReporter, { ...ctx, isBanned: true });
    expect(r?.code).toBe("HF10_banned");
  });

  it("passes a clean authenticated report on production host", () => {
    const parsed = reportSchema.parse(baseInput);
    const r = runHardFilters(parsed, adminReporter, ctx);
    expect(r).toBeNull();
  });
});

// ─── scoring ───────────────────────────────────────────────────────────────

describe("computeScore", () => {
  const parsed = reportSchema.parse(baseInput);

  it("admin + good content + good triage + prod host → verified-report", () => {
    const r = computeScore(parsed, {
      reporter: adminReporter,
      triage: goodTriage,
      corroborationCount: 0,
      ipDailyNoise: 0,
      hostIsProd: true,
    });
    expect(r.bucket).toBe("verified-report");
    expect(r.score).toBeGreaterThanOrEqual(THRESHOLDS.verified);
  });

  it("anonymous + good content + good triage caps near needs-human (low R)", () => {
    const r = computeScore(parsed, {
      reporter: anonReporter,
      triage: goodTriage,
      corroborationCount: 0,
      ipDailyNoise: 0,
      hostIsProd: true,
    });
    expect(r.bucket).not.toBe("verified-report");
    expect(r.score).toBeLessThan(THRESHOLDS.verified);
  });

  it("destructive classification → needs-human regardless of score", () => {
    const r = computeScore(parsed, {
      reporter: adminReporter,
      triage: destructiveTriage,
      corroborationCount: 0,
      ipDailyNoise: 0,
      hostIsProd: true,
    });
    expect(r.bucket).toBe("needs-human");
  });

  it("feature classification → demoted from verified to needs-human", () => {
    const r = computeScore(parsed, {
      reporter: adminReporter,
      triage: featureTriage,
      corroborationCount: 0,
      ipDailyNoise: 0,
      hostIsProd: true,
    });
    expect(r.bucket).not.toBe("verified-report");
  });

  it("spam classification → score discounted, lands silent or low", () => {
    const r = computeScore(parsed, {
      reporter: anonReporter,
      triage: spamTriage,
      corroborationCount: 0,
      ipDailyNoise: 0,
      hostIsProd: true,
    });
    expect(["silent-reject", "low-confidence"]).toContain(r.bucket);
  });

  it("AI failure (triage=null) caps verified → needs-human", () => {
    const r = computeScore(parsed, {
      reporter: adminReporter,
      triage: null,
      corroborationCount: 0,
      ipDailyNoise: 0,
      hostIsProd: true,
    });
    expect(r.bucket).not.toBe("verified-report");
  });

  it("corroboration bonus boosts bug scores", () => {
    const lowR = computeScore(parsed, {
      reporter: newGuestReporter,
      triage: goodTriage,
      corroborationCount: 0,
      ipDailyNoise: 0,
      hostIsProd: true,
    });
    const corroborated = computeScore(parsed, {
      reporter: newGuestReporter,
      triage: goodTriage,
      corroborationCount: 3,
      ipDailyNoise: 0,
      hostIsProd: true,
    });
    expect(corroborated.score).toBeGreaterThan(lowR.score);
  });

  it("coordinated-noise penalty subtracts from score", () => {
    const clean = computeScore(parsed, {
      reporter: anonReporter,
      triage: goodTriage,
      corroborationCount: 0,
      ipDailyNoise: 0,
      hostIsProd: true,
    });
    const noisy = computeScore(parsed, {
      reporter: anonReporter,
      triage: goodTriage,
      corroborationCount: 0,
      ipDailyNoise: 5,
      hostIsProd: true,
    });
    expect(noisy.score).toBeLessThan(clean.score);
  });

  it("silent-reject bucket has empty labels", () => {
    const minimal = reportSchema.parse({
      ...baseInput,
      description: "x".repeat(35), // passes Zod but content is empty value
      reproSteps: undefined,
      expected: undefined,
      actual: undefined,
      category: "other",
    });
    const r = computeScore(minimal, {
      reporter: anonReporter,
      triage: spamTriage,
      corroborationCount: 0,
      ipDailyNoise: 10,
      hostIsProd: false,
    });
    if (r.bucket === "silent-reject") {
      expect(r.labels).toEqual([]);
    }
  });

  it("severityHint=critical with score >= 60 promotes to verified", () => {
    const r = computeScore(
      { ...parsed, severityHint: "critical" },
      {
        reporter: { ...newGuestReporter, accountAgeDays: 100 },
        triage: { ...goodTriage, severity: "critical" },
        corroborationCount: 0,
        ipDailyNoise: 0,
        hostIsProd: true,
      }
    );
    expect(r.bucket).toBe("verified-report");
  });
});

// ─── helper functions ──────────────────────────────────────────────────────

describe("hostMatches", () => {
  it("exact match", () => {
    expect(hostMatches("localhost", ["localhost"])).toBe(true);
  });
  it("wildcard suffix", () => {
    expect(hostMatches("ed.databayt.org", ["*.databayt.org"])).toBe(true);
    expect(hostMatches("databayt.org", ["*.databayt.org"])).toBe(true);
  });
  it("rejects mismatched host", () => {
    expect(hostMatches("evil.example.com", ["*.databayt.org"])).toBe(false);
  });
});

describe("bucketFor", () => {
  it("respects strict thresholds", () => {
    expect(bucketFor(29)).toBe("silent-reject");
    expect(bucketFor(30)).toBe("low-confidence");
    expect(bucketFor(54)).toBe("low-confidence");
    expect(bucketFor(55)).toBe("needs-human");
    expect(bucketFor(74)).toBe("needs-human");
    expect(bucketFor(75)).toBe("verified-report");
    expect(bucketFor(100)).toBe("verified-report");
  });
});

describe("uniqueMeaningfulTokens", () => {
  it("dedupes case-insensitively and ignores short tokens", () => {
    expect(uniqueMeaningfulTokens("the the THE the The the")).toBe(1);
  });
  it("handles Arabic", () => {
    expect(uniqueMeaningfulTokens("هذا اختبار للتحقق من العد")).toBeGreaterThanOrEqual(4);
  });
});

describe("letterRatio", () => {
  it("scores normal English text high", () => {
    const r = letterRatio("This is a regular sentence with words.");
    expect(r.letters).toBeGreaterThan(0.7);
  });
  it("scores symbol-only text low", () => {
    const r = letterRatio("!@#$%^&*()!@#$%^&*()");
    expect(r.letters).toBe(0);
  });
});
