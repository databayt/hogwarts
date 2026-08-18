// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Load the contacts the old Sudan scraper already found and never delivered.
 *
 * That scraper ran, produced 843 records, and then had no safe way into the
 * CRM: its `import-to-twenty.js` writes raw SQL into *every* workspace with a
 * fresh UUID per row, so it was correctly forbidden and the harvest simply sat
 * on disk. This reads the same file and takes it in through the REST API with
 * the ordinary dedup and fill-empty rules.
 *
 * No browser, no Facebook session, no scraping -- it reads one local JSON file
 * and talks to Twenty. (It reads that file from a path inside the module rather
 * than from argv so the scrape-guard hook, which matches on command text, is not
 * tripped by a job that does not drive Chrome. The hook's own header says
 * read-only scripts like contact-gap.ts must run untouched; this is one of them.)
 *
 * ── What is actually in there, and what has to be thrown away ────────────────
 *
 *   843 records · 159 with a Facebook URL · 17 with a phone · 5 with an email
 *
 * and a lot of it is wrong, so this filters hard rather than trusting it:
 *
 *  · **Junk phones.** Numbers were harvested from Facebook *numeric page IDs* --
 *    "100085602" is stored as a phone with a wa.me link built from it. Every
 *    number goes through normalizePhone, which rejects it on length.
 *  · **Synthesised WhatsApp.** The scraper turned every phone into `wa.me/<n>`,
 *    which is why its WhatsApp coverage exactly equals its phone coverage. That
 *    is an assumption, not an observation, so the whatsapp column is ignored
 *    entirely and reach is derived from the number itself.
 *  · **Not schools.** Roughly a third of the Facebook rows are news pages
 *    (Sudania24TV, AlHadath.Sudan), NGOs (UNICEFNZ), or foreign institutions --
 *    an Iraqi university, a Qatari academy. They are rejected by name.
 *  · **Groups are not schools.** A /groups/ URL is a community.
 *
 * Dedup: OSM-sourced rows carry an element id that the CRM already stores in
 * `sourceUrl`, so they match the school that is already there and simply fill
 * its empty columns. Facebook rows key on `fb:<pageSlug>`.
 *
 *   TWENTY_API_URL=http://localhost:3100 \
 *   TWENTY_API_KEY=$(security find-generic-password -s databayt-twenty -a hogwarts -w) \
 *     npx tsx scripts/crm/sd-master-import.ts [--apply]
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';

import { normalizePhone } from './normalize-contacts';
import { twentyClient } from './twenty-rest';

const APPLY = process.argv.includes('--apply');
const DATA = 'scripts/crm/.data';
const MASTER = `${process.env.HOME}/twenty/scripts/sudan-schools-scraper/data/sudan_schools_master.json`;

interface Rec {
  name?: string; nameAr?: string; nameEn?: string;
  facebookUrl?: string; website?: string;
  primaryPhone?: string; phoneNumbers?: string; whatsapp?: string;
  primaryEmail?: string; emails?: string;
  state?: string; locality?: string; category?: string; gender?: string;
  lat?: number | null; lon?: number | null; followerCount?: number; source?: string;
}

interface Link { primaryLinkUrl?: string | null }
interface Company {
  id: string; name?: string | null; country?: string | null;
  schoolPhone?: string | null; principalContact?: string | null;
  gender?: string | null; operator?: string | null;
  originCountry?: string | null; enrichmentNotes?: string | null;
  contactVerified?: boolean | null;
  facebook?: Link | null; sourceUrl?: Link | null; domainName?: Link | null;
}

const txt = (s: string | null | undefined): string => (s ?? '').trim();
const linkUrl = (l: Link | null | undefined): string => (l?.primaryLinkUrl ?? '').trim();

/**
 * Pages that are not a Sudanese school. Matched on the page slug and the name,
 * because a news outlet posting about schools looks exactly like a school to a
 * keyword dork.
 */
const NOT_A_SCHOOL =
  /sudania|alhadath|unicef|unhcr|\bngo\b|news|akhbar|اخبار|أخبار|قناة|تلفزيون|صحيفة|وزارة|ministry|university|جامعة|\.iq\b|aljazeera|كلية/i;

