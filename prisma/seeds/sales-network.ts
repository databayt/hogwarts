// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Sales — Network short list
 *
 * Seeds the team's warm private network (and the first cold tier) into the
 * platform-scoped operator Lead pool (`schoolId = "platform"`), surfaced in
 * the saas-dashboard sales console at `/[lang]/sales`.
 *
 * Convention (see content/docs-en/sales.mdx workstream 1):
 *   Tier A — warm, you have a direct relay  → source REFERRAL, priority URGENT,
 *            tags ["network", "tier-a", <country>]
 *   Tier B — warm but needs intro/research → source REFERRAL, priority HIGH,
 *            tags ["network", "tier-b", <country>]
 *   Tier C — cold, needs research          → source COLD_CALL, priority MEDIUM,
 *            tags ["tier-c", <country>]  (NO "network" tag — not warm yet)
 *
 * Idempotent: matches on (schoolId="platform", company=<school name>) and
 * skips existing rows. Re-run any time to refresh missing schools.
 *
 * Run:
 *   pnpm db:seed:single sales-network
 */

import {
  LeadPriority,
  LeadSource,
  LeadStatus,
  LeadType,
  type PrismaClient,
} from "@prisma/client"

const PLATFORM_SCHOOL_ID = "platform"

type Tier = "A" | "B" | "C"

interface NetworkSchoolSeed {
  /** Primary contact name (or school name if no contact yet). */
  contactName: string
  /** Contact's role/title at the school, if known. */
  title?: string
  /** Notes — missing info markers, alt contacts, context. */
  notes: string
  /**
   * School / organization name. Omit only for intro-source contacts who
   * aren't tied to a specific target school (idempotency then falls back
   * to `contactName`).
   */
  company?: string
  /** ISO country code. */
  country: string
  tier: Tier
  /** Defaults to SCHOOL. Use PARTNERSHIP for intro-source / network connectors. */
  leadType?: LeadType
}

// ============================================================================
// SHORT LIST (2026-05-24)
// ============================================================================
// 11 schools + 1 intro-source contact captured from the team notebook. School
// names are Arabic primary per the single-language storage rule; transliterations
// live in `notes` for English-speaking team members.
// ============================================================================

const SCHOOLS: NetworkSchoolSeed[] = [
  {
    contactName: "أحمد بها",
    title: "صلة شبكة / مصدر تقديمات",
    country: "SD",
    tier: "A",
    leadType: LeadType.PARTNERSHIP,
    notes:
      "Ahmed Baha — the team's originally-named warm contact (sales.mdx workstream 1). Network connector / intro source, not a school decision-maker himself. Next step: list which schools he can warm-intro us to. Missing: phone, current location, schools he's connected to.",
  },
  {
    contactName: "حسن عبدوت",
    title: "تواصل عبر العائلة",
    company: "المجلس الأفريقي",
    country: "SD",
    tier: "A",
    notes:
      "African Council. Two warm relays: حسن عبدوت (primary) + معتز (alt). Missing: phones, formal roles. Sudan conflict — confirm operating mode before pitch.",
  },
  {
    contactName: "عبد الرحمن",
    company: "آفاق",
    country: "SD",
    tier: "A",
    notes: "Afaq. Direct personal contact. Missing: phone, role. Sudan.",
  },
  {
    contactName: "أريج",
    company: "مدارس الشيخ مصطفى الأمين",
    country: "SD",
    tier: "A",
    notes:
      "Sheikh Mustafa Al-Amin Schools. Direct personal contact. Missing: phone, role. Sudan.",
  },
  {
    contactName: "أسامة",
    company: "مدارس كمبوني",
    country: "SD",
    tier: "B",
    notes:
      "Comboni Schools. Warm but needs intro to confirm decision-maker. Missing: phone, role, location (Khartoum vs displaced).",
  },
  {
    contactName: "مها",
    company: "كيبيدا",
    country: "SD",
    tier: "B",
    notes: "Kibida. Warm contact. Missing: phone, role.",
  },
  {
    contactName: "إبراهيم سليمان",
    company: "نور البيان",
    country: "SD",
    tier: "B",
    notes: "Nour Al-Bayan. Warm contact. Missing: phone, role.",
  },
  {
    contactName: "أبو بكر جيكوني",
    company: "القبس",
    country: "SD",
    tier: "B",
    notes: "Al-Qabas. Warm contact. Missing: phone, role.",
  },
  {
    contactName: "كيكس",
    company: "كيكس",
    country: "SD",
    tier: "C",
    notes:
      "KICS — no contact yet. Need warm intro OR find website/social and DM. Sudan.",
  },
  {
    contactName: "أباذر الكودا",
    company: "أباذر الكودا",
    country: "SD",
    tier: "C",
    notes: "Abazar Al-Kuda — no contact yet. Research required. Sudan.",
  },
  {
    contactName: "Westminster Port Sudan",
    company: "Westminster Port Sudan",
    country: "SD",
    tier: "C",
    notes:
      "Westminster Port Sudan — international curriculum, English-first motion. No contact. Research required.",
  },
  {
    contactName: "Khartoum American School",
    company: "Khartoum American School (Egypt ops)",
    country: "EG",
    tier: "C",
    notes:
      "KAS — international, English-first, currently operating from Egypt. Higher willingness to pay; different motion than Sudanese national schools. No contact. Research required.",
  },
]

