// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { db } from "@/lib/db"
import type { Locale } from "@/components/internationalization/config"
import type { getDictionary } from "@/components/internationalization/dictionaries"
import { EmptyState } from "@/components/saas-dashboard/common/empty-state"

import { auditColumns, type AuditRow } from "./logs-table/columns"
import { AuditLogTable } from "./logs-table/table"

interface Props {
  dictionary: Awaited<ReturnType<typeof getDictionary>>
  lang: Locale
  searchParams?: {
    page?: string
    limit?: string
    action?: string
    search?: string
  }
}

export async function ObservabilityContent({
  dictionary,
  lang,
  searchParams,
}: Props) {
  const t = dictionary?.operator?.observability

  const page = Number(searchParams?.page) || 1
  const limit = Number(searchParams?.limit) || 50
  const offset = (page - 1) * limit

  let rows: AuditRow[] = []
  let total = 0

  try {
    const where = {
      ...(searchParams?.action ? { action: searchParams.action } : {}),
      ...(searchParams?.search
        ? {
            OR: [
              {
                performer: {
                  email: {
                    contains: searchParams.search,
                    mode: "insensitive" as const,
                  },
                },
              },
              {
                action: {
                  contains: searchParams.search,
                  mode: "insensitive" as const,
                },
              },
            ],
          }
        : {}),
    }

    const [logs, count] = await Promise.all([
      db.auditLog.findMany({
        where,
        select: {
          id: true,
          createdAt: true,
          action: true,
          reason: true,
          ip: true,
          performer: {
            select: { email: true },
          },
          school: {
            select: { name: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: offset,
        take: limit,
      }),
      db.auditLog.count({ where }),
    ])

    total = count
    rows = logs.map((log) => ({
      id: log.id,
      createdAt: log.createdAt.toISOString(),
      userEmail: log.performer.email ?? "",
      schoolName: log.school?.name ?? null,
      action: log.action,
      reason: log.reason,
      ip: log.ip,
    }))
  } catch {
    // Graceful fallback: table may not have data yet
    rows = []
  }

  return (
    <div className="space-y-6">
      {rows.length > 0 ? (
        <AuditLogTable data={rows} columns={auditColumns} />
      ) : (
        <EmptyState
          title={t?.noAuditEntries || "No audit entries"}
          description={
            t?.actionsWillAppear ||
            "Actions will be listed here as they happen."
          }
        />
      )}
    </div>
  )
}
