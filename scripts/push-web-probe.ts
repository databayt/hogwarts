// One-off probe: run the Web Push processor directly against the local DB.
// Usage: PROBE_NOTIFICATION_ID=<id> PROBE_SUBSCRIPTION_ID=<id> \
//   npx tsx -r dotenv/config -r ./scripts/_server-only-shim.cjs scripts/push-web-probe.ts
import { db } from "../src/lib/db"
import { processPendingWebPushes } from "../src/lib/notifications/push-web"

async function main() {
  const out = await processPendingWebPushes(10)
  console.log(JSON.stringify(out))
  const n = await db.notification.findUnique({
    where: { id: process.env.PROBE_NOTIFICATION_ID ?? "" },
    select: { pushSent: true, pushError: true },
  })
  const s = await db.pushSubscription.count({ where: { id: process.env.PROBE_SUBSCRIPTION_ID ?? "" } })
  console.log(JSON.stringify({ notification: n, bogusSubsLeft: s }))
  await db.$disconnect()
}
main().catch((e) => { console.error(e); process.exit(1) })
