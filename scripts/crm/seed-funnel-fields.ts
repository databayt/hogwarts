/**
 * Seed the conversion-funnel fields into the live hogwarts Twenty workspace.
 *
 *   npx tsx scripts/crm/seed-funnel-fields.ts            # dry run — prints the plan, writes nothing
 *   npx tsx scripts/crm/seed-funnel-fields.ts --apply    # create missing fields + append stage options
 *
 * Idempotent by construction: it reads the existing metadata first and only creates
 * what is absent. Run it twice — the second run must plan zero writes. That is the
 * test, and it is not optional.
 *
 * ── The one destructive thing this script refuses to do ──────────────────────
 *
 * It NEVER removes or rewrites an existing `stage` SELECT option. `COLD`, `PROSPECT`,
 * `PILOT` and `LOST` sit on 3,156 live company rows and Twenty stores an option's
 * *value* on the record, so replacing the option set orphans every row holding one.
 * The five funnel gates are APPENDED to whatever is already there. If an existing
 * option is missing from the live field, that is a finding to report — never
 * something to silently restore or drop.
 *
 * REST + metadata API only. Never psql into a workspace schema: the REST surface is
 * what the `packages/twenty-api` rewrite preserves, and raw SQL skips search vectors,
 * timeline and activity.
 */

import { twentyClient } from './twenty-rest';
import {
  FUNNEL_SCHEMA,
  GATES,
  STAGE_OPTIONS_EXISTING,
  STAGE_OPTIONS_TO_APPEND,
  type FieldDef,
} from './funnel-schema';

const APPLY = process.argv.includes('--apply');

type MetaField = {
  id: string;
  name: string;
  label?: string;
  type?: string;
  options?: { id?: string; value: string; label: string; position: number; color: string }[];
};
type MetaObject = { id: string; nameSingular: string; namePlural: string; fields?: MetaField[] };

const COLORS = ['blue', 'turquoise', 'sky', 'green', 'yellow', 'orange', 'red', 'purple', 'gray'];

/** Twenty rejects option payloads without a color/position, so build them explicitly. */
const toOption = (value: string, position: number) => ({
  value,
  label: value
    .split('_')
    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
    .join(' '),
  position,
  color: COLORS[position % COLORS.length],
});

async function main() {
  const t = twentyClient();
  console.log(APPLY ? '── APPLY ──' : '── DRY RUN (no writes; pass --apply to execute) ──');

  // Twenty's metadata API is offset-paginated. Upstream sdk/v2.30.0 removed the
  // cursor types entirely (PR #23925), so never reintroduce cursor paging here.
  // Verified against the live workspace 2026-08-18: the envelope is a FLAT array
  // under `data` (not `data.objects`), and each object embeds its own `fields`.
  const objRes = await t.rest<{ data?: MetaObject[] } | MetaObject[]>('GET', 'metadata/objects?limit=200');
  const objects: MetaObject[] = Array.isArray(objRes)
    ? objRes
    : ((objRes as { data?: MetaObject[] })?.data ?? []);
  if (!objects.length) throw new Error('metadata/objects returned nothing — check TWENTY_API_URL (3100, never 3000) and the key');

  let created = 0;
  let skipped = 0;
  const findings: string[] = [];

  for (const [objectName, fields] of Object.entries(FUNNEL_SCHEMA) as [string, FieldDef[]][]) {
    const obj = objects.find((o) => o.nameSingular === objectName);
    if (!obj) {
      findings.push(`object "${objectName}" not found in this workspace — skipped ${fields.length} field(s)`);
      continue;
    }
    const existing = new Set((obj.fields ?? []).map((f) => f.name));
    console.log(`\n${objectName} (${obj.id})`);

    for (const f of fields) {
      if (existing.has(f.name)) {
        console.log(`  = ${f.name.padEnd(20)} exists`);
        skipped++;
        continue;
      }
      console.log(`  + ${f.name.padEnd(20)} ${f.type}${f.options ? ` (${f.options.length} options)` : ''}`);
      created++;
      if (!APPLY) continue;

      await t.rest('POST', 'metadata/fields', {
        objectMetadataId: obj.id,
        name: f.name,
        label: f.label,
        type: f.type,
        description: f.description,
        icon: f.icon,
        ...(f.options ? { options: f.options.map(toOption) } : {}),
        ...(f.defaultValue !== undefined ? { defaultValue: f.defaultValue } : {}),
      });
    }
  }

  // ── Stage options: append only ──────────────────────────────────────────────
  const company = objects.find((o) => o.nameSingular === 'company');
  const stage = company?.fields?.find((f) => f.name === 'stage');
  if (!stage) {
    findings.push('company.stage not found — the gate mirror cannot be seeded; investigate before applying');
  } else {
    const live = new Set((stage.options ?? []).map((o) => o.value));
    const lost = STAGE_OPTIONS_EXISTING.filter((o) => !live.has(o));
    if (lost.length) {
      // Report, never restore. A missing option means rows moved somewhere this
      // script does not know about, and guessing would compound it.
      findings.push(`company.stage is MISSING expected live option(s): ${lost.join(', ')} — investigate, do not auto-restore`);
    }
    const toAdd = STAGE_OPTIONS_TO_APPEND.filter((o) => !live.has(o));

    // Positions carry no data — Twenty stores an option's VALUE on the record —
    // so they can be rewritten freely to make the Kanban board read in ladder
    // order. Appending alone would park SHORTLISTED and CONTACTED at the far
    // right of the board, after LOST, which is exactly where nobody looks for
    // the two stages they are supposed to work every day.
    const ladderOrder = (v: string) => {
      const i = (GATES as readonly string[]).indexOf(v);
      return i === -1 ? GATES.length : i; // unknown values sort last, never dropped
    };
    const merged = [...(stage.options ?? []), ...toAdd.map((v, i) => toOption(v, i))]
      .sort((a, b) => ladderOrder(a.value) - ladderOrder(b.value))
      .map((o, i) => ({ ...o, position: i }));

    const orderChanged =
      JSON.stringify((stage.options ?? []).map((o) => o.value)) !==
      JSON.stringify(merged.map((o) => o.value));

    console.log(`\ncompany.stage — live: ${[...live].join(', ') || '(none)'}`);
    if (!toAdd.length && !orderChanged) {
      console.log('  = all funnel gates present and in ladder order');
    } else {
      if (toAdd.length) {
        console.log(`  + append: ${toAdd.join(', ')}  (${live.size} existing options preserved)`);
        created += toAdd.length;
      }
      if (orderChanged) console.log(`  ~ reorder: ${merged.map((o) => o.value).join(' → ')}`);
      if (APPLY) await t.rest('PATCH', `metadata/fields/${stage.id}`, { options: merged });
    }
  }

  console.log(`\n${APPLY ? 'created' : 'would create'}: ${created} · unchanged: ${skipped}`);
  if (findings.length) {
    console.log('\nfindings (nothing was auto-corrected):');
    for (const f of findings) console.log(`  ! ${f}`);
  }
  if (!APPLY && created > 0) console.log('\nre-run with --apply, then run a THIRD time — it must plan 0 writes.');
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
