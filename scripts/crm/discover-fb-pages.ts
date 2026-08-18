// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Find Sudanese school pages on Facebook -- in Sudan and in the diaspora.
 *
 * This is the lane that has never run. The old scraper's tier3 drove Facebook's
 * own in-app page search and produced no output file at all, because that search
 * requires a signed-in session and the run was signed out; its tier1 Google-dork
 * matrix stopped after 50 queries. With a dedicated account the in-app search
 * works, and it is a far better instrument than dorking: Facebook is indexing
 * its own pages, so a query for "مدرسة بورتسودان" returns school Pages rather
 * than whatever Google happened to crawl.
 *
 * ── The query matrix ────────────────────────────────────────────────────────
 *
 * Two halves, because the brief is Sudanese schools **in Sudan and outside it**:
 *
 *   in-country : school words × Sudan's states, capitals and the real
 *                neighbourhood names in `config.js` (12 localities of Khartoum
 *                alone). Those names are the expensive part of that file and
 *                are reused verbatim rather than re-derived.
 *   diaspora   : "مدرسة سودانية" and friends × the cities Sudanese families
 *                actually moved to since April 2023 — Cairo, Riyadh, Jeddah,
 *                Kampala, Nairobi, Addis, Doha, Dubai, Port Said, Aswan.
 *
 * ── What it will not do ─────────────────────────────────────────────────────
 *
 * It writes no rows and visits no About tabs. Discovery, enrichment and loading
 * stay separate so that a bad relevance filter costs a re-parse rather than a
 * CRM full of football academies -- which is exactly what the dork run left
 * behind, and why the filter here is stricter than the one it used.
 *
 * Checkpointed per query and hard-stopped on the first challenge: the account
 * is cheap to replace but pointless to burn.
 *
 *   FB_SCRAPE_PORT=9333 FB_SCRAPE_PROFILE="$HOME/.claude/chrome-fbscrape-profile" \
 *   FB_SCRAPE_DELAY_MS=8000 \
 *     npx tsx scripts/crm/discover-fb-pages.ts [--limit=N] [--diaspora-only]
 */
import { appendFileSync, readFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';

import { createCdpSession, requireScrapePort, type CdpSession } from './cdp-session';

const DATA = 'scripts/crm/.data';
const CHECKPOINT = `${DATA}/fb-discover-checkpoint.json`;
const LEDGER = `${DATA}/fb-discover.jsonl`;
const arg = (n: string, d = ''): string => {
  const hit = process.argv.find((a) => a.startsWith(`--${n}=`));
  return hit ? hit.split('=').slice(1).join('=') : d;
};
const DIASPORA_ONLY = process.argv.includes('--diaspora-only');

const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));
const jitter = (ms: number): number => ms + Math.floor(Math.random() * ms * 0.6);

/** The school words that actually appear in Sudanese page names. */
const SCHOOL_WORDS = ['مدرسة', 'مدارس', 'أكاديمية', 'روضة', 'مجمع تربوي'];

/** States, capitals, and Khartoum's neighbourhoods — from the scraper's config. */
const SUDAN_PLACES = [
  'الخرطوم', 'أم درمان', 'بحري', 'شرق النيل', 'كرري', 'أمبدة', 'جبل أولياء',
  'العمارات', 'اركويت', 'الصحافة', 'الكلاكلة', 'المنشية', 'شمبات', 'كافوري', 'الحلفايا',
  'الموردة', 'ود نوباوي', 'العباسية', 'الثورة',
  'بورتسودان', 'سواكن', 'سنكات', 'طوكر',
  'عطبرة', 'الدامر', 'بربر', 'شندي',
  'دنقلا', 'مروي', 'الدبة', 'وادي حلفا',
  'ود مدني', 'الحصاحيصا', 'المناقل', 'رفاعة',
  'كسلا', 'حلفا الجديدة', 'القضارف', 'الفاو',
  'كوستي', 'ربك', 'سنار', 'سنجة', 'الدمازين', 'الأبيض', 'كادقلي', 'الفولة',
  'الفاشر', 'نيالا', 'الجنينة', 'زالنجي', 'الضعين',
];

/**
 * Where Sudanese families went. The school keeps its Sudanese name and adds the
 * host city, which is why "مدرسة سودانية القاهرة" finds pages that "مدرسة
 * الخرطوم" never will.
 */
const DIASPORA_TERMS = ['مدرسة سودانية', 'مدارس سودانية', 'المدرسة السودانية'];

/**
 * Egypt and the whole Gulf, searched by country AND by the cities inside it.
 *
 * The country name on its own is a productive query, because a page called
 * "المدرسة السودانية بالكويت" never names a district — so each country appears
 * both ways. Beyond the Gulf the East African hosts are kept, since a large
 * share of the 2023 displacement went to Uganda, Kenya, Ethiopia and Chad.
 */
