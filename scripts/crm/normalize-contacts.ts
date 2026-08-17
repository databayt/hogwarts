// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Make the contact column dialable, and say which numbers WhatsApp can actually reach.
 *
 * The imported numbers are in every shape a human ever types: `0126611004`,
 * `04-3400888`, `97143073000`, `0097317605000`, `800 394448`, `053 354 8222`.
 * The WhatsApp sender needs E.164, so most of these are unusable as stored --
 * not missing, just unformatted, which is a much cheaper problem than it looks.
 *
 * Two judgements matter more than the formatting:
 *
 *  - **Mobile vs landline.** A landline can be called but never WhatsApped. Sorting
 *    a landline into a WhatsApp campaign produces a silent non-delivery that looks
 *    like disinterest, so they are labelled instead of quietly included.
 *  - **The country field lies sometimes.** Two rows carry `00973…` (Bahrain) and
 *    `00965…` (Kuwait) while their country says OTHER and EG. An explicit country
 *    code in the number always beats the column.
 *
 * Dry-run by default; `--apply` writes back through the REST API.
 *
 *   TWENTY_API_URL=http://localhost:3100 \
 *   TWENTY_API_KEY=$(security find-generic-password -s databayt-twenty -a hogwarts -w) \
 *     npx tsx scripts/crm/normalize-contacts.ts [--apply] [--limit=N]
 */
import { writeFileSync, mkdirSync } from 'node:fs';

import { twentyClient } from './twenty-rest';

const APPLY = process.argv.includes('--apply');
const arg = (n: string, d = ''): string => {
  const hit = process.argv.find((a) => a.startsWith(`--${n}=`));
  return hit ? hit.split('=').slice(1).join('=') : d;
};

/**
 * Calling code, which national-number prefixes are mobile, and the valid national
 * lengths. Landline and mobile lengths differ inside one market -- a UAE mobile is
 * 9 digits (`50 894 5678`) but a Dubai landline is 8 (`4 340 0888`) -- so both are
 * listed, or every landline in the file gets thrown away as malformed.
 */
const MARKETS: Record<string, { cc: string; mobile: RegExp; nsnLen: number[] }> = {
  SD: { cc: '249', mobile: /^(9|1)/, nsnLen: [9] },
  SA: { cc: '966', mobile: /^5/, nsnLen: [9] },
  AE: { cc: '971', mobile: /^5/, nsnLen: [8, 9] },
  EG: { cc: '20', mobile: /^1/, nsnLen: [8, 9, 10] },
  QA: { cc: '974', mobile: /^[35667]/, nsnLen: [8] },
  BH: { cc: '973', mobile: /^3/, nsnLen: [8] },
  KW: { cc: '965', mobile: /^[569]/, nsnLen: [8] },
  // International school groups list a UK/US head office. Callable, never mobile here.
  GB: { cc: '44', mobile: /^7/, nsnLen: [10] },
};
const BY_CC = Object.fromEntries(Object.entries(MARKETS).map(([iso, m]) => [m.cc, iso]));
/** Longest first, so 966 is tried before 96. */
const CCS = Object.keys(BY_CC).sort((a, b) => b.length - a.length);

export type Reach = 'MOBILE' | 'LANDLINE' | 'NOT_DIALABLE';
export interface Normalized {
  e164: string | null;
  reach: Reach;
  why: string;
}

