/**
 * The "school shortlisted → outreach" workflow: its specification, and a
 * verifier that checks the deployed workflow still matches it.
 *
 *   npx tsx scripts/crm/workflow-spec.ts          # print the spec to build in the UI
 *   npx tsx scripts/crm/workflow-spec.ts --verify # read the live workflow and diff
 *
 * ── Why this is a spec and not a deploy script ──────────────────────────────
 *
 * It started as a deploy script. Twenty refuses:
 *
 *   400 "Updating a workflowVersion through the generic mutation is restricted.
 *        steps, trigger, status, position, workflowId and coreWorkflowVersionId
 *        cannot be changed"
 *
 * `trigger` and `steps` are RAW_JSON columns marked `isUIEditable: false`, and
 * that flag turns out to be enforced server-side, not merely hidden in the UI.
 *
 * CORRECTION, 2026-08-19, after getting a signed-in session: the STEPS half IS
 * automatable. `createWorkflowVersionStep` and `updateWorkflowVersionStep` are
 * reachable with a user token — GraphQL introspection HIDES them (they do not
 * appear under `__type(name:"Mutation")`, and their input types introspect as
 * null) but they resolve when called. Both steps of this workflow were created
 * and fully configured that way, with no UI clicks.
 *
 * The TRIGGER half is not. There is no trigger mutation anywhere: an
 * `UpdateWorkflowVersionTriggerInput` DTO exists, but the only thing wired to it
 * is an internal AI-agent tool, not a resolver. `updateWorkflowVersionStep` with
 * the reserved id `trigger` answers "Step not found". So the trigger is created
 * by a human picking a type in the workflow builder, and that menu did not
 * respond to CDP clicks, synthetic pointer sequences, or direct invocation of
 * its React onClick — so it is genuinely a hands-on-keyboard step.
 *
 * So a Twenty workflow at this version is built by a human in the UI. That is a
 * real constraint, not an oversight, and pretending otherwise would leave a
 * script that silently no-ops. What remains version-controllable is the
 * definition below and the verifier — so the workflow can be rebuilt exactly
 * after a volume loss, and drift can be caught rather than discovered.
 *
 * ── Details taken from a live workflow, not inferred ────────────────────────
 *
 * Four would have been wrong if guessed from the TypeScript types:
 *   - `operand` is UPPERCASE (`IS`, `IS_NOT`), not the enum's lowercase `is`
 *   - `stepOutputKey` is a full `{{…}}` template, not a bare dotted path
 *   - `value` is JSON-encoded: `"[\"SHORTLISTED\"]"`, not a bare string
 *   - `fieldMetadataId` is required on every filter
 *
 * And the templating root: for a DATABASE_EVENT trigger the record is at
 * `{{trigger.properties.after.*}}`. `{{trigger.record.*}}` — which Twenty's own
 * AI-tool prompt suggests — does not resolve here.
 */

import { twentyClient } from './twenty-rest'

const VERIFY = process.argv.includes('--verify')
const WORKFLOW_NAME = 'School shortlisted → outreach'
const HERMES_URL =
  process.env.HERMES_WEBHOOK_URL ?? 'http://host.docker.internal:8644/webhooks/school-shortlisted'

/** What the workflow must do. The UI build is checked against this. */
export const SPEC = {
  name: WORKFLOW_NAME,
  trigger: {
    object: 'company',
    event: 'Record is Updated',
    watchedFields: ['stage'],
    filters: [
      { field: 'stage', operand: 'IS', value: 'SHORTLISTED', on: 'after' },
      { field: 'stage', operand: 'IS_NOT', value: 'SHORTLISTED', on: 'before' },
      { field: 'outreachStatus', operand: 'IS', value: 'NOT_STARTED', on: 'after' },
      { field: 'schoolPhone', operand: 'IS_NOT_EMPTY', value: '', on: 'after' },
    ],
  },
  steps: [
    {
      type: 'HTTP_REQUEST',
      name: 'Notify Hermes',
      url: HERMES_URL,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Gitlab-Token': '<HERMES_ROUTE_SECRET>',
      },
      body: {
        type: 'school_shortlisted',
        school: {
          id: '{{trigger.properties.after.id}}',
          name: '{{trigger.properties.after.name}}',
          phone: '{{trigger.properties.after.schoolPhone}}',
          stage: '{{trigger.properties.after.stage}}',
        },
      },
    },
    {
      type: 'UPDATE_RECORD',
      name: 'Mark contacted',
      object: 'company',
      recordId: '{{trigger.properties.after.id}}',
      set: { stage: 'CONTACTED', outreachStatus: 'QUEUED' },
    },
  ],
} as const

