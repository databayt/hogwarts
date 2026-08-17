// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Measure what Google Places would actually buy us -- BEFORE buying it.
 *
 * This is the sample, not the run. It takes 50 schools stratified across the five
 * countries, asks Places for each, and reports the hit rate for phone and website
 * SEPARATELY, because they are priced differently and because an average across
 * five very different markets is a number that flatters itself. Arabic school
 * names in Sudan may match far worse than in the UAE; that is the whole reason to
 * sample rather than assume.
 *
 * It writes NOTHING to Twenty. It is a measurement.
 *
 * ── Cost, and why this script is nearly free ────────────────────────────────
 *
 * The field mask picks the SKU, so the lookup and the payload are billed apart:
 *
 *   Text Search with fieldMask=places.id     $0        unlimited free
 *   Place Details ENTERPRISE                 $20/1,000, first 1,000/month free
 *
 * Phone and website live in the ENTERPRISE tier (Essentials and Pro do not carry
 * them), so that is the SKU any real run pays for. 50 schools sits inside the
 * free monthly 1,000, which makes this sample cost $0 -- and a full 2,941-school
 * run about $39. Prices pulled from Google's page on 2026-08-17; re-check before
 * quoting, and note the old $200/mo Maps credit was retired in March 2025.
 *
 * ── Before this can run ─────────────────────────────────────────────────────
 *
 * The key in .env (GOOGLE_TRANSLATE_API_KEY, project 861303536195) is restricted
 * to the Translation API and answers API_KEY_SERVICE_BLOCKED here. Enabling
 * Places is a console change on a project we already own -- not a new vendor --
 * but it is still a spend decision, and the standing constraint is
 * subscription-only. So it waits for an explicit yes.
 *
 *   GOOGLE_PLACES_API_KEY=… TWENTY_API_URL=http://localhost:3100 \
 *   TWENTY_API_KEY=$(security find-generic-password -s databayt-twenty -a hogwarts -w) \
 *     npx tsx scripts/crm/places-sample.ts [--n=50]
 */
import { writeFileSync, mkdirSync } from 'node:fs';

import { normalizePhone } from './normalize-contacts';
import { twentyClient } from './twenty-rest';

const arg = (n: string, d = ''): string => {
  const hit = process.argv.find((a) => a.startsWith(`--${n}=`));
  return hit ? hit.split('=').slice(1).join('=') : d;
};

const KEY = process.env.GOOGLE_PLACES_API_KEY ?? process.env.GOOGLE_TRANSLATE_API_KEY ?? '';
const SEARCH = 'https://places.googleapis.com/v1/places:searchText';

interface Company {
  id: string;
  name?: string | null;
  country?: string | null;
  schoolPhone?: string | null;
  principalContact?: string | null;
  domainName?: { primaryLinkUrl?: string | null } | null;
  address?: { addressLat?: number | null; addressLng?: number | null } | null;
}

interface Hit {
  id: string;
  name: string;
  country: string;
  matched: boolean;
  matchedName?: string;
  phone?: string;
  phoneReach?: string;
  website?: string;
  businessStatus?: string;
}

/**
 * One Text Search per school, biased by the coordinate Lane 1 backfilled. The
 * location bias is what stops "مدرسة النور" matching a school of the same name
 * two countries away -- with 100% coordinate coverage after the OSM refetch,
 * every row can be biased, which is the main reason to run Lane 1 first.
 */
async function lookup(c: Company): Promise<Hit> {
  const lat = c.address?.addressLat;
  const lng = c.address?.addressLng;
  const body: Record<string, unknown> = { textQuery: c.name ?? '', maxResultCount: 1 };
  if (lat != null && lng != null) {
    body.locationBias = { circle: { center: { latitude: lat, longitude: lng }, radius: 5000 } };
  }

  const res = await fetch(SEARCH, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': KEY,
      // ENTERPRISE-tier mask: phone + website are not in Essentials or Pro.
      'X-Goog-FieldMask':
        'places.id,places.displayName,places.nationalPhoneNumber,places.internationalPhoneNumber,places.websiteUri,places.businessStatus',
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(30_000),
  });
  const json = (await res.json()) as {
    places?: {
      displayName?: { text?: string };
      nationalPhoneNumber?: string;
      internationalPhoneNumber?: string;
      websiteUri?: string;
      businessStatus?: string;
    }[];
    error?: { message?: string; status?: string };
  };
  if (json.error) throw new Error(`${json.error.status}: ${json.error.message}`);

  const p = json.places?.[0];
  const base = { id: c.id, name: c.name ?? '', country: c.country ?? '' };
  if (!p) return { ...base, matched: false };

  const raw = p.internationalPhoneNumber ?? p.nationalPhoneNumber ?? '';
  const n = raw ? normalizePhone(raw, (c.country ?? '').toUpperCase()) : null;
  return {
    ...base,
    matched: true,
    matchedName: p.displayName?.text,
    phone: n?.e164 ?? undefined,
    phoneReach: n?.reach,
    website: p.websiteUri,
    businessStatus: p.businessStatus,
  };
}

