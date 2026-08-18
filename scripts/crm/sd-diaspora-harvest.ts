// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Harvest the Sudanese schools that left Sudan.
 *
 * Since April 2023 a large part of Sudanese schooling has been operating from
 * Cairo and Riyadh rather than Khartoum, and none of it is in the CRM: of six
 * school names probed from these directories against all 3,156 rows, **zero**
 * matched. This is not enrichment, it is discovery -- and it is the only lane
 * measured so far that reaches schools we can actually phone.
 *
 * Two public directories, republished each academic year:
 *
 *   Egypt  -- schools by Cairo district, with street addresses and phones
 *   Saudi  -- schools by city, and richer: Google Maps pins, curriculum,
 *             grade stages, branch names, study mode (حضور / أونلاين)
 *
 * ── Why the WordPress API and not the page ──────────────────────────────────
 *
 * Fetching the rendered page gives you the intro and nothing else -- the
 * article body is not in the HTML that arrives. A cached copy of the Egypt page
 * carried 2 phone numbers; the same post through `/wp-json/wp/v2/posts?slug=`
 * carries **58**. So we read the REST API, which also hands back clean,
 * stably-structured markup instead of a theme's div soup.
 *
 * The structure is regular and is the whole parser:
 *
 *   <h3>  a section        مدارس سودانية في فيصل   /   مدارس سودانية بالرياض
 *   <h4>  a school name    مدارس د. أبـوذر الكودة السودانية بالقاهرة
 *   <p>   an attribute of the school above it -- address, phone line, maps
 *         link, curriculum, grades, branch, or the contact person's name
 *
 * ── What this does NOT do ───────────────────────────────────────────────────
 *
 * It writes nothing. Harvesting and loading are separate so a parser bug can
 * never be mistaken for a CRM problem, and so re-parsing costs no requests:
 * the fetch caches to .data/diaspora/*.json and the parse reads the cache.
 *
 *   npx tsx scripts/crm/sd-diaspora-harvest.ts [--refetch]
 */
import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'node:fs';

import { extractContacts, type ContactCandidate } from './contact-extract';
import { normalizePhone, type Reach } from './normalize-contacts';

const REFETCH = process.argv.includes('--refetch');
const DATA = 'scripts/crm/.data/diaspora';
const UA = 'databayt-hogwarts-crm/1.0 (school lead research; osmanabdout@hotmail.com)';

interface Source {
  key: string;
  country: 'EG' | 'SA';
  slug: string;
  /** The academic year the directory is published for -- our `lastSeenAt`. */
  lastSeen: string;
}

const SOURCES: Source[] = [
  {
    key: 'eg',
    country: 'EG',
    slug: 'مدارس-سودانية-في-مصر-للعام-الدراسي-2024-2025',
    lastSeen: '2025-10-01T00:00:00.000Z',
  },
  {
    key: 'sa',
    country: 'SA',
    slug: 'دليل-مدارس-سودانية-في-السعودية-للعام-ا',
    lastSeen: '2024-10-01T00:00:00.000Z',
  },
];

export interface DiasporaSchool {
  externalId: string;
  name: string;
  country: 'EG' | 'SA';
  section: string;
  addressLines: string[];
  phones: { e164: string; reach: Reach; raw: string; whatsapp: boolean; countryGuess?: string }[];
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
  /** Every line we could not classify, kept so nothing disappears quietly. */
  unparsed: string[];
}

// ── fetch ────────────────────────────────────────────────────────────────────

async function fetchPost(s: Source): Promise<{ content: string; link: string }> {
  const file = `${DATA}/${s.key}.json`;
  if (existsSync(file) && !REFETCH) {
    return JSON.parse(readFileSync(file, 'utf8')) as { content: string; link: string };
  }
  const url = `https://sudafoot.com/wp-json/wp/v2/posts?slug=${encodeURIComponent(s.slug)}`;
  const res = await fetch(url, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(60_000) });
  if (!res.ok) throw new Error(`${s.key}: HTTP ${res.status}`);
  const posts = (await res.json()) as { content?: { rendered?: string }; link?: string }[];
  if (!posts.length) throw new Error(`${s.key}: no post for slug`);
  const out = { content: posts[0].content?.rendered ?? '', link: posts[0].link ?? url };
  mkdirSync(DATA, { recursive: true });
  writeFileSync(file, JSON.stringify(out));
  return out;
}

