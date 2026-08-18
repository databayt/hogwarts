/**
 * Twenty CRM — declarative schema for the hogwarts conversion funnel (The Floo Network).
 *
 * Single source of truth for the funnel fields the seeder (`seed-funnel-fields.ts`)
 * materializes in the live hogwarts workspace via the REST metadata API. Mirrors
 * `kun/content/docs/funnel.mdx` and `kun/.claude/agents/funnel.md`.
 *
 * Shape deliberately copied from `mkan/scripts/crm/twenty-schema.ts` — mkan built and
 * hardened schema-as-code first and hogwarts is the second consumer, exactly as
 * `twenty-rest.ts` was vendored.
 *
 * ── Two rules this file exists to encode ─────────────────────────────────────
 *
 * 1. STAGE OPTIONS ARE APPENDED, NEVER REPLACED. `COLD`, `PROSPECT`, `PILOT` and
 *    `LOST` already sit on 3,156 live company rows, and Twenty stores an option's
 *    *value* on the record — so swapping the option set orphans every row holding an
 *    old value. `STAGE_OPTIONS_EXISTING` is listed here precisely so a future edit
 *    cannot quietly drop one.
 *
 * 2. THE GATE LADDER INTRODUCES NO NEW VOCABULARY. It is the union of enums that
 *    already exist — `Prospect.status`, `Lead.status`, and Twenty's `opportunity.stage`.
 *    A fourth naming scheme would guarantee three systems disagreeing about where a
 *    school actually is.
 *
 * Field types verified against twentyhq/twenty
 * `packages/twenty-shared/src/types/FieldMetadataType.ts`. Twenty auto-creates the
 * label-identifier `name` field on every object, so it is not declared here.
 */

export type TwentyFieldType =
  | 'TEXT'
  | 'NUMBER'
  | 'BOOLEAN'
  | 'DATE'
  | 'DATE_TIME'
  | 'SELECT'
  | 'MULTI_SELECT'
  | 'CURRENCY'
  | 'EMAILS'
  | 'PHONES'
  | 'LINKS'
  | 'RAW_JSON';

export interface FieldDef {
  /** camelCase Twenty field name (the DB column derives from this). */
  name: string;
  label: string;
  type: TwentyFieldType;
  description?: string;
  /** Tabler icon name, e.g. "IconProgressCheck". */
  icon?: string;
  /** SELECT / MULTI_SELECT choices; the seeder expands these to Twenty option objects. */
  options?: string[];
  defaultValue?: boolean;
}

// ── The gate ladder ──────────────────────────────────────────────────────────
// COLD belongs to /scrape — the funnel starts at REPLIED. NEGOTIATION means a PILOT
// is running: the GTM is a free 3-month pilot converting to an annual contract, so
// the pilot IS the negotiation rather than a stage before it.
// MEASURED against the live hogwarts workspace 2026-08-18, and it changed this design.
// `company.stage` already carries NINE options, and five of them hold zero rows:
//
//   COLD 3,119 · PROSPECT 21 · WARM 0 · DISCOVERY 0 · DEMO 0 · TRIAL 0 · PILOT 1 · PAID 0 · LOST 65
//
// Someone had already built this ladder and never populated it. So the funnel does not
// append a parallel set of gate names — that would have created exactly the duplicate
// vocabulary this file exists to prevent (WARM *is* replied, DISCOVERY *is* qualified,
// PAID *is* customer). It adopts the ladder that is already there and adds the single
// state genuinely missing from it: DORMANT.
//
// The existing split of TRIAL from PILOT turns out to be better than a merged stage:
// TRIAL is the self-serve sandbox, PILOT is the committed free 3-month engagement, and
// the GTM ("free 3-month pilot converting to an annual contract") needs both.
export const GATES = [
  'COLD',
  'PROSPECT',
  'WARM',
  'DISCOVERY',
  'DEMO',
  'TRIAL',
  'PILOT',
  'PAID',
  'DORMANT',
  'LOST',
] as const;
export type Gate = (typeof GATES)[number];