const DIASPORA_PLACES: { country: string; places: string[] }[] = [
  { country: 'مصر', places: ['القاهرة', 'الجيزة', 'الإسكندرية', 'أسوان', '6 أكتوبر', 'فيصل', 'مدينة نصر', 'عين شمس', 'المهندسين', 'دمياط', 'بورسعيد'] },
  { country: 'السعودية', places: ['الرياض', 'جدة', 'مكة', 'المدينة المنورة', 'الدمام', 'الخبر', 'الطائف', 'أبها', 'جازان', 'تبوك'] },
  { country: 'الإمارات', places: ['دبي', 'أبوظبي', 'الشارقة', 'عجمان', 'العين', 'رأس الخيمة'] },
  { country: 'قطر', places: ['الدوحة', 'الريان', 'الوكرة'] },
  { country: 'الكويت', places: ['حولي', 'الفروانية', 'الجهراء', 'الأحمدي', 'السالمية'] },
  { country: 'البحرين', places: ['المنامة', 'المحرق', 'الرفاع', 'مدينة عيسى'] },
  { country: 'عمان', places: ['مسقط', 'صلالة', 'صحار', 'نزوى'] },
  { country: 'أوغندا', places: ['كمبالا'] },
  { country: 'كينيا', places: ['نيروبي'] },
  { country: 'إثيوبيا', places: ['أديس أبابا'] },
  { country: 'تشاد', places: ['انجمينا'] },
  { country: 'تركيا', places: ['إسطنبول', 'أنقرة'] },
];
const DIASPORA_CITIES = DIASPORA_PLACES.flatMap((c) => [c.country, ...c.places]);

interface Found { url: string; name: string; query: string; kind: string; at: string }

/** A page is a lead only if it looks like a school and is not a group or a post. */
const SCHOOLish = /مدرس|مدارس|أكاديمي|اكاديمي|روضة|روضه|رياض أطفال|مجمع تربوي|تعليم|school|academy|kindergarten|college|institute|معهد/i;
const NOT_A_SCHOOL =
  /كرة|القدم|الطائرة|سلة|رياضي|نادي|خريج|خريجو|طلاب وطالبات|دفعة|ذكريات|جروب|مجموعة|وظائف|توظيف|إعلان|اخبار|أخبار|قناة|صحيفة|جامعة|university|football|volleyball|club|alumni|jobs|vacanc|news|channel|شهادات|كورس|كورسات|course|دروس|مذكرات|ملخصات/i;

/**
 * The result name has to earn its place, because Facebook's search is an OR.
 *
 * Querying "مدرسة سودانية مصر" does NOT return Sudanese schools in Egypt -- it
 * returns anything matching any word, which in the first live run meant 42 hits
 * consisting of ordinary Egyptian schools, a bank's technology academy, a meme
 * page, and a koshary restaurant called "مدرسة الكشري". Not one was Sudanese.
 *
 * So each lane must prove itself in the page's own name:
 *
 *   diaspora  the name must say Sudanese. A Sudanese school operating in Cairo
 *             or Riyadh advertises exactly that -- it is how families find it --
 *             so this is a cheap and very sharp test.
 *   sudan     the name must contain the place that was searched for. A Khartoum
 *             school will not call itself "Sudanese", but "مدرسة بورتسودان
 *             الثانوية" does contain بورتسودان.
 */
const SUDANESE = /سوداني|سودانيه|سودانية|السودان|sudan|sudanese/i;

