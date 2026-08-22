/**
 * Shared plumbing for the funnel-lane scripts (`scripts/funnel/`).
 *
 * The lane's scripts live under this path ON PURPOSE: kun's `funnel-guard` /
 * `funnel-yield` hooks fence `scripts/funnel/` by pattern, so a send script
 * created here is inside the guard by construction instead of by remembering
 * to extend a regex. See kun `.claude/hooks/funnel-guard.sh` for what the
 * fence enforces (an --apply that sends must name --segment; a drain must
 * name its approval source).
 *
 * Env: tsx does not auto-load `.env` the way Next does, so `loadEnv()` reads
 * it manually — values are TRIMMED because Vercel-pulled env files carry
 * stray trailing newlines (that bug already broke kun's report-issue lane).
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

export const argv = (n: string, d = ''): string => {
  const h = process.argv.find((a) => a.startsWith(`--${n}=`));
  return h ? h.split('=').slice(1).join('=') : d;
};
export const flag = (n: string): boolean => process.argv.includes(`--${n}`);

/** Parse `.env` into process.env for keys not already set. Values trimmed. */
export function loadEnv(root = process.cwd()): void {
  const p = join(root, '.env');
  if (!existsSync(p)) return;
  for (const line of readFileSync(p, 'utf8').split('\n')) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (!m) continue;
    const key = m[1];
    let val = m[2].trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'")))
      val = val.slice(1, -1).trim();
    if (!(key in process.env)) process.env[key] = val;
  }
}

/** Which database a DATABASE_URL points at — printed so a report can never
 * silently pass dev data off as production (that mistake has happened). */
export function dbHostTag(url: string | undefined): string {
  if (!url) return 'NO DATABASE_URL';
  const host = url.match(/@([^/:?]+)/)?.[1] ?? '?';
  const kind = /localhost|127\.0\.0\.1/.test(host) ? 'LOCAL DEV' : /neon\.tech/.test(host) ? 'NEON (prod-grade)' : 'remote';
  return `${host} (${kind})`;
}

// ── Phone + rail ─────────────────────────────────────────────────────────────

/** Arabic-Indic (٠-٩) and Eastern Arabic-Indic (۰-۹) digits → ASCII. A naive
 * regex silently drops every Sudanese number written the way Sudanese people
 * actually write numbers. */
export function normalizeDigits(s: string): string {
  return s
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0));
}

const CC: Record<string, string> = { SD: '249', EG: '20', SA: '966', AE: '971', QA: '974' };

/**
 * Best-effort E.164. Returns null rather than guess: a wrong number in a
 * WhatsApp campaign is worse than a dropped one.
 *   "+249 91 230 3865" → +249912303865
 *   "00966557411272"   → +966557411272
 *   "0912303865" + SD  → +249912303865   (local form needs the country)
 */
export function toE164(raw: string | null | undefined, country?: string | null): string | null {
  if (!raw) return null;
  let n = normalizeDigits(raw).replace(/[^\d+]/g, '');
  if (!n) return null;
  if (n.startsWith('00')) n = `+${n.slice(2)}`;
  if (!n.startsWith('+')) {
    const cc = CC[(country ?? '').toUpperCase()];
    if (n.startsWith('0') && cc) n = `+${cc}${n.slice(1)}`;
    else if (cc && n.length >= 8 && n.length <= 10) n = `+${cc}${n}`;
    else if (/^(249|20|966|971|974)\d{7,}$/.test(n)) n = `+${n}`;
    else return null;
  }
  return n.length >= 11 && n.length <= 16 ? n : null;
}

/**
 * Mobile detection per country. Deliberately conservative: anything not
 * recognisably mobile is dropped rather than guessed at.
 *
 *   SD  +249 9x ONLY        EG  +20 10/11/12/15
 *   SA  +966 5x             AE  +971 5x           QA  +974 3x/5x/6x/7x
 *
 * Sudan is the awkward one and worth explaining, because the first version of
 * this got it wrong. Sudanese mobiles run on 9x AND on some 1x prefixes, but
 * Khartoum landlines are also 1xx — 0183 is the Khartoum area code. There is no
 * way to separate them from the number alone, so accepting 1x put a school's
 * switchboard (+249 183 215 000) at the top of the wave. Only 9x is
 * unambiguously mobile; 1x is dropped as unknown. That loses a few real mobiles,
 * which is the cheaper mistake — a WhatsApp to a landline is never delivered and
 * reads back as a school that ignored us.
 */