/** Live on `company.stage` as of 2026-08-18. NEVER remove one of these. */
export const STAGE_OPTIONS_EXISTING = [
  'COLD', 'PROSPECT', 'WARM', 'DISCOVERY', 'DEMO', 'TRIAL', 'PILOT', 'PAID', 'LOST',
] as const;

/** Exactly one option is genuinely new. Additive by construction. */
export const STAGE_OPTIONS_TO_APPEND = GATES.filter(
  (g) => !STAGE_OPTIONS_EXISTING.includes(g as (typeof STAGE_OPTIONS_EXISTING)[number]),
);

/** What each gate means, so no session has to re-infer it from the option name. */
export const GATE_MEANING: Record<Gate, string> = {
  COLD: 'never contacted — /scrape owns this, the funnel does not',
  PROSPECT: 'tiered and worth working, but no reply yet',
  WARM: 'replied — the funnel actually starts here',
  DISCOVERY: 'the seven qualifying facts are known',
  DEMO: 'a proposal or consult has been shown',
  TRIAL: 'a self-serve sandbox is running in their own school name',
  PILOT: 'the committed free 3-month pilot is running',
  PAID: 'subscription active with real usage — the north-star state',
  DORMANT: 'four touches, no reply; re-enters at its stalled gate after 90 days',
  LOST: 'an explicit no',
};

/** Postgres is the source of truth for gate state; these mirror it onto the board. */
export const GATE_FROM_LEAD_STATUS: Record<string, Gate> = {
  NEW: 'WARM',
  CONTACTED: 'WARM',
  QUALIFIED: 'DISCOVERY',
  PROPOSAL: 'DEMO',
  NEGOTIATION: 'PILOT',
  CLOSED_WON: 'PAID',
  CLOSED_LOST: 'LOST',
  ARCHIVED: 'DORMANT',
};

// ── Segmentation ─────────────────────────────────────────────────────────────
// Bands come from `src/components/saas-marketing/pricing/config.ts`, not from taste:
// 100 is the free-tier ceiling, 20 is the minimumMonthly 30 / $1.50 floor, and 1000 is
// where enterprise is offered.
export const AUTHORITY = ['owner', 'principal', 'admin', 'unknown'] as const;
export const BAND = ['micro', 'small', 'mid', 'large'] as const;
export const RAIL = ['sd', 'gulf', 'eg', 'other'] as const;
export const TERM = ['now', 'next', 'far'] as const;

/** Rail decides the channel, and the measurement is not close: 119 of 176 contactables
 *  carry an email against only 45 mobiles, so everything outside Sudan is email-first. */
export const RAIL_CHANNEL: Record<(typeof RAIL)[number], 'whatsapp' | 'email'> = {
  sd: 'whatsapp',
  gulf: 'email',
  eg: 'email',
  other: 'email',
};

// ── Fields ───────────────────────────────────────────────────────────────────

/**
 * `opportunity` — the deal. Created at REPLIED, one per school being worked.
 * `company.stage` stays acquisition state (COLD/PROSPECT/…) and answers a different
 * question: "have we reached this school?" versus "how far along is this deal?"
 */
