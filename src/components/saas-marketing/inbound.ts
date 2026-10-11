// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Inbound plumbing shared by the marketing server actions (actions.ts) and
 * the survey (survey/actions.ts). Not a "use server" module — these are
 * internal helpers, never callable from the client.
 */

import "server-only"

import { db } from "@/lib/db"
import { sendEmail } from "@/lib/email"

const SALES_INBOX = process.env.SALES_NOTIFY_EMAIL ?? "hi@databayt.org"

export async function notifySales(subject: string, data: Record<string, unknown>) {
  try {
    await sendEmail({
      to: SALES_INBOX,
      subject,
      template: "sales-notify",
      data,
    })
  } catch (err) {
    console.error("[sales] notify failed", err)
  }
}

/**
 * Upsert a Prospect by email. Inbound forms = self-identified, so they land
 * with status="replied" -- they bypass the cold queue and go straight to the
 * founder's reply SLA bucket.
 */
export async function upsertInboundProspect(args: {
  email: string
  name?: string
  phone?: string
  website?: string
  country?: string
  source: string
  studentCountEstimate?: number
  tags?: string[]
  notes?: string
  status?: string
  rawPayload?: Record<string, unknown>
}) {
  const status = args.status ?? "replied"

  return db.prospect.upsert({
    where: {
      gmapsPlaceId: `inbound:${args.email}`, // synthetic unique key for inbound rows
    },
    create: {
      gmapsPlaceId: `inbound:${args.email}`,
      name: args.name ?? args.email,
      email: args.email,
      phone: args.phone,
      website: args.website,
      country: args.country ?? "unknown",
      source: args.source,
      status,
      studentCountEstimate: args.studentCountEstimate,
      tags: args.tags ?? [],
      notes: args.notes,
      lastTouchAt: new Date(),
    },
    update: {
      status,
      lastTouchAt: new Date(),
      tags: args.tags ?? [],
      ...(args.name ? { name: args.name } : {}),
      ...(args.phone ? { phone: args.phone } : {}),
      ...(args.website ? { website: args.website } : {}),
      ...(args.country ? { country: args.country } : {}),
      ...(args.studentCountEstimate !== undefined
        ? { studentCountEstimate: args.studentCountEstimate }
        : {}),
      ...(args.notes ? { notes: args.notes } : {}),
    },
  })
}