// ── parse ────────────────────────────────────────────────────────────────────

const strip = (h: string): string =>
  h
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#8211;|&#8212;/g, '-')
    .replace(/&[a-z]+;|&#\d+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();

/**
 * Headings that are page furniture rather than schools. Without this the
 * "conditions for opening a school" section and the cross-link to the other
 * directory both become schools with no contacts.
 */
const NOT_A_SCHOOL =
  /^(شروط|طالع|دليل مدارس|فيما يلي|مدارس سودانية في (مصر|السعودية)|اقرأ|اقرا|إقرأ|إقرا)/;

const SECTION_RE = /^مدارس سودانية (?:في|ب)\s*(.+)$/;

const LOC_HINT =
  /حي|الحى|الحي|شارع|ش\s|محطة|محطه|ميدان|مقابل|جوار|خلف|أمام|تقاطع|مدينة|مدينه|منطقة|طريق|كمبوند|برج|عمارة|عمارات|سوق|حدائق|الكيلو|بوابة|البوابة|المروج|شمال|جنوب|شرق|غرب|وسط|الاهرام|الهرم/;
const CURRICULUM_HINT = /منهج|المنهج|انترناشونال|إنترناشونال|دولي|بريطاني|أمريكي|سوداني/;
const GRADES_HINT = /رياض|أساس|ابتدائ|متوسط|ثانوي|كي جي|kg|روضة/i;
const STUDY_HINT = /الدراسة|دوام|حضور|أونلاين|اونلاين|صباحي|مسائي/;
const BRANCH_HINT = /^فرع|الفرع/;
const PERSON_HINT = /^(الأستاذ|الاستاذ|أ\.|ا\.|د\.|مدير|المدير)/;

const slugify = (s: string): string =>
  s
    .replace(/[ً-ْـ]/g, '')
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);

/** `https://maps.app.goo.gl/...` resolves to a URL carrying the coordinate. */
async function resolveMaps(url: string): Promise<{ lat?: number; lng?: number; placeUrl?: string }> {
  try {
    const res = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      headers: { 'User-Agent': UA },
      signal: AbortSignal.timeout(30_000),
    });
    const hit = /@(-?\d+\.\d+),(-?\d+\.\d+)/.exec(res.url) ?? /!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/.exec(res.url);
    if (hit) return { lat: Number(hit[1]), lng: Number(hit[2]), placeUrl: res.url };
    // A short-link usually resolves to a /maps/place/ URL carrying a plus-code
    // and Google's own name for the place, but no @lat,lng. That name is still
    // worth keeping as corroboration even though the coordinate is not there.
    if (/\/maps\/place\//.test(res.url)) return { placeUrl: res.url };
  } catch {
    /* a dead short-link is not worth failing the harvest over */
  }
  return {};
}

