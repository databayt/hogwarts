/**
 * Gate census + reachability — the funnel's measurement backbone.
 *
 *   pnpm crm:funnel-gates                  # full census, writes the artifact
 *   pnpm crm:funnel-gates --country=SD     # scoped view (artifact still full)
 *
 * Read-only against Twenty and Postgres; its only write is
 * `scripts/crm/.data/funnel-gates.json` — the artifact kun's `funnel-yield`
 * hook diffs after every funnel run. Until this script existed the hook could
 * only ever say UNMEASURED, because nothing wrote the file it reads. This is
 * the tick that closes that loop.
 *
 * Three sources, labeled, never conflated:
 *   Twenty  company.stage      — the operative mirror (all ~3.9k schools live here)
 *   Postgres Prospect/Lead     — the funnel's own truth (structurally empty until
 *                                capture ships; reported honestly as such)
 *   Postgres TwentyInboundEvent — the inbox depth (pending = received, not applied)
 *
 * Reach is computed per company from `schoolPhone` (E.164 + Arabic-Indic
 * normalize → mobile/landline, conservative) and `principalContact` (the field
 * label says contact, the data says email — 759 rows). Lanes:
 *   whatsapp  — verified mobile (sd rail leads with this)
 *   email     — valid email, no mobile (gulf/eg rail leads with this)
 *   landline-only / none — not reachable by this lane; the gap is /scrape's.
 */
import { loadEnv, argv, dbHostTag, toE164, isMobile, emailOf, railOf, LADDER, writeGatesArtifact, GATES_FILE } from './lib';
loadEnv();

import { twentyClient } from '../crm/twenty-rest';

interface Company {
  id: string;
  name?: string | null;
  stage?: string | null;
  tier?: string | null;
  country?: string | null;
  schoolPhone?: string | null;
  principalContact?: string | null;
  outreachStatus?: string | null;
}

async function prismaCounts() {
  // Deferred import: @/lib/db reads env at module scope.
  const { db } = await import('@/lib/db');
  const [prospect, lead, inbox] = await Promise.all([
    db.prospect.groupBy({ by: ['status'], _count: true }).catch(() => []),
    db.lead.groupBy({ by: ['status'], _count: true }).catch(() => []),
    db.twentyInboundEvent.groupBy({ by: ['status'], _count: true }).catch(() => []),
  ]);
  const m = (rows: Array<{ status: string; _count: number }>) =>
    Object.fromEntries(rows.map((r) => [r.status, r._count]));
  return {
    prospect: m(prospect as never),
    lead: m(lead as never),
    inbox: m(inbox as never),
  };
}

