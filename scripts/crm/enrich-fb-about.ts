// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Read a school's Facebook About tab -- the thing the old extractor never did.
 *
 * 113 CRM rows now carry a Facebook page and no phone. In Sudan that page is
 * very often the school's only public surface: no website, no directory entry,
 * and a ministry that is offline. The Intro block on the About tab carries the
 * phone, the address and the website in plain text.
 *
 * ── Why this is a rebuild and not a patch ───────────────────────────────────
 *
 * The previous enricher visited 41 pages and produced almost nothing, for four
 * reasons that are all visible in its own output:
 *
 *  1. **It never opened the About tab.** It loaded the bare page URL and read
 *     `document.body.innerText`, truncated to 5,000 characters. Record 40 in its
 *     JSONL is the proof: the captured text contains
 *     `Intro … Page · School … Madani Street, Khartoum, Sudan … 018 321 5000`
 *     while the stored record has `primaryPhone:null, whatsapp:null, emails:[]`.
 *     The data was on the page and fell out of the pipeline.
 *  2. **Its phone regex could not match a Sudanese landline.**
 *     `(?:9[0-9]|1[0-2])` rejects `018 321 5000`. The same loose window let a
 *     Facebook numeric page id (`100085602…`) through as a phone number.
 *  3. **It invented WhatsApp.** Every phone became `wa.me/<phone>`, which is why
 *     its WhatsApp coverage exactly equalled its phone coverage. A number is
 *     recorded as WhatsApp here only when a `wa.me` link or an Arabic WhatsApp
 *     label is actually present AND the number is a mobile -- a landline cannot
 *     receive WhatsApp whatever the page says next to it.
 *  4. **It scraped groups and news pages.** A `/groups/` URL is a community with
 *     no Intro block at all, and about a third of the discovered pages are news
 *     outlets or foreign institutions.
 *
 * ── The account rule, enforced twice ────────────────────────────────────────
 *
 * This drives a logged-in Chrome, so it refuses to start unless a dedicated
 * scrape browser is declared -- see `requireScrapePort()`. The `scrape-guard`
 * hook is the outer fence and this filename is chosen to match its
 * `scripts/crm/enrich` pattern, but a hook that only reads command text cannot
 * be the only defence.
 *
 *   FB_SCRAPE_PORT=9333 FB_SCRAPE_PROFILE="$HOME/.claude/chrome-fbscrape-profile" \
 *   FB_SCRAPE_DELAY_MS=8000 \
 *   TWENTY_API_URL=http://localhost:3100 \
 *   TWENTY_API_KEY=$(security find-generic-password -s databayt-twenty -a hogwarts -w) \
 *     npx tsx scripts/crm/enrich-fb-about.ts [--limit=N]
 */
import { appendFileSync, readFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';

import { createCdpSession, requireScrapePort, type CdpSession } from './cdp-session';
import { extractContacts } from './contact-extract';
import { normalizePhone } from './normalize-contacts';
import { twentyClient } from './twenty-rest';

const DATA = 'scripts/crm/.data';
const LEDGER = `${DATA}/fb-about.jsonl`;
const arg = (n: string, d = ''): string => {
  const hit = process.argv.find((a) => a.startsWith(`--${n}=`));
  return hit ? hit.split('=').slice(1).join('=') : d;
};

interface Link { primaryLinkUrl?: string | null }
interface Company {
  id: string; name?: string | null; country?: string | null;
  schoolPhone?: string | null; principalContact?: string | null;
  facebook?: Link | null; domainName?: Link | null;
  address?: { addressStreet1?: string | null } | null;
}

export interface AboutResult {
  id: string;
  name: string;
  url: string;
  ok: boolean;
  why?: string;
  intro?: string;
  phones: { e164: string; reach: string; whatsapp: boolean }[];
  emails: string[];
  website?: string;
  address?: string;
  category?: string;
  followers?: number;
  capturedAt: string;
}

const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));
const jitter = (ms: number): number => ms + Math.floor(Math.random() * ms * 0.6);

/**
 * Facebook serves the About tab under a few paths depending on page type; try
 * the most specific first. `about_contact_and_basic_info` is the panel that
 * actually holds phone/email/website when the page owner filled it in.
 */
const SUBPATHS =
  /\/(mentions|videos|photos|reels|community|followers|about|about_[a-z_]+|posts|events|reviews|shop|groups|likes|app|live)\/?$/i;

/**
 * Strip whatever tab the discovered URL happened to land on before building the
 * About URL. The CRM holds pages as `/RiverNileSchool/mentions` and
 * `/1000636.../mentions`, and appending `/about_contact_and_basic_info` to those
 * produces a 404-ish shell that still renders the page chrome — which is exactly
 * how the first pass "succeeded" on five pages and returned nothing.
 */