function parse(html: string, s: Source, link: string): DiasporaSchool[] {
  const blocks = [...html.matchAll(/<(h[1-6]|p|li)\b[^>]*>([\s\S]*?)<\/\1>/gi)].map((m) => ({
    tag: m[1].toLowerCase(),
    text: strip(m[2]),
  }));

  const out: DiasporaSchool[] = [];
  let section = '';
  let cur: DiasporaSchool | null = null;

  for (const b of blocks) {
    if (!b.text) continue;

    if (b.tag === 'h3' || b.tag === 'h2') {
      const m = SECTION_RE.exec(b.text);
      if (m) section = m[1].trim();
      continue;
    }

    if (b.tag === 'h4') {
      if (NOT_A_SCHOOL.test(b.text)) { cur = null; continue; }
      /**
       * A school group lists each branch under the SAME heading -- "مدارس أبوذر
       * الكودة" appears twice in the Riyadh section with different numbers. The
       * bare name is therefore not a unique key: both branches produced one id,
       * two CRM rows ended up sharing one sourceReference, and the second run
       * then reported a phone "conflict" against its own sibling. Disambiguate
       * with an ordinal so each branch keeps a stable identity of its own.
       */
      const base = `sudafoot:${s.key}:${slugify(b.text)}`;
      const seen = out.filter((o) => o.externalId === base || o.externalId.startsWith(`${base}#`)).length;
      cur = {
        externalId: seen ? `${base}#${seen + 1}` : base,
        name: b.text,
        country: s.country,
        section,
        addressLines: [],
        phones: [],
        emails: [],
        branches: [],
        sourceUrl: link,
        lastSeen: s.lastSeen,
        unparsed: [],
      };
      out.push(cur);
      continue;
    }

    if (!cur || (b.tag !== 'p' && b.tag !== 'li')) continue;

    let claimed = false;

    // Emails and the WhatsApp *signal* come from the shared extractor, which
    // reads the Arabic context around a number ("رقم التواصل واتساب ...").
    const found: ContactCandidate[] = extractContacts(b.text, cur.externalId);
    for (const c of found) {
      if (c.kind === 'email') { cur.emails.push(c.value); claimed = true; }
    }
    const waSignalled = found.some((c) => c.kind === 'whatsapp');

    /**
     * Phones are normalised here rather than taken from the extractor, because
     * the extractor is Sudan-first: an un-prefixed number is assumed to be
     * Sudanese and validated against `^[19]\d{8}$`. That is right in mkan and
     * wrong here -- a bare Cairo mobile `01033018961` is 10 digits, fails that
     * test, and was being dropped. The first run of this harvest found 10 phones
     * while 60-odd sat in the unparsed pile, all of them local Egyptian numbers.
     *
     * So: pull raw digit runs and hand each to normalizePhone with the
     * directory's own country as the hint. It still honours an explicit +/00
     * country code when there is one, which is how a Riyadh school's `00249…`
     * line stays Sudanese rather than being forced to +966.
     */
    /**
     * Split before normalising. Schools list two numbers on one line in every
     * shape a human types -- `01558216002-01558216003`, `0563140882 – 0548859941`,
     * `تلفون فرع فيصل: 01101380815 - 01147704537`. A single digit-run regex
     * swallows both as one 22-digit blob that then fails length validation, so
     * the second number of every pair was being lost.
     */
    const runs = b.text
      .split(/[\/,،]|\s[-–—]\s|(?<=\d)[-–—](?=0)/)
      .flatMap((part) => part.match(/(?:\+|00)?[\d][\d\s().]{6,18}\d/g) ?? []);
    for (const run of runs) {
      const n = normalizePhone(run, s.country);
      if (!n.e164) continue;
      const cc = /^\+(\d{1,3})/.exec(n.e164)?.[1];
      const foreign = (cc === '20' && s.country !== 'EG') || (cc === '966' && s.country !== 'SA') || cc === '249';
      if (!cur.phones.some((p) => p.e164 === n.e164)) {
        cur.phones.push({
          e164: n.e164,
          reach: n.reach,
          raw: run.trim(),
          // A LANDLINE can never be reached on WhatsApp, whatever the label
          // next to it says -- so the signal only counts on a mobile.
          whatsapp: waSignalled && n.reach === 'MOBILE',
          countryGuess: foreign ? cc : undefined,
        });
      }
      claimed = true;
    }

    const maps = /https?:\/\/(?:maps\.app\.goo\.gl|goo\.gl\/maps|g\.co\/kgs|www\.google\.[a-z.]+\/maps)\/\S+/.exec(b.text);
    if (maps) { cur.mapsUrl = maps[0]; claimed = true; }

    if (BRANCH_HINT.test(b.text)) { cur.branches.push(b.text); claimed = true; }
    if (!cur.curriculum && CURRICULUM_HINT.test(b.text) && !LOC_HINT.test(b.text)) {
      cur.curriculum = b.text; claimed = true;
    }
    if (!cur.grades && GRADES_HINT.test(b.text) && b.text.length < 80) { cur.grades = b.text; claimed = true; }
    if (!cur.studyMode && STUDY_HINT.test(b.text)) { cur.studyMode = b.text; claimed = true; }
    if (LOC_HINT.test(b.text)) { cur.addressLines.push(b.text); claimed = true; }
    if (!cur.contactPerson && PERSON_HINT.test(b.text)) { cur.contactPerson = b.text; claimed = true; }

    // No silent drops. An unclassified line is recorded, not discarded -- it is
    // how we find out the directory changed shape next academic year.
    if (!claimed) cur.unparsed.push(b.text);
  }

  return out;
}

