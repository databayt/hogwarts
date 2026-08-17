// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Re-fetch the OpenStreetMap tags the original import threw away.
 *
 * The 2026-07-26 import took a name and a coordinate from each OSM element and
 * dropped the rest of the tag bag on the floor. That was the expensive part --
 * the elements are still there, they are free to read, and they carry the things
 * this pipeline is short of: a phone, a website, an English name, a street, and
 * -- most commercially useful -- `operator:type=private`, because private schools
 * are the ones that pay.
 *
 * So before spending a cent on Google Places or risking an account on a Facebook
 * scraper, we go back and read what we already had. Zero cost, zero ToS risk.
 *
 * `out center` also returns a coordinate for ways and relations, which backfills
 * lat/lon on the ~2,500 rows that lack it -- and that is what makes a paid
 * geo-lookup lane possible at all later.
 *
 * ── Three phases, deliberately separate ─────────────────────────────────────
 *
 *   fetch   Overpass -> raw JSON cached per batch in .data/osm/. Re-runnable and
 *           resumable: a cached batch is never re-fetched, so a write bug at row
 *           1,900 costs a retry, not another 20 minutes of somebody's free API.
 *   plan    cache + live CRM -> an explicit, reviewable write set. This is the
 *           dry run, and it is a file you can read before anything is touched.
 *   apply   the plan -> one PATCH per row. Nothing computes a value here; apply
 *           only executes what plan already wrote down.
 *
 * The separation is what makes the idempotency claim testable: a second `--apply`
 * must PLAN ZERO WRITES. For an update pipeline "the row count didn't change" is
 * not a dedup test -- it inserts nothing, so it passes trivially and proves nothing.
 *
 * ── The rules it will not break ─────────────────────────────────────────────
 *
 *   - REST only. Never SQL into a workspace schema.
 *   - Fill empty, never replace populated. A populated field that disagrees
 *     becomes a dated line in `enrichmentNotes`, not an overwrite.
 *   - Phones go through normalizePhone: E.164, and MOBILE/LANDLINE/NOT_DIALABLE
 *     labelled, because a landline in a WhatsApp campaign is a silent
 *     non-delivery that reads as disinterest.
 *   - Nothing is capped silently. Rows without an OSM id, failed batches and
 *     unmapped tag values are all logged with counts and names.
 *
 *   TWENTY_API_URL=http://localhost:3100 \
 *   TWENTY_API_KEY=$(security find-generic-password -s databayt-twenty -a hogwarts -w) \
 *     npx tsx scripts/crm/osm-refetch.ts [--apply] [--refetch] [--batch=150]
 */
import { writeFileSync, readFileSync, existsSync, mkdirSync, readdirSync } from 'node:fs';

import { normalizePhone, type Reach } from './normalize-contacts';
import { twentyClient } from './twenty-rest';

const APPLY = process.argv.includes('--apply');
const REFETCH = process.argv.includes('--refetch');
const arg = (n: string, d = ''): string => {
  const hit = process.argv.find((a) => a.startsWith(`--${n}=`));
  return hit ? hit.split('=').slice(1).join('=') : d;
};

const DATA = 'scripts/crm/.data';
const CACHE = `${DATA}/osm`;
const PLAN_FILE = `${DATA}/osm-plan.json`;

/**
 * Politeness, and the two failure modes that actually bite.
 *
 * overpass-api.de is the freshest mirror (its base timestamp tracks today; kumi
 * lagged by ten weeks when this was written), so it leads and the others catch
 * overflow. A 300-id batch times out on the main endpoint; 150 is comfortable.
 *
 * The subtle one: Overpass reports "server busy" as an HTML body with HTTP 200.
 * A naive res.json() throws a JSON parse error and the real cause -- back off and
 * retry -- never reaches the log. Every response is content-type checked first.
 *
 * And a descriptive User-Agent is not optional: without one Apache answers 406
 * Not Acceptable, which looks like a malformed query and is not.
 *
 * The one that actually cost an hour: `fetch()` has NO default timeout. A mirror
 * that accepts the connection and then never answers (kumi did exactly this)
 * hangs the run forever -- no error, no progress, a live process doing nothing.
 * Every request now carries an AbortSignal, so a dead mirror costs REQ_TIMEOUT
 * and a rotation instead of the whole job.
 */