export function isMobile(e164: string): boolean {
  const n = e164.replace(/[^\d+]/g, '');
  if (n.startsWith('+249')) return /^\+2499/.test(n);
  if (n.startsWith('+20')) return /^\+20(10|11|12|15)/.test(n);
  if (n.startsWith('+966')) return /^\+9665/.test(n);
  if (n.startsWith('+971')) return /^\+9715/.test(n);
  if (n.startsWith('+974')) return /^\+974[3567]/.test(n);
  return false;
}

/** Channel rail. sd → WhatsApp-first; gulf/eg → email-first (119 of 176
 * contactables carry an email, only 45 are mobile). */
export function railOf(country: string | null | undefined, e164: string | null): 'sd' | 'gulf' | 'eg' | 'other' {
  const c = (country ?? '').toUpperCase();
  if (c === 'SD' || e164?.startsWith('+249')) return 'sd';
  if (c === 'EG' || e164?.startsWith('+20')) return 'eg';
  if (['SA', 'AE', 'QA', 'KW', 'BH', 'OM'].includes(c) || /^\+(966|971|974|965|973|968)/.test(e164 ?? ''))
    return 'gulf';
  return 'other';
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export const emailOf = (raw: string | null | undefined): string | null => {
  const v = (raw ?? '').trim().toLowerCase();
  return EMAIL_RE.test(v) ? v : null;
};

// ── The opening message (moved verbatim from wave-one.ts) ────────────────────

/**
 * Arabic only — every school in the current waves is in SD/EG/SA/AE/QA and the
 * deck is Arabic, so an English opener would be the wrong first impression.
 *
 * Shape, and the reasoning behind it:
 *   - Who is speaking, immediately. A cold WhatsApp with no name is spam.
 *   - What it is, in one sentence, in the school's own vocabulary — admission,
 *     fees, parents, website — not "SaaS platform".
 *   - The offer, stated plainly and without conditions to read past.
 *   - ONE ask, and a small one. Not a demo, not a call — just a yes/no.
 *   - No urgency, no scarcity, no "quick question". Schools are institutions
 *     and respond badly to sales theatre.
 */
export function openingMessage(schoolName: string): string {
  return [
    'السلام عليكم ورحمة الله وبركاته',
    '',
    `أكتب لكم بخصوص ${schoolName}.`,
    '',
    'معكم فريق داتابيت. طوّرنا منصة «بالقلم» لإدارة المدارس — القبول والتسجيل، الرسوم والفواتير والرواتب، التواصل مع أولياء الأمور، وموقع إلكتروني خاص بالمدرسة.',
    '',
    'أرفقنا لكم تعريفاً مختصراً.',
    '',
    'نتيح ثلاثة أشهر تجربة مجانية كاملة، بدون رسوم وبدون التزام.',
    '',
    'هل ترغبون أن نجهّز نسخة تجريبية باسم مدرستكم لتجربتها؟',
  ].join('\n');
}

export function waLink(e164: string, text: string): string {
  return `https://wa.me/${e164.replace(/[^\d]/g, '')}?text=${encodeURIComponent(text)}`;
}

/** The balqalam intro deck — sent AFTER a reply, linked in email touch 1. */
export const DECK_URL = 'https://balqalam.com/decks/balqalam.pdf';

// ── The gates artifact ───────────────────────────────────────────────────────

/** The ladder, in order, as it exists LIVE in the workspace (12 options —
 * SHORTLISTED + CONTACTED appended 2026-08-19). One list, one order. */
export const LADDER = [
  'COLD',
  'PROSPECT',
  'SHORTLISTED',
  'CONTACTED',
  'WARM',
  'DISCOVERY',
  'DEMO',
  'TRIAL',
  'PILOT',
  'PAID',
  'DORMANT',
  'LOST',
] as const;
export type Gate = (typeof LADDER)[number];

export const GATES_FILE = 'scripts/crm/.data/funnel-gates.json';

/**
 * The contract kun's `funnel-yield` hook reads:
 * `.gates.{PROSPECT,WARM,DISCOVERY,DEMO,TRIAL,PILOT,PAID,DORMANT}` +
 * `.generatedAt`. The file carries all 12 stages; the funnel lane reports WARM
 * and beyond, SHORTLISTED/CONTACTED belong to the outreach report. Every write
 * goes through here so the contract has exactly one author.
 */
export function writeGatesArtifact(data: {
  gates: Record<Gate, number>;
  reach?: unknown;
  prisma?: unknown;
  biggestStallGate: string;
  biggestStallCount: number;
  source: unknown;
}): string {
  const out = join(process.cwd(), GATES_FILE);
  mkdirSync(join(process.cwd(), 'scripts/crm/.data'), { recursive: true });
  writeFileSync(out, JSON.stringify({ generatedAt: new Date().toISOString(), ...data }, null, 2));
  return out;
}