export function normalizePhone(raw: string, countryHint: string): Normalized {
  // Some rows arrived URL-encoded (`+971%202%20501%204777`) from an earlier import.
  // Decoding first turns two dead numbers into live ones; without it the digit strip
  // folds the `20`s of each `%20` into the number and the result fails on length --
  // which is at least a safe failure, but it is still a lost lead.
  let trimmed = (raw ?? '').trim();
  if (trimmed.includes('%')) {
    try { trimmed = decodeURIComponent(trimmed).trim(); } catch { /* leave as-is */ }
  }
  if (!trimmed) return { e164: null, reach: 'NOT_DIALABLE', why: 'empty' };

  let digits = trimmed.replace(/\D/g, '');
  if (!digits) return { e164: null, reach: 'NOT_DIALABLE', why: 'no digits' };

  // `00` is the international access prefix, so what follows is a country code.
  const explicitIntl = trimmed.trimStart().startsWith('+') || digits.startsWith('00');
  if (digits.startsWith('00')) digits = digits.slice(2);

  /** Strip a country code only if what remains is a plausible national number there. */
  const split = (d: string): { cc: string; nsn: string } | null => {
    for (const c of CCS) {
      if (!d.startsWith(c)) continue;
      // A national number may still carry its trunk `0` after the country code,
      // e.g. `(+44) 020 7131 0000`.
      const rest = d.slice(c.length).replace(/^0+/, '');
      if (MARKETS[BY_CC[c]].nsnLen.includes(rest.length)) return { cc: c, nsn: rest };
    }
    return null;
  };

  let cc: string;
  let nsn: string;
  const parsed = split(digits);
  if (parsed) {
    // Trust the number's own country code over the country column: two rows are
    // stored as OTHER/EG while their numbers say Bahrain and Kuwait.
    ({ cc, nsn } = parsed);
  } else if (explicitIntl) {
    // It announced itself as international but matches no market we serve.
    return { e164: null, reach: 'NOT_DIALABLE', why: 'unrecognised country code' };
  } else {
    const market = MARKETS[countryHint];
    if (!market) return { e164: null, reach: 'NOT_DIALABLE', why: `no country (${countryHint || '\u2014'})` };
    cc = market.cc;
    nsn = digits.replace(/^0+/, ''); // national trunk prefix
  }

  const iso = BY_CC[cc];
  const market = MARKETS[iso];

  // Toll-free and service numbers are real, but nobody answers a sales message on them.
  if (/^800/.test(nsn) || /^920/.test(nsn) || /^92\d{4}$/.test(nsn)) {
    return { e164: null, reach: 'NOT_DIALABLE', why: 'toll-free / service line' };
  }
  if (!market.nsnLen.includes(nsn.length)) {
    return { e164: null, reach: 'NOT_DIALABLE', why: `wrong length for ${iso} (${nsn.length}d)` };
  }

  const e164 = `+${cc}${nsn}`;
  return market.mobile.test(nsn)
    ? { e164, reach: 'MOBILE', why: `${iso} mobile` }
    : { e164, reach: 'LANDLINE', why: `${iso} landline — callable, not WhatsApp` };
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

interface Company {
  id: string; name?: string | null; country?: string | null;
  schoolPhone?: string | null; principalContact?: string | null;
  tier?: string | null; stage?: string | null;
}

async function main(): Promise<void> {
  const limit = Number(arg('limit', '0')) || Infinity;
  const { all, rest } = twentyClient();

  console.log('Reading companies …');
  const rows = ((await all('companies')) as unknown as Company[]).filter(
    (c) => (c.schoolPhone ?? '').trim() || (c.principalContact ?? '').trim()
  );

  const changes: {
    id: string; name: string; from: string; to: string; reach: Reach; why: string;
  }[] = [];
  const emails: { id: string; name: string; email: string }[] = [];
  const tally: Record<string, number> = {};

  for (const c of rows) {
    const country = (c.country ?? '').toUpperCase();
    const pc = (c.principalContact ?? '').trim();
    if (EMAIL.test(pc)) emails.push({ id: c.id, name: c.name ?? '', email: pc });

    const raw = (c.schoolPhone ?? '').trim() || (EMAIL.test(pc) ? '' : pc);
    if (!raw) continue;

    const n = normalizePhone(raw, country);
    tally[n.reach] = (tally[n.reach] ?? 0) + 1;
    if (n.e164 && n.e164 !== raw) {
      changes.push({ id: c.id, name: c.name ?? '', from: raw, to: n.e164, reach: n.reach, why: n.why });
    }
  }

  console.log(`\n═══ ${rows.length} schools with some contact ═══\n`);
  for (const [k, v] of Object.entries(tally).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${k.padEnd(14)} ${String(v).padStart(4)}`);
  }
  console.log(`\n  ${changes.length} numbers would be rewritten into E.164`);
  console.log(`  ${changes.filter((c) => c.reach === 'MOBILE').length} of those are mobile → WhatsApp-reachable`);
  console.log(`  ${emails.length} rows carry an email in principalContact → the email lane\n`);

  for (const c of changes.slice(0, 12)) {
    console.log(`   ${c.from.padEnd(18)} → ${c.to.padEnd(15)} ${c.reach.padEnd(9)} ${c.name.slice(0, 34)}`);
  }
  if (changes.length > 12) console.log(`   … and ${changes.length - 12} more`);

  mkdirSync('scripts/crm/.data', { recursive: true });
  writeFileSync('scripts/crm/.data/normalize-contacts.json',
    JSON.stringify({ generatedAt: new Date().toISOString(), tally, changes, emails }, null, 2));

  if (!APPLY) {
    console.log('\n  DRY RUN — nothing written. Re-run with --apply to update Twenty.\n');
    return;
  }

  console.log('\n  Applying …');
  let ok = 0;
  for (const c of changes.slice(0, limit === Infinity ? changes.length : limit)) {
    try {
      await rest('PATCH', `companies/${c.id}`, { schoolPhone: c.to });
      ok++;
    } catch (e) {
      console.error(`   ! ${c.name}: ${e instanceof Error ? e.message : e}`);
    }
  }
  console.log(`  ${ok}/${changes.length} updated.\n`);
}

// Only run when invoked directly -- the pure helpers above are imported by tests,
// and a module that runs a network job on import cannot be unit-tested.
if (process.argv[1] && /normalize-contacts\.ts$/.test(process.argv[1])) {
  main().catch((e) => {
    console.error(e instanceof Error ? e.message : e);
    process.exit(1);
  });
}