const aboutUrls = (pageUrl: string): string[] => {
  /**
   * `profile.php?id=N` keeps its identity in the QUERY STRING, so splitting on
   * '?' leaves the bare string "facebook.com/profile.php" -- which Facebook
   * resolves to the SIGNED-IN USER'S OWN profile. 572 of the 640 discovered
   * pages are that shape, so the first pass over them reported "page deleted or
   * renamed" for essentially every row while the pages were perfectly alive.
   *
   * The numeric id works as a plain path segment, and that form is verified to
   * render the contact panel, so normalise to it before doing anything else.
   */
  const pid = /facebook\.com\/profile\.php\?id=(\d+)/i.exec(pageUrl)?.[1];
  if (pid) {
    const b = `https://www.facebook.com/${pid}`;
    return [`${b}/about_contact_and_basic_info`, `${b}/about`, b];
  }
  let base = pageUrl.replace(/\/+$/, '').split('?')[0];
  for (let i = 0; i < 3 && SUBPATHS.test(base); i++) base = base.replace(SUBPATHS, '');
  // `/about_contact_and_basic_info` is the one that matters: Facebook redirects
  // it to `/directory_contact_info/`, which renders the phone and its own
  // Mobile/Landline label. `/about` alone renders only the section headings.
  return [`${base}/about_contact_and_basic_info`, `${base}/about`, base];
};

/** Read the whole About panel, untruncated, plus every tel:/mailto:/wa.me link. */
const SCRAPE_JS = `(() => {
  const txt = document.body ? document.body.innerText : '';
  const links = Array.from(document.querySelectorAll('a')).map(a => a.href || '');
  const grab = (re) => links.filter(l => re.test(l));
  const h1 = document.querySelector('h1');
  return {
    title: h1 ? h1.innerText.trim() : (document.title || '').replace(/\\s*\\|.*$/, '').trim(),
    text: txt,
    tel: grab(/^tel:/).map(l => l.replace(/^tel:/, '')),
    mail: grab(/^mailto:/).map(l => l.replace(/^mailto:/, '')),
    wa: grab(/wa\\.me|api\\.whatsapp\\.com/),
    ext: grab(/l\\.facebook\\.com\\/l\\.php|https?:\\/\\/(?!.*facebook\\.com)/),
    loginWall: !!document.querySelector('input[name="email"][type="text"], input[name="pass"]'),
    checkpoint: /checkpoint|confirm your identity|we limit how often|temporarily blocked|suspicious/i.test(txt.slice(0, 4000)),
    // Chrome's own error page. Without this the run records an empty result as
    // a SUCCESS and the ledger never retries that page again.
    netError: /ERR_INTERNET_DISCONNECTED|ERR_NAME_NOT_RESOLVED|ERR_CONNECTION|ERR_TIMED_OUT|ERR_PROXY|No internet/i.test(txt.slice(0, 2000)),
    // A deleted or renamed Page redirects to the SIGNED-IN USER'S OWN profile,
    // which renders perfectly and contains no school whatsoever.
    ownProfile: !!document.querySelector('[aria-label="Edit profile"]')
      || /Add cover photo|Add to story|People You May Know/i.test(txt.slice(0, 1200)),
  };
})()`;

/**
 * The contact panel is short — a few hundred characters — and anchoring on the
 * word "Intro" lands on the tab strip ("Intro | Category | Details | Reels"),
 * not on content. So the whole page text is the haystack; it is small, and the
 * noise filters in contact-extract already reject follower counts and years.
 */
function introOf(text: string): string {
  const i = text.search(/Contact info|معلومات الاتصال/);
  return i >= 0 ? text.slice(Math.max(0, i - 100), i + 900) : text.slice(0, 2500);
}

const ADDRESS_RE =
  /^[^\n]{6,120}(?:Street|St\.|Road|Rd\.|Avenue|Ave|Khartoum|Omdurman|Bahri|Sudan|شارع|طريق|حي|الخرطوم|أم درمان|بحري|السودان)[^\n]{0,60}$/im;