const REQ_TIMEOUT_MS = 150_000;
const MIRRORS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
];
const UA = 'databayt-hogwarts-crm/1.0 (school lead enrichment; osmanabdout@hotmail.com)';
const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

interface OsmElement {
  type: 'node' | 'way' | 'relation';
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

interface Link {
  primaryLinkUrl?: string | null;
  primaryLinkLabel?: string | null;
}
interface Address {
  addressStreet1?: string | null;
  addressCity?: string | null;
  addressState?: string | null;
  addressPostcode?: string | null;
  addressLat?: number | null;
  addressLng?: number | null;
}
interface Company {
  id: string;
  name?: string | null;
  country?: string | null;
  schoolPhone?: string | null;
  principalContact?: string | null;
  schoolType?: string | null;
  nameEn?: string | null;
  grades?: string | null;
  iscedLevel?: string | null;
  gender?: string | null;
  operator?: string | null;
  enrichmentNotes?: string | null;
  facebook?: Link | null;
  domainName?: Link | null;
  sourceUrl?: Link | null;
  address?: Address | null;
}

const txt = (s: string | null | undefined): string => (s ?? '').trim();
const linkUrl = (l: Link | null | undefined): string => (l?.primaryLinkUrl ?? '').trim();

/** A page is only a lead if it is a Page. A /groups/ URL is a community, not a school. */
const isUsableFacebookPage = (u: string): boolean =>
  /facebook\.com/i.test(u) && !/facebook\.com\/groups\//i.test(u);

/**
 * Comparators that ignore the differences nobody means.
 *
 * The first dry run produced 104 website conflicts and 27 Facebook ones. 103 and
 * ~20 of those were the same address written two ways -- a trailing slash, or an
 * Arabic page name percent-encoded on one side and literal on the other:
 *
 *   https://albayan.edu.sa/          vs  https://albayan.edu.sa
 *   facebook.com/مدرسة-خالد          vs  facebook.com/%D9%85%D8%AF%D8%B1%D8%B3%D8%A9-...
 *
 * Recording those as conflicts is worse than useless: it buries the ONE real
 * website disagreement under a hundred notes, and a conflict log nobody can read
 * is a conflict log nobody reads. Same for email, where the only difference is
 * capitalisation (`Info@` vs `info@`).
 */
const sameUrl = (a: string, b: string): boolean => {
  const norm = (u: string): string => {
    let s = u.trim();
    try { s = decodeURIComponent(s); } catch { /* malformed escape — compare raw */ }
    return s.toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/+$/, '');
  };
  return norm(a) === norm(b);
};
const sameEmail = (a: string, b: string): boolean => a.trim().toLowerCase() === b.trim().toLowerCase();

const OSM_RE = /openstreetmap\.org\/(node|way|relation)\/(\d+)/i;

// ── fetch ────────────────────────────────────────────────────────────────────

/**
 * Failures per mirror, remembered for the whole run. A mirror that has timed out
 * once is tried last rather than every third batch -- otherwise one dead endpoint
 * taxes the job REQ_TIMEOUT for every rotation it takes part in.
 */
const mirrorFailures = new Map<string, number>(MIRRORS.map((m) => [m, 0]));

/** One Overpass call, rotating mirrors and treating an HTML body as failure. */
async function overpass(query: string, label: string): Promise<OsmElement[]> {
  for (let attempt = 0; attempt < MIRRORS.length * 2; attempt++) {
    const ep = [...MIRRORS].sort((a, b) => (mirrorFailures.get(a) ?? 0) - (mirrorFailures.get(b) ?? 0))[
      attempt % MIRRORS.length
    ];
    try {
      const res = await fetch(ep, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': UA,
          Accept: 'application/json',
        },
        body: `data=${encodeURIComponent(query)}`,
        signal: AbortSignal.timeout(REQ_TIMEOUT_MS),
      });
      const ct = res.headers.get('content-type') ?? '';
      const body = await res.text();
      // The HTML-with-200 trap: check the shape of the answer, not just the code.
      if (!res.ok || !ct.includes('json')) {
        const hint = /rate_limit|too many|busy|slow down/i.test(body) ? 'rate limited' : `HTTP ${res.status}`;
        throw new Error(`${hint} from ${new URL(ep).host}`);
      }
      return (JSON.parse(body).elements ?? []) as OsmElement[];
    } catch (e) {
      mirrorFailures.set(ep, (mirrorFailures.get(ep) ?? 0) + 1);
      const why = e instanceof Error ? (e.name === 'TimeoutError' ? 'timed out' : e.message) : String(e);
      const backoff = 5_000 * (attempt + 1);
      console.warn(`    ! ${label}: ${why} on ${new URL(ep).host} — retrying in ${backoff / 1000}s`);
      await sleep(backoff);
    }
  }
  throw new Error(`${label}: every mirror failed`);
}