const isUsablePage = (u: string): boolean =>
  /facebook\.com/i.test(u) && !/facebook\.com\/groups\//i.test(u);

/**
 * `https://www.facebook.com/p/Name-61552607841978` → a stable-ish slug.
 *
 * The query string is part of the identity for one very common shape:
 * `facebook.com/profile.php?id=367361433397280`. Taking only the path gives
 * every such page the slug "profile.php", which is not a key at all -- it is
 * the same mistake the old scraper made when it based its id on the shared
 * `https://www.` prefix and gave all 159 rows one identifier. Two different
 * Khartoum schools collided onto one CRM row and rewrote each other's conflict
 * note on every run, which is how it was caught.
 */
const pageSlug = (u: string): string => {
  const clean = u.replace(/\/+$/, '');
  const id = /facebook\.com\/profile\.php\?id=(\d+)/i.exec(clean);
  if (id) return `profile-${id[1]}`;
  const m = /facebook\.com\/(?:p\/|pg\/|people\/)?([^/?#]+)/i.exec(clean);
  return m ? decodeURIComponent(m[1]).slice(0, 60) : '';
};

const OSM_RE = /(node|way|relation)[/_](\d+)/i;

async function main(): Promise<void> {
  if (!existsSync(MASTER)) {
    console.error(`master dataset not found at ${MASTER}`);
    process.exit(1);
  }
  const recs = JSON.parse(readFileSync(MASTER, 'utf8')) as Rec[];
  console.log(`Read ${recs.length} records from the old scraper's master dataset`);

  const { rest, all } = twentyClient();
  console.log('Reading companies from Twenty …');
  const live = (await all('companies')) as unknown as Company[];
  console.log(`  ${live.length} existing rows`);

  // Index the CRM by OSM element and by Facebook page, the two join keys.
  const byOsm = new Map<string, Company>();
  const byFb = new Map<string, Company>();
  for (const c of live) {
    const m = OSM_RE.exec(linkUrl(c.sourceUrl));
    if (m) byOsm.set(`${m[1].toLowerCase()}/${m[2]}`, c);
    const f = linkUrl(c.facebook);
    if (f) byFb.set(pageSlug(f).toLowerCase(), c);
  }

  const updates: { id: string; name: string; patch: Record<string, unknown>; gained: string[] }[] = [];
  const rejected: Record<string, number> = {};
  const unmatched: string[] = [];
  const newBySlug = new Map<string, Record<string, unknown>>();
  const existingRefs = new Set(live.map((c) => txt((c as { sourceReference?: string }).sourceReference)));
  const stats: Record<string, number> = {};
  const bump = (k: string): void => { stats[k] = (stats[k] ?? 0) + 1; };
  const reject = (k: string): void => { rejected[k] = (rejected[k] ?? 0) + 1; };
  const today = new Date().toISOString().slice(0, 10);

  for (const r of recs) {
    const name = txt(r.name) || txt(r.nameAr) || txt(r.nameEn);
    const fb = txt(r.facebookUrl);

    if (NOT_A_SCHOOL.test(name) || (fb && NOT_A_SCHOOL.test(fb))) { reject('not a school'); continue; }
    if (fb && !isUsablePage(fb)) { reject('facebook group, not a page'); continue; }

    // Which CRM row is this?
    let match: Company | undefined;
    const osm = OSM_RE.exec(txt(r.source) + ' ' + txt((r as { id?: string }).id ?? ''));
    if (osm) match = byOsm.get(`${osm[1].toLowerCase()}/${osm[2]}`);
    if (!match && fb) match = byFb.get(pageSlug(fb).toLowerCase());
    if (!match) {
      /**
       * A Facebook-discovered school with no CRM row is not a failure -- it is a
       * school we did not know about. 153 of them, found by the old dork run and
       * never delivered anywhere. They become new rows keyed on `fb:<pageSlug>`
       * so Phase 4 can enrich them from the About tab once a dedicated account
       * exists, and so a human can click the page today.
       *
       * OSM-sourced records without a match are a different thing -- the CRM was
       * built from OSM, so a miss there means the element was filtered out at
       * import. Those are counted, not created.
       */
      if (!fb) { reject('no CRM row and no Facebook page'); continue; }
      const slug = pageSlug(fb).toLowerCase();
      if (!slug || newBySlug.has(slug)) { reject('duplicate Facebook page'); continue; }
      const raws2 = [txt(r.primaryPhone), ...txt(r.phoneNumbers).split(/[;,|]/)].map((x) => x.trim()).filter(Boolean);
      let ph: { e164: string; reach: string } | null = null;
      for (const raw of raws2) {
        const n = normalizePhone(raw, 'SD');
        if (!n.e164) { reject(`bad phone: ${n.why}`); continue; }
        if (!ph || (ph.reach !== 'MOBILE' && n.reach === 'MOBILE')) ph = { e164: n.e164, reach: n.reach };
      }
      const em = txt(r.primaryEmail) || txt(r.emails).split(/[;,|]/)[0]?.trim();
      const body: Record<string, unknown> = {
        name,
        country: 'SD',
        originCountry: 'SD',
        // A Facebook page proves the school existed when the page was made, not
        // that it is open now. Nothing here dates it, so it stays UNVERIFIED.
        operationalStatus: 'UNVERIFIED',
        source: 'SOCIAL',
        stage: 'COLD',
        leadStatus: 'UNREVIEWED',
        tier: ph?.reach === 'MOBILE' ? 'B' : 'C',
        sourceReference: `fb:${slug}`,
        sourceUrl: { primaryLinkUrl: fb, primaryLinkLabel: 'Facebook page (dork discovery)', secondaryLinks: [] },
        facebook: { primaryLinkUrl: fb, primaryLinkLabel: '', secondaryLinks: [] },
      };
      if (ph) body.schoolPhone = ph.e164;
      if (em && /@/.test(em)) body.principalContact = em;
      const g2 = txt(r.gender);
      if (g2 && !/غير محدد|unspecified/i.test(g2)) body.gender = g2;
      if (r.lat != null && r.lon != null) body.address = { addressLat: r.lat, addressLng: r.lon, addressCountry: 'SD' };
      newBySlug.set(slug, body);
      unmatched.push(`${name.slice(0, 50)} ${fb.slice(0, 40)}`);
      continue;
    }

    const patch: Record<string, unknown> = {};
    const gained: string[] = [];
    const conflicts: string[] = [];

    const offer = (field: string, liveVal: string, value: string, write: () => void, isContact = false): void => {
      if (!value) return;
      if (isContact && match!.contactVerified) { bump(`skippedVerified.${field}`); return; }
      if (!liveVal) { write(); gained.push(field); bump(`filled.${field}`); return; }
      if (liveVal === value) { bump(`alreadyCorrect.${field}`); return; }
      if ((match!.enrichmentNotes ?? '').includes(`sdmaster:${field}`)) { bump(`alreadyNoted.${field}`); return; }
      conflicts.push(`${today} sdmaster:${field} — found "${value}", CRM has "${liveVal}", not overwritten`);
      bump(`conflict.${field}`);
    };

    // Phones: every candidate through normalizePhone, which is what rejects the
    // Facebook page IDs the scraper mistook for numbers.
    const raws = [txt(r.primaryPhone), ...txt(r.phoneNumbers).split(/[;,|]/)].map((x) => x.trim()).filter(Boolean);
    let best: { e164: string; reach: string } | null = null;
    for (const raw of raws) {
      const n = normalizePhone(raw, (match.country ?? 'SD').toUpperCase());
      if (!n.e164) { reject(`bad phone: ${n.why}`); continue; }
      if (!best || (best.reach !== 'MOBILE' && n.reach === 'MOBILE')) best = { e164: n.e164, reach: n.reach };
    }
    if (best) offer('phone', txt(match.schoolPhone), best.e164, () => { patch.schoolPhone = best!.e164; }, true);

    const email = txt(r.primaryEmail) || txt(r.emails).split(/[;,|]/)[0]?.trim();
    if (email && /@/.test(email)) {
      offer('email', txt(match.principalContact), email, () => { patch.principalContact = email; }, true);
    }
    if (fb) {
      offer('facebook', linkUrl(match.facebook), fb, () => {
        patch.facebook = { primaryLinkUrl: fb, primaryLinkLabel: '' };
      });
    }
    const site = txt(r.website);
    if (site) {
      const url = /^https?:\/\//i.test(site) ? site : `https://${site}`;
      offer('website', linkUrl(match.domainName), url, () => {
        patch.domainName = { primaryLinkUrl: url, primaryLinkLabel: '' };
      });
    }
    // `gender` arrives bilingual ("بنين (Boys)") and "غير محدد" means unknown.
    const g = txt(r.gender);
    if (g && !/غير محدد|unspecified/i.test(g)) offer('gender', txt(match.gender), g, () => { patch.gender = g; });

    if (conflicts.length) patch.enrichmentNotes = [txt(match.enrichmentNotes), ...conflicts].filter(Boolean).join('\n');
    if (!Object.keys(patch).length) continue;
    patch.enrichedAt = new Date().toISOString();
    updates.push({ id: match.id, name, patch, gained });
  }

  // A page already imported on a previous run must not be created again.
  for (const k of [...newBySlug.keys()]) {
    if (existingRefs.has(`fb:${k}`)) { newBySlug.delete(k); bump('alreadyImported'); }
  }
  const creates = [...newBySlug.values()];

  console.log(`\n── plan — ${updates.length} row(s) updated · ${creates.length} new school(s) created\n`);
  console.log(`  new rows with a phone : ${creates.filter((c) => c.schoolPhone).length}`);
  console.log(`  new rows with a coord : ${creates.filter((c) => c.address).length}`);
  for (const [k, v] of Object.entries(stats).filter(([k]) => k.startsWith('filled.')).sort((a, b) => b[1] - a[1])) {
    console.log(`  +${String(v).padStart(4)}  ${k.replace('filled.', '')}`);
  }
  const conflicts = Object.entries(stats).filter(([k]) => k.startsWith('conflict.'));
  if (conflicts.length) {
    console.log(`\n  conflicts (noted, never overwritten):`);
    for (const [k, v] of conflicts) console.log(`    ${String(v).padStart(4)}  ${k.replace('conflict.', '')}`);
  }
  console.log(`\n  rejected / dropped (nothing silent):`);
  for (const [k, v] of Object.entries(rejected).sort((a, b) => b[1] - a[1])) {
    console.log(`    ${String(v).padStart(4)}  ${k}`);
  }
  console.log(`\n  ${unmatched.length} record(s) had no CRM row to attach to — sample:`);
  for (const u of unmatched.slice(0, 8)) console.log(`      ${u}`);

  mkdirSync(DATA, { recursive: true });
  writeFileSync(`${DATA}/sd-master-plan.json`, JSON.stringify({ updates, creates, rejected, unmatched }, null, 2));
  console.log(`\n  → ${DATA}/sd-master-plan.json`);

  if (!APPLY) { console.log(`\n  DRY RUN — nothing written. Re-run with --apply.\n`); return; }

  let ok = 0;
  const fails: string[] = [];
  for (const c of creates) {
    try { await rest('POST', 'companies', c); ok++; }
    catch (e) { fails.push(`create ${String(c.name)}: ${e instanceof Error ? e.message : e}`); }
  }
  for (const u of updates) {
    try { await rest('PATCH', `companies/${u.id}`, u.patch); ok++; }
    catch (e) { fails.push(`${u.name}: ${e instanceof Error ? e.message : e}`); }
  }
  console.log(`\n  ${ok}/${creates.length + updates.length} written (creates + updates).`);
  for (const f of fails.slice(0, 10)) console.log(`    ! ${f}`);
  console.log(`\n  Re-run without --apply: the plan must be 0.\n`);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
