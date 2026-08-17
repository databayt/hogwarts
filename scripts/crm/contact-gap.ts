// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Where the contact gap actually is (read-only).
 *
 * The hogwarts workspace holds thousands of school leads, and the great majority
 * cannot be contacted at all -- no phone, no email, no page. Discovery is not the
 * constraint; reachability is. Scraping more names adds rows we equally cannot
 * call, so before any enrichment run this reports which schools are missing a
 * contact AND, more usefully, *what signal they still carry*, because that is what
 * decides which hunt can work on them:
 *
 *   FB_PAGE  -- has a Facebook page  -> scrape its About/Intro, where Sudanese and
 *               Saudi schools actually publish a phone and a WhatsApp link
 *   WEBSITE  -- has a domain         -> fetch and extract
 *   MAP_ONLY -- an OSM node and a name, nothing else -> no automated lane exists;
 *               these need a human worksheet or a local directory, and pretending
 *               otherwise is how a pipeline burns a week for nothing
 *
 * Read-only by design: it never writes to Twenty. Enrichment writes are a separate
 * step so a bad extraction can never be blamed on a report.
 *
 *   TWENTY_API_URL=http://localhost:3100 \
 *   TWENTY_API_KEY=$(security find-generic-password -s databayt-twenty -a hogwarts -w) \
 *     npx tsx scripts/crm/contact-gap.ts [--country=SD] [--out=<file.json>]
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

import { twentyClient } from './twenty-rest';

interface Link {
  primaryLinkUrl?: string | null;
  primaryLinkLabel?: string | null;
}
interface Company {
  id: string;
  name?: string | null;
  country?: string | null;
  stage?: string | null;
  tier?: string | null;
  leadStatus?: string | null;
  schoolPhone?: string | null;
  principalContact?: string | null;
  principalName?: string | null;
  studentCount?: number | null;
  facebook?: Link | null;
  domainName?: Link | null;
  sourceUrl?: Link | null;
  address?: { addressCity?: string | null; addressState?: string | null } | null;
}

type Lane = 'CONTACTABLE' | 'FB_PAGE' | 'WEBSITE' | 'MAP_ONLY';

const arg = (n: string, d = ''): string => {
  const hit = process.argv.find((a) => a.startsWith(`--${n}=`));
  return hit ? hit.split('=').slice(1).join('=') : d;
};

const url = (l: Link | null | undefined): string => (l?.primaryLinkUrl ?? '').trim();
const txt = (s: string | null | undefined): string => (s ?? '').trim();

/** A page is only a lead if it is a Page. A /groups/ URL is a community, not a school. */
export const isUsableFacebookPage = (u: string): boolean =>
  /facebook\.com/i.test(u) && !/facebook\.com\/groups\//i.test(u);

export function laneFor(c: Company): Lane {
  if (txt(c.schoolPhone) || txt(c.principalContact)) return 'CONTACTABLE';
  if (isUsableFacebookPage(url(c.facebook))) return 'FB_PAGE';
  if (url(c.domainName)) return 'WEBSITE';
  return 'MAP_ONLY';
}

const pct = (n: number, total: number): string =>
  total === 0 ? '  0.0%' : `${((n / total) * 100).toFixed(1).padStart(5)}%`;

const tally = <T>(rows: T[], key: (r: T) => string): [string, number][] =>
  [...rows.reduce((m, r) => m.set(key(r), (m.get(key(r)) ?? 0) + 1), new Map<string, number>())]
    .sort((a, b) => b[1] - a[1]);

async function main(): Promise<void> {
  const country = arg('country').toUpperCase();
  const out = arg('out', 'scripts/crm/.data/contact-gap.json');

  const { all } = twentyClient();
  console.log('Reading companies from Twenty …');
  let rows = (await all('companies')) as unknown as Company[];
  if (country) rows = rows.filter((c) => (c.country ?? '').toUpperCase() === country);

  const total = rows.length;
  const byLane = new Map<Lane, Company[]>();
  for (const c of rows) {
    const lane = laneFor(c);
    (byLane.get(lane) ?? byLane.set(lane, []).get(lane)!).push(c);
  }
  const lane = (l: Lane): Company[] => byLane.get(l) ?? [];

  console.log(`\n═══ Contact gap${country ? ` — ${country}` : ''} — ${total} schools ═══\n`);
  const order: Lane[] = ['CONTACTABLE', 'FB_PAGE', 'WEBSITE', 'MAP_ONLY'];
  const label: Record<Lane, string> = {
    CONTACTABLE: 'reachable today',
    FB_PAGE: 'has a FB page   → scrape About',
    WEBSITE: 'has a website   → fetch + extract',
    MAP_ONLY: 'name + map pin  → human worksheet only',
  };
  for (const l of order) {
    console.log(`  ${l.padEnd(12)} ${String(lane(l).length).padStart(5)}  ${pct(lane(l).length, total)}   ${label[l]}`);
  }

  const reachable = lane('CONTACTABLE').length;
  const winnable = lane('FB_PAGE').length + lane('WEBSITE').length;
  console.log(
    `\n  Automated enrichment can plausibly reach ${winnable} more (${pct(winnable, total)}), ` +
      `taking contactable from ${reachable} to at most ${reachable + winnable}.`
  );
  console.log(
    `  The remaining ${lane('MAP_ONLY').length} carry no online handle at all — no scraper closes that;\n` +
      '  it is a worksheet, a phone book, or the network.'
  );

  console.log('\n  by country :', tally(rows, (c) => c.country ?? '—').map(([k, v]) => `${k} ${v}`).join('  '));
  console.log('  by tier    :', tally(rows, (c) => c.tier ?? '—').map(([k, v]) => `${k} ${v}`).join('  '));
  console.log('  by stage   :', tally(rows, (c) => c.stage ?? '—').map(([k, v]) => `${k} ${v}`).join('  '));

  // Schools already reachable and not yet worked -- outreach does not have to wait
  // for a single enrichment run to start.
  const workable = lane('CONTACTABLE').filter(
    (c) => ['COLD', 'PROSPECT'].includes(c.stage ?? '') && (c.tier === 'A' || c.tier === 'B')
  );
  console.log(`\n  ▸ Workable NOW (contactable, COLD/PROSPECT, tier A or B): ${workable.length}`);
  for (const c of workable.slice(0, 10)) {
    console.log(
      `      ${(c.tier ?? '?')} ${(c.stage ?? '').padEnd(8)} ${(c.name ?? '').slice(0, 44).padEnd(44)} ` +
        `${txt(c.schoolPhone) || txt(c.principalContact)}`
    );
  }
  if (workable.length > 10) console.log(`      … and ${workable.length - 10} more`);

  const payload = {
    generatedAt: new Date().toISOString(),
    country: country || 'ALL',
    totals: Object.fromEntries(order.map((l) => [l, lane(l).length])),
    workableNow: workable.map((c) => ({
      id: c.id, name: c.name, tier: c.tier, stage: c.stage,
      contact: txt(c.schoolPhone) || txt(c.principalContact),
    })),
    fbQueue: lane('FB_PAGE').map((c) => ({ id: c.id, name: c.name, country: c.country, url: url(c.facebook) })),
    webQueue: lane('WEBSITE').map((c) => ({ id: c.id, name: c.name, country: c.country, url: url(c.domainName) })),
  };
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, JSON.stringify(payload, null, 2));
  console.log(`\n  → ${out}\n`);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
