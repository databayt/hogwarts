// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Load harvested Sudanese schools into Twenty -- the single write path.
 *
 * Every lane in this job (the diaspora directories, school websites, Facebook
 * About tabs) ends here rather than writing its own rows, so the dedup rules and
 * the fill-empty discipline exist once instead of three times.
 *
 * ── Dedup, in order, because the cheap test should run first ────────────────
 *
 *  1. **Stable external id** (`sudafoot:eg:<slug>`, later `fb:<pageSlug>`) held
 *     in `sourceReference`. A GET filtered on that field before any create is
 *     what makes a second run write nothing.
 *  2. **Folded-name match** against existing rows. Arabic is folded first
 *     (diacritics and tatweel stripped, أإآٱ→ا, ى→ي, ة→ه, leading ال dropped),
 *     then at least **two** significant tokens must agree after category words
 *     (مدرسة/مدارس/روضة/الخاصة/العالمية/school/international) are removed.
 *     One token is never enough: probing these directories against the CRM,
 *     "دار المعالي" matched "دار المعالي لتحفيظ القران نساء" -- a women's Qur'an
 *     centre in Riyadh, not the school. A one-token rule would have merged them.
 *  3. **Coordinate proximity** when both sides have one.
 *
 * ── The write rules ─────────────────────────────────────────────────────────
 *
 * REST only, never SQL -- `import-to-twenty.js` in the old scraper writes raw
 * SQL into *every* workspace with a fresh UUID per row, and is forbidden.
 * Fill empty, never replace populated; a populated field that disagrees becomes
 * a dated line in `enrichmentNotes`. A row a human marked `contactVerified` is
 * left alone for contact fields -- someone decided -- but still gets its empty
 * *attribute* columns filled, because verifying a phone says nothing about a
 * missing curriculum.
 *
 * **No fabrication:** every record must carry a `sourceUrl` that was actually
 * fetched, asserted before the write. A school that sounds plausible but has no
 * fetched source is the one failure that would make this list worse than useless
 * to whoever picks up the phone.
 *
 *   TWENTY_API_URL=http://localhost:3100 \
 *   TWENTY_API_KEY=$(security find-generic-password -s databayt-twenty -a hogwarts -w) \
 *     npx tsx scripts/crm/sd-upsert.ts [--apply]
 */
import { readFileSync, writeFileSync } from 'node:fs';

import { twentyClient } from './twenty-rest';

const APPLY = process.argv.includes('--apply');
const DATA = 'scripts/crm/.data/diaspora';

interface Phone {
  e164: string;
  reach: string;
  raw: string;
  whatsapp: boolean;
  countryGuess?: string;
}
interface Harvested {
  externalId: string;
  name: string;
  country: 'EG' | 'SA';
  section: string;
  addressLines: string[];
  phones: Phone[];
  emails: string[];
  mapsUrl?: string;
  placeUrl?: string;
  lat?: number;
  lng?: number;
  curriculum?: string;
  grades?: string;
  studyMode?: string;
  branches: string[];
  contactPerson?: string;
  sourceUrl: string;
  lastSeen: string;
}

interface Link { primaryLinkUrl?: string | null }
interface Company {
  id: string;
  name?: string | null;
  country?: string | null;
  schoolPhone?: string | null;
  principalContact?: string | null;
  principalName?: string | null;
  grades?: string | null;
  curriculum?: string | null;
  schoolType?: string | null;
  originCountry?: string | null;
  operationalStatus?: string | null;
  contactVerified?: boolean | null;
  enrichmentNotes?: string | null;
  sourceReference?: string | null;
  domainName?: Link | null;
  sourceUrl?: Link | null;
  address?: {
    addressStreet1?: string | null;
    addressCity?: string | null;
    addressCountry?: string | null;
    addressLat?: number | null;
    addressLng?: number | null;
  } | null;
}

const txt = (s: string | null | undefined): string => (s ?? '').trim();

// ── Arabic-aware name matching ───────────────────────────────────────────────

/** Fold orthography so "مدرسه" and "مدرسة" are the same word. */
const foldArabic = (s: string): string =>
  (s ?? '')
    .replace(/[ً-ْـ]/g, '')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();

