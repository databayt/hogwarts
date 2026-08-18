// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Sign the DEDICATED scrape account into the dedicated Chrome profile.
 *
 * The session then persists in that profile, so this runs once and the About-tab
 * enricher reuses it. It exists as a script rather than a manual step because
 * the session does get signed out, and re-doing it by hand invites the one
 * mistake that matters: logging in on the wrong browser.
 *
 * Credentials come from the environment and are never written anywhere --
 * not to a file, not to the ledger, not into a commit:
 *
 *   FB_SCRAPE_PORT=9333 FB_SCRAPE_PROFILE="$HOME/.claude/chrome-fbscrape-profile" \
 *   FB_LOGIN_EMAIL=… FB_LOGIN_PASSWORD=… \
 *     npx tsx scripts/crm/scrape-fb-login.ts
 *
 * ── MEASURED 2026-08-18: the automated sign-in does not work ────────────────
 *
 * Filling the form programmatically and submitting it returns Facebook's
 * "Your Request Couldn't be Processed" page. The fill itself is fine -- the
 * inputs receive the right values via the native setter plus input/change
 * events -- but the submit is rejected. `form.submit()` bypasses the handlers
 * Facebook requires, and a brand-new account signing in from an automated
 * browser is the single most challenge-prone event in this pipeline.
 *
 * **So do not iterate on this.** Escalating the automation is how a fresh
 * account gets checkpointed for good, and the payoff is nil: a human types the
 * credentials into the already-open window ONCE and the session persists in the
 * profile from then on. That is precisely what a persistent debug profile is
 * for. This script's useful half is the `--check` it performs on every run:
 * telling you whether the profile still holds a session, and on which account.
 *
 * If a challenge appears (phone verification, captcha, "confirm it's you"),
 * that is also a job for the human in the same window, not for a script.
 *
 * Note also that `~/.claude/bin/chrome-debug.sh` CANNOT launch this browser --
 * it hardcodes the session-vault profile and ignores FB_SCRAPE_PROFILE, so
 * calling it with a different port gives you the vault on a new port, which is
 * exactly the outcome the whole guard exists to prevent. Launch Chrome directly:
 *
 *   "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
 *     --remote-debugging-port=9333 --remote-allow-origins='*' \
 *     --user-data-dir="$HOME/.claude/chrome-fbscrape-profile" &
 */
import { createCdpSession, requireScrapePort } from './cdp-session';

const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

interface State {
  url: string;
  loggedIn: boolean;
  hasLoginForm: boolean;
  challenge: string;
  who: string;
}

const PROBE = `(() => {
  const t = document.body ? document.body.innerText.slice(0, 5000) : '';
  const q = (s) => !!document.querySelector(s);
  return {
    url: location.href,
    hasLoginForm: q('input[name="email"]') && q('input[name="pass"]'),
    loggedIn: q('[aria-label="Your profile"], [aria-label="Account"], div[role="navigation"] a[href*="/me/"], a[href^="/logout"], [aria-label="حسابك"]')
              || /\\/(feed|home)\\b/.test(location.pathname) && !q('input[name="pass"]'),
    challenge: /checkpoint|confirm your identity|enter the code|two-factor|verify your|we sent|captcha|unusual activity|تأكيد هويتك|رمز/i.test(t)
               ? t.split('\\n').filter(Boolean).slice(0, 6).join(' | ') : '',
    who: (document.querySelector('[aria-label="Your profile"]')?.getAttribute('aria-label')) || '',
  };
})()`;

async function main(): Promise<void> {
  const { port, profile } = requireScrapePort();
  const email = process.env.FB_LOGIN_EMAIL ?? '';
  const password = process.env.FB_LOGIN_PASSWORD ?? '';
  if (!email || !password) {
    console.error('needs FB_LOGIN_EMAIL and FB_LOGIN_PASSWORD in the environment');
    process.exit(1);
  }
  console.log(`Signing in on port ${port}, profile ${profile}`);
  console.log(`Account: ${email.replace(/(.{2}).*(@.*)/, '$1***$2')}\n`);

  const s = await createCdpSession(port, 'about:blank');
  try {
    await s.navigate('https://www.facebook.com/');
    await sleep(3000);

    let st = await s.evaluate<State>(PROBE);
    if (st.loggedIn) {
      console.log('✅ already signed in — the profile still holds a session. Nothing to do.');
      return;
    }

    if (!st.hasLoginForm) {
      await s.navigate('https://www.facebook.com/login');
      await sleep(3000);
      st = await s.evaluate<State>(PROBE);
    }
    if (!st.hasLoginForm) {
      console.log(`no login form found at ${st.url}${st.challenge ? ` — ${st.challenge}` : ''}`);
      return;
    }

    // Type into the real inputs and dispatch the events React listens for; a
    // bare `value =` assignment leaves Facebook's form state empty and the
    // submit silently does nothing.
    await s.evaluate(`(() => {
      const set = (sel, val) => {
        const el = document.querySelector(sel);
        if (!el) return false;
        const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        setter.call(el, val);
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
        return true;
      };
      set('input[name="email"]', ${JSON.stringify(email)});
      set('input[name="pass"]', ${JSON.stringify(password)});
      return true;
    })()`);
    await sleep(1200);
    await s.evaluate(`(() => {
      const btn = document.querySelector('button[name="login"], button[type="submit"]');
      if (btn) { btn.click(); return 'clicked'; }
      const f = document.querySelector('form');
      if (f) { f.submit(); return 'submitted'; }
      return 'no submit control';
    })()`);

    // Facebook navigates a few times after a successful sign-in.
    for (let i = 0; i < 10; i++) {
      await sleep(3000);
      st = await s.evaluate<State>(PROBE);
      if (st.loggedIn || st.challenge) break;
    }

    if (st.loggedIn) {
      console.log('✅ signed in. The session now persists in this profile.');
      console.log('   Next: npx tsx scripts/crm/enrich-fb-about.ts --limit=5');
    } else if (st.challenge) {
      console.log('⚠️  Facebook is challenging this sign-in:\n');
      console.log(`   ${st.challenge}\n`);
      console.log(`   at ${st.url}`);
      console.log('   A Chrome window is open on this profile — finish the challenge there by hand,');
      console.log('   then re-run this to confirm. New accounts get challenged often; that is expected.');
    } else {
      console.log(`not signed in yet — currently at ${st.url}`);
      console.log('   The Chrome window on this profile is open; check it.');
    }
  } finally {
    await s.close();
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