async function main() {
  const countryFilter = argv('country').toUpperCase();

  console.log('Reading companies from Twenty …');
  const all = (await twentyClient().all('companies')) as unknown as Company[];
  const rows = countryFilter ? all.filter((c) => (c.country ?? '').toUpperCase() === countryFilter) : all;

  // ── Gates ──────────────────────────────────────────────────────────────────
  const gates = Object.fromEntries(LADDER.map((g) => [g, 0])) as Record<(typeof LADDER)[number], number>;
  let unknownStage = 0;
  for (const c of all) {
    const s = (c.stage ?? '').toUpperCase() as (typeof LADDER)[number];
    if (s in gates) gates[s]++;
    else unknownStage++;
  }

  // ── Reach ──────────────────────────────────────────────────────────────────
  const reach = {
    total: rows.length,
    mobile: 0, // whatsapp lane
    landlineOnly: 0,
    emailOnly: 0, // email lane
    mobileAndEmail: 0,
    none: 0,
    byRail: { sd: 0, gulf: 0, eg: 0, other: 0 } as Record<string, number>,
    lanePending: { whatsapp: 0, email: 0 }, // reachable AND still COLD/PROSPECT — the roll's queue
  };
  for (const c of rows) {
    const e164 = toE164(c.schoolPhone, c.country);
    const mobile = e164 ? isMobile(e164) : false;
    const email = emailOf(c.principalContact);
    if (mobile && email) reach.mobileAndEmail++;
    else if (mobile) reach.mobile++;
    else if (email) reach.emailOnly++;
    else if (e164) reach.landlineOnly++;
    else reach.none++;
    if (mobile || email) {
      reach.byRail[railOf(c.country, e164)]++;
      const stage = (c.stage ?? '').toUpperCase();
      if (stage === 'COLD' || stage === 'PROSPECT') {
        if (mobile) reach.lanePending.whatsapp++;
        else reach.lanePending.email++;
      }
    }
  }
  const whatsappLane = reach.mobile + reach.mobileAndEmail;
  const emailLane = reach.emailOnly + reach.mobileAndEmail;

  // ── Postgres (the funnel's own truth) ─────────────────────────────────────
  const dbTag = dbHostTag(process.env.DATABASE_URL);
  const prisma = await prismaCounts().catch((e) => {
    console.warn(`  ! Postgres unreadable (${e instanceof Error ? e.message.split('\n')[0] : e}) — reporting Twenty only`);
    return null;
  });

  // ── The stall ─────────────────────────────────────────────────────────────
  // The biggest actionable pile, not just the biggest number: reachable schools
  // nobody has messaged (the roll's queue), then contacted-but-silent.
  const pendingTotal = reach.lanePending.whatsapp + reach.lanePending.email;
  const stall =
    pendingTotal > 0
      ? { gate: 'COLD/PROSPECT (reachable, unmessaged)', count: pendingTotal }
      : gates.CONTACTED > 0
        ? { gate: 'CONTACTED (messaged, no reply)', count: gates.CONTACTED }
        : { gate: 'WARM', count: gates.WARM };

  // ── Report ─────────────────────────────────────────────────────────────────
  console.log(`\n═══ Funnel gates — ${all.length} schools${countryFilter ? ` (reach scoped: ${countryFilter})` : ''} ═══\n`);
  console.log('  ' + LADDER.map((g) => `${g} ${gates[g]}`).join(' · ') + (unknownStage ? ` · (no stage) ${unknownStage}` : ''));
  console.log(`\n  Reach (schoolPhone + principalContact):`);
  console.log(`    whatsapp lane (verified mobile)  ${whatsappLane}   (${reach.mobileAndEmail} also have email)`);
  console.log(`    email lane (email, no mobile)    ${reach.emailOnly}`);
  console.log(`    landline only                    ${reach.landlineOnly}   ← never WhatsApped, never counted reachable`);
  console.log(`    no usable contact                ${reach.none}   ← /scrape's gap, not this lane's`);
  console.log(`    by rail: sd ${reach.byRail.sd} · gulf ${reach.byRail.gulf} · eg ${reach.byRail.eg} · other ${reach.byRail.other}`);
  console.log(`\n  The roll's queue (reachable AND still COLD/PROSPECT):`);
  console.log(`    whatsapp ${reach.lanePending.whatsapp} · email ${reach.lanePending.email}`);
  if (prisma) {
    console.log(`\n  Postgres [${dbTag}]:`);
    console.log(`    Prospect ${JSON.stringify(prisma.prospect)} · Lead ${JSON.stringify(prisma.lead)}`);
    console.log(`    Inbox    ${JSON.stringify(prisma.inbox)}   ← pending = received, not yet applied`);
  }
  console.log(`\n  ▸ Biggest stall: ${stall.gate} — ${stall.count}`);

  const out = writeGatesArtifact({
    gates,
    reach,
    prisma: prisma ? { ...prisma, db: dbTag } : { unreadable: true, db: dbTag },
    biggestStallGate: stall.gate,
    biggestStallCount: stall.count,
    source: { twenty: process.env.TWENTY_API_URL, companies: all.length, reachScope: countryFilter || 'ALL' },
  });
  console.log(`  artifact → ${out}  (the funnel-yield ledger diffs this)\n`);
}

main().then(
  () => process.exit(0),
  (e) => {
    console.error(e);
    process.exit(1);
  }
);