function tierFields(tier: Tier, country: string) {
  switch (tier) {
    case "A":
      return {
        source: LeadSource.REFERRAL,
        priority: LeadPriority.URGENT,
        tags: ["network", "tier-a", country.toLowerCase()],
      }
    case "B":
      return {
        source: LeadSource.REFERRAL,
        priority: LeadPriority.HIGH,
        tags: ["network", "tier-b", country.toLowerCase()],
      }
    case "C":
      return {
        source: LeadSource.COLD_CALL,
        priority: LeadPriority.MEDIUM,
        // No "network" tag — not warm yet.
        tags: ["tier-c", country.toLowerCase()],
      }
  }
}

export async function seedSalesNetwork(prisma: PrismaClient): Promise<void> {
  // Lead.schoolId has a FK to School. The operator console writes all platform
  // leads under id="platform", so that sentinel row must exist before we
  // insert. Upsert it idempotently; nothing else in the codebase relies on
  // its other fields.
  await prisma.school.upsert({
    where: { id: PLATFORM_SCHOOL_ID },
    update: {},
    create: {
      id: PLATFORM_SCHOOL_ID,
      name: "Platform Operator",
      domain: PLATFORM_SCHOOL_ID,
      isActive: true,
      // School defaults cover timezone, preferredLanguage, planType, limits.
    },
  })

  let created = 0
  let skipped = 0

  for (const s of SCHOOLS) {
    // Idempotency: company name is the logical key inside the platform pool.
    // For intro-source contacts with no company, dedup by contact name instead.
    const existing = await prisma.lead.findFirst({
      where: s.company
        ? { schoolId: PLATFORM_SCHOOL_ID, company: s.company }
        : {
            schoolId: PLATFORM_SCHOOL_ID,
            company: null,
            name: s.contactName,
          },
      select: { id: true },
    })
    if (existing) {
      skipped++
      continue
    }

    const fields = tierFields(s.tier, s.country)
    await prisma.lead.create({
      data: {
        schoolId: PLATFORM_SCHOOL_ID,
        name: s.contactName,
        title: s.title,
        company: s.company,
        country: s.country,
        leadType: s.leadType ?? LeadType.SCHOOL,
        status: LeadStatus.NEW,
        source: fields.source,
        priority: fields.priority,
        tags: fields.tags,
        notes: s.notes,
      },
    })
    created++
  }

  console.log(
    `  ✓ sales-network: ${created} created, ${skipped} already present`
  )
}
