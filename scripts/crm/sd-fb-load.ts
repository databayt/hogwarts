// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Take the Facebook About-tab harvest into Twenty.
 *
 * Reads the append-only ledger `enrich-fb-about.ts` writes and applies the same
 * rules every other lane uses: fill empty, never replace populated, a populated
 * disagreement becomes a dated note, and a row a human marked `contactVerified`
 * keeps its contact fields.
 *
 * No browser and no network beyond Twenty -- the scraping already happened, and
 * keeping the write separate means a bad extraction can be re-planned without
 * re-visiting a single page, which is the expensive and account-risky half.
 *
 * ── One rule specific to this source ────────────────────────────────────────
 *
 * A phone whose country code does not belong to the row's country is NOT
 * written; it is recorded as a note instead. The dork run tagged its finds
 * `country=SD` from the query that found them rather than from anything in the
 * page, and the About tab is the first place that assumption meets evidence:
 * "River Nile School" turned out to be in Victoria, Australia, with a +61
 * number. Writing that as a Sudanese school's phone would put a wrong number in
 * front of a salesperson, which is worse than an empty field.
 *
 *   TWENTY_API_URL=http://localhost:3100 \
 *   TWENTY_API_KEY=$(security find-generic-password -s databayt-twenty -a hogwarts -w) \
 *     npx tsx scripts/crm/sd-fb-load.ts [--apply]
 */
import { readFileSync, existsSync, writeFileSync } from 'node:fs';

import { twentyClient } from './twenty-rest';

const APPLY = process.argv.includes('--apply');
const DATA = 'scripts/crm/.data';
const LEDGER = `${DATA}/fb-about.jsonl`;

interface AboutResult {
  id: string; name: string; url: string; ok: boolean; why?: string;
  phones: { e164: string; reach: string; whatsapp: boolean }[];
  emails: string[]; website?: string; address?: string;
  category?: string; followers?: number; capturedAt: string;
}
interface Link { primaryLinkUrl?: string | null }
interface Company {
  id: string; name?: string | null; country?: string | null;
  schoolPhone?: string | null; principalContact?: string | null;
  contactVerified?: boolean | null; enrichmentNotes?: string | null;
  originCountry?: string | null;
  operationalStatus?: string | null; lastSeenAt?: string | null;
  domainName?: Link | null;
  address?: { addressStreet1?: string | null } | null;
}

const txt = (s: string | null | undefined): string => (s ?? '').trim();
const linkUrl = (l: Link | null | undefined): string => (l?.primaryLinkUrl ?? '').trim();

/** Which calling code belongs to which country column. */
const CC_OF: Record<string, string> = {
  SD: '249', SA: '966', AE: '971', EG: '20', QA: '974',
  KW: '965', BH: '973', OM: '968', UG: '256', KE: '254', ET: '251', TD: '235', TR: '90',
};
const COUNTRY_OF_CC: Record<string, string> = {
  '249': 'SD', '966': 'SA', '971': 'AE', '974': 'QA', '20': 'EG',
  '965': 'KW', '973': 'BH', '968': 'OM', '256': 'UG', '254': 'KE', '251': 'ET', '235': 'TD', '90': 'TR',
};

/**
 * Read the calling code off an E.164 number by matching KNOWN codes, longest
 * first -- never by a greedy digit capture.
 *
 * `/^\+(\d{1,3})/` looks right and is not: on `+201156162267` it takes three
 * digits and yields "201", so every Egyptian number failed the country lookup
 * while the three-digit codes (966, 971) worked. Egypt is the largest diaspora
 * market, so the bug hid exactly the rows this job most wanted to find.
 */
const ccOf = (e164: string): string | null =>
  // Longest first: '20' must not shadow '249', and '90' must not shadow '968'.
  ['249', '966', '971', '974', '965', '973', '968', '256', '254', '251', '235', '20', '90']
    .find((cc) => e164.startsWith(`+${cc}`)) ?? null;

/**
 * A country-coded TLD is the same kind of evidence as a calling code, and it
 * catches the case the phone check cannot. "River Nile School" is filed SD by
 * the dork run; its page publishes `admin@rivernileschool.vic.edu.au` and
 * `rivernileschool.vic.edu.au`. Its +61 phone never reached the phone check
 * because the Sudan normaliser had already rejected it, so without this the
 * loader would have quietly written an Australian school's real email onto a
 * row a salesperson would call as Sudanese.
 */
const TLD_COUNTRY: Record<string, string> = {
  au: 'AU', uk: 'GB', iq: 'IQ', qa: 'QA', sa: 'SA', ae: 'AE', eg: 'EG', sd: 'SD',
  kw: 'KW', bh: 'BH', om: 'OM', tr: 'TR', ke: 'KE', ug: 'UG', et: 'ET', td: 'TD',
  us: 'US', ca: 'CA', de: 'DE', fr: 'FR',
};

/** The country a domain or email address implies, if any. */
const impliedCountry = (s: string): string | null => {
  const host = /@([\w.-]+)$/.exec(s)?.[1] ?? /^https?:\/\/([^/]+)/.exec(s)?.[1] ?? '';
  const tld = host.toLowerCase().split('.').pop() ?? '';
  return TLD_COUNTRY[tld] ?? null;
};

