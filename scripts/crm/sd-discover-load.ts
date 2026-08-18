// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Turn discovered Facebook pages into CRM rows -- with the final relevance call.
 *
 * The discovery ledger is deliberately raw. Filtering at harvest time means any
 * mistake costs another hour of somebody's Facebook session; filtering here
 * means it costs a re-run of this script. So the discovery pass keeps anything
 * plausibly school-shaped and this is where a page has to be a school someone
 * could actually sell to.
 *
 * ── What still gets thrown out here ─────────────────────────────────────────
 *
 * "مدرسة" is used loosely in Arabic the way "school of" is in English, so the
 * discovery lane returns things like "مدرسة الدهانات الحائطية والديكور" -- a
 * wall-painting and decorating business. Driving schools, sewing, cooking,
 * barbering and the like are the same class. They are trades, not schools with
 * pupils and a fee book, and they are rejected by name.
 *
 * Country comes from the query that found the page, not from a guess: a page
 * found by "مدرسة سودانية الكويت" is filed KW with originCountry=SD, which is
 * the two-field model the rest of this pipeline uses. In-country finds are SD
 * on both.
 *
 * Everything created is `operationalStatus=UNVERIFIED`. A Facebook page proves
 * a school existed when the page was made; nothing in a search result dates it,
 * and Sudan has been at war since 2023. `enrich-fb-about.ts` is what turns that
 * into evidence.
 *
 *   TWENTY_API_URL=http://localhost:3100 \
 *   TWENTY_API_KEY=$(security find-generic-password -s databayt-twenty -a hogwarts -w) \
 *     npx tsx scripts/crm/sd-discover-load.ts [--apply]
 */
import { readFileSync, existsSync, writeFileSync } from 'node:fs';

import { twentyClient } from './twenty-rest';

const APPLY = process.argv.includes('--apply');
const DATA = 'scripts/crm/.data';
const LEDGER = `${DATA}/fb-discover.jsonl`;

interface Found { url: string; name: string; query: string; kind: string; at: string }
interface Link { primaryLinkUrl?: string | null }
interface Company {
  id: string; name?: string | null; country?: string | null;
  originCountry?: string | null; sourceReference?: string | null;
  facebook?: Link | null;
}

const txt = (s: string | null | undefined): string => (s ?? '').trim();

/**
 * A trade is not a school. "مدرسة" prefixes crafts in Arabic the way "school
 * of" does in English, and the discovery lane cannot tell them apart from a
 * page name alone -- but a buyer of a school information system certainly can.
 */
const TRADE =
  /دهان|ديكور|نقاش|سواقة|قيادة|خياطة|طبخ|طهي|حلاق|تجميل|كوافير|جيم|لياقة|رقص|موسيقى|عود|غناء|سباكة|كهرباء|نجارة|حدادة|موبايل|صيانة|كمبيوتر شخصي|driving|sewing|cooking|barber|salon|gym|fitness|dance|music/i;
const NOT_A_SCHOOL =
  /كرة|القدم|الطائرة|سلة|رياضي|نادي|خريج|خريجو|طلاب وطالبات|دفعة|ذكريات|وظائف|توظيف|اخبار|أخبار|قناة|صحيفة|جامعة|university|football|volleyball|club|alumni|jobs|vacanc|news|channel|كورس|كورسات|course|مبادرة|من إبداعات|تعلن عن|مذكرات|ملخصات|منحة|scholarship/i;
const SCHOOLish =
  /مدرس|مدارس|أكاديمي|اكاديمي|روضة|روضه|رياض أطفال|مجمع تربوي|school|academy|kindergarten|college|institute|معهد/i;

/** Which country a diaspora query was aimed at. */
const PLACE_COUNTRY: [RegExp, string][] = [
  [/مصر|القاهرة|الجيزة|الإسكندرية|أسوان|أكتوبر|فيصل|مدينة نصر|عين شمس|المهندسين|دمياط|بورسعيد/, 'EG'],
  [/السعودية|الرياض|جدة|مكة|المدينة المنورة|الدمام|الخبر|الطائف|أبها|جازان|تبوك/, 'SA'],
  [/الإمارات|دبي|أبوظبي|الشارقة|عجمان|العين|رأس الخيمة/, 'AE'],
  [/قطر|الدوحة|الريان|الوكرة/, 'QA'],
  [/الكويت|حولي|الفروانية|الجهراء|الأحمدي|السالمية/, 'KW'],
  [/البحرين|المنامة|المحرق|الرفاع|مدينة عيسى/, 'BH'],
  [/عمان|مسقط|صلالة|صحار|نزوى/, 'OM'],
  [/أوغندا|كمبالا/, 'UG'],
  [/كينيا|نيروبي/, 'KE'],
  [/إثيوبيا|أديس/, 'ET'],
  [/تشاد|انجمينا/, 'TD'],
  [/تركيا|إسطنبول|أنقرة/, 'TR'],
];

const countryOf = (f: Found): string =>
  f.kind === 'sudan' ? 'SD' : (PLACE_COUNTRY.find(([re]) => re.test(f.query))?.[1] ?? 'OTHER');

