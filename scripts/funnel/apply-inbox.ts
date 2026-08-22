/**
 * The applier — drain the Twenty inbox (`TwentyInboundEvent`, status=pending).
 *
 *   pnpm crm:funnel-apply-inbox            # dry: classify every pending row
 *   pnpm crm:funnel-apply-inbox --apply    # apply + mark rows applied/ignored
 *
 * Until now rows arrived and nothing read them — "received" and "applied" were
 * separately observable and the answer was always "not applied". This closes
 * that half. The rules are deliberately narrow:
 *
 *   APPLY   company.updated where a human dragged stage → WARM. That drag is
 *           the designed reply signal at wave-one volume (the person who SENT
 *           the message is the person reading the reply), so it is the one
 *           board move that writes state: upsert the Prospect (the same
 *           synthetic-key discipline as the inbound web actions —
 *           `inbound:<email>` / `inbound:wa:<e164>`), status=replied, then
 *           promoteToLead() → Lead NEW. WARM *is* replied; one vocabulary.
 *
 *   IGNORE  the workflow's own echo (stage+outreachStatus changed together —
 *           step 2 writing CONTACTED re-enters the trigger's watch list), and
 *           every other board move — recorded with a note as ADVISORY, never
 *           silently applied. One writer, one truth.
 *
 * Anything this script cannot classify stays pending and is listed — a row
 * neither applied nor explained is exactly the silence this table exists to
 * prevent.
 */
import { loadEnv, flag, dbHostTag, toE164, emailOf } from './lib';
loadEnv();

const APPLY = flag('apply');

interface TwentyRecord {
  id?: string;
  name?: string;
  stage?: string;
  country?: string;
  schoolPhone?: string;
  principalContact?: string;
  domainName?: { primaryLinkUrl?: string } | string | null;
}

async function main() {
  const { db } = await import('@/lib/db');
  const { promoteToLead } = await import('@/lib/sales/promote');

  console.log(`DB: ${dbHostTag(process.env.DATABASE_URL)}`);
  const pending = await db.twentyInboundEvent.findMany({
    where: { status: 'pending' },
    orderBy: { createdAt: 'asc' },
  });
  console.log(`\n═══ Inbox applier — ${pending.length} pending ═══\n`);
  if (!pending.length) return;

  let applied = 0,
    ignored = 0,
    left = 0;

  for (const evt of pending) {
    const payload = evt.payload as { record?: TwentyRecord } | TwentyRecord | null;
    const record: TwentyRecord =
      (payload && 'record' in (payload as object) && (payload as { record?: TwentyRecord }).record) ||
      (payload as TwentyRecord) ||
      {};
    const fields = evt.updatedFields ?? [];

    const decide = async (): Promise<{ status: 'applied' | 'ignored' | 'pending'; note: string }> => {
      if (evt.objectName !== 'company')
        return { status: 'ignored', note: `advisory ${evt.objectName} move — recorded, review on the board` };
      if (!fields.includes('stage'))
        return { status: 'ignored', note: `company fields [${fields.join(',')}] — no gate meaning` };

      const stage = (record.stage ?? '').toUpperCase();
      if (fields.includes('outreachStatus'))
        return { status: 'ignored', note: `workflow self-echo (stage=${stage} + outreachStatus together)` };

      if (stage === 'WARM') {
        // The reply signal. Capture into the funnel's own tables.
        const email = emailOf(record.principalContact);
        const e164 = toE164(record.schoolPhone, record.country);
        const key = email ? `inbound:${email}` : e164 ? `inbound:wa:${e164}` : null;
        if (!key)
          return {
            status: 'pending',
            note: 'WARM drag but no email/phone on the record — needs a human to attach a contact first',
          };
        if (!APPLY) return { status: 'applied', note: `WOULD capture ${key} + promoteToLead (dry)` };
        const prospect = await db.prospect.upsert({
          where: { gmapsPlaceId: key },
          create: {
            gmapsPlaceId: key,
            name: record.name ?? key,
            email,
            phone: e164,
            country: record.country ?? 'unknown',
            source: 'outreach-warm-drag',
            status: 'replied',
            tags: [`twenty:${evt.recordId}`],
            notes: `WARM drag applied from Twenty event ${evt.id}`,
            lastTouchAt: new Date(),
          },
          update: { status: 'replied', lastTouchAt: new Date() },
        });
        const res = await promoteToLead(prospect.id);
        return {
          status: 'applied',
          note: `captured ${key} → promoteToLead: ${JSON.stringify(res).slice(0, 120)}`,
        };
      }
      return { status: 'ignored', note: `advisory drag to ${stage || '?'} — recorded, not written back` };
    };

    const verdict = await decide();
    const line = `  [${verdict.status.toUpperCase().padEnd(7)}] ${evt.eventName} ${evt.recordId.slice(0, 8)} — ${verdict.note}`;
    console.log(line);
    if (verdict.status === 'pending') {
      left++;
      continue;
    }
    if (APPLY) {
      await db.twentyInboundEvent.update({
        where: { id: evt.id },
        data: { status: verdict.status, note: verdict.note, processedAt: new Date() },
      });
    }
    verdict.status === 'applied' ? applied++ : ignored++;
  }

  console.log(
    `\n  ${APPLY ? 'applied' : 'would apply'} ${applied} · ignored ${ignored} · still pending ${left}` +
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
