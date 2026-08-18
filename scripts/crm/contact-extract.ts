// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * VENDORED from mkan/scripts/crm/contact-extract.ts (2026-08-18), unchanged below
 * this header. mkan built it for Airbnb hosts; hogwarts uses it for schools, and
 * the parts that matter transfer exactly because they are about *Sudanese text*,
 * not about property rentals:
 *
 *   - Eastern-Arabic and Persian digits folded before any pattern runs, because
 *     ٠١٢٣٤٥ matches no ASCII regex.
 *   - A number is classified phone-vs-WhatsApp by what sits within ~40 characters
 *     of it (واتساب / للتواصل / اتصل / هاتف), not by the number's own shape. On a
 *     school's About tab that context is the only thing that distinguishes a
 *     WhatsApp line from a switchboard.
 *   - Years and measurements are rejected as noise -- a school page is full of
 *     founding dates and campus areas.
 *   - Foreign numbers are KEPT AND TAGGED rather than dropped. This is the whole
 *     reason to vendor rather than rewrite: a Sudanese school operating in Riyadh
 *     answers on +966, and half of this job is exactly those schools.
 *
 * Like twenty-rest.ts, this is a copy and not a shared package. Fix bugs in BOTH
 * copies until it is extracted; prefer mkan's if they ever disagree.
 *
 * One caveat when feeding it HTML: the phone pattern will happily match digit
 * runs inside minified JS and CSS. Strip <script>/<style> and tags to text first.
 */
/**
 * Pull contact channels out of free text (Epic G1.6).
 *
 * Airbnb hides host phone numbers, so not one of the scraped hosts has a
 * channel — which makes contact discovery, not listing volume, the thing
 * standing between us and any host outreach at all. But hosts leak contacts
 * constantly in text Airbnb *does* publish: descriptions, house rules, and the
 * "about" blurb on the host card.
 *
 * Pure and side-effect free, like `airbnb-parse.ts`, so it can be tested against
 * real strings without a browser.
 *
 * ── Measured yield, and what it means ──────────────────────────────────────
 *
 * Run over all 109 scraped descriptions on 2026-07-26, this found **nothing** —
 * not one contact across 67 hosts. There is not a single run of six or more
 * consecutive digits anywhere in that text. Airbnb scrubs contact details from
 * listing copy to stop off-platform booking, and it does so thoroughly.
 *
 * So this module is worth running (house rules and the host "about" blurb are
 * still unscraped at the time of writing, and cost nothing to check), but it
 * should not be mistaken for a contact strategy. The ceiling is set by the
 * source, not by the patterns here — no amount of additional regex will move
 * it. Reaching these hosts needs a channel Airbnb does not control: the
 * operator worksheet in `contact-hunt.ts`, reverse-image search against the
 * Facebook groups where Sudanese hosts cross-post the same photo sets, or a
 * claim link delivered some other way.
 *
 * ── Sudanese specifics that a generic phone regex gets wrong ────────────────
 *
 *  · Numbers are often typed in Eastern Arabic digits (٠١٢٣٤٥٦٧٨٩), which no
 *    ASCII pattern matches. Everything is transliterated before matching.
 *  · Local format is 10 digits starting 09x or 01x; international is +249
 *    followed by 9 digits. Both appear, often in the same listing.
 *  · A large share of Sudanese hosts live abroad — Saudi, Egypt, the Emirates,
 *    Qatar, Turkey — since the war. Their foreign numbers are real contacts,
 *    not noise, so they are kept and tagged with the country rather than
 *    filtered out for not being +249.
 */

export type ContactKind = 'phone' | 'whatsapp' | 'email' | 'facebook' | 'instagram' | 'telegram';
export type Confidence = 'HIGH' | 'MEDIUM' | 'LOW';

export interface ContactCandidate {
  kind: ContactKind;
  /** Normalized: E.164 for numbers, lowercased for emails, full URL for socials. */
  value: string;
  /** The text as it appeared, for a human checking our work. */
  raw: string;
  /** Which field it came from, e.g. "description:ar". */
  source: string;
  confidence: Confidence;
  /** ISO country for a non-Sudanese number — these hosts are diaspora. */
  countryGuess?: string;
}