async function main(): Promise<void> {
  if (!KEY) throw new Error('needs GOOGLE_PLACES_API_KEY');
  const n = Number(arg('n', '50'));
  const { all } = twentyClient();

  console.log('Reading schools from Twenty …');
  const rows = (await all('companies')) as unknown as Company[];

  // Sample only from schools we CANNOT already reach -- measuring Places against
  // rows that already have a phone would inflate the hit rate with answers we
  // did not need to buy.
  const unreachable = rows.filter(
    (c) => !(c.schoolPhone ?? '').trim() && !(c.principalContact ?? '').trim()
  );

  // Stratify across countries, proportionally, so one big market cannot hide a
  // market where Arabic name matching quietly fails.
  const byCountry = new Map<string, Company[]>();
  for (const c of unreachable) {
    const k = (c.country ?? 'OTHER').toUpperCase();
    byCountry.set(k, [...(byCountry.get(k) ?? []), c]);
  }
  const sample: Company[] = [];
  for (const [country, list] of byCountry) {
    const take = Math.max(1, Math.round((list.length / unreachable.length) * n));
    // Evenly spaced picks rather than the first N, which would all come from one
    // import batch and therefore one region.
    const step = Math.max(1, Math.floor(list.length / take));
    for (let i = 0; i < list.length && sample.filter((s) => s.country === country).length < take; i += step) {
      sample.push(list[i]);
    }
  }

  console.log(`  ${unreachable.length} unreachable schools; sampling ${sample.length}`);
  console.log(`  strata: ${[...byCountry].map(([k, v]) => `${k} ${v.length}`).join('  ')}\n`);

  const hits: Hit[] = [];
  for (const [i, c] of sample.entries()) {
    try {
      const h = await lookup(c);
      hits.push(h);
      const mark = h.matched ? (h.phone ? 'PHONE' : h.website ? 'web  ' : 'match') : '  —  ';
      console.log(`  ${String(i + 1).padStart(3)}/${sample.length} ${mark} ${(c.country ?? '').padEnd(3)} ${(c.name ?? '').slice(0, 46)}`);
    } catch (e) {
      console.error(`  ! ${c.name}: ${e instanceof Error ? e.message : e}`);
      // A key/permission error is fatal for the whole sample -- stop rather than
      // print 50 identical failures and call it a 0% hit rate.
      if (/PERMISSION_DENIED|API_KEY|BLOCKED/i.test(String(e))) {
        console.error('\n  Places is not enabled on this key. Nothing was measured.\n');
        process.exit(1);
      }
    }
    await new Promise((r) => setTimeout(r, 120));
  }

  // Per country AND overall, phone and website counted apart.
  const countries = [...new Set(hits.map((h) => h.country))].sort();
  console.log(`\n═══ Places sample — ${hits.length} schools ═══\n`);
  console.log(`  ${'country'.padEnd(9)} ${'n'.padStart(4)} ${'matched'.padStart(8)} ${'phone'.padStart(7)} ${'website'.padStart(8)} ${'mobile'.padStart(7)}`);
  const row = (label: string, set: Hit[]): void => {
    const pc = (k: number): string => (set.length ? `${((k / set.length) * 100).toFixed(0)}%` : '—');
    const ph = set.filter((h) => h.phone).length;
    console.log(
      `  ${label.padEnd(9)} ${String(set.length).padStart(4)} ${pc(set.filter((h) => h.matched).length).padStart(8)} ` +
        `${pc(ph).padStart(7)} ${pc(set.filter((h) => h.website).length).padStart(8)} ` +
        `${String(set.filter((h) => h.phoneReach === 'MOBILE').length).padStart(7)}`
    );
  };
  for (const c of countries) row(c, hits.filter((h) => h.country === c));
  console.log('  ' + '─'.repeat(48));
  row('ALL', hits);

  const phoneRate = hits.filter((h) => h.phone).length / (hits.length || 1);
  const remaining = 2_941;
  const billable = Math.max(0, remaining - 1_000);
  console.log(
    `\n  Projected over ${remaining} unreachable schools at this phone rate: ` +
      `~${Math.round(phoneRate * remaining)} phones`
  );
  console.log(`  Cost: lookup $0 (IDs-only is free) + details ${billable} × $20/1,000 = $${(billable * 0.02).toFixed(2)}`);
  console.log(`  → $${(phoneRate * remaining ? (billable * 0.02) / (phoneRate * remaining) : 0).toFixed(3)} per phone acquired\n`);

  mkdirSync('scripts/crm/.data', { recursive: true });
  writeFileSync(
    'scripts/crm/.data/places-sample.json',
    JSON.stringify({ generatedAt: new Date().toISOString(), hits }, null, 2)
  );
  console.log('  → scripts/crm/.data/places-sample.json');
  console.log('  Sample only. Nothing was written to Twenty.\n');
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