/** Words that describe the category, not the school. */
const NOISE = new Set([
  'مدرسه', 'مدارس', 'روضه', 'رياض', 'اكاديميه', 'أكاديميه', 'مركز', 'مراكز', 'معهد',
  'الخاصه', 'خاصه', 'العالميه', 'عالميه', 'الدوليه', 'دوليه', 'السودانيه', 'سودانيه',
  'التعليميه', 'تعليميه', 'النموذجيه', 'للتعليم', 'بالقاهره', 'ال',
  // Ordinals and phase words: "الأولى" appears in a great many school names and
  // carries no identity. It is what matched "رياض ومدارس الخرطوم الاولى" to
  // "المتوسطة الأولى والثانوية الأولى للبنات".
  'اولي', 'الاولي', 'ثانيه', 'الثانيه', 'ثالثه', 'الثالثه', 'متوسطه', 'المتوسطه',
  'ثانويه', 'الثانويه', 'ابتدائيه', 'الابتدائيه', 'بنات', 'بنين', 'للبنات', 'للبنين',
  'school', 'schools', 'international', 'academy', 'centre', 'center', 'the', 'for', 'and',
]);

const tokens = (name: string): string[] =>
  foldArabic(name)
    // Parenthetical notes are branch and district asides, never identity:
    // "مركز المعرفة (فرعين فى عين شمس وفيصل)" matched "مدرسة الفرير عين شمس"
    // purely on the district inside the brackets.
    .replace(/\([^)]*\)/g, ' ')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .map((w) => w.replace(/^ال/, ''))
    .filter((w) => w.length > 1 && !NOISE.has(w));

/**
 * Two significant tokens must agree. The comment above records why one is not
 * enough; this is the function that enforces it.
 */
function nameMatches(a: string, b: string): boolean {
  const ta = new Set(tokens(a));
  const tb = tokens(b);
  const shared = tb.filter((t) => ta.has(t));
  return shared.length >= 2;
}

const haversineKm = (aLat: number, aLng: number, bLat: number, bLng: number): number => {
  const R = 6371, r = Math.PI / 180;
  const dLat = (bLat - aLat) * r, dLng = (bLng - aLng) * r;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(aLat * r) * Math.cos(bLat * r) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
};

/** Only map a curriculum we can actually read off the text. Never guess. */
function mapCurriculum(raw: string | undefined): string | null {
  const t = foldArabic(raw ?? '');
  if (!t) return null;
  if (/بريطاني|igcse|كامبريدج/i.test(t)) return 'IGCSE';
  if (/امريكي|أمريكي|american/i.test(t)) return 'AMERICAN';
  if (/فرنسي|french/i.test(t)) return 'FRENCH';
  if (/سوداني|وطني|قومي/.test(t)) return 'NATIONAL';
  return null;
}