const foldAr = (x: string): string =>
  x.replace(/[ً-ْـ]/g, '').replace(/[أإآٱ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه').toLowerCase();

function isRelevant(name: string, query: string, kind: string): boolean {
  const n = foldAr(name);
  if (kind === 'diaspora') return SUDANESE.test(n);
  // in-country: the searched place, or an explicit Sudan marker, must appear.
  const place = foldAr(query.split(' ').slice(1).join(' ')).trim();
  return (place.length > 2 && n.includes(place)) || SUDANESE.test(n);
}

const isPageUrl = (u: string): boolean =>
  /^https?:\/\/(?:www\.|web\.)?facebook\.com\//i.test(u) &&
  !/\/(groups|events|marketplace|watch|photo|videos|posts|permalink|story\.php|hashtag|search|help|policies|privacy|login|reel)\b/i.test(u) &&
  !/\.php\?(?!id=)/i.test(u);

const normalizeUrl = (u: string): string => {
  const clean = u.split('?')[0].replace(/\/+$/, '');
  const id = /facebook\.com\/profile\.php\?id=(\d+)/i.exec(u);
  return id ? `https://www.facebook.com/profile.php?id=${id[1]}` : clean;
};

/** Harvest every plausible page link from a rendered search-results page. */
const HARVEST_JS = `(() => {
  const out = [];
  for (const a of Array.from(document.querySelectorAll('a[href]'))) {
    const href = a.href || '';
    const text = (a.innerText || '').trim().split('\\n')[0];
    if (!href || !text || text.length < 3 || text.length > 90) continue;
    out.push({ href, text });
  }
  const body = document.body ? document.body.innerText : '';
  return {
    links: out,
    empty: /No results found|لا توجد نتائج|We couldn't find anything/i.test(body),
    checkpoint: /checkpoint|confirm your identity|we limit how often|temporarily blocked|suspicious activity|you're temporarily/i.test(body.slice(0, 5000)),
    loginWall: !!document.querySelector('input[name="pass"]'),
  };
})()`;

async function searchOnce(s: CdpSession, query: string, kind: string, delayMs: number): Promise<{ found: Found[]; stop?: string }> {
  const url = `https://www.facebook.com/search/pages/?q=${encodeURIComponent(query)}`;
  await s.navigate(url);
  await sleep(jitter(delayMs));

  // Results load lazily; a couple of scrolls is enough for the first page or two.
  for (let i = 0; i < 3; i++) {
    await s.evaluate('window.scrollBy(0, 1200); true');
    await sleep(jitter(delayMs / 2));
  }

  const r = await s.evaluate<{
    links: { href: string; text: string }[]; empty: boolean; checkpoint: boolean; loginWall: boolean;
  }>(HARVEST_JS);

  if (r.checkpoint) return { found: [], stop: 'CHECKPOINT' };
  if (r.loginWall) return { found: [], stop: 'login wall — the scrape session is signed out' };

  const seen = new Set<string>();
  const found: Found[] = [];
  for (const l of r.links) {
    if (!isPageUrl(l.href)) continue;
    const name = l.text.trim();
    if (!SCHOOLish.test(name) || NOT_A_SCHOOL.test(name)) continue;
    if (!isRelevant(name, query, kind)) continue;
    const url2 = normalizeUrl(l.href);
    if (seen.has(url2)) continue;
    seen.add(url2);
    found.push({ url: url2, name, query, kind, at: new Date().toISOString() });
  }
  return { found };
}

async function main(): Promise<void> {
  const { port, profile, delayMs } = requireScrapePort();
  const limit = Number(arg('limit', '0')) || Infinity;

  const queries: { q: string; kind: string }[] = [];
  if (!DIASPORA_ONLY) {
    for (const p of SUDAN_PLACES) for (const w of SCHOOL_WORDS.slice(0, 3)) queries.push({ q: `${w} ${p}`, kind: 'sudan' });
  }
  for (const c of DIASPORA_CITIES) for (const t of DIASPORA_TERMS) queries.push({ q: `${t} ${c}`, kind: 'diaspora' });

  mkdirSync(DATA, { recursive: true });
  const done = new Set<string>(existsSync(CHECKPOINT) ? (JSON.parse(readFileSync(CHECKPOINT, 'utf8')) as string[]) : []);
  const known = new Map<string, Found>();
  if (existsSync(LEDGER)) {
    for (const line of readFileSync(LEDGER, 'utf8').split('\n').filter(Boolean)) {
      try { const f = JSON.parse(line) as Found; known.set(f.url, f); } catch { /* skip */ }
    }
  }

  const todo = queries.filter((x) => !done.has(x.q)).slice(0, limit === Infinity ? undefined : limit);
  console.log(`Scrape browser: port ${port}, profile ${profile}, delay ~${delayMs}ms`);
  console.log(`${queries.length} queries in the matrix · ${done.size} already done · ${todo.length} to run`);
  console.log(`${known.size} page(s) already discovered\n`);
  if (!todo.length) { console.log('nothing to do.\n'); return; }

  const s = await createCdpSession(port, 'about:blank');
  let stopped = '';
  let newPages = 0;

  try {
    for (const [i, x] of todo.entries()) {
      const { found, stop } = await searchOnce(s, x.q, x.kind, delayMs);
      if (stop) { stopped = stop; break; }
      let fresh = 0;
      for (const f of found) {
        if (known.has(f.url)) continue;
        known.set(f.url, f);
        appendFileSync(LEDGER, `${JSON.stringify(f)}\n`);
        fresh++; newPages++;
      }
      done.add(x.q);
      if ((i + 1) % 5 === 0 || fresh) writeFileSync(CHECKPOINT, JSON.stringify([...done]));
      console.log(`  ${String(i + 1).padStart(3)}/${todo.length} ${x.kind.padEnd(8)} ${String(fresh).padStart(2)} new  ${x.q.slice(0, 40)}`);
      await sleep(jitter(delayMs));
    }
  } finally {
    writeFileSync(CHECKPOINT, JSON.stringify([...done]));
    await s.close();
  }

  const byKind = [...known.values()].reduce((m, f) => { m[f.kind] = (m[f.kind] ?? 0) + 1; return m; }, {} as Record<string, number>);
  console.log(`\n═══ discovery — ${newPages} new page(s) this run, ${known.size} total ═══`);
  console.log(`  by lane: ${Object.entries(byKind).map(([k, v]) => `${k} ${v}`).join('  ')}`);
  console.log(`  ${done.size}/${queries.length} queries completed`);
  if (stopped) {
    console.log(`\n  ⛔ STOPPED EARLY: ${stopped}`);
    console.log(`     Re-run to resume — the checkpoint skips completed queries.`);
  }
  console.log(`\n  → ${LEDGER}`);
  console.log('  Nothing written to Twenty. Load with sd-fb-discover-load.ts.\n');
}

main().catch((e) => { console.error(e instanceof Error ? e.message : e); process.exit(1); });