/** Eastern Arabic-Indic and Persian digits → ASCII. */
export function normalizeDigits(input: string): string {
  return input.replace(/[٠-٩۰-۹]/g, (d) => {
    const code = d.charCodeAt(0);
    const base = code >= 0x06f0 ? 0x06f0 : 0x0660;
    return String(code - base);
  });
}

/** Strip separators and the leading + people type inside numbers. */
const compact = (s: string) => s.replace(/[\s\-().+]/g, '');

const DIASPORA: Array<[string, RegExp, number]> = [
  // country, dial-code pattern, national-number length
  ['SA', /^966/, 9],
  ['AE', /^971/, 9],
  ['EG', /^20/, 10],
  ['QA', /^974/, 8],
  ['KW', /^965/, 8],
  ['TR', /^90/, 10],
  ['GB', /^44/, 10],
  ['US', /^1/, 10],
];

/**
 * Sudanese mobile: +249 then 9 digits beginning 9 (Zain/MTN) or 1 (Sudani),
 * or the local 0-prefixed 10-digit form.
 */
function normalizeSudanPhone(digits: string): string | null {
  let d = digits;
  if (d.startsWith('00')) d = d.slice(2);
  if (d.startsWith('249')) d = d.slice(3);
  else if (d.startsWith('0')) d = d.slice(1);
  else if (d.length !== 9) return null;
  if (!/^[19]\d{8}$/.test(d)) return null;
  return `+249${d}`;
}

function normalizeForeignPhone(digits: string): { value: string; country: string } | null {
  let d = digits;
  if (d.startsWith('00')) d = d.slice(2);
  if (!d.startsWith('+') && d.length < 8) return null;
  d = d.replace(/^\+/, '');
  for (const [country, prefix, len] of DIASPORA) {
    const m = d.match(prefix);
    if (m && d.length === m[0].length + len) return { value: `+${d}`, country };
  }
  return null;
}

// Candidate number runs: an optional +/00 then 7–15 digits with separators.
const PHONE_RUN = /(?:\+|00)?[\d][\d\s\-().]{6,18}\d/g;
const EMAIL = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi;
const FACEBOOK = /(?:https?:\/\/)?(?:www\.|m\.|web\.)?(?:facebook\.com|fb\.me|m\.me)\/([A-Za-z0-9.\-_]+)/gi;
const INSTAGRAM = /(?:https?:\/\/)?(?:www\.)?instagram\.com\/([A-Za-z0-9._]+)/gi;
const TELEGRAM = /(?:https?:\/\/)?(?:www\.)?(?:t\.me|telegram\.me)\/([A-Za-z0-9_]+)/gi;
const WA_LINK = /(?:https?:\/\/)?(?:wa\.me\/|api\.whatsapp\.com\/send\?phone=)(\+?\d{7,15})/gi;

/** Words that, near a number, mean it is a WhatsApp line or a booking line. */
const WHATSAPP_NEAR = /واتس\s*اب|واتساب|واتس|whats\s*app|whatsapp|wa\b/i;
const CALL_NEAR = /للحجز|للتواصل|اتصل|اتصال|تواصل|هاتف|جوال|موبايل|رقم|call|contact|book(?:ing)?|reach/i;

/** Things that look like phone numbers but are not. */
function isNoise(compactDigits: string, context: string): boolean {
  if (/^(?:19|20)\d{2}$/.test(compactDigits)) return true; // a year
  if (/^\d{1,6}$/.test(compactDigits)) return true; // too short
  if (/\d+\s*(?:sqm|m2|متر|كم|km)/i.test(context)) return true; // a measurement
  if (/^0+$/.test(compactDigits)) return true;
  return false;
}

/** Text within ±window characters of an index. */
function around(text: string, index: number, length: number, window = 40): string {
  return text.slice(Math.max(0, index - window), Math.min(text.length, index + length + window));
}

/**
 * Extract every contact channel in one blob of text.
 *
 * `source` is carried through to the output so a human reviewing a candidate
 * can see whether it came from a description, a house rule or a host bio —
 * which is most of what decides whether to trust it.
 */
