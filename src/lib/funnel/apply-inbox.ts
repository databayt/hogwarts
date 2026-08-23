// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * The inbox applier — drain `TwentyInboundEvent` rows (status=pending).
 *
 * ONE implementation, two callers: the Vercel cron route
 * (`app/api/cron/funnel-apply`) runs it hourly against production, and the
 * script (`scripts/funnel/apply-inbox.ts`) wraps it for dry runs and local
 * work. The rules are deliberately narrow:
 *
 *   APPLY   `company.updated` where a human dragged stage → WARM. At this
 *           volume the person who SENT the message is the person reading the
 *           reply, so that one drag is the designed reply signal: upsert the
 *           Prospect (same synthetic keys as the chatbot and the inbound
 *           forms), status=replied, then promoteToLead() → Lead NEW.
 *
 *   IGNORE  the workflow's own echo (stage+outreachStatus changed together),
 *           and every other board move — recorded with a note as ADVISORY,
 *           never silently applied. One writer, one truth.
 *
 * Anything unclassifiable stays pending and is reported — a row neither
 * applied nor explained is exactly the silence this table exists to prevent.
 */
import { db } from "@/lib/db"
import { emailOf, toE164 } from "@/lib/funnel/identifiers"
import { promoteToLead } from "@/lib/sales/promote"

interface TwentyRecord {
  id?: string
  name?: string
  stage?: string
  country?: string
  schoolPhone?: string
  principalContact?: string
}

export interface ApplyAction {
  eventId: string
  eventName: string
  recordId: string
  status: "applied" | "ignored" | "pending"
  note: string
}

export interface ApplyReport {
  dryRun: boolean
  pending: number
  applied: number
  ignored: number
  left: number
  actions: ApplyAction[]
}

export async function applyInbox({
  dryRun,
}: {
  dryRun: boolean
}): Promise<ApplyReport> {
  const pending = await db.twentyInboundEvent.findMany({
    where: { status: "pending" },
    orderBy: { createdAt: "asc" },
    take: 200, // one batch per run; the next run takes the rest
  })

  const report: ApplyReport = {
    dryRun,
    pending: pending.length,
    applied: 0,
    ignored: 0,
    left: 0,
    actions: [],
  }

  for (const evt of pending) {
    const payload = evt.payload as
      | { record?: TwentyRecord }
      | TwentyRecord
      | null
    const record: TwentyRecord =
      (payload &&
        "record" in (payload as object) &&
        (payload as { record?: TwentyRecord }).record) ||
      (payload as TwentyRecord) ||
      {}
    const fields = evt.updatedFields ?? []

    const decide = async (): Promise<{
      status: ApplyAction["status"]
      note: string
    }> => {
      if (evt.objectName !== "company")
        return {
          status: "ignored",
          note: `advisory ${evt.objectName} move — recorded, review on the board`,
        }
      if (!fields.includes("stage"))
        return {
          status: "ignored",
          note: `company fields [${fields.join(",")}] — no gate meaning`,
        }

      const stage = (record.stage ?? "").toUpperCase()
      if (fields.includes("outreachStatus"))
        return {
          status: "ignored",
          note: `workflow self-echo (stage=${stage} + outreachStatus together)`,
        }

      if (stage === "WARM") {
        const email = emailOf(record.principalContact)
        const e164 = toE164(record.schoolPhone, record.country)
        const key = email
          ? `inbound:${email}`
          : e164
            ? `inbound:wa:${e164}`
            : null
        if (!key)
          return {
            status: "pending",
            note: "WARM drag but no email/phone on the record — needs a human to attach a contact first",
          }
        if (dryRun)
          return {
            status: "applied",
            note: `WOULD capture ${key} + promoteToLead (dry)`,
          }
        const prospect = await db.prospect.upsert({
          where: { gmapsPlaceId: key },
          create: {
            gmapsPlaceId: key,
            name: record.name ?? key,
            email,
            phone: e164,
            country: record.country ?? "unknown",
            source: "outreach-warm-drag",
            status: "replied",
            tags: [`twenty:${evt.recordId}`],
            notes: `WARM drag applied from Twenty event ${evt.id}`,
            lastTouchAt: new Date(),
          },
          update: { status: "replied", lastTouchAt: new Date() },
        })
        const res = await promoteToLead(prospect.id)
        return {
          status: "applied",
          note: `captured ${key} → promoteToLead: ${JSON.stringify(res).slice(0, 120)}`,
        }
      }
      return {
        status: "ignored",
        note: `advisory drag to ${stage || "?"} — recorded, not written back`,
      }
    }

    const verdict = await decide()
    report.actions.push({
      eventId: evt.id,
      eventName: evt.eventName,
      recordId: evt.recordId,
      ...verdict,
    })
    if (verdict.status === "pending") {
      report.left++
      continue
    }
    if (!dryRun) {
      await db.twentyInboundEvent.update({
        where: { id: evt.id },
        data: {
          status: verdict.status,
          note: verdict.note,
          processedAt: new Date(),
        },
      })
    }
    verdict.status === "applied" ? report.applied++ : report.ignored++
  }

  return report
}
