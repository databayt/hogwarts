/**
 * The Twenty REST client, in one place.
 *
 * VENDORED from mkan/scripts/crm/twenty-rest.ts (2026-08-17), byte-identical below
 * this header. mkan built and hardened it first; hogwarts is the second consumer.
 * Once both lanes are live it should move to a shared package -- until then, fix
 * bugs in BOTH copies, and prefer mkan's as canonical if they ever disagree.
 *
 * The same throttled `rest()` + `records()` pair had been copy-pasted into
 * `twenty-upsert.ts`, `sync-import-to-twenty.ts`, `sync-contacts-to-twenty.ts`,
 * `sync-rehosted-photos.ts` and `score-trust.ts`. Five copies of a rate limiter
 * drift, and when they do the symptom is a 429 storm halfway through a write
 * loop, which is the worst possible moment to discover it.
 *
 * Twenty's limit is 100 requests / 60s, so calls are spaced ≥700ms and a 429
 * backs off progressively. Callers see a plain promise.
 */

/** Twenty returns CURRENCY fields as {amountMicros, currencyCode}. */
export interface Currency {
  amountMicros: number | null;
  currencyCode: string | null;
}
/** …and PHONES / EMAILS as their own composites. */
export interface Phones {
  primaryPhoneNumber?: string | null;
  primaryPhoneCountryCode?: string | null;
  primaryPhoneCallingCode?: string | null;
}
export interface Emails {
  primaryEmail?: string | null;
}

const MIN_GAP_MS = 700;
const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

let lastCallAt = 0;
async function throttle(): Promise<void> {
  const wait = lastCallAt + MIN_GAP_MS - Date.now();
  if (wait > 0) await sleep(wait);
  lastCallAt = Date.now();
}

export interface TwentyClient {
  rest<T = unknown>(method: 'GET' | 'POST' | 'PATCH' | 'DELETE', path: string, body?: unknown): Promise<T>;
  /** Every record of one object type, following Twenty's `startingAfter` pages. */
  all(plural: string, depth?: number): Promise<Record<string, unknown>[]>;
}

/** Reads TWENTY_API_URL / TWENTY_API_KEY. Throws if either is missing. */
export function twentyClient(): TwentyClient {
  const apiUrl = (process.env.TWENTY_API_URL ?? '').replace(/\/+$/, '');
  const apiKey = process.env.TWENTY_API_KEY ?? '';
  if (!apiUrl || !apiKey) {
    throw new Error('needs TWENTY_API_URL + TWENTY_API_KEY (Settings → APIs & Webhooks)');
  }
  const base = `${apiUrl}/rest`;

  async function rest<T>(
    method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
    path: string,
    body?: unknown,
    attempt = 0
  ): Promise<T> {
    await throttle();
    const res = await fetch(`${base}/${path}`, {
      method,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (res.status === 429 && attempt < 8) {
      const backoff = 15_000 * (attempt + 1);
      console.warn(`  … 429 — waiting ${backoff / 1000}s (attempt ${attempt + 1})`);
      await sleep(backoff);
      return rest<T>(method, path, body, attempt + 1);
    }
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(`REST ${method} ${path} → ${res.status}: ${JSON.stringify(json).slice(0, 200)}`);
    }
    return json as T;
  }

  const unwrap = (res: unknown, plural: string): Record<string, unknown>[] => {
    const data = (res as { data?: unknown })?.data ?? res;
    const value = (data as Record<string, unknown>)?.[plural] ?? data;
    if (Array.isArray(value)) return value as Record<string, unknown>[];
    const edges = (value as { edges?: { node: Record<string, unknown> }[] })?.edges;
    if (Array.isArray(edges)) return edges.map((e) => e.node);
    return [];
  };

  async function all(plural: string, depth = 0): Promise<Record<string, unknown>[]> {
    const out: Record<string, unknown>[] = [];
    let cursor: string | null = null;
    // Cursors are OPAQUE (base64 of {"id":…}) and must come from pageInfo.endCursor.
    // mkan's copy passes the last row's raw id instead, which Twenty v2.31 rejects
    // with `Invalid cursor`. mkan never noticed because its objects are all under
    // one page; hogwarts has 3k+ companies and fails on page two. Fix mkan's copy
    // too if it ever grows past 200 rows of anything.
    // 60 pages x 200 is far beyond any plausible workspace; the bound exists so a
    // malformed cursor cannot spin forever.
    for (let page = 0; page < 60; page++) {
      const q = `${plural}?limit=200&depth=${depth}${cursor ? `&starting_after=${encodeURIComponent(cursor)}` : ''}`;
      const res = (await rest('GET', q)) as {
        pageInfo?: { endCursor?: string | null; hasNextPage?: boolean };
      };
      const batch = unwrap(res, plural);
      out.push(...batch);
      const info = res?.pageInfo;
      if (!info?.hasNextPage || !info?.endCursor) break;
      cursor = info.endCursor;
    }
    return out;
  }

  return { rest, all };
}

/** SDG 32,500 comes back as 32500000000 micros. Absent reads as null, not 0. */
export const fromMicros = (c: Currency | null | undefined): number | null =>
  c && c.amountMicros != null ? c.amountMicros / 1_000_000 : null;

export const phoneOf = (p: Phones | null | undefined): string | null => {
  const n = p?.primaryPhoneNumber?.trim();
  if (!n) return null;
  const cc = p?.primaryPhoneCallingCode?.trim() ?? '';
  return cc ? `${cc}${n}` : n;
};

export const emailOf = (e: Emails | null | undefined): string | null => e?.primaryEmail?.trim() || null;