export function extractContacts(text: string | null | undefined, source: string): ContactCandidate[] {
  if (!text || !text.trim()) return [];
  const t = normalizeDigits(String(text));
  const out: ContactCandidate[] = [];
  const seen = new Set<string>();

  const push = (c: ContactCandidate) => {
    const key = `${c.kind}:${c.value}`;
    if (seen.has(key)) return;
    seen.add(key);
    out.push(c);
  };

  // wa.me links are unambiguous — the host published a WhatsApp number.
  for (const m of t.matchAll(WA_LINK)) {
    const digits = compact(m[1]);
    const sd = normalizeSudanPhone(digits);
    const fr = sd ? null : normalizeForeignPhone(digits);
    const value = sd ?? fr?.value ?? `+${digits.replace(/^\+/, '')}`;
    push({ kind: 'whatsapp', value, raw: m[0], source, confidence: 'HIGH', countryGuess: fr?.country });
  }

  for (const m of t.matchAll(EMAIL)) {
    push({ kind: 'email', value: m[0].toLowerCase(), raw: m[0], source, confidence: 'MEDIUM' });
  }
  for (const m of t.matchAll(FACEBOOK)) {
    if (/^(?:sharer|tr|plugins|profile\.php)$/i.test(m[1])) continue;
    push({ kind: 'facebook', value: `https://facebook.com/${m[1]}`, raw: m[0], source, confidence: 'MEDIUM' });
  }
  for (const m of t.matchAll(INSTAGRAM)) {
    push({ kind: 'instagram', value: `https://instagram.com/${m[1]}`, raw: m[0], source, confidence: 'MEDIUM' });
  }
  for (const m of t.matchAll(TELEGRAM)) {
    push({ kind: 'telegram', value: `https://t.me/${m[1]}`, raw: m[0], source, confidence: 'MEDIUM' });
  }

  for (const m of t.matchAll(PHONE_RUN)) {
    const raw = m[0].trim();
    const digits = compact(raw);
    const context = around(t, m.index ?? 0, raw.length);
    if (isNoise(digits, context)) continue;

    const sudan = normalizeSudanPhone(digits);
    const foreign = sudan ? null : normalizeForeignPhone(digits);
    if (!sudan && !foreign) continue;

    const value = sudan ?? foreign!.value;
    // Adjacency to "واتساب" or "للحجز" is what separates a number the host
    // wants you to use from one that merely appears in the text.
    const isWa = WHATSAPP_NEAR.test(context);
    const invited = isWa || CALL_NEAR.test(context);
    push({
      kind: isWa ? 'whatsapp' : 'phone',
      value,
      raw,
      source,
      confidence: invited ? 'HIGH' : 'MEDIUM',
      countryGuess: foreign?.country,
    });
  }

  return out;
}

/** Run the extractor over several labelled fields at once. */
export function extractContactsFrom(fields: Array<[string, string | null | undefined]>): ContactCandidate[] {
  const all = fields.flatMap(([source, text]) => extractContacts(text, source));

  // Dedupe by the number itself, not by kind. One number found bare in the
  // description and again beside "واتساب" in the house rules is one contact,
  // and the WhatsApp reading is the useful one — emitting both would put the
  // same host in the outbox twice on the weaker channel.
  const rank: Record<Confidence, number> = { HIGH: 3, MEDIUM: 2, LOW: 1 };
  const kindRank = (k: ContactKind) => (k === 'whatsapp' ? 2 : 1);
  const best = new Map<string, ContactCandidate>();
  for (const c of all) {
    const prev = best.get(c.value);
    if (
      !prev ||
      kindRank(c.kind) > kindRank(prev.kind) ||
      (kindRank(c.kind) === kindRank(prev.kind) && rank[c.confidence] > rank[prev.confidence])
    ) {
      // Keep the best evidence for the channel, but never downgrade confidence
      // just because the stronger channel was found in a quieter context.
      best.set(c.value, {
        ...c,
        confidence: prev && rank[prev.confidence] > rank[c.confidence] ? prev.confidence : c.confidence,
      });
    }
  }
  return [...best.values()];
}

/** The strongest confidence present, for a per-host summary field. */
export function overallConfidence(candidates: ContactCandidate[]): Confidence | 'NONE' {
  if (candidates.some((c) => c.confidence === 'HIGH')) return 'HIGH';
  if (candidates.some((c) => c.confidence === 'MEDIUM')) return 'MEDIUM';
  if (candidates.length) return 'LOW';
  return 'NONE';
}