const pageSlug = (u: string): string => {
  const clean = u.replace(/\/+$/, '');
  const id = /facebook\.com\/profile\.php\?id=(\d+)/i.exec(clean);
  if (id) return `profile-${id[1]}`;
  const m = /facebook\.com\/(?:p\/|pg\/|people\/)?([^/?#]+)/i.exec(clean);
  return m ? decodeURIComponent(m[1]).slice(0, 60) : '';
};

const foldAr = (x: string): string =>
  x.replace(/[ً-ْـ]/g, '').replace(/[أإآٱ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه').toLowerCase().replace(/\s+/g, ' ').trim();

async function main(): Promise<void> {
  if (!existsSync(LEDGER)) { console.error(`no ledger at ${LEDGER} — run discover-fb-pages.ts first`); process.exit(1); }
  const raw = readFileSync(LEDGER, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l) as Found);
  // The ledger is append-only and a page can be found by several queries.
  const byUrl = new Map<string, Found>();
  for (const f of raw) if (!byUrl.has(f.url)) byUrl.set(f.url, f);
  console.log(`Read ${raw.length} ledger line(s) → ${byUrl.size} distinct page(s)`);

  const { rest, all } = twentyClient();
  const live = (await all('companies')) as unknown as Company[];
  const refs = new Set(live.map((c) => txt(c.sourceReference)));
  const fbUrls = new Set(live.map((c) => pageSlug(txt(c.facebook?.primaryLinkUrl)).toLowerCase()).filter(Boolean));
  const names = new Set(live.map((c) => foldAr(txt(c.name))).filter(Boolean));
  console.log(`  ${live.length} existing rows`);

  const creates: { f: Found; body: Record<string, unknown> }[] = [];
  const rejected: Record<string, number> = {};
  const rej = (k: string): void => { rejected[k] = (rejected[k] ?? 0) + 1; };
  const seenSlug = new Set<string>();
  const seenName = new Set<string>();

  for (const f of byUrl.values()) {
    if (!SCHOOLish.test(f.name)) { rej('not school-shaped'); continue; }
    if (NOT_A_SCHOOL.test(f.name)) { rej('sports / alumni / news / course page'); continue; }
    if (TRADE.test(f.name)) { rej('a trade, not a school'); continue; }

    const slug = pageSlug(f.url).toLowerCase();
    if (!slug) { rej('no usable page slug'); continue; }
    if (refs.has(`fb:${slug}`) || fbUrls.has(slug)) { rej('already in the CRM'); continue; }
    if (seenSlug.has(slug)) { rej('duplicate page in this batch'); continue; }
    if (names.has(foldAr(f.name))) { rej('a row with this exact name already exists'); continue; }
    /**
     * Two different Pages can carry the identical name -- "مدرسة الخرطوم"
     * appeared twice in the first batch. Occasionally that is two campuses, but
     * far more often it is one school with a duplicate or abandoned Page, and a
     * sales list is damaged more by calling the same school twice than by
     * missing a second campus that the About pass would reveal anyway. Keep the
     * first, log the rest.
     */
    if (seenName.has(foldAr(f.name))) { rej('same name as another page in this batch'); continue; }
    seenSlug.add(slug);
    seenName.add(foldAr(f.name));

    const country = countryOf(f);
    creates.push({
      f,
      body: {
        name: f.name,
        country,
        originCountry: 'SD',
        operationalStatus: 'UNVERIFIED',
        source: 'SOCIAL',
        stage: 'COLD',
        leadStatus: 'UNREVIEWED',
        tier: 'C',
        sourceReference: `fb:${slug}`,
        sourceUrl: { primaryLinkUrl: f.url, primaryLinkLabel: `Facebook page search: ${f.query}`, secondaryLinks: [] },
        facebook: { primaryLinkUrl: f.url, primaryLinkLabel: '', secondaryLinks: [] },
      },
    });
  }

  const byCountry = creates.reduce((m, c) => { const k = String(c.body.country); m[k] = (m[k] ?? 0) + 1; return m; }, {} as Record<string, number>);
  console.log(`\n── plan — ${creates.length} new Sudanese school(s) to create\n`);
  console.log(`  by country: ${Object.entries(byCountry).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${v}`).join('  ')}`);
  console.log(`\n  rejected (nothing silent):`);
  for (const [k, v] of Object.entries(rejected).sort((a, b) => b[1] - a[1])) console.log(`    ${String(v).padStart(4)}  ${k}`);
  console.log(`\n  sample:`);
  for (const c of creates.slice(0, 12)) console.log(`    ${String(c.body.country).padEnd(3)} ${c.f.name.slice(0, 56)}`);

  writeFileSync(`${DATA}/fb-discover-plan.json`, JSON.stringify({ creates }, null, 2));
  console.log(`\n  → ${DATA}/fb-discover-plan.json`);
  if (!APPLY) { console.log('\n  DRY RUN — nothing written. Re-run with --apply.\n'); return; }

  let ok = 0;
  const fails: string[] = [];
  for (const c of creates) {
    try { await rest('POST', 'companies', c.body); ok++; }
    catch (e) { fails.push(`${c.f.name.slice(0, 40)}: ${e instanceof Error ? e.message : e}`); }
  }
  console.log(`\n  ${ok}/${creates.length} created.`);
  for (const f of fails.slice(0, 10)) console.log(`    ! ${f}`);
  console.log('\n  Re-run without --apply: the plan must be 0.\n');
}

main().catch((e) => { console.error(e instanceof Error ? e.message : e); process.exit(1); });