/** Batch ids by type; an empty group would be an Overpass syntax error. */
function buildQuery(batch: { type: string; id: string }[]): string {
  const groups = (['node', 'way', 'relation'] as const)
    .map((t) => {
      const ids = batch.filter((b) => b.type === t).map((b) => b.id);
      return ids.length ? `${t}(id:${ids.join(',')});` : '';
    })
    .filter(Boolean)
    .join('');
  return `[out:json][timeout:180];(${groups});out tags center;`;
}

async function fetchAll(refs: { type: string; id: string }[], size: number): Promise<Map<string, OsmElement>> {
  mkdirSync(CACHE, { recursive: true });
  const batches: (typeof refs)[] = [];
  for (let i = 0; i < refs.length; i += size) batches.push(refs.slice(i, i + size));

  console.log(`\n── fetch — ${refs.length} elements in ${batches.length} batches of ${size}\n`);
  const failed: number[] = [];

  for (const [i, batch] of batches.entries()) {
    const file = `${CACHE}/batch-${String(i).padStart(3, '0')}.json`;
    if (existsSync(file) && !REFETCH) continue;
    try {
      const els = await overpass(buildQuery(batch), `batch ${i + 1}/${batches.length}`);
      writeFileSync(file, JSON.stringify(els));
      const withContact = els.filter(
        (e) => e.tags && ['phone', 'contact:phone', 'website', 'email', 'contact:email'].some((k) => e.tags![k])
      ).length;
      console.log(
        `  batch ${String(i + 1).padStart(3)}/${batches.length}  ${String(els.length).padStart(4)} elements, ${withContact} with a contact tag`
      );
      await sleep(1_500); // Overpass politeness between batches
    } catch (e) {
      // A dropped batch is a logged loss, never a silent one.
      console.error(`  ✗ batch ${i + 1} FAILED: ${e instanceof Error ? e.message : e}`);
      console.error(`    dropped ids: ${batch.map((b) => `${b.type}/${b.id}`).join(',')}`);
      failed.push(i);
    }
  }

  const byKey = new Map<string, OsmElement>();
  for (const f of readdirSync(CACHE).filter((f) => f.endsWith('.json'))) {
    for (const el of JSON.parse(readFileSync(`${CACHE}/${f}`, 'utf8')) as OsmElement[]) {
      byKey.set(`${el.type}/${el.id}`, el);
    }
  }
  console.log(`\n  cached ${byKey.size}/${refs.length} elements` + (failed.length ? ` — ${failed.length} batch(es) FAILED` : ''));
  if (failed.length) console.log(`  re-run to retry the failed batches (cached ones are skipped)`);
  return byKey;
}

// ── plan ─────────────────────────────────────────────────────────────────────

/**
 * `operator:type` is the tag worth the whole exercise: it is the only free signal
 * that separates a school that can buy software from one funded by a ministry.
 * Values outside this map are counted and reported, never guessed into a tier.
 */
const OPERATOR_TYPE: Record<string, string> = {
  private: 'PRIVATE',
  private_non_profit: 'PRIVATE',
  private_for_profit: 'PRIVATE',
  public: 'PUBLIC',
  government: 'PUBLIC',
  'public/government': 'PUBLIC',
  // Deliberately absent: `religious` (may be either, and in this market often
  // private but state-funded) and `school` (a tautology someone typed into the
  // wrong field). Both are counted in the unmapped report rather than guessed --
  // a wrong PRIVATE here becomes a wrong tier, which becomes a wasted call.
};