// ── main ─────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const all: DiasporaSchool[] = [];

  for (const s of SOURCES) {
    const { content, link } = await fetchPost(s);
    const schools = parse(content, s, link);
    console.log(`\n── ${s.country} — ${schools.length} schools from ${link}`);

    for (const sc of schools) {
      if (sc.mapsUrl) {
        const { lat, lng, placeUrl } = await resolveMaps(sc.mapsUrl);
        sc.lat = lat; sc.lng = lng; sc.placeUrl = placeUrl;
      }
      const reach = sc.phones.map((p) => p.reach[0]).join('');
      console.log(
        `   ${String(sc.phones.length).padStart(2)}☎ ${(sc.emails.length ? 'e' : ' ')}` +
          `${(sc.lat != null ? '📍' : '  ')} ${sc.section.slice(0, 12).padEnd(12)} ` +
          `${sc.name.slice(0, 44).padEnd(44)} ${reach}`
      );
    }
    all.push(...schools);
  }

  // ── the report, per country and honest about what it missed ────────────────
  console.log(`\n═══ harvest — ${all.length} Sudanese diaspora schools ═══\n`);
  for (const c of ['EG', 'SA'] as const) {
    const rows = all.filter((r) => r.country === c);
    const ph = rows.filter((r) => r.phones.length).length;
    const mob = rows.filter((r) => r.phones.some((p) => p.reach === 'MOBILE')).length;
    console.log(
      `  ${c}  ${String(rows.length).padStart(3)} schools · ${String(ph).padStart(3)} with a phone · ` +
        `${String(mob).padStart(3)} with a MOBILE (WhatsApp-reachable) · ` +
        `${rows.filter((r) => r.emails.length).length} with an email · ` +
        `${rows.filter((r) => r.lat != null).length} with a coordinate`
    );
  }
  const phones = all.flatMap((r) => r.phones);
  console.log(`\n  ${phones.length} distinct numbers · ` +
    `MOBILE ${phones.filter((p) => p.reach === 'MOBILE').length} · ` +
    `LANDLINE ${phones.filter((p) => p.reach === 'LANDLINE').length}`);
  const foreign = phones.filter((p) => p.countryGuess);
  if (foreign.length) {
    console.log(`  ${foreign.length} number(s) whose country differs from the directory's — kept and tagged, not dropped`);
  }
  const noContact = all.filter((r) => !r.phones.length && !r.emails.length);
  console.log(`\n  ${noContact.length} school(s) parsed with NO contact at all:`);
  for (const r of noContact) console.log(`      ${r.country} ${r.name.slice(0, 60)}`);
  const unparsed = all.flatMap((r) => r.unparsed.map((u) => `${r.name.slice(0, 24)} :: ${u.slice(0, 70)}`));
  console.log(`\n  ${unparsed.length} line(s) the parser could not classify (kept, not dropped):`);
  for (const u of unparsed.slice(0, 15)) console.log(`      ${u}`);
  if (unparsed.length > 15) console.log(`      … and ${unparsed.length - 15} more (all in the JSON)`);

  mkdirSync(DATA, { recursive: true });
  const out = `${DATA}/schools.json`;
  writeFileSync(out, JSON.stringify({ generatedAt: new Date().toISOString(), schools: all }, null, 2));
  console.log(`\n  → ${out}`);
  console.log('  Nothing was written to Twenty. Load with sd-upsert.ts.\n');
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
