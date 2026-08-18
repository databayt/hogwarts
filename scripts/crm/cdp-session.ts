// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * A minimal Chrome DevTools Protocol client -- with the port made explicit.
 *
 * VENDORED from twenty/scripts/sudan-schools-scraper/cdp-client.js, with one
 * deliberate change that is the whole reason for the copy: **the port is a
 * required argument and has no default.**
 *
 * The original hardcodes `127.0.0.1:9222` in three places -- the health check,
 * the tab-open call, and the tab-close call. On this machine 9222 is the
 * *session vault*: the single persistent Chrome that Abdout logs into by hand
 * and that agents attach to. A scraper pointed there drives Facebook as him,
 * and the cost of a ban is not a re-login -- it takes the Page access tokens
 * the entire social pipeline (draft → approve → publish) with it.
 *
 * The `scrape-guard` hook is the outer fence, but it can only read the command
 * text and the profile behind a port; it cannot ask Chrome which Facebook user
 * is signed in, and it cannot see a hardcoded constant inside a module. So the
 * defence has to exist here too, which is what `requireScrapePort()` is for.
 */
import { EventEmitter } from 'node:events';

/**
 * Refuse to run unless a dedicated scrape browser has been declared.
 *
 * Called at startup by every script in this directory that drives Chrome, so
 * the failure is loud and immediate rather than a silent attach to the wrong
 * browser twenty pages into a run.
 */
export function requireScrapePort(): { port: number; profile: string; delayMs: number } {
  const raw = process.env.FB_SCRAPE_PORT;
  const profile = process.env.FB_SCRAPE_PROFILE ?? '';
  const fail = (why: string): never => {
    console.error(`\n⛔ refusing to start: ${why}\n`);
    console.error('   This job drives a logged-in Chrome. It must run on a DEDICATED Facebook');
    console.error('   account in its own profile — never the session vault on 9222, which is');
    console.error("   Abdout's own browser and carries the social pipeline's Page tokens.\n");
    console.error('     export FB_SCRAPE_PORT=9333');
    console.error('     export FB_SCRAPE_PROFILE="$HOME/.claude/chrome-fbscrape-profile"');
    console.error('     export FB_SCRAPE_DELAY_MS=8000');
    console.error('     bash ~/.claude/bin/chrome-debug.sh 9333   # then log in as that account\n');
    process.exit(1);
  };
  if (!raw) fail('FB_SCRAPE_PORT is not set');
  const port = Number(raw);
  if (!Number.isInteger(port) || port <= 0) fail(`FB_SCRAPE_PORT is not a port: ${raw}`);
  if (port === 9222) fail('FB_SCRAPE_PORT is 9222 — that is the session vault');
  if (!profile) fail('FB_SCRAPE_PROFILE is not set');
  if (profile.includes('chrome-debug-profile')) fail(`FB_SCRAPE_PROFILE points at the session vault: ${profile}`);
  return { port, profile, delayMs: Number(process.env.FB_SCRAPE_DELAY_MS ?? 8000) };
}

interface Pending { resolve: (v: unknown) => void; reject: (e: Error) => void }

export class CdpSession extends EventEmitter {
  private ws: WebSocket | null = null;
  private nextId = 1;
  private pending = new Map<number, Pending>();

  constructor(private wsUrl: string, private targetId: string, private port: number) {
    super();
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.wsUrl);
      this.ws.onopen = () => resolve();
      this.ws.onerror = (e) => reject(new Error(`CDP socket error: ${String(e)}`));
      this.ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(String(event.data)) as {
            id?: number; error?: { message?: string }; result?: unknown; method?: string; params?: unknown;
          };
          if (msg.id && this.pending.has(msg.id)) {
            const p = this.pending.get(msg.id)!;
            this.pending.delete(msg.id);
            if (msg.error) p.reject(new Error(msg.error.message ?? JSON.stringify(msg.error)));
            else p.resolve(msg.result);
          } else if (msg.method) {
            this.emit(msg.method, msg.params);
          }
        } catch { /* a malformed frame is not worth killing the run */ }
      };
      this.ws.onclose = () => this.emit('disconnected');
    });
  }

  send<T = unknown>(method: string, params: Record<string, unknown> = {}): Promise<T> {
    return new Promise((resolve, reject) => {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return reject(new Error('CDP socket is not open'));
      const id = this.nextId++;
      this.pending.set(id, { resolve: resolve as (v: unknown) => void, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async evaluate<T = unknown>(expression: string): Promise<T> {
    const res = await this.send<{ result?: { value?: T }; exceptionDetails?: unknown }>('Runtime.evaluate', {
      expression, returnByValue: true, awaitPromise: true,
    });
    if (res.exceptionDetails) throw new Error(`eval failed: ${JSON.stringify(res.exceptionDetails)}`);
    return res.result?.value as T;
  }

  async navigate(url: string, timeoutMs = 45_000): Promise<void> {
    await this.send('Page.enable');
    const done = new Promise<void>((resolve) => {
      const onLoad = (): void => { this.off('Page.loadEventFired', onLoad); resolve(); };
      this.on('Page.loadEventFired', onLoad);
      setTimeout(onLoad, timeoutMs);
    });
    await this.send('Page.navigate', { url });
    await done;
  }

  async close(): Promise<void> {
    try {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) this.ws.close();
      await fetch(`http://127.0.0.1:${this.port}/json/close/${this.targetId}`);
    } catch { /* closing a tab is best-effort */ }
  }
}

export async function createCdpSession(port: number, initialUrl = 'about:blank'): Promise<CdpSession> {
  const ver = await fetch(`http://127.0.0.1:${port}/json/version`).catch(() => null);
  if (!ver || !ver.ok) {
    throw new Error(
      `no Chrome listening on ${port}. Launch the dedicated scrape profile first:\n` +
        `  FB_SCRAPE_PROFILE="$HOME/.claude/chrome-fbscrape-profile" bash ~/.claude/bin/chrome-debug.sh ${port}`
    );
  }
  const res = await fetch(`http://127.0.0.1:${port}/json/new?${encodeURIComponent(initialUrl)}`, { method: 'PUT' });
  const tab = (await res.json()) as { webSocketDebuggerUrl?: string; id?: string };
  if (!tab.webSocketDebuggerUrl || !tab.id) throw new Error(`could not open a tab: ${JSON.stringify(tab)}`);
  const s = new CdpSession(tab.webSocketDebuggerUrl, tab.id, port);
  await s.connect();
  await s.send('Page.enable');
  await s.send('Runtime.enable');
  return s;
}