const pick = (t: Record<string, string>, ...keys: string[]): string => {
  for (const k of keys) if (txt(t[k])) return txt(t[k]);
  return '';
};

interface Write {
  id: string;
  name: string;
  country: string;
  osm: string;
  patch: Record<string, unknown>;
  gained: string[];
  conflicts: string[];
  phoneReach?: Reach;
}

interface Plan {
  generatedAt: string;
  writes: Write[];
  stats: Record<string, number>;
  unmapped: Record<string, Record<string, number>>;
  noOsmId: { id: string; name: string }[];
  missingFromOverpass: string[];
}

function plan(rows: Company[], osm: Map<string, OsmElement>): Plan {
  const writes: Write[] = [];
  const stats: Record<string, number> = {};
  const unmapped: Record<string, Record<string, number>> = { operatorType: {}, phone: {} };
  const noOsmId: { id: string; name: string }[] = [];
  const missingFromOverpass: string[] = [];
  const bump = (k: string): void => { stats[k] = (stats[k] ?? 0) + 1; };
  const today = new Date().toISOString().slice(0, 10);

  for (const c of rows) {
    const m = OSM_RE.exec(linkUrl(c.sourceUrl));
    if (!m) { noOsmId.push({ id: c.id, name: c.name ?? '' }); continue; }
    const key = `${m[1].toLowerCase()}/${m[2]}`;
    const el = osm.get(key);
    if (!el) { missingFromOverpass.push(key); continue; }
    const tags = el.tags ?? {};

    const patch: Record<string, unknown> = {};
    const address: Record<string, unknown> = {};
    const gained: string[] = [];
    const conflicts: string[] = [];
    let phoneReach: Reach | undefined;

    /**
     * The fill-empty-never-replace-populated rule, in one place so no field can
     * quietly opt out of it. Populated-and-different becomes a note; the marker
     * `osm:<field>` is stable across dates so a re-run cannot append a second
     * copy of the same conflict.
     */
    const offer = (
      field: string,
      live: string,
      value: string,
      write: () => void,
      same: (a: string, b: string) => boolean = (a, b) => a === b
    ): void => {
      if (!value) return;
      // A note for this field means the situation was already adjudicated -- a
      // conflict recorded, or a unique constraint that refused the write. Either
      // way, re-planning it every run would never converge: the row would be
      // "1 school would be updated" forever, and an idempotency check that never
      // reaches zero is an idempotency check nobody can use.
      if ((c.enrichmentNotes ?? '').includes(`osm:${field}`)) { bump(`alreadyAdjudicated.${field}`); return; }
      if (!live) { write(); gained.push(field); bump(`gained.${field}`); return; }
      if (same(live, value)) { bump(`alreadyCorrect.${field}`); return; }
      conflicts.push(`${today} osm:${field} — found "${value}", CRM has "${live}", not overwritten`);
      bump(`conflict.${field}`);
    };

    // -- contact, the fields that decide reachability ------------------------
    const rawPhone = pick(tags, 'phone', 'contact:phone', 'contact:mobile', 'phone:mobile');
    if (rawPhone) {
      // Multiple numbers arrive semicolon-separated; the first is the main line.
      const n = normalizePhone(rawPhone.split(';')[0], (c.country ?? '').toUpperCase());
      if (n.e164) {
        phoneReach = n.reach;
        offer('phone', txt(c.schoolPhone), n.e164, () => { patch.schoolPhone = n.e164; });
      } else {
        unmapped.phone[n.why] = (unmapped.phone[n.why] ?? 0) + 1;
      }
    }

    const email = pick(tags, 'email', 'contact:email').split(';')[0];
    if (email) offer('email', txt(c.principalContact), email, () => { patch.principalContact = email; }, sameEmail);

    const site = pick(tags, 'website', 'contact:website', 'url').split(';')[0];
    if (site) {
      const url = /^https?:\/\//i.test(site) ? site : `https://${site}`;
      offer('website', linkUrl(c.domainName), url, () => {
        patch.domainName = { primaryLinkUrl: url, primaryLinkLabel: '' };
      }, sameUrl);
    }

    const fb = pick(tags, 'contact:facebook', 'facebook').split(';')[0];
    if (fb && isUsableFacebookPage(fb)) {
      offer('facebook', linkUrl(c.facebook), fb, () => {
        patch.facebook = { primaryLinkUrl: fb, primaryLinkLabel: '' };
      }, sameUrl);
    }

    // -- attributes, the fields that decide tier -----------------------------
    offer('nameEn', txt(c.nameEn), pick(tags, 'name:en'), () => { patch.nameEn = pick(tags, 'name:en'); });
    offer('grades', txt(c.grades), pick(tags, 'grades', 'school:grades'), () => {
      patch.grades = pick(tags, 'grades', 'school:grades');
    });
    offer('iscedLevel', txt(c.iscedLevel), pick(tags, 'isced:level'), () => { patch.iscedLevel = pick(tags, 'isced:level'); });
    offer('gender', txt(c.gender), pick(tags, 'school:gender'), () => { patch.gender = pick(tags, 'school:gender'); });
    offer('operator', txt(c.operator), pick(tags, 'operator'), () => { patch.operator = pick(tags, 'operator'); });

    const opType = pick(tags, 'operator:type').toLowerCase();
    if (opType) {
      const mapped = OPERATOR_TYPE[opType];
      if (mapped) offer('schoolType', txt(c.schoolType), mapped, () => { patch.schoolType = mapped; });
      else unmapped.operatorType[opType] = (unmapped.operatorType[opType] ?? 0) + 1;
    }

    // -- address + coordinate ------------------------------------------------
    const street = pick(tags, 'addr:street');
    if (street && !txt(c.address?.addressStreet1)) { address.addressStreet1 = street; gained.push('street'); bump('gained.street'); }
    const city = pick(tags, 'addr:city');
    if (city && !txt(c.address?.addressCity)) { address.addressCity = city; gained.push('city'); bump('gained.city'); }
    const postcode = pick(tags, 'addr:postcode');
    if (postcode && !txt(c.address?.addressPostcode)) {
      address.addressPostcode = postcode; gained.push('postcode'); bump('gained.postcode');
    }

    // `out center` gives ways and relations a coordinate, which is what unlocks
    // any later geo lookup. Twenty merges composite subfields on PATCH (verified),
    // so sending lat/lng alone cannot wipe a city that is already there.
    const lat = el.lat ?? el.center?.lat;
    const lon = el.lon ?? el.center?.lon;
    if (lat != null && lon != null && c.address?.addressLat == null) {
      address.addressLat = lat;
      address.addressLng = lon;
      gained.push('coords');
      bump('gained.coords');
    }
    if (Object.keys(address).length) patch.address = address;

    if (conflicts.length) {
      patch.enrichmentNotes = [txt(c.enrichmentNotes), ...conflicts].filter(Boolean).join('\n');
    }
    if (!Object.keys(patch).length) continue;

    // enrichedAt is stamped only on rows that actually change, and is set AFTER
    // the emptiness check above -- if it took part in the diff, every re-run
    // would rewrite every row and the idempotency proof would be a lie.
    patch.enrichedAt = new Date().toISOString();
    writes.push({
      id: c.id, name: c.name ?? '', country: c.country ?? '', osm: key,
      patch, gained, conflicts, phoneReach,
    });
  }

  return { generatedAt: new Date().toISOString(), writes, stats, unmapped, noOsmId, missingFromOverpass };
}