async function scrapeOne(s: CdpSession, c: Company, url: string, delayMs: number): Promise<AboutResult> {
  const base: AboutResult = {
    id: c.id, name: c.name ?? '', url, ok: false, phones: [], emails: [],
    capturedAt: new Date().toISOString(),
  };

  for (const target of aboutUrls(url)) {
    await s.navigate(target);
    await sleep(jitter(delayMs));
    const r = await s.evaluate<{
      title: string; text: string; tel: string[]; mail: string[]; wa: string[]; ext: string[];
      loginWall: boolean; checkpoint: boolean; netError: boolean; ownProfile: boolean;
    }>(SCRAPE_JS);

    // Stop the whole run on a challenge rather than pushing through it. Burning
    // the dedicated account is cheap to recover from but pointless.
    if (r.checkpoint) return { ...base, why: 'CHECKPOINT' };
    if (r.loginWall) return { ...base, why: 'login wall — the scrape session is signed out' };
    /**
     * Two failures that look exactly like an empty page, and both were recorded
     * as successes before this check existed.
     *
     * NETWORK is fatal for the whole run: once Chrome has lost its connection,
     * every remaining page in the queue gets burned as "no content found" and
     * the ledger never retries any of them. Six pages were lost that way.
     *
     * OWN_PROFILE is per-page: sixteen pages recorded the scrape account's own
     * timeline — "Add cover photo … People You May Know" — as a school's About
     * tab, because a dead Page redirects there.
     */
    if (r.netError) return { ...base, why: 'NETWORK' };
    if (r.ownProfile) return { ...base, why: 'redirected to the scrape account profile — page deleted or renamed' };

    const text = r.text ?? '';
    // Only accept a variant that actually rendered the contact panel; fall
    // through to the next URL form otherwise.
    const rendered = /Contact info|معلومات الاتصال/i.test(text);
    if (!rendered && target !== aboutUrls(url).at(-1)) continue;

    const intro = introOf(text);
    const hay = `${intro}\n${r.tel.join('\n')}\n${r.mail.join('\n')}\n${r.wa.join('\n')}`;

    // WhatsApp only when the page says so — a wa.me link, or an Arabic label.
    const waNumbers = new Set(
      r.wa.map((l) => (/(?:wa\.me\/|phone=)(\+?\d{7,15})/.exec(l) ?? [])[1]).filter(Boolean) as string[]
    );
    const waLabelled = extractContacts(hay, 'fb-about').some((x) => x.kind === 'whatsapp');

    const phones: AboutResult['phones'] = [];
    const runs = hay
      .split(/[\/,،|]|\s[-–—]\s|(?<=\d)[-–—](?=0)/)
      .flatMap((p) => p.match(/(?:\+|00)?[\d][\d\s().]{6,18}\d/g) ?? []);
    for (const run of runs) {
      const n = normalizePhone(run, (c.country ?? 'SD').toUpperCase());
      if (!n.e164 || phones.some((p) => p.e164 === n.e164)) continue;
      const digits = n.e164.replace(/\D/g, '');
      // Facebook prints its own label next to the number ("Phone 012 577 4487
      // Mobile"). That is the page owner's declaration and beats a
      // prefix heuristic, so it wins when present.
      const labelled = new RegExp(`${run.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*(Mobile|Landline|Work|هاتف|جوال|محمول)`, 'i').exec(hay)?.[1];
      const reach = labelled && /mobile|جوال|محمول/i.test(labelled) ? 'MOBILE'
        : labelled && /landline/i.test(labelled) ? 'LANDLINE'
        : n.reach;
      phones.push({
        e164: n.e164,
        reach,
        whatsapp: reach === 'MOBILE' && (waNumbers.has(digits) || [...waNumbers].some((w) => digits.endsWith(w.replace(/\D/g, '').slice(-9))) || waLabelled),
      });
    }

    const emails = [...new Set([...r.mail, ...(hay.match(/[\w.+-]+@[\w-]+\.[\w.]{2,}/g) ?? [])])]
      .filter((e) => !/facebook\.com|meta\.com|fbcdn/.test(e));

    const website = r.ext
      .map((l) => {
        const m = /[?&]u=([^&]+)/.exec(l);
        return m ? decodeURIComponent(m[1]) : l;
      })
      .find((l) => /^https?:\/\//.test(l) && !/facebook|instagram|whatsapp|youtube|tiktok|twitter|x\.com/.test(l));

    const address = ADDRESS_RE.exec(intro)?.[0]?.trim();
    const cat = /Page\s*·\s*([^\n]{2,40})/.exec(text)?.[1]?.trim();
    const followers = Number(
      (/([\d.,]+)([KkMm])?\s*(?:followers|متابع)/.exec(text)?.[1] ?? '').replace(/[.,]/g, '')
    ) || undefined;

    return { ...base, ok: true, intro: intro.slice(0, 600), phones, emails, website, address, category: cat, followers };
  }
  return { ...base, why: 'no About content found' };
}

async function main(): Promise<void> {
  const { port, profile, delayMs } = requireScrapePort();
  const limit = Number(arg('limit', '0')) || Infinity;
  console.log(`Scrape browser: port ${port}, profile ${profile}, delay ~${delayMs}ms`);

  const { all } = twentyClient();
  const live = (await all('companies')) as unknown as Company[];

  // Resume: never re-visit a page this ledger already records.
  const done = new Set<string>();
  if (existsSync(LEDGER)) {
    for (const line of readFileSync(LEDGER, 'utf8').split('\n').filter(Boolean)) {
      try { done.add((JSON.parse(line) as AboutResult).url); } catch { /* skip */ }
    }
  }

  const queue = live
    .filter((c) => {
      const u = (c.facebook?.primaryLinkUrl ?? '').trim();
      if (!u || /facebook\.com\/groups\//i.test(u)) return false;
      if (done.has(u)) return false;
      // Only rows that still need something.
      return !(c.schoolPhone ?? '').trim() || !(c.principalContact ?? '').trim();
    })
    .slice(0, limit === Infinity ? undefined : limit);

  console.log(`${queue.length} page(s) to visit (${done.size} already in the ledger)\n`);
  if (!queue.length) { console.log('nothing to do.\n'); return; }

  mkdirSync(DATA, { recursive: true });
  let s = await createCdpSession(port, 'about:blank');
  const results: AboutResult[] = [];
  let stopped = '';
  let reconnects = 0;

  /**
   * The CDP socket dies roughly every 170 pages -- Chrome drops the tab, the
   * browser itself stays up. Twice now that has ended a long run outright, once
   * here and once mid-discovery, each time costing the rest of the queue until
   * somebody noticed and restarted it by hand.
   *
   * A dead socket says nothing about the page, so it is not a result: reopen a
   * tab and retry the same page once. Only if the reconnect itself fails does
   * the run stop.
   */
  const withSession = async (c: Company, url: string): Promise<AboutResult> => {
    try {
      return await scrapeOne(s, c, url, delayMs);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (!/socket is not open|CDP|WebSocket|Target closed/i.test(msg)) throw e;
      reconnects++;
      console.log(`    ↻ CDP socket dropped — reopening a tab (reconnect ${reconnects})`);
      try { await s.close(); } catch { /* already gone */ }
      await sleep(3000);
      s = await createCdpSession(port, 'about:blank');
      return await scrapeOne(s, c, url, delayMs);
    }
  };

  try {
    for (const [i, c] of queue.entries()) {
      const url = (c.facebook?.primaryLinkUrl ?? '').trim();
      const r = await withSession(c, url);
      // A network drop says nothing about this page, so it is not written to the
      // ledger at all — the page must still be retried on the next run.
      if (r.why !== 'NETWORK') appendFileSync(LEDGER, `${JSON.stringify(r)}\n`);
      results.push(r);
      const mark = r.ok ? (r.phones.length ? `☎${r.phones.length}` : r.emails.length ? 'mail' : ' —  ') : '✗';
      console.log(`  ${String(i + 1).padStart(3)}/${queue.length} ${mark}  ${(c.name ?? '').slice(0, 44).padEnd(44)} ${r.why ?? ''}`);
      if (r.why === 'CHECKPOINT' || r.why?.startsWith('login wall') || r.why === 'NETWORK') {
        stopped = r.why;
        break;
      }
      await sleep(jitter(delayMs));
    }
  } finally {
    await s.close();
  }

  const withPhone = results.filter((r) => r.phones.length).length;
  console.log(`\n═══ About-tab pass — ${results.length} page(s) visited ═══`);
  console.log(`  ${withPhone} with a phone · ${results.filter((r) => r.emails.length).length} with an email`);
  console.log(`  ${results.filter((r) => r.website).length} with a website · ${results.filter((r) => r.address).length} with an address`);
  console.log(`  ${results.flatMap((r) => r.phones).filter((p) => p.whatsapp).length} number(s) evidenced as WhatsApp (a wa.me link or an Arabic label — never assumed)`);
  console.log(`  ${results.filter((r) => !r.ok).length} page(s) yielded nothing`);
  if (reconnects) console.log(`  ${reconnects} CDP socket drop(s) recovered without losing a page`);
  if (stopped) {
    console.log(`\n  ⛔ STOPPED EARLY: ${stopped}`);
    console.log(`     ${queue.length - results.length} page(s) not visited. Re-run to resume — the ledger skips what is done.`);
  }
  writeFileSync(`${DATA}/fb-about-latest.json`, JSON.stringify({ generatedAt: new Date().toISOString(), results }, null, 2));
  console.log(`\n  → ${LEDGER} (append-only, resumable)`);
  console.log('  Nothing written to Twenty. Load with sd-upsert.ts.\n');
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
