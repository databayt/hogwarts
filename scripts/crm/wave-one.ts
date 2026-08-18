/**
 * Wave 1 — the first ten schools.
 *
 *   npx tsx scripts/crm/wave-one.ts                      # plan only, prints the sheet
 *   npx tsx scripts/crm/wave-one.ts --test=+249xxxxxxxxx # every message aimed at ONE number
 *   npx tsx scripts/crm/wave-one.ts --apply              # blocked until a sender exists
 *
 * ── What this is for ────────────────────────────────────────────────────────
 *
 * Ten schools, one opening message, one deck. Its job is not throughput — it is
 * to find out what a school principal actually replies to, so the qualifying
 * questions that come later are written from real answers rather than guesses.
 * That is why it stops at ten and why every reply goes to a person.
 *
 * ── Why it does not send ────────────────────────────────────────────────────
 *
 * `--apply` is deliberately refused. The Evolution instance the sender expects
 * (EVOLUTION_API_URL) currently returns 404 "Application not found", so there is
 * no WhatsApp transport at all. Rather than fail halfway through a list of real
 * schools, this emits `wa.me` links a human opens and sends — which for ten
 * messages is the right mechanism anyway: it produces replies this week, and a
 * person reads every one.
 *
 * MOBILE ONLY. A landline in a WhatsApp campaign is a silent non-delivery that
 * reads as disinterest, so switchboard numbers are dropped and counted, never
 * quietly attempted.
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'

const DECK_URL = 'https://balqalam.com/decks/balqalam.pdf'
const WAVE_SIZE = 10

const args = process.argv.slice(2)
const APPLY = args.includes('--apply')
const TEST_TO = args.find((a) => a.startsWith('--test='))?.split('=')[1] ?? null
const LIMIT = Number(args.find((a) => a.startsWith('--limit='))?.split('=')[1] ?? WAVE_SIZE)

interface Row {
  id: string
  name: string
  tier: string
  stage: string
  contact: string
}

/**
 * Mobile detection per country. Deliberately conservative: anything not
 * recognisably mobile is dropped rather than guessed at.
 *
 *   SD  +249 9x ONLY        EG  +20 10/11/12/15
 *   SA  +966 5x             AE  +971 5x           QA  +974 3x/5x/6x/7x
 *
 * Sudan is the awkward one and worth explaining, because the first version of
 * this got it wrong. Sudanese mobiles run on 9x AND on some 1x prefixes, but
 * Khartoum landlines are also 1xx — 0183 is the Khartoum area code. There is no
 * way to separate them from the number alone, so accepting 1x put a school's
 * switchboard (+249 183 215 000) at the top of the wave. Only 9x is
 * unambiguously mobile; 1x is dropped as unknown. That loses a few real mobiles,
 * which is the cheaper mistake — a WhatsApp to a landline is never delivered and
 * reads back as a school that ignored us.
 */
function isMobile(e164: string): boolean {
  const n = e164.replace(/[^\d+]/g, '')
  if (n.startsWith('+249')) return /^\+2499/.test(n)
  if (n.startsWith('+20')) return /^\+20(10|11|12|15)/.test(n)
  if (n.startsWith('+966')) return /^\+9665/.test(n)
  if (n.startsWith('+971')) return /^\+9715/.test(n)
  if (n.startsWith('+974')) return /^\+974[3567]/.test(n)
  return false
}

/**
 * The opening message.
 *
 * Arabic only — every school in this wave is in SD/EG/SA/AE/QA and the deck is
 * Arabic, so an English opener would be the wrong first impression.
 *
 * Shape, and the reasoning behind it:
 *   - Who is speaking, immediately. A cold WhatsApp with no name is spam.
 *   - What it is, in one sentence, in the school's own vocabulary — admission,
 *     fees, parents, website — not "SaaS platform".
 *   - The offer, stated plainly and without conditions to read past.
 *   - ONE ask, and a small one. Not a demo, not a call — just a yes/no.
 *   - No urgency, no scarcity, no "quick question". Schools are institutions
 *     and respond badly to sales theatre.
 */