// ── main ─────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const size = Number(arg('batch', '150'));
  const { all, rest } = twentyClient();

  console.log('Reading schools from Twenty …');
  const rows = (await all('companies')) as unknown as Company[];
  console.log(`  ${rows.length} schools`);

  const refs: { type: string; id: string }[] = [];
  for (const c of rows) {
    const m = OSM_RE.exec(linkUrl(c.sourceUrl));
    if (m) refs.push({ type: m[1].toLowerCase(), id: m[2] });
  }

  const osm = await fetchAll(refs, size);
  const p = plan(rows, osm);
  mkdirSync(DATA, { recursive: true });
  writeFileSync(PLAN_FILE, JSON.stringify(p, null, 2));

  console.log(`\n── plan — ${p.writes.length} schools would be updated\n`);
  const gains = Object.entries(p.stats).filter(([k]) => k.startsWith('gained.')).sort((a, b) => b[1] - a[1]);
  for (const [k, v] of gains) console.log(`  +${String(v).padStart(5)}  ${k.replace('gained.', '')}`);

  const contactGain = ['phone', 'email'].reduce((n, f) => n + (p.stats[`gained.${f}`] ?? 0), 0);
  console.log(`\n  ${contactGain} schools gain a directly contactable field (phone or email)`);
  const reach = p.writes.filter((w) => w.phoneReach).reduce((m, w) => {
    m[w.phoneReach!] = (m[w.phoneReach!] ?? 0) + 1; return m;
  }, {} as Record<string, number>);
  if (Object.keys(reach).length) {
    console.log(`  phone reach: ${Object.entries(reach).map(([k, v]) => `${k} ${v}`).join('  ')}`);
  }

  const conflicts = Object.entries(p.stats).filter(([k]) => k.startsWith('conflict.'));
  if (conflicts.length) {
    console.log(`\n  conflicts (recorded as notes, never overwritten):`);
    for (const [k, v] of conflicts) console.log(`    ${String(v).padStart(4)}  ${k.replace('conflict.', '')}`);
  }

  // Everything dropped, stated out loud. A silent cap reads as full coverage.
  console.log(`\n  dropped / not reached:`);
  console.log(`    ${p.noOsmId.length} schools carry no OSM id in sourceUrl:`);
  for (const n of p.noOsmId) console.log(`        ${n.name}`);
  if (p.missingFromOverpass.length) {
    console.log(`    ${p.missingFromOverpass.length} OSM ids returned nothing (deleted upstream since the import)`);
  }
  for (const [k, v] of Object.entries(p.unmapped)) {
    const items = Object.entries(v).sort((a, b) => b[1] - a[1]);
    if (items.length) console.log(`    unmapped ${k}: ${items.map(([a, b]) => `${a} (${b})`).join(', ')}`);
  }
  console.log(`\n  → ${PLAN_FILE}`);

  if (!APPLY) {
    console.log(`\n  DRY RUN — nothing written. Re-run with --apply.\n`);
    return;
  }
  if (!p.writes.length) {
    console.log(`\n  ✅ Nothing to write — the CRM already matches OSM. (This is the idempotency proof.)\n`);
    return;
  }

  console.log(`\n── apply — ${p.writes.length} PATCHes …\n`);
  let ok = 0;
  let degraded = 0;
  const failures: string[] = [];
  for (const w of p.writes) {
    try {
      await rest('PATCH', `companies/${w.id}`, w.patch);
      ok++;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      /**
       * The workspace puts a UNIQUE constraint on domainName, and school groups
       * genuinely break it: "نبع المعرفة — primary" and "نبع المعرفة — secondary"
       * are two rows, two campuses, one website. Losing the whole PATCH over that
       * would also throw away the coordinate, which is the part we actually came
       * for. So drop the contested field, keep the rest, and record WHY in the
       * conflict log rather than leaving a silent hole.
       */
      if (/duplicate entry/i.test(msg) && w.patch.domainName) {
        const url = (w.patch.domainName as Link).primaryLinkUrl ?? '';
        const { domainName, ...rest2 } = w.patch;
        const note = `${new Date().toISOString().slice(0, 10)} osm:website — "${url}" already belongs to another school (shared by a school group); not set here`;
        rest2.enrichmentNotes = [String(rest2.enrichmentNotes ?? ''), note].filter(Boolean).join('\n');
        try {
          await rest('PATCH', `companies/${w.id}`, rest2);
          degraded++;
        } catch (e2) {
          failures.push(`${w.name}: ${e2 instanceof Error ? e2.message : e2}`);
        }
      } else {
        failures.push(`${w.name}: ${msg}`);
      }
    }
    if ((ok + degraded) % 100 === 0) console.log(`  ${ok + degraded}/${p.writes.length} …`);
  }
  console.log(`\n  ${ok}/${p.writes.length} updated.`);
  if (degraded) {
    console.log(`  ${degraded} written WITHOUT a contested unique field (recorded as a note, not lost)`);
  }
  if (failures.length) {
    console.log(`  ${failures.length} FAILED:`);
    for (const f of failures.slice(0, 20)) console.log(`    ! ${f}`);
  }
  console.log(`\n  Re-run without --apply: the plan must be 0 writes. That is the dedup test.\n`);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
