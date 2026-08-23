/**
 * The applier — script wrapper around `@/lib/funnel/apply-inbox`.
 *
 *   pnpm crm:funnel-apply-inbox            # dry: classify every pending row
 *   pnpm crm:funnel-apply-inbox --apply    # apply + mark rows applied/ignored
 *
 * The core logic lives in `src/lib/funnel/apply-inbox.ts` — ONE implementation
 * shared with the hourly Vercel cron (`/api/cron/funnel-apply`), which is the
 * production home of this drain. This wrapper exists for dry runs, local work,
 * and driving the drain from launchd when the Vercel cron cannot (the lane's
 * clock doctrine: launchd + Vercel cron, never a Twenty CRON workflow).
 *
 * Which database it hits is whatever DATABASE_URL resolves to — printed first,
 * because reporting dev data as production has happened before.
 */
import { loadEnv, flag, dbHostTag } from './lib';
loadEnv();

const APPLY = flag('apply');

async function main() {
  console.log(`DB: ${dbHostTag(process.env.DATABASE_URL)}`);
  const { applyInbox } = await import('@/lib/funnel/apply-inbox');
  const report = await applyInbox({ dryRun: !APPLY });

  console.log(`\n═══ Inbox applier — ${report.pending} pending ═══\n`);
  for (const a of report.actions)
    console.log(`  [${a.status.toUpperCase().padEnd(7)}] ${a.eventName} ${a.recordId.slice(0, 8)} — ${a.note}`);
  console.log(
    `\n  ${APPLY ? 'applied' : 'would apply'} ${report.applied} · ignored ${report.ignored} · still pending ${report.left}` +
      (APPLY ? '' : '   (dry — rows untouched; --apply to mark)') +
      '\n'
  );
}

main().then(
  () => process.exit(0),
  (e) => {
    console.error(e);
    process.exit(1);
  }
);
