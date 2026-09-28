/**
 * Chatbot leads → Twenty. The balqalam.com assistant captures a visitor who
 * types an email or phone as a prod `Prospect` (source=chatbot,
 * status=replied — src/components/chatbot/capture.ts), but until 2026-09-28
 * nothing carried it to the board, so the team working Twenty never saw
 * the warmest lead the site can produce.
 *
 * For every chatbot Prospect with no Twenty company yet (idempotency key:
 * company.sourceReference = the Prospect's `inbound:*` key):
 *   1. create the company at PROSPECT carrying ONLY the identifier the
 *      Prospect is keyed on — so the applier's upsert lands on this same row
 *      instead of minting a twin;
 *   2. PATCH stage → WARM on its own, which fires company.updated →
 *      balqalam.com receiver → the hourly applier → promoteToLead: the exact
 *      path every other reply takes, no second writer;
 *   3. attach the conversation as a note, and post a card.
 *
 * Runs on the Mac (loop.sh), never on the Worker: Cloudflare cannot
 * TLS-handshake with the Tailscale Funnel in front of Twenty (525).
 *
 *   DATABASE_URL=<prod> pnpm crm:funnel-sync-chatbot            dry
 *   DATABASE_URL=<prod> pnpm crm:funnel-sync-chatbot --apply
 */
import { twentyClient } from "../crm/twenty-rest"
import { dbHostTag, flag, loadEnv } from "./lib"
import { postCard } from "./notify"

const APPLY = flag("apply")

async function main() {
  // The caller passes the prod URL (Keychain cf-hogwarts-DATABASE_URL);
  // .env only fills what is unset, so it cannot silently swap in dev.
  loadEnv()
  const host = dbHostTag(process.env.DATABASE_URL)
  console.log(`DB: ${host}`)
  if (!/NEON/.test(host) && !flag("allow-local"))
    throw new Error(
      "DATABASE_URL is not the prod Neon — chatbot leads live in prod. Pass it from Keychain cf-hogwarts-DATABASE_URL (or --allow-local to test)."
    )
  const { db } = await import("@/lib/db")
  const t = twentyClient()

  const prospects = await db.prospect.findMany({
    where: { source: "chatbot" },
    orderBy: { updatedAt: "asc" },
    select: {
      id: true,
      gmapsPlaceId: true,
      email: true,
      phone: true,
      notes: true,
      tags: true,
      updatedAt: true,
    },
  })
  console.log(`${prospects.length} chatbot prospect(s) in prod`)

  let created = 0
  for (const p of prospects) {
    const key = p.gmapsPlaceId
    if (!key) continue
    const found = (await t.rest(
      "GET",
      `companies?limit=1&filter=${encodeURIComponent(`sourceReference[eq]:"${key}"`)}`
    )) as { data?: { companies?: { id: string }[] } }
    if (found?.data?.companies?.length) continue

    const byEmail = key.startsWith("inbound:") && !key.startsWith("inbound:wa:")
    const who = byEmail ? p.email : p.phone
    console.log(`  + ${key}  (${who})`)
    created++
    if (!APPLY) continue

    const res = (await t.rest("POST", "companies", {
      name: `Chatbot · ${who}`,
      stage: "PROSPECT",
      sourceReference: key,
      ...(byEmail ? { principalContact: p.email } : { schoolPhone: p.phone }),
      nextAction:
        "Answer the chatbot lead — they typed their contact into balqalam.com",
    })) as { data?: { createCompany?: { id: string } } }
    const id = res?.data?.createCompany?.id
    if (!id) {
      console.log(
        `    ✗ create returned no id: ${JSON.stringify(res).slice(0, 200)}`
      )
      continue
    }
    await t.rest("PATCH", `companies/${id}`, { stage: "WARM" })

    try {
      const note = (await t.rest("POST", "notes", {
        title: "Chatbot conversation",
        bodyV2: { markdown: p.notes ?? "(no text captured)" },
      })) as { data?: { createNote?: { id: string } } }
      const noteId = note?.data?.createNote?.id
      if (noteId)
        await t.rest("POST", "noteTargets", { noteId, targetCompanyId: id })
    } catch (e) {
      console.log(
        `    (note not attached: ${e instanceof Error ? e.message.slice(0, 120) : e})`
      )
    }

    const locale = p.tags.find((x) => x.startsWith("locale:"))?.slice(7) ?? "?"
    postCard(
      `🤖 *Chatbot lead* (${locale}) — ${who}\n> ${(p.notes ?? "").replace(/^chatbot \([a-z]+\): /, "").slice(0, 400)}\n\nOn the board at *WARM*; the applier promotes it to a Lead within the hour. Reply today.\nhttps://hogwarts.databayt.org/object/company/${id}`,
      "Funnel · chatbot"
    )
  }
  console.log(`${APPLY ? "created" : "would create"} ${created}`)
  await db.$disconnect()
}

main().then(
  () => process.exit(0),
  (e) => {
    console.error(e instanceof Error ? e.message : e)
    process.exit(1)
  }
)