export function openingMessage(schoolName: string): string {
  return [
    'السلام عليكم ورحمة الله وبركاته',
    '',
    `أكتب لكم بخصوص ${schoolName}.`,
    '',
    'معكم فريق داتابيت. طوّرنا منصة «بالقلم» لإدارة المدارس — القبول والتسجيل، الرسوم والفواتير والرواتب، التواصل مع أولياء الأمور، وموقع إلكتروني خاص بالمدرسة.',
    '',
    'أرفقنا لكم تعريفاً مختصراً.',
    '',
    'نتيح ثلاثة أشهر تجربة مجانية كاملة، بدون رسوم وبدون التزام.',
    '',
    'هل ترغبون أن نجهّز نسخة تجريبية باسم مدرستكم لتجربتها؟',
  ].join('\n')
}

function waLink(e164: string, text: string): string {
  return `https://wa.me/${e164.replace(/[^\d]/g, '')}?text=${encodeURIComponent(text)}`
}

function main() {
  const gapPath = join(process.cwd(), 'scripts/crm/.data/contact-gap.json')
  const gap = JSON.parse(readFileSync(gapPath, 'utf8'))
  const all: Row[] = gap.workableNow ?? []
  if (!all.length) throw new Error('no workableNow rows — run contact-gap.ts first')

  const mobile = all.filter((r) => isMobile(r.contact))
  const landline = all.length - mobile.length

  // Tier A before B: a bigger school is worth the first ten slots.
  const ranked = [...mobile].sort((a, b) => (a.tier === b.tier ? 0 : a.tier === 'A' ? -1 : 1))
  const wave = ranked.slice(0, LIMIT)

  console.log(`\n═══ Wave 1 — balqalam opening ═══`)
  console.log(`  workable now      ${all.length}`)
  console.log(`  mobile (WhatsApp) ${mobile.length}`)
  console.log(`  dropped: landline ${landline}   ← never attempted, they read as disinterest`)
  console.log(`  selected          ${wave.length}`)
  if (TEST_TO) console.log(`  TEST MODE → every message aimed at ${TEST_TO}\n`)

  const sheet = wave.map((r, i) => {
    const text = openingMessage(r.name)
    const to = TEST_TO ?? r.contact
    return {
      n: i + 1,
      companyId: r.id,
      school: r.name,
      tier: r.tier,
      realNumber: r.contact,
      sendTo: to,
      deck: DECK_URL,
      message: text,
      waLink: waLink(to, text),
    }
  })

  for (const s of sheet) {
    console.log(`  ${String(s.n).padStart(2)}. [${s.tier}] ${s.school}`)
    console.log(`      → ${s.sendTo}${TEST_TO ? `  (real: ${s.realNumber})` : ''}`)
    console.log(`      ${s.waLink.slice(0, 110)}…`)
  }

  const outDir = join(process.cwd(), 'scripts/crm/.data')
  mkdirSync(outDir, { recursive: true })
  const out = join(outDir, 'wave-one.json')
  writeFileSync(out, JSON.stringify({ generatedAt: new Date().toISOString(), deck: DECK_URL, testMode: TEST_TO, sheet }, null, 2))
  console.log(`\n  sheet → ${out}`)
  console.log(`  deck  → ${DECK_URL}`)

  if (APPLY) {
    throw new Error(
      'automated sending is disabled: EVOLUTION_API_URL returns 404 "Application not found", so ' +
        'there is no WhatsApp transport. Open the wa.me links above and attach the deck by hand — ' +
        'for ten messages that is the right mechanism, and a person reads every reply.',
    )
  }
  console.log(`\n  Open each link, attach the deck, send. Then log the send as a Note on the company.\n`)
}

main()
