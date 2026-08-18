// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Prospect → Lead promotion.
 *
 * `prisma/models/sales.prisma` has referred to this function in a doc comment
 * since the Prospect model was written, and it has never existed. It is the one
 * step between the cold list the scrape lane fills and the warm pipeline the
 * funnel lane works, so nothing downstream of a first reply could run without it.
 *
 * ── The two foreign keys that make this harder than it looks ────────────────
 *
 * `Lead.schoolId` is a REQUIRED FK to School (onDelete: Cascade), and
 * `LeadActivity.createdById` is a REQUIRED FK to User. An inbound lead — a
 * principal who replied to a WhatsApp message, a visitor who typed an email into
 * the chat widget — has neither. Note the deliberate contrast one model down:
 * `Prospect.schoolId` is `@default("platform")` and is explicitly *not* a FK,
 * precisely because a cold row belongs to no tenant.
 *
 * Making `Lead.schoolId` nullable would silently widen every one of that model's
 * indexes and every query that assumes tenant scoping. So instead a sentinel
 * tenant carries platform-level leads, created on demand rather than seeded, so
 * that no environment needs a migration step before this function works and the
 * row only appears once something has actually been promoted.
 */

import { LeadPriority, LeadSource, LeadStatus, LeadType } from "@prisma/client"

import { db } from "@/lib/db"

/** The tenant that owns platform-level leads. Never a real school. */
export const PLATFORM_SCHOOL_ID = "platform"
/** The actor recorded on activity written by automation rather than a person. */
export const SYSTEM_USER_ID = "system-funnel"

export type PromoteResult =
  | { ok: true; leadId: string; created: boolean }
  | { ok: false; reason: "prospect_not_found" | "no_contact_channel" }

/**
 * Ensure the sentinel tenant and system actor exist.
 *
 * `isActive: false` keeps the sentinel out of active-tenant counts, which is
 * what the north-star metric reads. `platform` is a reserved subdomain, so it
 * can never collide with a real school's domain.
 */
async function ensureSentinels(): Promise<void> {
  await db.school.upsert({
    where: { id: PLATFORM_SCHOOL_ID },
    update: {},
    create: {
      id: PLATFORM_SCHOOL_ID,
      name: "Databayt Platform",
      domain: PLATFORM_SCHOOL_ID,
      isActive: false,
      planType: "basic",
      maxStudents: 0,
      maxTeachers: 0,
    },
  })
  await db.user.upsert({
    where: { id: SYSTEM_USER_ID },
    update: {},
    create: {
      id: SYSTEM_USER_ID,
      name: "Funnel automation",
      // Deliberately unroutable: nothing should ever mail this address, and no
      // one should be able to sign in as it.
      email: "system-funnel@invalid.databayt.org",
      schoolId: PLATFORM_SCHOOL_ID,
    },
  })
}

/** Days to wait before the first follow-up touch, per the funnel's cadence. */
const FIRST_TOUCH_DELAY_DAYS = 2

/**
 * Promote a cold Prospect into a warm Lead.
 *
 * Idempotent: `Prospect.promotedLeadId` is `@unique`, so a second call returns
 * the same lead rather than creating another. Callers may retry freely — the
 * webhook and the chat capture both can, and both will.
 *
 * Returns `no_contact_channel` rather than promoting a row nobody can reach:
 * a lead with neither an email nor a phone cannot be worked, and creating one
 * would only inflate the pipeline.
 */
export async function promoteToLead(prospectId: string): Promise<PromoteResult> {
  const prospect = await db.prospect.findUnique({ where: { id: prospectId } })
  if (!prospect) return { ok: false, reason: "prospect_not_found" }

  if (prospect.promotedLeadId) {
    return { ok: true, leadId: prospect.promotedLeadId, created: false }
  }
  if (!prospect.email && !prospect.phone) {
    return { ok: false, reason: "no_contact_channel" }
  }

  await ensureSentinels()

  const now = new Date()
  const nextFollowUpAt = new Date(
    now.getTime() + FIRST_TOUCH_DELAY_DAYS * 24 * 60 * 60 * 1000
  )

  // One transaction: a Lead without its Prospect back-reference would be
  // promoted twice on the next call, which is exactly what @unique is for.
  const lead = await db.$transaction(async (tx) => {
    const created = await tx.lead.create({
      data: {
        schoolId: PLATFORM_SCHOOL_ID,
        name: prospect.principalName ?? prospect.name,
        email: prospect.email,
        phone: prospect.phone,
        company: prospect.name,
        title: prospect.decisionMakerRole,
        website: prospect.website,
        country: prospect.country,
        location: prospect.city,
        leadType: LeadType.SCHOOL,
        status: LeadStatus.NEW,
        // A promoted prospect replied to something we sent, or arrived through
        // the site. Either way the origin is our own surface, not a purchase.
        source: LeadSource.WEBSITE,
        priority:
          prospect.decisionMakerRole === "owner" ||
          prospect.decisionMakerRole === "principal"
            ? LeadPriority.HIGH
            : LeadPriority.MEDIUM,
        score: prospect.enrichmentScore ?? 0,
        notes: prospect.pitchHook,
        tags: ["funnel", `source:${prospect.source}`],
        nextFollowUpAt,
      },
    })

    await tx.prospect.update({
      where: { id: prospect.id },
      data: { status: "promoted", promotedLeadId: created.id },
    })

    await tx.leadActivity.create({
      data: {
        schoolId: PLATFORM_SCHOOL_ID,
        leadId: created.id,
        createdById: SYSTEM_USER_ID,
        type: "status_change",
        description: `Promoted from prospect ${prospect.id} (${prospect.source})`,
      },
    })

    return created
  })

  return { ok: true, leadId: lead.id, created: true }
}
