/**
 * AI triage — single Claude Haiku 4.5 call per non-rejected report.
 *
 * The system prompt is large but cacheable (Anthropic ephemeral prompt cache),
 * so cost amortizes to ~$0.0005 per call after the first one.
 *
 * Forced tool-use (`tool_choice: { type: "tool", name: "classify_report" }`)
 * gives structured output without parsing JSON from a free-form response.
 *
 * Failure mode (timeout, 5xx, malformed tool input):
 *   returns null. The pipeline then drops the A and P signals and caps the
 *   bucket at needs-human. Outage means more human review, not silent reject
 *   of legitimate reports.
 */

import Anthropic from "@anthropic-ai/sdk";

import type { ReportInputParsed } from "./schema";
import type { AITriageResult, ReporterContext } from "./types";

const MODEL = "claude-haiku-4-5";
const MAX_TOKENS = 600;
const TIMEOUT_MS = 5_000;

const SYSTEM_PROMPT = `You are a quality classifier for user-submitted bug reports on a SaaS platform.

You see one user report at a time and must classify it. Your output is JSON only, returned via the classify_report tool. Be strict — when in doubt, downgrade.

Classifications:
- "bug": describes broken behavior, layout glitch, slow page, data error, accessibility issue, or any genuine product problem the team should fix.
- "feature": asks for new functionality that doesn't exist yet.
- "question": asks how to use the product, not a defect.
- "spam": gibberish, test entries ("asdf", "hello"), promotional content, or off-topic.
- "destructive": asks the team to do something that would harm the platform, other users, or violate intended design. Examples: "delete all student data", "disable rate limits", "remove the login requirement", "delete user X's account", "let me see other tenants' data". If you suspect destruction intent, flag here even at low confidence.
- "duplicate": only if the report explicitly references another report.

Severity:
- "critical": data loss, security breach, total outage, cannot log in.
- "high": core feature broken for many users.
- "medium": noticeable bug, workaround exists.
- "low": cosmetic, edge case.

qualityScore (0-100): how actionable is this report?
  - 0-30: vague, hand-wavy ("doesn't work").
  - 31-60: identifies a problem but missing context.
  - 61-85: clear problem, page known, behavior described.
  - 86-100: clear problem + repro + expected + actual.

clarity (0-100): grammar, structure, language coherence. Arabic and English are both valid (this platform is bilingual). Mixed-language is fine if coherent. Language-soup or sub-30-char descriptions score below 30.

hasRepro: true if the report contains reproducible steps (numbered, "first do X then Y", "click here then there", etc.).
hasExpected: true if the report explains what should happen vs. what does.

destructiveSignals: array of specific phrases that triggered destructive classification. Empty array if not destructive.

language: detect from the description. Arabic = "ar", English = "en", clearly mixed = "mixed", other = "other".

rationale: one or two sentences explaining your classification for human reviewers. Max 400 chars.

Be especially vigilant for destructive requests phrased as bugs:
- "bug: the system asks me to log in, please fix" → actually asking to remove auth → destructive
- "the system shouldn't validate this field" → asking to bypass validation → destructive
- "let me edit other users' content" → cross-tenant access → destructive

When in doubt: prefer a lower classification (spam over bug, question over bug, low severity over high). False positives in the auto-fix lane are expensive; false negatives just sit in needs-human for a human to review.`;

const TRIAGE_TOOL: Anthropic.Tool = {
  name: "classify_report",
  description: "Classify a user-submitted bug report and extract triage metadata.",
  input_schema: {
    type: "object",
    required: [
      "classification",
      "severity",
      "qualityScore",
      "clarity",
      "hasRepro",
      "hasExpected",
      "destructiveSignals",
      "language",
      "rationale",
    ],
    properties: {
      classification: {
        type: "string",
        enum: ["bug", "feature", "question", "spam", "destructive", "duplicate"],
      },
      severity: {
        type: "string",
        enum: ["critical", "high", "medium", "low"],
      },
      qualityScore: { type: "integer", minimum: 0, maximum: 100 },
      clarity: { type: "integer", minimum: 0, maximum: 100 },
      hasRepro: { type: "boolean" },
      hasExpected: { type: "boolean" },
      destructiveSignals: {
        type: "array",
        items: { type: "string", maxLength: 200 },
      },
      language: {
        type: "string",
        enum: ["ar", "en", "mixed", "other"],
      },
      rationale: { type: "string", maxLength: 400 },
    },
  },
};