async function main(): Promise<void> {
  if (!existsSync(LEDGER)) { console.error(`no ledger at ${LEDGER} — run enrich-fb-about.ts first`); process.exit(1); }
  const results = readFileSync(LEDGER, 'utf8').split('\n').filter(Boolean)
    .map((l) => JSON.parse(l) as AboutResult);
  // The ledger is append-only, so a page re-visited later wins.
  const latest = new Map<string, AboutResult>();
  for (const r of results) latest.set(r.url, r);
  console.log(`Read ${results.length} ledger line(s) → ${latest.size} distinct page(s)`);

  const { rest, all } = twentyClient();
  const live = (await all('companies')) as unknown as Company[];
  const byId = new Map(live.map((c) => [c.id, c]));

  const updates: { id: string; name: string; patch: Record<string, unknown> }[] = [];
  const stats: Record<string, number> = {};
  const mismatched: string[] = [];
  const bump = (k: string): void => { stats[k] = (stats[k] ?? 0) + 1; };
  const today = new Date().toISOString().slice(0, 10);

  for (const r of latest.values()) {
    const c = byId.get(r.id);
    if (!c) { bump('row gone from CRM'); continue; }
    if (!r.ok) { bump(`no content: ${r.why ?? 'unknown'}`); continue; }

    const patch: Record<string, unknown> = {};
    const address: Record<string, unknown> = {};
    const conflicts: string[] = [];

    const offer = (field: string, liveVal: string, value: string | undefined, write: () => void, isContact = false): void => {
      if (!value) return;
      if (isContact && c.contactVerified) { bump(`skippedVerified.${field}`); return; }
      // A note for this field means the situation was already adjudicated -- a
      // conflict recorded, or a unique constraint that refused the write. This
      // check must come BEFORE the empty test: a field that can never be written
      // stays empty, so an empty-only guard re-plans it on every single run and
      // the plan never reaches zero.
      if ((c.enrichmentNotes ?? '').includes(`fb:${field}`)) { bump(`alreadyAdjudicated.${field}`); return; }
      if (!liveVal) { write(); bump(`filled.${field}`); return; }
      if (liveVal === value) { bump(`alreadyCorrect.${field}`); return; }
      conflicts.push(`${today} fb:${field} — found "${value}", CRM has "${liveVal}", not overwritten`);
      bump(`conflict.${field}`);
    };

    /**
     * The country notes below are pushed outside `offer()`, so they need the
     * same "already adjudicated" guard it applies -- without it the row is
     * re-noted on every run and the plan never reaches zero. Same lesson as the
     * OSM job: an idempotency check that cannot converge is one nobody can use.
     */
    const noted = (marker: string): boolean => (c.enrichmentNotes ?? '').includes(marker);

    // Prefer a mobile: only a mobile can be reached on WhatsApp.
    const phone = r.phones.find((p) => p.reach === 'MOBILE') ?? r.phones[0];
    if (phone) {
      const want = CC_OF[(c.country ?? '').toUpperCase()];
      const got = ccOf(phone.e164) ?? '';
      if (want && !phone.e164.startsWith(`+${want}`)) {
        /**
         * A phone whose country contradicts the row is usually not an error --
         * it is the diaspora, and it is the whole point of this exercise.
         *
         * "شركة الخرطوم للتعليم الخاص مدارس القبس", "أكاديمية الخرطوم للعلوم
         * الإدارية", "Confluence International School of Khartoum" and
         * "مدرسة الخرطوم العربية العالمية" all answer on Egyptian +20 numbers.
         * They are Khartoum schools that moved to Cairo after April 2023 and
         * kept their names. Withholding those numbers would discard precisely
         * the reachable leads this whole job set out to find.
         *
         * So the phone re-files the row rather than being refused: the school
         * keeps originCountry=SD (it is Sudanese) and gains the country it now
         * operates in, which is what keeps phone normalisation and geography
         * honest. The change is recorded, because it is an inference from one
         * number and a human may want to check it.
         *
         * This applies only to rows already marked Sudanese. Anything else with
         * a foreign number is a mis-tagged discovery, not a relocation, and is
         * still refused below.
         */
        const refiled = COUNTRY_OF_CC[got];
        if (noted('fb:country') || noted('fb:phone')) { bump('alreadyAdjudicated.country'); }
        else if (refiled && txt(c.originCountry) === 'SD') {
          patch.country = refiled;
          patch.schoolPhone = phone.e164;
          conflicts.push(
            `${today} fb:country — the page answers on +${got}…, so this Sudanese school is operating in ` +
              `${refiled}, not ${c.country}. Country re-filed from the page; originCountry stays SD.`
          );
          bump(`refiled to ${refiled} (diaspora)`);
          bump('filled.phone');
        } else {
          conflicts.push(
            `${today} fb:phone — the page publishes +${got}… but this row is filed as ${c.country}. ` +
              `Not written: the country came from the search query, not the page. Re-file the row first.`
          );
          mismatched.push(`${r.name.slice(0, 40)} — ${phone.e164} vs country=${c.country}`);
          bump('country mismatch — phone withheld');
        }
      } else {
        offer('phone', txt(c.schoolPhone), phone.e164, () => { patch.schoolPhone = phone.e164; }, true);
      }
    }

    const email = r.emails.find((e) => /@/.test(e));
    const site = r.website ? r.website.split(/[?&]fbclid=/)[0] : undefined;

    // Does the page's own domain contradict where we filed this school?
    const rowCountry = (c.country ?? '').toUpperCase();
    const implied = [email, site].filter(Boolean).map((x) => impliedCountry(x!)).find(Boolean) ?? null;
    const foreign = implied && rowCountry && implied !== rowCountry;

    if (foreign && noted('fb:country')) {
      bump('alreadyAdjudicated.domain');
    } else if (foreign) {
      conflicts.push(
        `${today} fb:country — the page's own domain is .${implied.toLowerCase()} but this row is filed as ` +
          `${rowCountry}. Contact details withheld: the country came from the search query, not the page. ` +
          `Re-file the row, then re-run.`
      );
      mismatched.push(`${r.name.slice(0, 40)} — domain implies ${implied}, filed ${rowCountry}`);
      bump('country mismatch — contacts withheld');
    } else {
      if (email) offer('email', txt(c.principalContact), email, () => { patch.principalContact = email; }, true);
      if (site) {
        offer('website', linkUrl(c.domainName), site, () => {
          patch.domainName = { primaryLinkUrl: site, primaryLinkLabel: '' };
        });
      }
    }
    if (r.address && !txt(c.address?.addressStreet1)) {
      address.addressStreet1 = r.address;
      bump('filled.street');
    }
    if (Object.keys(address).length) patch.address = address;

    // The page rendered, so the school was publicly present when we looked.
    if (txt(c.operationalStatus) === 'UNVERIFIED' && (r.phones.length || r.emails.length || r.website)) {
      patch.operationalStatus = 'OPERATING';
      bump('filled.operationalStatus');
    }
    if (!txt(c.lastSeenAt)) { patch.lastSeenAt = r.capturedAt; bump('filled.lastSeenAt'); }

    if (conflicts.length) patch.enrichmentNotes = [txt(c.enrichmentNotes), ...conflicts].filter(Boolean).join('\n');
    const meaningful = Object.keys(patch).filter((k) => k !== 'lastSeenAt');
    if (!meaningful.length) continue;
    patch.enrichedAt = new Date().toISOString();
    updates.push({ id: r.id, name: r.name, patch });
  }

  console.log(`\n── plan — ${updates.length} row(s) would be updated\n`);
  for (const [k, v] of Object.entries(stats).filter(([k]) => k.startsWith('filled.')).sort((a, b) => b[1] - a[1])) {
    console.log(`  +${String(v).padStart(4)}  ${k.replace('filled.', '')}`);
  }
  const other = Object.entries(stats).filter(([k]) => !k.startsWith('filled.'));
  if (other.length) {
    console.log(`\n  other outcomes:`);
    for (const [k, v] of other.sort((a, b) => b[1] - a[1])) console.log(`    ${String(v).padStart(4)}  ${k}`);
  }
  if (mismatched.length) {
    console.log(`\n  ${mismatched.length} row(s) whose page phone contradicts their filed country — withheld, noted:`);
    for (const m of mismatched.slice(0, 10)) console.log(`      ${m}`);
  }

  writeFileSync(`${DATA}/fb-load-plan.json`, JSON.stringify({ updates }, null, 2));
  console.log(`\n  → ${DATA}/fb-load-plan.json`);
  if (!APPLY) { console.log('\n  DRY RUN — nothing written. Re-run with --apply.\n'); return; }

  let ok = 0;
  const fails: string[] = [];
  let degraded = 0;
  for (const u of updates) {
    try { await rest('PATCH', `companies/${u.id}`, u.patch); ok++; }
    catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      // domainName is UNIQUE and school groups legitimately share one website.
      // Drop the contested field, keep everything else, and say why.
      if (/duplicate entry/i.test(msg) && u.patch.domainName) {
        const { domainName, ...rest2 } = u.patch;
        const url = (domainName as { primaryLinkUrl?: string }).primaryLinkUrl ?? '';
        rest2.enrichmentNotes = [String(rest2.enrichmentNotes ?? ''),
          `${today} fb:website — "${url}" already belongs to another school (a group shares one site); not set here`]
          .filter(Boolean).join('\n');
        try { await rest('PATCH', `companies/${u.id}`, rest2); degraded++; }
        catch (e2) { fails.push(`${u.name}: ${e2 instanceof Error ? e2.message : e2}`); }
      } else fails.push(`${u.name}: ${msg}`);
    }
  }
  if (degraded) console.log(`  ${degraded} written without a contested unique field (noted, not lost)`);
  console.log(`\n  ${ok}/${updates.length} updated.`);
  for (const f of fails.slice(0, 10)) console.log(`    ! ${f}`);
  console.log('\n  Re-run without --apply: the plan must be 0.\n');
}

main().catch((e) => { console.error(e instanceof Error ? e.message : e); process.exit(1); });
