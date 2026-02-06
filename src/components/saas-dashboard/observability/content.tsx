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
}

export async function ObservabilityContent({ dictionary, lang }: Props) {
  const t = dictionary?.operator?.observability

  let rows: AuditRow[] = []

  try {
    const logs = await db.auditLog.findMany({
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
      take: 100,
    })

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
    <PageContainer>
      <div className="flex flex-1 flex-col gap-4">
        <div>
          <h1 className="text-xl font-semibold">
            {t?.auditLogs || "Audit Logs"}
          </h1>
          <p className="text-muted-foreground text-sm">
            {t?.recentActions || "Recent sensitive operator actions"}
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
