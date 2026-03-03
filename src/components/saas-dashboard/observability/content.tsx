// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { db } from "@/lib/db"
import type { Locale } from "@/components/internationalization/config"
import type { getDictionary } from "@/components/internationalization/dictionaries"
import { EmptyState } from "@/components/saas-dashboard/common/empty-state"
import { Shell as PageContainer } from "@/components/table/shell"

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

  const totalPages = Math.ceil(total / limit)

  return (
    <PageContainer>
      <div className="flex flex-1 flex-col gap-4">
        <div>
          <h1 className="text-xl font-semibold">
            {t?.auditLogs || "Audit Logs"}
          </h1>
          <p className="text-muted-foreground text-sm">
            {t?.recentActions || "Recent sensitive operator actions"}
            {total > 0 &&
              ` (${(t?.totalEntries || "${total} total").replace("${total}", String(total))}, ${(t?.pageOfPages || "page ${page} of ${totalPages}").replace("${page}", String(page)).replace("${totalPages}", String(totalPages))})`}
          </p>
        </div>
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
    </PageContainer>
  )
}
