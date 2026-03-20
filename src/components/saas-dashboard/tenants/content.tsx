// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { getDisplayText } from "@/lib/content-display"
import { db } from "@/lib/db"
import type { Locale } from "@/components/internationalization/config"
import type { getDictionary } from "@/components/internationalization/dictionaries"
import { EmptyState } from "@/components/saas-dashboard/common/empty-state"

import type { TenantRow } from "./columns"
import { TenantsTable } from "./table"

interface Props {
  dictionary: Awaited<ReturnType<typeof getDictionary>>
  lang: Locale
  searchParams?: {
    page?: string
    limit?: string
    status?: string
    plan?: string
    search?: string
  }
}

async function getTenants(searchParams: Props["searchParams"], lang: Locale) {
  const page = Number(searchParams?.page) || 1
  const limit = Number(searchParams?.limit) || 10
  const offset = (page - 1) * limit

  const where = {
    ...(searchParams?.status && searchParams.status !== "all"
      ? { isActive: searchParams.status === "active" }
      : {}),
    ...(searchParams?.plan && searchParams.plan !== "all"
      ? { planType: searchParams.plan }
      : {}),
    ...(searchParams?.search
      ? {
          OR: [
            {
              name: {
                contains: searchParams.search,
                mode: "insensitive" as const,
              },
            },
            {
              domain: {
                contains: searchParams.search,
                mode: "insensitive" as const,
              },
            },
          ],
        }
      : {}),
  }

  const [tenants, total] = await Promise.all([
    db.school.findMany({
      where,
      select: {
        id: true,
        name: true,
        domain: true,
        isActive: true,
        planType: true,
        preferredLanguage: true,
        createdAt: true,
        _count: {
          select: {
            students: true,
            teachers: true,
            academicLevels: true,
            academicGrades: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: offset,
      take: limit,
    }),
    db.school.count({ where }),
  ])

  const translatedNames = await Promise.all(
    tenants.map((tenant) =>
      getDisplayText(
        tenant.name,
        (tenant.preferredLanguage ?? "ar") as "en" | "ar",
        lang,
        tenant.id
      )
    )
  )

  const rows: TenantRow[] = tenants.map((tenant, i) => ({
    id: tenant.id,
    name: translatedNames[i],
    originalName: tenant.name,
    subdomain: tenant.domain,
    domain: tenant.domain,
    isActive: tenant.isActive,
    planType: tenant.planType as "TRIAL" | "BASIC" | "PREMIUM" | "ENTERPRISE",
    studentCount: tenant._count.students,
    teacherCount: tenant._count.teachers,
    catalogLevels: tenant._count.academicLevels,
    catalogGrades: tenant._count.academicGrades,
    createdAt: tenant.createdAt.toISOString(),
    trialEndsAt: undefined,
  }))

  return {
    rows,
    total,
    pageCount: Math.ceil(total / limit),
  }
}

export async function TenantsContent({
  dictionary,
  lang,
  searchParams,
}: Props) {
  const limit = Number(searchParams?.limit) || 10
  const t = dictionary?.operator?.tenants

  const tenantData = await getTenants(searchParams, lang)

  return tenantData.rows.length > 0 ? (
    <TenantsTable
      initialData={tenantData.rows}
      total={tenantData.total}
      perPage={limit}
    />
  ) : (
    <EmptyState
      title={t?.noSchoolsFound || "No schools found"}
      description={
        t?.schoolsWillAppear ||
        "Schools will appear here once they complete onboarding."
      }
    />
  )
}