function printSpec() {
  console.log(`
═══ Build this in Twenty → Workflows → "${WORKFLOW_NAME}" ═══

TRIGGER  ── Record is Updated, object: School (company)
  Watch field:  stage          ← this alone is most of the idempotency: the run is
                                 not even enqueued unless stage actually changed,
                                 and Twenty emits nothing at all for a no-op save.
  Filters (AND):
    stage           IS            SHORTLISTED       (new value)
    stage           IS NOT        SHORTLISTED       (previous value — a real transition)
    outreachStatus  IS            NOT_STARTED       (never re-send a queued school)
    schoolPhone     IS NOT EMPTY

STEP 1  ── HTTP Request
  URL     POST  ${HERMES_URL}
  Headers Content-Type: application/json
          X-Gitlab-Token: <HERMES_ROUTE_SECRET>
            ↑ a plain shared token, constant-time compared by Hermes. NOT an HMAC:
              Twenty's HTTP action can only template strings, so the stronger
              X-Webhook-Signature-V2 mode is unreachable from here. Acceptable only
              because this request never leaves the machine — Docker bridge to host.
  Body    {
            "type": "school_shortlisted",
            "school": {
              "id":    "{{trigger.properties.after.id}}",
              "name":  "{{trigger.properties.after.name}}",
              "phone": "{{trigger.properties.after.schoolPhone}}",
              "stage": "{{trigger.properties.after.stage}}"
            }
          }
  Errors  retry on failure: OFF   continue on failure: OFF
            ↑ the trigger job is already enqueued with retryLimit 3, so delivery is
              at-least-once. Step retries on top multiply the duplicate window for a
              message going to a real school.

STEP 2  ── Update Record
  Object      School (company)
  Record id   {{trigger.properties.after.id}}
  Set         stage          = CONTACTED
              outreachStatus = QUEUED
                ↑ QUEUED, never SENT. All this step knows is that Hermes accepted
                  the request. A human marks SENT after actually sending, and sets
                  lastOutreachAt then — that is the real outreach moment.

Then press ACTIVATE, and verify with:
  npx tsx scripts/crm/workflow-spec.ts --verify
`)
}

async function verify() {
  const t = twentyClient()
  const wfRes = await t.rest<any>('GET', 'workflows?limit=50')
  const workflows = wfRes?.data?.workflows ?? wfRes?.data ?? wfRes
  const wf = (Array.isArray(workflows) ? workflows : []).find((w: any) => w.name === WORKFLOW_NAME)
  if (!wf) {
    console.log(`❌ no workflow named "${WORKFLOW_NAME}" — build it in the UI first`)
    process.exit(1)
  }

  const problems: string[] = []
  if (!wf.lastPublishedVersionId) problems.push('never activated — no published version')

  const vRes = await t.rest<any>('GET', `workflowVersions?filter=workflowId[eq]:${wf.id}&limit=10`)
  const versions = vRes?.data?.workflowVersions ?? vRes?.data ?? vRes
  const active = (Array.isArray(versions) ? versions : []).find((v: any) => v.status === 'ACTIVE')
  if (!active) problems.push('no ACTIVE version')

  if (active) {
    const trig = active.trigger ?? {}
    const s = trig.settings ?? {}
    if (s.eventName !== 'company.updated') problems.push(`eventName is ${s.eventName}, expected company.updated`)
    if (JSON.stringify(s.fields ?? []) !== '["stage"]') problems.push(`watched fields are ${JSON.stringify(s.fields)}, expected ["stage"]`)
    const nFilters = (s.filter?.stepFilters ?? []).length
    if (nFilters < 4) problems.push(`${nFilters} trigger filters, expected 4 — the missing ones are what stop duplicate sends`)

    const steps = active.steps ?? []
    const http = steps.find((x: any) => x.type === 'HTTP_REQUEST')
    const upd = steps.find((x: any) => x.type === 'UPDATE_RECORD')
    if (!http) problems.push('no HTTP_REQUEST step')
    if (!upd) problems.push('no UPDATE_RECORD step')
    if (http) {
      const inp = http.settings?.input ?? {}
      if (!String(inp.url ?? '').includes('/webhooks/school-shortlisted')) problems.push(`HTTP url is ${inp.url}`)
      if (!inp.headers?.['X-Gitlab-Token']) problems.push('HTTP step is missing the X-Gitlab-Token header — Hermes will 401 every call')
      if (http.settings?.errorHandlingOptions?.retryOnFailure?.value) problems.push('retryOnFailure is ON — duplicate sends to real schools')
    }
    if (upd) {
      const rec = upd.settings?.input?.objectRecord ?? {}
      if (rec.outreachStatus === 'SENT') problems.push('UPDATE_RECORD sets SENT — it can only honestly say QUEUED; only a human who sent it may set SENT')
      if (rec.stage !== 'CONTACTED') problems.push(`UPDATE_RECORD sets stage=${rec.stage}, expected CONTACTED`)
    }
  }

  console.log(`\n workflow  ${wf.name}  (${wf.id})`)
  console.log(` published ${wf.lastPublishedVersionId ?? '— NOT ACTIVATED'}`)
  if (!problems.length) {
    console.log('\n ✅ deployed workflow matches the spec\n')
  } else {
    console.log('\n ❌ drift from the spec:')
    for (const p of problems) console.log(`   • ${p}`)
    console.log()
    process.exit(1)
  }
}

;(VERIFY ? verify() : Promise.resolve(printSpec())).catch((e) => {
  console.error(e instanceof Error ? e.message : e)
  process.exit(1)
})