export const OPPORTUNITY_FUNNEL_FIELDS: FieldDef[] = [
  {
    name: 'hogwartsLeadId',
    label: 'hogwarts Lead ID',
    type: 'TEXT',
    icon: 'IconLink',
    description:
      'Join key back to hogwarts Postgres, which is the source of truth for gate state. Without this the board cannot be reconciled.',
  },
  {
    name: 'funnelSegment',
    label: 'Segment',
    type: 'TEXT',
    icon: 'IconCategory',
    description: '<authority>-<band>-<rail>-<term>. Recomputed on read — never authored by hand.',
  },
  {
    name: 'funnelSurface',
    label: 'Surface',
    type: 'SELECT',
    icon: 'IconDeviceMobileMessage',
    options: ['WEB_WIDGET', 'WHATSAPP', 'EMAIL', 'FORM', 'OUTBOUND'],
    description: 'Which lane produced this deal.',
  },
  {
    name: 'nextActionAt',
    label: 'Next action',
    type: 'DATE_TIME',
    icon: 'IconClockHour4',
    description: 'The stall clock. This is the column the human board should sort by.',
  },
  {
    name: 'lastTouchAt',
    label: 'Last touch',
    type: 'DATE_TIME',
    icon: 'IconSend',
  },
  {
    name: 'touchNumber',
    label: 'Touch number',
    type: 'NUMBER',
    icon: 'IconNumbers',
    description: '1-4. Four touches then DORMANT — never infinite.',
  },
  {
    name: 'stallDays',
    label: 'Days silent',
    type: 'NUMBER',
    icon: 'IconZzz',
    description: 'Written by the tick, so "who went quiet" is a sort rather than an investigation.',
  },
  {
    name: 'assetsSent',
    label: 'Assets sent',
    type: 'MULTI_SELECT',
    icon: 'IconGift',
    options: [
      'ROI_ONEPAGER',
      'FREE_TIER_SETUP',
      'GUIDE_SINGLE',
      'GUIDE_MULTIBRANCH',
      'CASE_KING_FAHAD',
      'CONSULT_20MIN',
      'COMPLIANCE_CHECKLIST',
      'PILOT_AGREEMENT',
      'MIGRATION_PLAN',
      'ONBOARDING_CHECKLIST',
      'SANDBOX',
    ],
    description:
      'Every touch must carry an asset this segment has NOT received. This field is what makes that enforceable rather than aspirational.',
  },
  {
    name: 'consentAt',
    label: 'Consent at',
    type: 'DATE_TIME',
    icon: 'IconCheck',
    description: 'A reply is consent. Nothing else counts, and nothing sends without it.',
  },
  {
    name: 'stallReason',
    label: 'Stall reason',
    type: 'TEXT',
    icon: 'IconHelpCircle',
  },
];

/** `company` — the school. Acquisition state stays here; the deal lives on opportunity. */
export const COMPANY_FUNNEL_FIELDS: FieldDef[] = [
  {
    name: 'studentCountBand',
    label: 'Student band',
    type: 'SELECT',
    icon: 'IconUsers',
    options: ['MICRO', 'SMALL', 'MID', 'LARGE'],
    description: 'micro <100 (free tier) · small 100-299 · mid 300-999 · large 1000+ (enterprise).',
  },
  {
    name: 'paymentRail',
    label: 'Payment rail',
    type: 'SELECT',
    icon: 'IconCreditCard',
    options: ['SD', 'GULF', 'EG', 'OTHER'],
    description: 'SD → Bankak/Cashi in SDG. Everything else → card or wire in USD. Also sets the outreach channel.',
  },
  {
    name: 'termStartsAt',
    label: 'Term starts',
    type: 'DATE',
    icon: 'IconCalendarEvent',
    description: 'Schools buy before a term, never during one — this is the urgency axis.',
  },
  {
    name: 'currentSystem',
    label: 'Current system',
    type: 'SELECT',
    icon: 'IconDatabase',
    options: ['PAPER', 'EXCEL', 'COMPETITOR', 'NONE', 'UNKNOWN'],
    description: 'The switching cost, and the pain the first touch should name.',
  },
  {
    name: 'decisionAuthority',
    label: 'Authority',
    type: 'SELECT',
    icon: 'IconUserCheck',
    options: ['OWNER', 'PRINCIPAL', 'ADMIN', 'UNKNOWN'],
    description: 'Only a signer can sign. An admin gets material built to be forwarded upward.',
  },
];

export const FUNNEL_SCHEMA = {
  opportunity: OPPORTUNITY_FUNNEL_FIELDS,
  company: COMPANY_FUNNEL_FIELDS,
} as const;