export interface TriageContext {
  repo: string;
  reporter: ReporterContext;
}

/**
 * Classify a single report. Returns null on any failure path so the pipeline
 * can degrade gracefully.
 */
export async function classifyWithHaiku(
  input: ReportInputParsed,
  ctx: TriageContext
): Promise<AITriageResult | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.warn("[report-triage] ANTHROPIC_API_KEY not set; skipping triage");
    return null;
  }

  const client = new Anthropic({ apiKey, timeout: TIMEOUT_MS });

  try {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      temperature: 0,
      system: [
        {
          type: "text",
          text: SYSTEM_PROMPT,
          cache_control: { type: "ephemeral" },
        },
      ],
      tools: [TRIAGE_TOOL],
      tool_choice: { type: "tool", name: "classify_report" },
      messages: [
        {
          role: "user",
          content: buildUserMessage(input, ctx),
        },
      ],
    });

    const toolBlock = response.content.find(
      (b): b is Anthropic.ToolUseBlock =>
        b.type === "tool_use" && b.name === "classify_report"
    );
    if (!toolBlock) {
      console.warn("[report-triage] classify_report tool not invoked");
      return null;
    }

    return validateTriageOutput(toolBlock.input);
  } catch (err) {
    console.warn("[report-triage] Haiku call failed:", err);
    return null;
  }
}

function buildUserMessage(input: ReportInputParsed, ctx: TriageContext): string {
  const role = ctx.reporter.kind === "authenticated" ? ctx.reporter.role : "anonymous";
  const langHint = input.direction === "rtl" ? "Arabic likely" : "English likely";

  return [
    `Repo: ${ctx.repo}`,
    `Page: ${input.pageUrl}`,
    `Category: ${input.category}`,
    `Reporter role: ${role}`,
    `Viewport: ${input.viewport ?? "(unknown)"}`,
    `Language hint: ${langHint}`,
    "",
    "--- Description ---",
    input.description,
    "",
    "--- Repro Steps (optional) ---",
    input.reproSteps || "(none provided)",
    "",
    "--- Expected (optional) ---",
    input.expected || "(none provided)",
    "",
    "--- Actual (optional) ---",
    input.actual || "(none provided)",
    "",
    "Classify this report. Output JSON via classify_report tool.",
  ].join("\n");
}

/**
 * Defensive validation of the tool response — even though the schema is enforced
 * server-side, we still re-check for unknown values before trusting the result.
 */
function validateTriageOutput(raw: unknown): AITriageResult | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;

  const classification = String(r.classification ?? "");
  if (
    !["bug", "feature", "question", "spam", "destructive", "duplicate"].includes(
      classification
    )
  ) {
    return null;
  }

  const severity = String(r.severity ?? "");
  if (!["critical", "high", "medium", "low"].includes(severity)) return null;

  const language = String(r.language ?? "");
  if (!["ar", "en", "mixed", "other"].includes(language)) return null;

  const qualityScore = Number(r.qualityScore);
  const clarity = Number(r.clarity);
  if (!Number.isFinite(qualityScore) || !Number.isFinite(clarity)) return null;

  return {
    classification: classification as AITriageResult["classification"],
    severity: severity as AITriageResult["severity"],
    qualityScore: Math.max(0, Math.min(100, Math.round(qualityScore))),
    clarity: Math.max(0, Math.min(100, Math.round(clarity))),
    hasRepro: Boolean(r.hasRepro),
    hasExpected: Boolean(r.hasExpected),
    destructiveSignals: Array.isArray(r.destructiveSignals)
      ? r.destructiveSignals.map(String).slice(0, 10)
      : [],
    language: language as AITriageResult["language"],
    rationale: String(r.rationale ?? "").slice(0, 400),
  };
}