async function main(): Promise<void> {
  const { rest, all } = twentyClient();
  const harvest = JSON.parse(readFileSync(`${DATA}/schools.json`, 'utf8')) as { schools: Harvested[] };
  const schools = harvest.schools;
  console.log(`Read ${schools.length} harvested schools`);

  console.log('Reading existing companies from Twenty …');
  const live = (await all('companies')) as unknown as Company[];
  console.log(`  ${live.length} existing rows`);

  const byExternalId = new Map<string, Company>();
  for (const c of live) {
    const ref = txt(c.sourceReference);
    if (ref.startsWith('sudafoot:') || ref.startsWith('fb:')) byExternalId.set(ref, c);
  }

  const creates: { s: Harvested; body: Record<string, unknown> }[] = [];
  const updates: { s: Harvested; id: string; patch: Record<string, unknown>; why: string }[] = [];
  const skipped: string[] = [];
  const nearMisses: string[] = [];
  const stats: Record<string, number> = {};
  const bump = (k: string): void => { stats[k] = (stats[k] ?? 0) + 1; };
  const today = new Date().toISOString().slice(0, 10);

  for (const s of schools) {
    // The no-fabrication assert.
    if (!s.sourceUrl || !/^https?:\/\//.test(s.sourceUrl)) {
      throw new Error(`${s.name}: no fetched source URL — refusing to write a record that cannot be traced`);
    }

    const primary = s.phones.find((p) => p.reach === 'MOBILE') ?? s.phones[0];
    const email = s.emails[0];
    const street = s.addressLines[0];
    const curriculum = mapCurriculum(s.curriculum);

    // ── find an existing row ────────────────────────────────────────────────
    let match = byExternalId.get(s.externalId) ?? null;
    let why = 'externalId';
    if (!match) {
      /**
       * Name matching is restricted to rows already known to be Sudanese
       * (`originCountry=SD`), and this restriction is the whole safeguard.
       *
       * Without it the first dry run produced three matches and **all three
       * were wrong**: "مركز المعرفة (فرعين فى عين شمس وفيصل)" matched the
       * French Catholic "مدرسة الفرير عين شمس" on the district inside its
       * brackets; "مدرسة دار المعالي الخاصة" matched "دار المعالي لتحفيظ
       * القران نساء", a women's Qur'an centre; and "رياض ومدارس الخرطوم
       * الاولى" matched "المتوسطة الأولى والثانوية الأولى للبنات" on a
       * repeated ordinal. Applying them would have written Sudanese phone
       * numbers onto three unrelated Egyptian and Saudi schools.
       *
       * The rest of the CRM's EG/SA rows are OSM-imported *local* schools, and
       * a Sudanese diaspora school is essentially never the same entity as one
       * of them — a probe of six directory names against all 3,156 rows found
       * zero genuine matches. So the only rows worth merging with are ones we
       * already marked Sudanese ourselves.
       */
      const sudanese = live.filter((c) => txt(c.originCountry) === 'SD');
      const cands = sudanese.filter((c) => nameMatches(s.name, c.name ?? ''));
      match = cands.find((c) => c.country === s.country) ?? null;
      if (match) why = 'name+country(SD)';
      // Anything the old, looser rule would have merged is reported rather than
      // silently dropped, so a genuine merge we are now refusing is visible.
      if (!match) {
        for (const c of live) {
          if (txt(c.originCountry) !== 'SD' && c.country === s.country && nameMatches(s.name, c.name ?? '')) {
            nearMisses.push(`${s.name.slice(0, 40)}  ~  ${(c.name ?? '').slice(0, 40)}  [not merged: not a Sudanese row]`);
          }
        }
      }
      if (!match && s.lat != null) {
        const near = live.find(
          (c) => c.address?.addressLat != null &&
            haversineKm(s.lat!, s.lng!, c.address.addressLat!, c.address.addressLng!) < 0.15
        );
        if (near) { match = near; why = 'coords'; }
      }
    }

    if (match) {
      const m = match;
      const patch: Record<string, unknown> = {};
      const address: Record<string, unknown> = {};
      const conflicts: string[] = [];

      const offer = (field: string, liveVal: string, value: string | undefined, write: () => void, isContact = false): void => {
        if (!value) return;
        // A human-verified row keeps its contact fields; attributes still fill.
        if (isContact && m.contactVerified) { bump(`skippedVerified.${field}`); return; }
        if (!liveVal) { write(); bump(`filled.${field}`); return; }
        if (liveVal === value) { bump(`alreadyCorrect.${field}`); return; }
        if ((m.enrichmentNotes ?? '').includes(`sudafoot:${field}`)) { bump(`alreadyNoted.${field}`); return; }
        conflicts.push(`${today} sudafoot:${field} — found "${value}", CRM has "${liveVal}", not overwritten`);
        bump(`conflict.${field}`);
      };

      offer('phone', txt(m.schoolPhone), primary?.e164, () => { patch.schoolPhone = primary!.e164; }, true);
      offer('email', txt(m.principalContact), email, () => { patch.principalContact = email; }, true);
      offer('principalName', txt(m.principalName), s.contactPerson, () => { patch.principalName = s.contactPerson; });
      offer('grades', txt(m.grades), s.grades, () => { patch.grades = s.grades; });
      offer('curriculum', txt(m.curriculum), curriculum ?? undefined, () => { patch.curriculum = curriculum; });
      offer('originCountry', txt(m.originCountry), 'SD', () => { patch.originCountry = 'SD'; });
      offer('operationalStatus', txt(m.operationalStatus), 'OPERATING', () => { patch.operationalStatus = 'OPERATING'; });

      if (street && !txt(m.address?.addressStreet1)) { address.addressStreet1 = street; bump('filled.street'); }
      if (s.section && !txt(m.address?.addressCity)) { address.addressCity = s.section; bump('filled.city'); }
      if (Object.keys(address).length) patch.address = address;
      if (!txt(m.sourceReference)) patch.sourceReference = s.externalId;
      patch.lastSeenAt = s.lastSeen;
      if (conflicts.length) patch.enrichmentNotes = [txt(m.enrichmentNotes), ...conflicts].filter(Boolean).join('\n');

      // lastSeenAt alone is not a reason to write.
      const meaningful = Object.keys(patch).filter((k) => k !== 'lastSeenAt');
      if (meaningful.length) updates.push({ s, id: m.id, patch, why });
      else { skipped.push(`${s.name} — already complete`); bump('noChange'); }
      continue;
    }

    // ── a new school ────────────────────────────────────────────────────────
    const body: Record<string, unknown> = {
      name: s.name,
      country: s.country,
      originCountry: 'SD',
      operationalStatus: 'OPERATING',
      lastSeenAt: s.lastSeen,
      source: 'DIRECTORY',
      stage: 'COLD',
      leadStatus: 'UNREVIEWED',
      // Tier B, stated as a rule rather than a guess: a fee-charging private
      // school in the diaspora that publishes a reachable mobile is workable
      // today. Tier A stays reserved for the tiering pass, which has evidence
      // this directory does not carry (size, follower count, secondary phase).
      tier: primary?.reach === 'MOBILE' ? 'B' : 'C',
      sourceReference: s.externalId,
      sourceUrl: {
        primaryLinkUrl: s.sourceUrl,
        primaryLinkLabel: `sudafoot ${s.country} directory`,
        secondaryLinks: [s.placeUrl ?? s.mapsUrl].filter(Boolean).map((u) => ({ label: 'Google Maps', url: u })),
      },
    };
    if (primary) body.schoolPhone = primary.e164;
    if (email) body.principalContact = email;
    if (s.contactPerson) body.principalName = s.contactPerson;
    if (s.grades) body.grades = s.grades;
    if (curriculum) body.curriculum = curriculum;
    const addr: Record<string, unknown> = { addressCountry: s.country };
    if (street) addr.addressStreet1 = street;
    if (s.section) addr.addressCity = s.section;
    if (s.lat != null) { addr.addressLat = s.lat; addr.addressLng = s.lng; }
    body.address = addr;
    creates.push({ s, body });
    bump('create');
  }

  // ── report ────────────────────────────────────────────────────────────────
  console.log(`\n── plan ──────────────────────────────────────────────`);
  console.log(`  ${creates.length} new school(s) to create`);
  console.log(`  ${updates.length} existing row(s) to update`);
  console.log(`  ${skipped.length} unchanged`);
  for (const [k, v] of Object.entries(stats).sort((a, b) => b[1] - a[1])) {
    console.log(`     ${String(v).padStart(4)}  ${k}`);
  }
  if (updates.length) {
    console.log(`\n  matched existing rows:`);
    for (const u of updates.slice(0, 12)) {
      console.log(`     [${u.why}] ${u.s.name.slice(0, 44).padEnd(44)} → ${Object.keys(u.patch).join(', ')}`);
    }
  }
  console.log(`\n  sample of new rows:`);
  for (const c of creates.slice(0, 10)) {
    console.log(`     ${c.s.country} ${String(c.body.tier)} ${c.s.name.slice(0, 44).padEnd(44)} ${c.body.schoolPhone ?? '—'}`);
  }

  if (nearMisses.length) {
    console.log(`\n  ${nearMisses.length} name collision(s) deliberately NOT merged (different institution, same words):`);
    for (const n of nearMisses.slice(0, 10)) console.log(`     ${n}`);
  }

  writeFileSync(`${DATA}/upsert-plan.json`, JSON.stringify({ creates, updates, skipped }, null, 2));
  console.log(`\n  → ${DATA}/upsert-plan.json`);

  if (!APPLY) {
    console.log(`\n  DRY RUN — nothing written. Re-run with --apply.\n`);
    return;
  }

  console.log(`\n── apply ─────────────────────────────────────────────`);
  let created = 0, updated = 0;
  const failures: string[] = [];
  for (const c of creates) {
    try { await rest('POST', 'companies', c.body); created++; }
    catch (e) { failures.push(`create ${c.s.name}: ${e instanceof Error ? e.message : e}`); }
  }
  for (const u of updates) {
    try { await rest('PATCH', `companies/${u.id}`, u.patch); updated++; }
    catch (e) { failures.push(`update ${u.s.name}: ${e instanceof Error ? e.message : e}`); }
  }
  console.log(`  ${created}/${creates.length} created · ${updated}/${updates.length} updated`);
  for (const f of failures.slice(0, 15)) console.log(`    ! ${f}`);
  console.log(`\n  Re-run without --apply: creates AND updates must both be 0. That is the dedup test.\n`);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
